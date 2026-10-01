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
    const publishedContent = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    const draftContent = row.draft_content
        ? (typeof row.draft_content === 'string' ? JSON.parse(row.draft_content) : row.draft_content)
        : null;

    // The admin editor loads draftContent if present, else publishedContent:
    row.content = draftContent !== null ? draftContent : publishedContent;
    row.published_content = publishedContent;
    row.has_draft_changes = draftContent !== null && JSON.stringify(draftContent) !== JSON.stringify(publishedContent);
    row.is_published = row.is_published === 1 ? 1 : 0;
    return row;
};

// ── Save Module Content ──────────────────────────────
// If shouldPublish is true: promotes content to published, clears draft_content, marks is_published = 1.
// If shouldPublish is false: saves to draft_content only (autosave), preserving live published content.
const saveModuleContentService = async (schoolId, moduleKey, content, shouldPublish = false) => {
    const contentJson = JSON.stringify(content);

    try {
        if (shouldPublish) {
            await pool.query(
                `INSERT INTO tbl_module_content (school_id, module_key, content, draft_content, is_published)
                 VALUES (?, ?, ?, NULL, 1)
                 ON DUPLICATE KEY UPDATE
                 content = VALUES(content),
                 draft_content = NULL,
                 is_published = 1,
                 updated_at = CURRENT_TIMESTAMP`,
                [schoolId, moduleKey, contentJson]
            );
        } else {
            await pool.query(
                `INSERT INTO tbl_module_content (school_id, module_key, content, draft_content, is_published)
                 VALUES (?, ?, ?, ?, 0)
                 ON DUPLICATE KEY UPDATE
                 draft_content = VALUES(draft_content),
                 updated_at = CURRENT_TIMESTAMP`,
                [schoolId, moduleKey, contentJson, contentJson]
            );
        }
    } catch (dbErr) {
        if (dbErr?.message?.includes("Unknown column 'draft_content'")) {
            console.warn("[content.service] draft_content column missing, adding column...");
            try {
                await pool.query(`ALTER TABLE tbl_module_content ADD COLUMN draft_content LONGTEXT NULL AFTER content`);
                return await saveModuleContentService(schoolId, moduleKey, content, shouldPublish);
            } catch (alterErr) {
                console.error("[content.service] auto-alter failed:", alterErr?.message);
                await pool.query(
                    `INSERT INTO tbl_module_content (school_id, module_key, content, is_published)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     content = VALUES(content),
                     is_published = VALUES(is_published),
                     updated_at = CURRENT_TIMESTAMP`,
                    [schoolId, moduleKey, contentJson, shouldPublish ? 1 : 0]
                );
            }
        } else {
            throw dbErr;
        }
    }

    // Free the school's storage quota for any uploads this save removed
    // (see storage.utils.js). Isolated so a reconcile hiccup can't fail a save.
    try {
        await reconcileModuleMedia(schoolId, moduleKey, content);
    } catch (err) {
        console.error("[storage] reconcile failed", schoolId, moduleKey, err?.message);
    }

    return await getModuleContentService(schoolId, moduleKey);
};

// ── Publish / Unpublish Module ──
const togglePublishService = async (schoolId, moduleKey, explicitStatus) => {
    let query, params;
    if (explicitStatus !== undefined && explicitStatus !== null) {
        const val = (explicitStatus === 1 || explicitStatus === true || explicitStatus === '1') ? 1 : 0;
        if (val === 1) {
            query = `UPDATE tbl_module_content
                     SET is_published = 1,
                     content = COALESCE(draft_content, content),
                     draft_content = NULL,
                     updated_at = CURRENT_TIMESTAMP
                     WHERE school_id = ? AND module_key = ?`;
        } else {
            query = `UPDATE tbl_module_content
                     SET is_published = 0,
                     updated_at = CURRENT_TIMESTAMP
                     WHERE school_id = ? AND module_key = ?`;
        }
        params = [schoolId, moduleKey];
    } else {
        query = `UPDATE tbl_module_content
                 SET is_published = IF(is_published = 1, 0, 1),
                 content = IF(is_published = 0, COALESCE(draft_content, content), content),
                 draft_content = IF(is_published = 0, NULL, draft_content),
                 updated_at = CURRENT_TIMESTAMP
                 WHERE school_id = ? AND module_key = ?`;
        params = [schoolId, moduleKey];
    }

    try {
        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            throw new AppError("Module content not found.", 404);
        }
    } catch (err) {
        if (err?.message?.includes("Unknown column 'draft_content'")) {
            const fallbackQuery = `UPDATE tbl_module_content SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE school_id = ? AND module_key = ?`;
            const [result] = await pool.query(fallbackQuery, [explicitStatus ? 1 : 0, schoolId, moduleKey]);
            if (result.affectedRows === 0) {
                throw new AppError("Module content not found.", 404);
            }
        } else {
            throw err;
        }
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