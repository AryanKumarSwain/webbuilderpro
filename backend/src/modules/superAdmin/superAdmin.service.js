const { pool } = require("../../config/db");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../utils/error.utils");
const { sendMail } = require("../../config/mailer");

// ── Create School ────────────────────────────────────
const createSchoolService = async (schoolData, superAdminId) => {
    const { name, email, phone, address, city, state, pincode } = schoolData;

    if (!name || !email) throw new AppError("School name and email are required", 400);

    const [existing] = await pool.query("SELECT id FROM tbl_schools WHERE email = ?", [email]);
    if (existing.length > 0) throw new AppError("This email is already registered", 409);

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const [slugCheck] = await pool.query("SELECT id FROM tbl_schools WHERE slug = ?", [slug]);
    if (slugCheck.length > 0) throw new AppError("A school with this name already exists", 409);

    const uuid = uuidv4();
    await pool.query(
        `INSERT INTO tbl_schools (uuid, name, slug, email, phone, address, city, state, pincode, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid, name, slug, email, phone || null, address || null, city || null, state || null, pincode || null, superAdminId]
    );

    const [newSchool] = await pool.query("SELECT * FROM tbl_schools WHERE uuid = ?", [uuid]);
    return newSchool[0];
};

// ── Get All Schools ──────────────────────────────────
const getAllSchoolsService = async () => {
    const [schools] = await pool.query(
        `SELECT s.*, a.name as admin_name, a.email as admin_email,
                p.name as plan_name, p.tenure_years as plan_tenure_years, p.storage_mb as plan_storage_mb
        FROM tbl_schools s
        LEFT JOIN tbl_admins a ON s.id = a.school_id
        LEFT JOIN tbl_plans p ON s.plan_id = p.id
        ORDER BY s.created_at DESC`
    );
    return schools;
};

// ── Get Single School ────────────────────────────────
const getSchoolByUuidService = async (uuid) => {
    const [schools] = await pool.query(
        `SELECT s.*, a.name as admin_name, a.email as admin_email, a.phone as admin_phone, a.status as admin_status
        FROM tbl_schools s
        LEFT JOIN tbl_admins a ON s.id = a.school_id
        WHERE s.uuid = ?`,
        [uuid]
    );
    if (schools.length === 0) throw new AppError("School not found", 404);
    return schools[0];
};

// ── Update School Status ─────────────────────────────
const updateSchoolStatusService = async (uuid, status) => {
    const validStatuses = ["active", "suspended", "pending"];
    if (!validStatuses.includes(status)) throw new AppError("Invalid status", 400);

    const [school] = await pool.query("SELECT id FROM tbl_schools WHERE uuid = ?", [uuid]);
    if (school.length === 0) throw new AppError("School not found", 404);

    await pool.query("UPDATE tbl_schools SET status = ? WHERE uuid = ?", [status, uuid]);
    return { message: `School status updated to ${status}` };
};

// ── Create Admin ─────────────────────────────────────
const createAdminService = async (adminData) => {
    const { name, email, password, phone, schoolUuid } = adminData;

    if (!name || !email || !password || !schoolUuid) throw new AppError("Name, email, password and schoolUuid are required", 400);

    const [schools] = await pool.query("SELECT id FROM tbl_schools WHERE uuid = ?", [schoolUuid]);
    if (schools.length === 0) throw new AppError("School not found", 404);

    const schoolId = schools[0].id;
    const [existing] = await pool.query("SELECT id FROM tbl_admins WHERE email = ?", [email]);
    if (existing.length > 0) throw new AppError("This email is already registered", 409);

    const hashedPassword = await bcrypt.hash(password, 10);
    const uuid = uuidv4();

    await pool.query(
        `INSERT INTO tbl_admins (uuid, school_id, name, email, password, phone) VALUES (?, ?, ?, ?, ?, ?)`,
        [uuid, schoolId, name, email, hashedPassword, phone || null]
    );

    await pool.query("UPDATE tbl_schools SET status = ? WHERE id = ?", ["active", schoolId]);

    const [newAdmin] = await pool.query(
        `SELECT id, uuid, school_id, name, email, phone, status, created_at FROM tbl_admins WHERE uuid = ?`,
        [uuid]
    );
    return newAdmin[0];
};

// ── Update Admin Status ──────────────────────────────
const updateAdminStatusService = async (uuid, status) => {
    const validStatuses = ["active", "suspended"];
    if (!validStatuses.includes(status)) throw new AppError("Invalid status", 400);

    const [admin] = await pool.query("SELECT id FROM tbl_admins WHERE uuid = ?", [uuid]);
    if (admin.length === 0) throw new AppError("Admin not found", 404);

    await pool.query("UPDATE tbl_admins SET status = ? WHERE uuid = ?", [status, uuid]);
    return { message: `Admin status updated to ${status}` };
};

// ── Create School + Admin Together ───────────────────
// Admin login credentials are the school's own email + the password set here —
// there is no separate admin email anymore, so tbl_admins.email is always set
// equal to the school's email.
const createSchoolWithAdminService = async (data, superAdminId, logoUrl = null) => {
    const { name, email, phone, address, city, state, pincode, adminName, adminPassword, adminPhone } = data;

    if (!name || !email) throw new AppError("School name and email are required", 400);
    if (!adminName || !adminPassword) throw new AppError("Admin name and password are required", 400);

    const [existingSchool] = await pool.query("SELECT id FROM tbl_schools WHERE email = ?", [email]);
    if (existingSchool.length > 0) throw new AppError("This school email is already registered", 409);

    const [existingAdmin] = await pool.query("SELECT id FROM tbl_admins WHERE email = ?", [email]);
    if (existingAdmin.length > 0) throw new AppError("This email is already in use by an admin account", 409);

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
    const [slugCheck] = await pool.query("SELECT id FROM tbl_schools WHERE slug = ?", [slug]);
    if (slugCheck.length > 0) throw new AppError("A school with this name already exists", 409);

    const schoolUuid = uuidv4();
    const adminUuid = uuidv4();
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await pool.query(
        `INSERT INTO tbl_schools (uuid, name, slug, email, phone, address, city, state, pincode, logo_url, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [schoolUuid, name, slug, email, phone || null, address || null, city || null, state || null, pincode || null, logoUrl || null, superAdminId]
    );

    const [newSchool] = await pool.query("SELECT id FROM tbl_schools WHERE uuid = ?", [schoolUuid]);
    const schoolId = newSchool[0].id;

    await pool.query(
        `INSERT INTO tbl_admins (uuid, school_id, name, email, password, phone, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [adminUuid, schoolId, adminName, email, hashedPassword, adminPhone || null]
    );

    const [school] = await pool.query(
        `SELECT s.*, a.name as admin_name, a.email as admin_email FROM tbl_schools s LEFT JOIN tbl_admins a ON s.id = a.school_id WHERE s.uuid = ?`,
        [schoolUuid]
    );
    return school[0];
};

// ── Delete School ─────────────────────────────────────
// Removes the school and everything scoped to it (admins, their refresh
// tokens, module content, storage ledger rows, and payment records) in one
// transaction so a failure partway through can't leave orphaned rows behind.
const deleteSchoolService = async (uuid) => {
    const conn = await pool.getConnection();
    try {
        const [school] = await conn.query("SELECT id FROM tbl_schools WHERE uuid = ?", [uuid]);
        if (school.length === 0) throw new AppError("School not found", 404);
        const schoolId = school[0].id;

        await conn.beginTransaction();

        const [admins] = await conn.query("SELECT id FROM tbl_admins WHERE school_id = ?", [schoolId]);
        const adminIds = admins.map((a) => a.id);
        if (adminIds.length > 0) {
            await conn.query("DELETE FROM tbl_refresh_tokens WHERE admin_id IN (?)", [adminIds]);
        }
        await conn.query("DELETE FROM tbl_admins WHERE school_id = ?", [schoolId]);
        await conn.query("DELETE FROM tbl_module_content WHERE school_id = ?", [schoolId]);
        await conn.query("DELETE FROM tbl_media_usage WHERE school_id = ?", [schoolId]);
        await conn.query("DELETE FROM tbl_payments WHERE school_id = ?", [schoolId]);
        await conn.query("DELETE FROM tbl_schools WHERE id = ?", [schoolId]);

        await conn.commit();
        return { message: "School permanently deleted" };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// ── Get Dashboard Stats ──────────────────────────────
const getDashboardStatsService = async () => {
    const [[schoolStats]] = await pool.query(`
        SELECT 
            COUNT(*) as total_schools,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_schools,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_schools,
            SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_schools
        FROM tbl_schools
    `);

    const [[adminStats]] = await pool.query(`
        SELECT COUNT(*) as total_admins FROM tbl_admins
    `);

    const [recentSchools] = await pool.query(`
        SELECT id, name, slug, status, city, state, theme, logo_url, created_at
        FROM tbl_schools
        ORDER BY created_at DESC
        LIMIT 5
    `);

    return {
        total_schools: schoolStats.total_schools || 0,
        active_schools: schoolStats.active_schools || 0,
        pending_schools: schoolStats.pending_schools || 0,
        suspended_schools: schoolStats.suspended_schools || 0,
        total_admins: adminStats.total_admins || 0,
        recent_schools: recentSchools,
    };
};

// ── Get Pending Schools (self-signups awaiting approval) ─────────────
const getPendingSchoolsService = async () => {
    const [schools] = await pool.query(
        `SELECT s.id, s.uuid, s.name, s.slug, s.email, s.phone, s.created_at,
                a.name as admin_name, a.email as admin_email
        FROM tbl_schools s
        LEFT JOIN tbl_admins a ON s.id = a.school_id
        WHERE s.status = 'pending'
        ORDER BY s.created_at DESC`
    );
    return schools;
};

// ── Approve School ───────────────────────────────────
const approveSchoolService = async (uuid) => {
    const [schools] = await pool.query(
        `SELECT s.id, s.name, a.name as admin_name, a.email as admin_email
        FROM tbl_schools s LEFT JOIN tbl_admins a ON s.id = a.school_id
        WHERE s.uuid = ?`,
        [uuid]
    );
    if (schools.length === 0) throw new AppError("School not found", 404);
    const school = schools[0];

    await pool.query("UPDATE tbl_schools SET status = 'active' WHERE uuid = ?", [uuid]);

    // Fire-and-forget, same reasoning as signup.service.js#createSignupRequestService:
    // Gmail SMTP can take a long time to connect/time out, and the approve response
    // (which the Super Admin UI waits on before refreshing the list) must not block on it.
    sendMail({
        to: school.admin_email,
        subject: "Your Web Builder Pro account is approved",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #20242C;">
                <h2 style="color: #4169E1;">You're approved!</h2>
                <p>Hi ${school.admin_name || ""},</p>
                <p><strong>${school.name}</strong>'s account has been approved. Log in to choose your plan and go live.</p>
                <p style="margin: 28px 0;">
                    <a href="${process.env.FRONTEND_URL}/login" style="background: #4169E1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                        Log In
                    </a>
                </p>
                <p style="color: #9aa3b8; font-size: 12px; margin-top: 32px;">Web Builder Pro</p>
            </div>
        `,
    }).catch((err) => console.error("Failed to send approval email:", err.message));

    return { message: "School approved" };
};

// ── Reject School ─────────────────────────────────────
const rejectSchoolService = async (uuid) => {
    const [school] = await pool.query("SELECT id FROM tbl_schools WHERE uuid = ?", [uuid]);
    if (school.length === 0) throw new AppError("School not found", 404);

    await pool.query("UPDATE tbl_schools SET status = 'suspended' WHERE uuid = ?", [uuid]);
    return { message: "School rejected" };
};

// ── Assign Plan (backfill existing schools / manual override) ────────
const assignPlanService = async (uuid, planId) => {
    const [school] = await pool.query("SELECT id FROM tbl_schools WHERE uuid = ?", [uuid]);
    if (school.length === 0) throw new AppError("School not found", 404);

    const [plans] = await pool.query("SELECT id, tenure_years FROM tbl_plans WHERE id = ? AND is_active = 1", [planId]);
    if (plans.length === 0) throw new AppError("Plan not found", 404);
    const plan = plans[0];

    // Same extend-from-remaining-time math as billing.service.js's
    // activatePlanForPayment — keep both in sync if this ever changes.
    await pool.query(
        `UPDATE tbl_schools
        SET plan_id = ?, plan_start_date = CURDATE(),
            plan_end_date = DATE_ADD(GREATEST(COALESCE(plan_end_date, CURDATE()), CURDATE()), INTERVAL ? YEAR)
        WHERE id = ?`,
        [plan.id, plan.tenure_years, school[0].id]
    );

    return { message: "Plan assigned" };
};

module.exports = {
    createSchoolService,
    getAllSchoolsService,
    getSchoolByUuidService,
    updateSchoolStatusService,
    deleteSchoolService,
    createAdminService,
    updateAdminStatusService,
    createSchoolWithAdminService,
    getDashboardStatsService,
    getPendingSchoolsService,
    approveSchoolService,
    rejectSchoolService,
    assignPlanService,
};