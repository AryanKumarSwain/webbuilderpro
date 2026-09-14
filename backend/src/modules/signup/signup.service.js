const { pool } = require("../../config/db");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../utils/error.utils");
const { sendMail } = require("../../config/mailer");

// ── Public Signup Request ────────────────────────────
// Creates the school (status='pending') + its admin, with no plan/payment attached
// yet — that only happens post-approval, on the forced /admin/billing page. Mirrors
// the field/slug conventions of superAdmin.service.js#createSchoolWithAdminService,
// except tbl_admins.email is set equal to the school's email, same as that flow.
const createSignupRequestService = async ({ schoolName, adminName, email, phone, password }) => {
    if (!schoolName || !adminName || !email || !password) {
        throw new AppError("School name, admin name, email and password are required", 400);
    }
    if (password.length < 8) {
        throw new AppError("Password must be at least 8 characters", 400);
    }
    if (phone && !/^\d{10}$/.test(phone)) {
        throw new AppError("Phone number must be exactly 10 digits", 400);
    }

    const [existingSchool] = await pool.query("SELECT id FROM tbl_schools WHERE email = ?", [email]);
    if (existingSchool.length > 0) throw new AppError("This email is already registered", 409);

    const [existingAdmin] = await pool.query("SELECT id FROM tbl_admins WHERE email = ?", [email]);
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

    const schoolUuid = uuidv4();
    const adminUuid = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
        `INSERT INTO tbl_schools (uuid, name, slug, email, phone, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
        [schoolUuid, schoolName, slug, email, phone || null]
    );

    const [newSchool] = await pool.query("SELECT id FROM tbl_schools WHERE uuid = ?", [schoolUuid]);
    const schoolId = newSchool[0].id;

    await pool.query(
        `INSERT INTO tbl_admins (uuid, school_id, name, email, password, phone, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [adminUuid, schoolId, adminName, email, hashedPassword, phone || null]
    );

    // Fire-and-forget: Gmail SMTP can take a long time to connect/time out, and the
    // signup response must not block on it — the confirmation email is a nice-to-have,
    // not something the client should wait ~2 minutes for before seeing "submitted".
    sendMail({
        to: email,
        subject: "We've received your Web Builder Pro request",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #20242C;">
                <h2 style="color: #4169E1;">Request received</h2>
                <p>Hi ${adminName},</p>
                <p>Thanks for signing up <strong>${schoolName}</strong> with Web Builder Pro. Our team will review your request and approve your account shortly — you'll get another email the moment that happens.</p>
                <p style="color: #9aa3b8; font-size: 12px; margin-top: 32px;">Web Builder Pro</p>
            </div>
        `,
    }).catch((err) => console.error("Failed to send signup confirmation email:", err.message));

    return { uuid: schoolUuid, name: schoolName, email };
};

module.exports = { createSignupRequestService };
