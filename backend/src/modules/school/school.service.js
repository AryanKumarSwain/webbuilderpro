const { pool } = require("../../config/db");
const AppError = require("../../utils/error.utils");
const { reconcileSchoolAssetMedia, reconcileHeroVideoMedia } = require("../../utils/storage.utils");
const { isPlanActive } = require("../../config/plan.config");

// ── Get School Profile ───────────────────────────────
const getSchoolProfileService = async (schoolId) => {
    const [schools] = await pool.query(
        `SELECT 
            s.*,
            a.name as admin_name,
            a.email as admin_email,
            a.phone as admin_phone,
            a.profile_photo as admin_photo
        FROM tbl_schools s
        LEFT JOIN tbl_admins a ON s.id = a.school_id
        WHERE s.id = ?`,
        [schoolId]
    );

    if (schools.length === 0) {
        throw new AppError("School not found", 404);
    }

    return schools[0];
};

// ── Update School Profile ────────────────────────────
// Only columns actually present as keys in `data` are written — this lets callers
// send a partial payload (e.g. just `{ welcome_banner_enabled }`) without wiping
// other fields, while still allowing an explicit `null`/'' to clear a field (e.g.
// "Remove Logo" sends `{ logo_url: null }`). A COALESCE-based UPDATE can't do the
// latter since COALESCE(NULL, logo_url) just keeps the old value.
const updateSchoolProfileService = async (schoolId, data) => {
    const allowedFields = [
        'name', 'phone', 'phone2', 'whatsapp_number', 'address', 'city', 'state', 'pincode',
        'map_url', 'facebook', 'instagram', 'youtube', 'twitter', 'linkedin',
        'hero_video_url', 'hero_video_title', 'logo_url', 'intro_message', 'intro_message_enabled',
        'welcome_banner_enabled', 'welcome_banner_url', 'welcome_banner_link',
        'footer_bg_url', 'footer_about_text', 'bg_music_enabled', 'bg_music_track', 'affiliation_badges', 'custom_domain',
        'prospectus_url', 'school_app_label', 'school_app_url'
    ];

    const fieldsToUpdate = allowedFields.filter((field) =>
        Object.prototype.hasOwnProperty.call(data, field)
    );

    if (fieldsToUpdate.length > 0) {
        const setClause = fieldsToUpdate.map((field) => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map((field) => data[field]);

        await pool.query(
            `UPDATE tbl_schools SET ${setClause} WHERE id = ?`,
            [...values, schoolId]
        );
    }

    const [updated] = await pool.query('SELECT * FROM tbl_schools WHERE id = ?', [schoolId]);

    // Free storage for any school asset this update replaced or cleared — logo /
    // welcome banner / footer bg (branding bucket) and the Home hero video
    // (bucketed under 'home'). Best-effort — a reconcile hiccup must never fail
    // the profile save.
    try {
        await reconcileSchoolAssetMedia(schoolId, updated[0]);
        await reconcileHeroVideoMedia(schoolId);
    } catch (err) {
        console.error('[storage] school-asset reconcile failed', schoolId, err?.message);
    }

    return updated[0];
};

// ── Update School Settings ───────────────────────────
const updateSchoolSettingsService = async (schoolId, data) => {
    const { theme, base_theme, logo_url, nav_font, heading_font } = data;

    await pool.query(
        `UPDATE tbl_schools
        SET
            theme = COALESCE(?, theme),
            base_theme = COALESCE(?, base_theme),
            logo_url = COALESCE(?, logo_url),
            nav_font = COALESCE(?, nav_font),
            heading_font = COALESCE(?, heading_font)
        WHERE id = ?`,
        [theme, base_theme, logo_url, nav_font, heading_font, schoolId]
    );

    const [updated] = await pool.query('SELECT * FROM tbl_schools WHERE id = ?', [schoolId]);
    return updated[0];
};

// ── Select Modules ───────────────────────────────────
const selectModulesService = async (schoolId, modules) => {
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
        throw new AppError("Select at least one module", 400);
    }

    const validModules = [
        "home", "about", "fee", "courses", "faculty", "infrastructure",
        "sports", "gallery", "achievements", "alumni", "testimonials", "disclosure", "tc",
        "events", "calendar", "announcements", "circulars", "results", "admissionProcedure", "bookList", "parentsCorner", "admission",
        "career", "contact", "settings",
    ];

    const invalidModules = modules.filter((m) => !validModules.includes(m));
    if (invalidModules.length > 0) {
        throw new AppError(`Invalid modules: ${invalidModules.join(", ")}`, 400);
    }

    await pool.query(
        `UPDATE tbl_schools 
        SET selected_modules = ?, is_first_login = 0 
        WHERE id = ?`,
        [JSON.stringify(modules), schoolId]
    );

    return { selectedModules: modules };
};

// Bump this whenever the consent text in AcceptTerms.jsx materially changes —
// schools whose stored terms_version falls behind get re-prompted once.
const CURRENT_TERMS_VERSION = 1;

// ── Get Selected Modules ─────────────────────────────
// Also returns hasActivePlan and hasAcceptedTerms — the AdminLayout gate
// piggybacks on this same call (already fired on every admin route change)
// rather than adding extra round-trips just to check plan/consent status.
const getSelectedModulesService = async (schoolId) => {
    const [schools] = await pool.query(
        "SELECT selected_modules, is_first_login, plan_id, plan_end_date, terms_accepted_at, terms_version FROM tbl_schools WHERE id = ?",
        [schoolId]
    );

    if (schools.length === 0) {
        throw new AppError("School not found", 404);
    }

    // A plan_id alone isn't enough — a lapsed plan_end_date (past its grace
    // period, with no renewal) must also force the admin back to Billing, same
    // as never having had a plan at all. isPlanActive is the single source of
    // truth for the cutoff so this can never drift from the backend route guard.
    const school = schools[0];
    const hasActivePlan = isPlanActive(school.plan_id, school.plan_end_date);

    return {
        selectedModules: school.selected_modules
            ? typeof school.selected_modules === "string"
                ? JSON.parse(school.selected_modules)
                : school.selected_modules
            : [],
        isFirstLogin: school.is_first_login,
        hasActivePlan,
        hasAcceptedTerms: school.terms_accepted_at !== null && school.terms_version >= CURRENT_TERMS_VERSION,
    };
};

// ── Accept Terms ──────────────────────────────────────
const acceptTermsService = async (schoolId) => {
    await pool.query(
        "UPDATE tbl_schools SET terms_accepted_at = NOW(), terms_version = ? WHERE id = ?",
        [CURRENT_TERMS_VERSION, schoolId]
    );
    return { termsAccepted: true };
};

// ── Get Storage Usage ─────────────────────────────────
const getStorageUsageService = async (schoolId) => {
    const [rows] = await pool.query(
        `SELECT s.storage_used_bytes, p.storage_mb
        FROM tbl_schools s
        LEFT JOIN tbl_plans p ON s.plan_id = p.id
        WHERE s.id = ?`,
        [schoolId]
    );
    if (rows.length === 0) throw new AppError("School not found", 404);
    const { storage_used_bytes, storage_mb } = rows[0];
    const limitBytes = storage_mb ? storage_mb * 1024 * 1024 : 0;
    const usedBytes = Number(storage_used_bytes) || 0;

    const [breakdown] = await pool.query(
        `SELECT COALESCE(module_key, 'other') as moduleKey, SUM(file_size_bytes) as bytes
        FROM tbl_media_usage
        WHERE school_id = ?
        GROUP BY COALESCE(module_key, 'other')
        ORDER BY bytes DESC`,
        [schoolId]
    );

    return {
        usedBytes,
        limitBytes,
        percent: limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0,
        breakdown: breakdown.map((row) => ({
            moduleKey: row.moduleKey,
            bytes: Number(row.bytes),
            percent: usedBytes > 0 ? Math.round((Number(row.bytes) / usedBytes) * 100) : 0,
        })),
    };
};

// ── Get Public School ────────────────────────────────
const getPublicSchoolService = async (slug) => {
    const [rows] = await pool.query(
        `SELECT
            s.id, s.name, s.slug, s.email, s.phone, s.phone2, s.whatsapp_number, s.address,
            s.city, s.state, s.pincode, s.logo_url, s.theme, s.base_theme,
            s.nav_font, s.heading_font,
            s.selected_modules, s.status, s.map_url,
            s.facebook, s.instagram, s.youtube, s.twitter, s.linkedin,
            s.hero_video_url, s.hero_video_title, s.intro_message, s.intro_message_enabled,
            s.welcome_banner_enabled, s.welcome_banner_url, s.welcome_banner_link,
            s.footer_bg_url, s.footer_about_text, s.bg_music_enabled, s.bg_music_track, s.affiliation_badges,
            s.prospectus_url, s.school_app_label, s.school_app_url,
            s.plan_id, s.plan_end_date
        FROM tbl_schools s
        WHERE s.slug = ? AND s.status = 'active'`,
        [slug]
    );

    if (rows.length === 0) {
        throw new AppError('School not found', 404);
    }

    const school = rows[0];

    // Past-grace-period expiry takes the public site offline the same as
    // status = 'suspended' — an expired-past-grace school has no plan_id/
    // plan_end_date changed anywhere, so this is the only place that acts on it.
    if (!isPlanActive(school.plan_id, school.plan_end_date)) {
        throw new AppError('School not found', 404);
    }
    delete school.plan_id;
    delete school.plan_end_date;
    school.selected_modules = typeof school.selected_modules === 'string'
        ? JSON.parse(school.selected_modules)
        : (school.selected_modules || []);
    school.affiliation_badges = typeof school.affiliation_badges === 'string'
        ? JSON.parse(school.affiliation_badges)
        : (school.affiliation_badges || []);

    return school;
};

// ── Resolve School by Custom Domain ──────────────────
// Used by the frontend on first load to detect a visitor arriving via a school's
// own connected domain (e.g. www.theirschool.com) rather than the platform's own
// host — returns just the slug, which the frontend then treats exactly like a
// normal /school/:slug visit.
const getSchoolSlugByDomainService = async (domain) => {
    const [rows] = await pool.query(
        `SELECT slug FROM tbl_schools WHERE custom_domain = ? AND status = 'active'`,
        [domain]
    );

    if (rows.length === 0) {
        throw new AppError('No school connected to this domain', 404);
    }

    return { slug: rows[0].slug };
};

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
// ── Update Admin Account (name/email — the admin's own login identity,
// separate from the school's public-facing profile above) ───────────
const updateAdminAccountService = async (adminId, { name, email }) => {
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedName) throw new AppError("Name is required", 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        throw new AppError("Enter a valid email address", 400);
    }

    const [existing] = await pool.query(
        "SELECT id FROM tbl_admins WHERE email = ? AND id != ?",
        [trimmedEmail, adminId]
    );
    if (existing.length > 0) {
        throw new AppError("This email is already in use", 409);
    }

    await pool.query(
        "UPDATE tbl_admins SET name = ?, email = ? WHERE id = ?",
        [trimmedName, trimmedEmail, adminId]
    );

    return { name: trimmedName, email: trimmedEmail };
};

module.exports = {
    getSchoolProfileService,
    updateSchoolProfileService,
    updateSchoolSettingsService,
    selectModulesService,
    getSelectedModulesService,
    acceptTermsService,
    getPublicSchoolService,
    getSchoolSlugByDomainService,
    getDashboardStatsService,
    getStorageUsageService,
    updateAdminAccountService,
};