const { pool } = require("../../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../utils/error.utils");
const { sendMail } = require("../../config/mailer");
const { issueSession } = require("../auth/auth.service");

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

// ── Issue + email a signup OTP ───────────────────────
// Shared by createSignupRequestService (first send) and resendSignupOtpService.
const issueAndSendOtp = async (schoolId, adminName, email) => {
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await pool.query(
        `INSERT INTO tbl_signup_otps (school_id, otp_hash, expires_at) VALUES (?, ?, ?)`,
        [schoolId, otpHash, expiresAt]
    );

    if (process.env.NODE_ENV !== "production") {
        console.log("🔢 [dev only] Signup OTP:", otp);
    }

    // Fire-and-forget, same reasoning as every other email in this codebase —
    // Gmail/Resend latency must not block the response.
    sendMail({
        to: email,
        subject: "Your Web Builder Pro verification code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #20242C;">
                <h2 style="color: #4169E1;">Verify your email</h2>
                <p>Hi ${adminName || ""},</p>
                <p>Thanks for signing up with Web Builder Pro. Enter this code to verify your email and continue:</p>
                <div style="font-size: 36px; font-weight: 700; letter-spacing: 10px; text-align: center; color: #20242C; background: #f4f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    ${otp}
                </div>
                <p>This code is valid for 10 minutes. If you didn't request this, you can safely ignore this email.</p>
                <p style="color: #9aa3b8; font-size: 12px; margin-top: 32px;">Web Builder Pro</p>
            </div>
        `,
    }).catch((err) => console.error("Failed to send signup OTP email:", err.message));
};

// ── Public Signup Request ────────────────────────────
// Creates the school (status='pending') + its admin, then sends a 6-digit
// email OTP. The school goes 'pending' -> 'active' in verifySignupOtpService
// once the code is verified — there's no Super Admin approval step and no
// plan/payment attached yet (that happens post-verification, on the forced
// /admin/billing page). Mirrors the field/slug conventions of
// superAdmin.service.js#createSchoolWithAdminService, except tbl_admins.email
// is set equal to the school's email, same as that flow.
const createSignupRequestService = async ({ schoolName, adminName, email, phone, password }) => {
    if (!schoolName || !adminName || !email || !phone || !password) {
        throw new AppError("All fields are mandatory", 400);
    }
    if (password.length < 8) {
        throw new AppError("Password must be at least 8 characters", 400);
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password)) {
        throw new AppError("Password must be alphanumeric with at least 1 special character", 400);
    }
    if (!/^\d{10}$/.test(phone)) {
        throw new AppError("Phone number must be exactly 10 digits", 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check if phone number is already registered with another active school or admin
    const [existingPhoneSchool] = await pool.query("SELECT id, status, email FROM tbl_schools WHERE phone = ?", [cleanPhone]);
    if (existingPhoneSchool.length > 0) {
        const match = existingPhoneSchool[0];
        if (match.status !== "pending" || match.email.toLowerCase() !== cleanEmail) {
            throw new AppError("This phone number is already registered", 409);
        }
    }
    const [existingPhoneAdmin] = await pool.query(
        "SELECT a.id, a.email, s.status FROM tbl_admins a LEFT JOIN tbl_schools s ON a.school_id = s.id WHERE a.phone = ?",
        [cleanPhone]
    );
    if (existingPhoneAdmin.length > 0) {
        const match = existingPhoneAdmin[0];
        if (match.status !== "pending" || match.email.toLowerCase() !== cleanEmail) {
            throw new AppError("This phone number is already registered", 409);
        }
    }

    const [existingSchools] = await pool.query("SELECT id, uuid, status FROM tbl_schools WHERE email = ?", [cleanEmail]);

    let schoolId, schoolUuid;

    if (existingSchools.length > 0) {
        const existing = existingSchools[0];
        if (existing.status !== "pending") {
            throw new AppError("This email is already registered", 409);
        }

        // An abandoned/never-verified signup — reuse the row instead of
        // permanently blocking a retry with "already registered". Refresh the
        // admin's password to whatever was just submitted (the most likely
        // reason for retrying is "I forgot what I typed the first time");
        // leave name/slug alone to avoid slug-uniqueness churn.
        schoolId = existing.id;
        schoolUuid = existing.uuid;
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query("UPDATE tbl_schools SET phone = ?, name = ? WHERE id = ?", [cleanPhone, schoolName.trim(), schoolId]);
        await pool.query("UPDATE tbl_admins SET password = ?, name = ?, phone = ? WHERE school_id = ?", [hashedPassword, adminName.trim(), cleanPhone, schoolId]);
    } else {
        const [existingAdmin] = await pool.query("SELECT id FROM tbl_admins WHERE email = ?", [cleanEmail]);
        if (existingAdmin.length > 0) throw new AppError("This email is already registered", 409);

        const slugBase = schoolName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
        let slug = slugBase;
        let suffix = 1;
        while (true) {
            const [slugCheck] = await pool.query("SELECT id FROM tbl_schools WHERE slug = ?", [slug]);
            if (slugCheck.length === 0) break;
            suffix += 1;
            slug = `${slugBase}-${suffix}`;
        }

        schoolUuid = uuidv4();
        const adminUuid = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO tbl_schools (uuid, name, slug, email, phone, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
            [schoolUuid, schoolName.trim(), slug, cleanEmail, cleanPhone]
        );

        const [newSchool] = await pool.query("SELECT id FROM tbl_schools WHERE uuid = ?", [schoolUuid]);
        schoolId = newSchool[0].id;

        await pool.query(
            `INSERT INTO tbl_admins (uuid, school_id, name, email, password, phone, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [adminUuid, schoolId, adminName.trim(), cleanEmail, hashedPassword, cleanPhone]
        );
    }

    await issueAndSendOtp(schoolId, adminName, email);

    return { uuid: schoolUuid, name: schoolName, email };
};

// ── Verify Signup OTP ────────────────────────────────
// Flips the school to 'active' (same transition approveSchoolService used to
// do manually) and immediately issues a session — the caller ends up logged
// in, same response shape as auth.service.js's loginService, so the
// controller can set the refresh-token cookie the same way login's does.
const verifySignupOtpService = async (schoolUuid, otp) => {
    if (!schoolUuid || !otp) {
        throw new AppError("School and verification code are required", 400);
    }

    const [schools] = await pool.query("SELECT id, status FROM tbl_schools WHERE uuid = ?", [schoolUuid]);
    if (schools.length === 0) throw new AppError("School not found", 404);
    const school = schools[0];

    if (school.status !== "pending") {
        throw new AppError("This account is already verified", 400);
    }

    const [otpRows] = await pool.query(
        `SELECT * FROM tbl_signup_otps WHERE school_id = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1`,
        [school.id]
    );
    if (otpRows.length === 0) {
        throw new AppError("No verification code found. Please request a new one.", 400);
    }
    const otpRow = otpRows[0];

    if (new Date(otpRow.expires_at) < new Date()) {
        throw new AppError("This code has expired. Please request a new one.", 400);
    }
    if (otpRow.attempts >= OTP_MAX_ATTEMPTS) {
        throw new AppError("Too many incorrect attempts. Please request a new code.", 429);
    }

    const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex");
    if (otpHash !== otpRow.otp_hash) {
        await pool.query("UPDATE tbl_signup_otps SET attempts = attempts + 1 WHERE id = ?", [otpRow.id]);
        throw new AppError("Incorrect code. Please try again.", 400);
    }

    await pool.query("UPDATE tbl_signup_otps SET used_at = NOW() WHERE id = ?", [otpRow.id]);
    await pool.query("UPDATE tbl_schools SET status = 'active' WHERE id = ?", [school.id]);

    const [admins] = await pool.query(
        `SELECT id, uuid, school_id, name, email, phone, profile_photo, status, last_login, created_at, updated_at
        FROM tbl_admins WHERE school_id = ?`,
        [school.id]
    );
    if (admins.length === 0) throw new AppError("Admin account not found", 404);
    const admin = admins[0];

    const { accessToken, refreshToken } = await issueSession(admin.id, "admin", admin.school_id);
    await pool.query("UPDATE tbl_admins SET last_login = NOW() WHERE id = ?", [admin.id]);

    return { accessToken, refreshToken, user: admin };
};

// ── Resend Signup OTP ────────────────────────────────
const resendSignupOtpService = async (schoolUuid) => {
    if (!schoolUuid) throw new AppError("School is required", 400);

    const [schools] = await pool.query(
        `SELECT s.id, s.email, s.status, a.name as admin_name
        FROM tbl_schools s LEFT JOIN tbl_admins a ON s.id = a.school_id
        WHERE s.uuid = ?`,
        [schoolUuid]
    );
    if (schools.length === 0) throw new AppError("School not found", 404);
    const school = schools[0];

    if (school.status !== "pending") {
        throw new AppError("This account is already verified", 400);
    }

    // Invalidate any still-usable OTP for this school before issuing a new one.
    await pool.query(
        "UPDATE tbl_signup_otps SET used_at = NOW() WHERE school_id = ? AND used_at IS NULL",
        [school.id]
    );

    await issueAndSendOtp(school.id, school.admin_name, school.email);

    return { message: "Verification code sent" };
};

module.exports = { createSignupRequestService, verifySignupOtpService, resendSignupOtpService };
