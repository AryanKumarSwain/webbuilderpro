const crypto = require("crypto");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../../config/db");
const AppError = require("../../utils/error.utils");

// Read the keys through these so a stray trailing space/newline in a hosting
// dashboard env var (a real gotcha on Render) can't silently break auth —
// `razorpay.orders.create` would then throw a confusing BAD_REQUEST_ERROR.
const rzpKeyId = () => (process.env.RAZORPAY_KEY_ID || "").trim();
const rzpKeySecret = () => (process.env.RAZORPAY_KEY_SECRET || "").trim();
const rzpWebhookSecret = () => (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();

// Constructed lazily (not at module load) so the server still boots when
// RAZORPAY_KEY_ID/SECRET aren't configured yet in local dev — the SDK throws
// synchronously in its constructor if key_id is missing.
const getRazorpayClient = () => {
    if (!rzpKeyId() || !rzpKeySecret()) {
        throw new AppError("Payments aren't configured yet — contact Web Builder Pro", 503);
    }
    return new Razorpay({
        key_id: rzpKeyId(),
        key_secret: rzpKeySecret(),
    });
};

// ── Create Order ──────────────────────────────────────
const createOrderService = async (schoolId, planId) => {
    const razorpay = getRazorpayClient();
    const [plans] = await pool.query("SELECT id, price FROM tbl_plans WHERE id = ? AND is_active = 1", [planId]);
    if (plans.length === 0) throw new AppError("Plan not found", 404);
    const plan = plans[0];

    if (Number(plan.price) <= 0) {
        throw new AppError("This plan isn't priced yet — contact Web Builder Pro", 400);
    }

    const amountPaise = Math.round(Number(plan.price) * 100);
    let order;
    try {
        order = await razorpay.orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt: `school-${schoolId}-plan-${planId}-${Date.now()}`,
        });
    } catch (err) {
        // The Razorpay SDK's rejection has no top-level `.message` — the real
        // reason lives at `.error.description`. Without this, the controller's
        // `sendError(res, error.message, ...)` sends message: undefined, which
        // JSON.stringify drops entirely, leaving the frontend with no text to
        // show (falls back to a generic "Failed to start payment" toast).
        console.error("[billing] razorpay.orders.create failed", {
            schoolId,
            planId,
            amountPaise,
            statusCode: err.statusCode,
            error: err.error || err.message,
        });
        throw new AppError(err.error?.description || "Could not start payment — try again", err.statusCode || 502);
    }

    const uuid = uuidv4();
    await pool.query(
        `INSERT INTO tbl_payments (uuid, school_id, plan_id, razorpay_order_id, amount, currency, status)
        VALUES (?, ?, ?, ?, ?, 'INR', 'created')`,
        [uuid, schoolId, plan.id, order.id, plan.price]
    );

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: rzpKeyId(),
    };
};

// ── Activate plan for a paid order ────────────────────
// Shared by the browser verify-payment call and the Razorpay webhook. Idempotent
// on purpose — both paths can land here for the same payment (e.g. the webhook
// fires while the browser is still on the success screen). If the row is already
// 'paid' this is a no-op, so whichever path wins the race, the other is harmless.
//
// All three statements (mark payment paid, read plan tenure, activate the
// school's plan) run in one transaction — without this, a failure between the
// first and third statement would leave tbl_payments.status = 'paid' with the
// school's plan_id never updated, and the idempotency check above would then
// block every future retry from ever completing the activation. On any
// failure here, the whole thing rolls back so tbl_payments.status stays
// whatever it was before (not 'paid'), and a retry can run cleanly again.
const activatePlanForPayment = async (payment, paymentId, signature = null) => {
    if (payment.status === "paid") {
        return { message: "Plan already active", alreadyPaid: true };
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `UPDATE tbl_payments SET status = 'paid', razorpay_payment_id = ?, razorpay_signature = ? WHERE id = ?`,
            [paymentId, signature, payment.id]
        );

        const [plans] = await conn.query("SELECT tenure_years FROM tbl_plans WHERE id = ?", [payment.plan_id]);
        const tenureYears = plans[0].tenure_years;

        // Renewing/upgrading extends from whichever is later — the school's current
        // plan_end_date (so an early renewal keeps its unused days) or today (so a
        // school renewing after real expiry starts fresh instead of backdating).
        // COALESCE handles a first-ever purchase, where plan_end_date is still NULL.
        await conn.query(
            `UPDATE tbl_schools
            SET plan_id = ?, plan_start_date = CURDATE(),
                plan_end_date = DATE_ADD(GREATEST(COALESCE(plan_end_date, CURDATE()), CURDATE()), INTERVAL ? YEAR)
            WHERE id = ?`,
            [payment.plan_id, tenureYears, payment.school_id]
        );

        await conn.commit();
        return { message: "Payment verified — plan activated" };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// ── Verify Payment (browser -> us) ────────────────────
const verifyPaymentService = async (schoolId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new AppError("Missing payment verification details", 400);
    }

    const [payments] = await pool.query(
        "SELECT * FROM tbl_payments WHERE razorpay_order_id = ? AND school_id = ?",
        [razorpay_order_id, schoolId]
    );
    if (payments.length === 0) throw new AppError("Payment record not found", 404);
    const payment = payments[0];

    const expectedSignature = crypto
        .createHmac("sha256", rzpKeySecret())
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    const gotBuf = Buffer.from(String(razorpay_signature || ""), "utf8");
    const signatureValid = expectedBuf.length === gotBuf.length && crypto.timingSafeEqual(expectedBuf, gotBuf);
    if (!signatureValid) {
        await pool.query("UPDATE tbl_payments SET status = 'failed' WHERE id = ?", [payment.id]);
        throw new AppError("Payment verification failed", 400);
    }

    return activatePlanForPayment(payment, razorpay_payment_id, razorpay_signature);
};

// ── Webhook (Razorpay -> us) ──────────────────────────
// Safety net for when the browser never calls /verify-payment — tab closed,
// network dropped, or (the bug that prompted this) a UPI flow that captures the
// money but leaves Checkout hanging so its success handler never fires. Set up
// in the Razorpay dashboard (Settings -> Webhooks) pointing at
// POST /api/billing/webhook with the "payment.captured" event, using the same
// secret as RAZORPAY_WEBHOOK_SECRET here.
const handleWebhookService = async (rawBody, signature) => {
    const secret = rzpWebhookSecret();
    if (!secret) {
        // Not wired up yet — log and no-op instead of erroring on every hit.
        console.warn("[billing] webhook received but RAZORPAY_WEBHOOK_SECRET is not set — ignoring");
        return { ignored: "not configured" };
    }

    const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody || Buffer.alloc(0))
        .digest("hex");
    const sigBuf = Buffer.from(String(signature || ""), "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        throw new AppError("Invalid webhook signature", 400);
    }

    let event;
    try {
        event = JSON.parse(rawBody.toString("utf8"));
    } catch {
        throw new AppError("Invalid webhook payload", 400);
    }

    // payment.captured is the canonical "the money is really ours" signal.
    if (event.event !== "payment.captured") {
        return { ignored: event.event };
    }

    const entity = event.payload?.payment?.entity || {};
    const orderId = entity.order_id;
    const paymentId = entity.id;
    if (!orderId || !paymentId) throw new AppError("Webhook missing order/payment id", 400);

    const [payments] = await pool.query(
        "SELECT * FROM tbl_payments WHERE razorpay_order_id = ?",
        [orderId]
    );
    if (payments.length === 0) {
        // An order we didn't create — e.g. another environment sharing this
        // Razorpay account. Nothing to do.
        console.warn("[billing] webhook payment.captured for unknown order", orderId);
        return { ignored: "unknown order" };
    }

    const result = await activatePlanForPayment(payments[0], paymentId);
    console.log("[billing] webhook payment.captured processed", { orderId, paymentId, ...result });
    return result;
};

module.exports = { createOrderService, verifyPaymentService, handleWebhookService };
