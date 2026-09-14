const { pool } = require("../../config/db");
const AppError = require("../../utils/error.utils");
const { sendMail } = require("../../config/mailer");

const WBPRO_DOMAIN = "wbpro.in";
const LABEL_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
const RESERVED_LABELS = new Set([
    "www", "admin", "api", "app", "mail", "ftp", "wbpro", "blog", "support",
    "school", "schools", "billing", "signup", "login",
]);

const validateLabel = (label) => {
    if (!label || typeof label !== "string") {
        throw new AppError("Please enter a subdomain", 400);
    }
    const normalized = label.trim().toLowerCase();
    if (!LABEL_REGEX.test(normalized)) {
        throw new AppError("Subdomain can only contain lowercase letters, numbers and hyphens (3-63 characters)", 400);
    }
    if (RESERVED_LABELS.has(normalized)) {
        throw new AppError("This subdomain is reserved — try another", 409);
    }
    return normalized;
};

// ── Request a Subdomain ───────────────────────────────
// Rejects immediately (no row written) if the label is already live on
// another school's custom_domain, or already pending on another school's
// request — the whole point is the admin sees "already taken" at submit
// time, never a silent queue collision discovered later by the Super Admin.
const requestSubdomainService = async (schoolId, rawLabel) => {
    const label = validateLabel(rawLabel);
    const fullDomain = `${label}.${WBPRO_DOMAIN}`;

    const [liveCollision] = await pool.query(
        "SELECT id FROM tbl_schools WHERE custom_domain = ? AND id != ?",
        [fullDomain, schoolId]
    );
    if (liveCollision.length > 0) {
        throw new AppError("This subdomain is already taken — try another", 409);
    }

    const [pendingCollision] = await pool.query(
        "SELECT id FROM tbl_subdomain_requests WHERE requested_label = ? AND status = 'pending' AND school_id != ?",
        [label, schoolId]
    );
    if (pendingCollision.length > 0) {
        throw new AppError("This subdomain is already taken — try another", 409);
    }

    const [school] = await pool.query(
        `SELECT s.name, a.name as admin_name, a.email as admin_email
        FROM tbl_schools s LEFT JOIN tbl_admins a ON s.id = a.school_id
        WHERE s.id = ?`,
        [schoolId]
    );
    if (school.length === 0) throw new AppError("School not found", 404);
    const { name: schoolName, admin_name: adminName, admin_email: adminEmail } = school[0];

    // Reuse this school's own still-pending row instead of piling up
    // duplicates if they change their mind before it's fulfilled.
    const [existingPending] = await pool.query(
        "SELECT id FROM tbl_subdomain_requests WHERE school_id = ? AND status = 'pending'",
        [schoolId]
    );
    if (existingPending.length > 0) {
        await pool.query(
            "UPDATE tbl_subdomain_requests SET requested_label = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?",
            [label, existingPending[0].id]
        );
    } else {
        await pool.query(
            "INSERT INTO tbl_subdomain_requests (school_id, requested_label) VALUES (?, ?)",
            [schoolId, label]
        );
    }

    sendMail({
        to: adminEmail,
        subject: "Your Web Builder Pro subdomain request",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #20242C;">
                <h2 style="color: #4169E1;">Request received</h2>
                <p>Hi ${adminName || ""},</p>
                <p>We've received your request to set up <strong>${schoolName}</strong>'s website at:</p>
                <div style="font-size: 20px; font-weight: 700; text-align: center; color: #20242C; background: #f4f5f9; border-radius: 12px; padding: 16px; margin: 24px 0;">
                    ${fullDomain}
                </div>
                <p>Our team will set this up and your site will be live at this address within 24 hours. You'll get another email the moment it's ready.</p>
                <p style="color: #9aa3b8; font-size: 12px; margin-top: 32px;">Web Builder Pro</p>
            </div>
        `,
    }).catch((err) => console.error("Failed to send subdomain request email:", err.message));

    return { message: "Subdomain request submitted", label, fullDomain };
};

// ── Get My (Latest) Subdomain Request ────────────────
const getMySubdomainRequestService = async (schoolId) => {
    const [rows] = await pool.query(
        "SELECT id, requested_label, status, created_at, fulfilled_at FROM tbl_subdomain_requests WHERE school_id = ? ORDER BY id DESC LIMIT 1",
        [schoolId]
    );
    return rows.length > 0 ? rows[0] : null;
};

// ── Get Pending Requests (Super Admin queue) ─────────
const getPendingSubdomainRequestsService = async () => {
    const [rows] = await pool.query(
        `SELECT r.id, r.requested_label, r.created_at, s.id as school_id, s.name as school_name,
                a.name as admin_name, a.email as admin_email
        FROM tbl_subdomain_requests r
        JOIN tbl_schools s ON r.school_id = s.id
        LEFT JOIN tbl_admins a ON s.id = a.school_id
        WHERE r.status = 'pending'
        ORDER BY r.created_at ASC`
    );
    return rows;
};

// ── Fulfill a Request ─────────────────────────────────
const fulfillSubdomainRequestService = async (id, superAdminId) => {
    const [rows] = await pool.query(
        `SELECT r.id, r.school_id, r.requested_label, r.status, s.name as school_name,
                a.name as admin_name, a.email as admin_email
        FROM tbl_subdomain_requests r
        JOIN tbl_schools s ON r.school_id = s.id
        LEFT JOIN tbl_admins a ON s.id = a.school_id
        WHERE r.id = ?`,
        [id]
    );
    if (rows.length === 0) throw new AppError("Request not found", 404);
    const request = rows[0];
    if (request.status !== "pending") {
        throw new AppError("This request has already been handled", 400);
    }

    const fullDomain = `${request.requested_label}.${WBPRO_DOMAIN}`;

    await pool.query("UPDATE tbl_schools SET custom_domain = ? WHERE id = ?", [fullDomain, request.school_id]);
    await pool.query(
        "UPDATE tbl_subdomain_requests SET status = 'fulfilled', fulfilled_by = ?, fulfilled_at = NOW() WHERE id = ?",
        [superAdminId, id]
    );

    sendMail({
        to: request.admin_email,
        subject: "Your Web Builder Pro subdomain is live!",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #20242C;">
                <h2 style="color: #16a34a;">You're live!</h2>
                <p>Hi ${request.admin_name || ""},</p>
                <p><strong>${request.school_name}</strong>'s website is now live at:</p>
                <p style="margin: 28px 0; text-align: center;">
                    <a href="https://${fullDomain}" style="background: #4169E1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                        Visit ${fullDomain}
                    </a>
                </p>
                <p style="color: #9aa3b8; font-size: 12px; margin-top: 32px;">Web Builder Pro</p>
            </div>
        `,
    }).catch((err) => console.error("Failed to send subdomain-live email:", err.message));

    return { message: "Subdomain marked live", fullDomain };
};

// ── Reject a Request ──────────────────────────────────
const rejectSubdomainRequestService = async (id) => {
    const [rows] = await pool.query(
        `SELECT r.id, r.status, r.requested_label, s.name as school_name,
                a.name as admin_name, a.email as admin_email
        FROM tbl_subdomain_requests r
        JOIN tbl_schools s ON r.school_id = s.id
        LEFT JOIN tbl_admins a ON s.id = a.school_id
        WHERE r.id = ?`,
        [id]
    );
    if (rows.length === 0) throw new AppError("Request not found", 404);
    const request = rows[0];
    if (request.status !== "pending") {
        throw new AppError("This request has already been handled", 400);
    }

    await pool.query("UPDATE tbl_subdomain_requests SET status = 'rejected' WHERE id = ?", [id]);

    sendMail({
        to: request.admin_email,
        subject: "About your Web Builder Pro subdomain request",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #20242C;">
                <h2 style="color: #4169E1;">Let's try a different subdomain</h2>
                <p>Hi ${request.admin_name || ""},</p>
                <p>We weren't able to set up <strong>${request.requested_label}.wbpro.in</strong> for ${request.school_name}. Please head back to Settings and submit a different subdomain.</p>
                <p style="color: #9aa3b8; font-size: 12px; margin-top: 32px;">Web Builder Pro</p>
            </div>
        `,
    }).catch((err) => console.error("Failed to send subdomain-rejected email:", err.message));

    return { message: "Request rejected" };
};

module.exports = {
    requestSubdomainService,
    getMySubdomainRequestService,
    getPendingSubdomainRequestsService,
    fulfillSubdomainRequestService,
    rejectSubdomainRequestService,
};
