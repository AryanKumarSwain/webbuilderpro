const { pool } = require("../../config/db");
const AppError = require("../../utils/error.utils");
const { reconcileModuleMedia } = require("../../utils/storage.utils");
const { isPlanActive } = require("../../config/plan.config");

// ── Assert School Publicly Visible ───────────────────
// Same offline gate as getPublicSchoolService (school.service.js) — a
// suspended school, or one expired past its grace period, must be
// unreachable through this schoolId-keyed endpoint too, not just through the
// slug-keyed one. Without this, a suspended/expired school's already-published
// content stayed fetchable by anyone who knew/guessed its numeric id.
const assertSchoolPubliclyVisible = async (schoolId) => {
    const [rows] = await pool.query(
        `SELECT status, plan_id, plan_end_date FROM tbl_schools WHERE id = ?`,
        [schoolId]
    );
    const school = rows[0];
    if (!school || school.status !== 'active' || !isPlanActive(school.plan_id, school.plan_end_date)) {
        throw new AppError('School not found', 404);
    }
};

// ── Get Module Content ───────────────────────────────
const getModuleContentService = async (schoolId, moduleKey) => {
    const [rows] = await pool.query(
        `SELECT * FROM tbl_module_content WHERE school_id = ? AND module_key = ?`,
        [schoolId, moduleKey]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    row.content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    return row;
};

// ── Save Module Content ──────────────────────────────
// RULE: Save NEVER touches is_published. Save = content only.
// (Old bug: is_published = VALUES(is_published) reset the flag — or set
//  NULL when the controller passed undefined — on every single save,
//  silently unpublishing live modules.)
const saveModuleContentService = async (schoolId, moduleKey, content) => {
    const contentJson = JSON.stringify(content);

    await pool.query(
        `INSERT INTO tbl_module_content (school_id, module_key, content, is_published)
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
         content = VALUES(content),
         updated_at = CURRENT_TIMESTAMP`,
        [schoolId, moduleKey, contentJson]
    );
    // Note: is_published intentionally absent from the UPDATE clause —
    // a new row starts as draft (0), an existing row keeps its flag.

    // Free the school's storage quota for any uploads this save removed
    // (see storage.utils.js). Isolated so a reconcile hiccup can't fail a save.
    try {
        await reconcileModuleMedia(schoolId, moduleKey, content);
    } catch (err) {
        console.error("[storage] reconcile failed", schoolId, moduleKey, err?.message);
    }

    return await getModuleContentService(schoolId, moduleKey);
};

// ── Publish / Unpublish Module (server-side toggle) ──
// RULE: Never trust a client-supplied flag (old bug: frontend sent
// nothing → undefined → NULL). The server flips the current DB value,
// NULL-safe: 1 → 0, and 0/NULL → 1.
const togglePublishService = async (schoolId, moduleKey) => {
    const [result] = await pool.query(
        `UPDATE tbl_module_content
         SET is_published = IF(is_published = 1, 0, 1)
         WHERE school_id = ? AND module_key = ?`,
        [schoolId, moduleKey]
    );

    if (result.affectedRows === 0) {
        throw new AppError("Module content not found. Save the module before publishing.", 404);
    }

    const [rows] = await pool.query(
        `SELECT is_published FROM tbl_module_content WHERE school_id = ? AND module_key = ?`,
        [schoolId, moduleKey]
    );

    return { isPublished: !!rows[0]?.is_published };
};

// ── Get Public Module Content ────────────────────────
const getPublicModuleContentService = async (schoolId, moduleKey) => {
    await assertSchoolPubliclyVisible(schoolId);

    const [rows] = await pool.query(
        `SELECT content FROM tbl_module_content
         WHERE school_id = ? AND module_key = ? AND is_published = 1`,
        [schoolId, moduleKey]
    );

    if (rows.length === 0) return null;

    return typeof rows[0].content === 'string'
        ? JSON.parse(rows[0].content)
        : rows[0].content;
};

// ── Get Published Module Keys — used by the public site to only show nav/footer
//    links for modules the school has actually published (not just enabled) ──
const getPublishedModuleKeysService = async (schoolId) => {
    await assertSchoolPubliclyVisible(schoolId);

    const [rows] = await pool.query(
        `SELECT module_key FROM tbl_module_content WHERE school_id = ? AND is_published = 1`,
        [schoolId]
    );
    return rows.map(r => r.module_key);
};

module.exports = {
    getModuleContentService,
    saveModuleContentService,
    togglePublishService,
    getPublicModuleContentService,
    getPublishedModuleKeysService,
};