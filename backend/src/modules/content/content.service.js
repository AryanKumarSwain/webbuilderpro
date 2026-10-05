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

    let row = rows[0];

    // If testimonials module row doesn't exist yet, check if home has testimonials
    if (!row && moduleKey === 'testimonials') {
        const [homeRows] = await pool.query(
            `SELECT content, draft_content, is_published FROM tbl_module_content WHERE school_id = ? AND module_key = 'home'`,
            [schoolId]
        );
        if (homeRows.length > 0) {
            const homeC = typeof homeRows[0].content === 'string' ? JSON.parse(homeRows[0].content || '{}') : (homeRows[0].content || {});
            const homeDc = homeRows[0].draft_content ? (typeof homeRows[0].draft_content === 'string' ? JSON.parse(homeRows[0].draft_content) : homeRows[0].draft_content) : null;
            const active = homeDc || homeC;
            if (active?.testimonials?.length > 0) {
                return {
                    school_id: schoolId,
                    module_key: 'testimonials',
                    content: {
                        heading: active.testimonialsHeading || '',
                        headingColor: active.testimonialsHeadingColor || '',
                        headingFont: active.testimonialsHeadingFont || '',
                        testimonials: active.testimonials,
                        videoTestimonials: []
                    },
                    published_content: {
                        heading: active.testimonialsHeading || '',
                        testimonials: active.testimonials,
                        videoTestimonials: []
                    },
                    has_draft_changes: false,
                    is_published: homeRows[0].is_published === 1 ? 1 : 0
                };
            }
        }
    }

    if (!row) return null;

    let publishedContent = typeof row.content === 'string' ? JSON.parse(row.content || '{}') : (row.content || {});
    let draftContent = row.draft_content
        ? (typeof row.draft_content === 'string' ? JSON.parse(row.draft_content) : row.draft_content)
        : null;

    // Automatic fallback sync if testimonials array is empty in current module but present in counterpart
    if (moduleKey === 'testimonials' || moduleKey === 'home') {
        const otherKey = moduleKey === 'testimonials' ? 'home' : 'testimonials';
        const activeContent = (row.is_published === 1 && publishedContent) ? publishedContent : (draftContent !== null ? draftContent : publishedContent);
        if (!activeContent.testimonials || activeContent.testimonials.length === 0) {
            const [otherRows] = await pool.query(
                `SELECT content, draft_content, is_published FROM tbl_module_content WHERE school_id = ? AND module_key = ?`,
                [schoolId, otherKey]
            );
            if (otherRows.length > 0) {
                const otherC = typeof otherRows[0].content === 'string' ? JSON.parse(otherRows[0].content || '{}') : (otherRows[0].content || {});
                const otherDc = otherRows[0].draft_content ? (typeof otherRows[0].draft_content === 'string' ? JSON.parse(otherRows[0].draft_content) : otherRows[0].draft_content) : null;
                const otherActive = (otherRows[0].is_published === 1 && otherC) ? otherC : (otherDc || otherC);
                if (otherActive?.testimonials?.length > 0) {
                    if (draftContent) draftContent.testimonials = otherActive.testimonials;
                    if (publishedContent) publishedContent.testimonials = otherActive.testimonials;
                }
            }
        }
    }

    // The admin editor prioritizes publishedContent when published, so stale ghost drafts never override live data:
    row.content = (row.is_published === 1 && publishedContent) ? publishedContent : (draftContent !== null ? draftContent : publishedContent);
    row.published_content = publishedContent;
    row.has_draft_changes = row.is_published !== 1 && draftContent !== null && JSON.stringify(draftContent) !== JSON.stringify(publishedContent);
    row.is_published = row.is_published === 1 ? 1 : 0;
    return row;
};

// ── Sync Testimonials Between 'home' and 'testimonials' Modules ──
const syncTestimonialsBetweenHomeAndModule = async (schoolId, sourceKey, sourceContent, shouldPublish) => {
    if (sourceKey !== 'home' && sourceKey !== 'testimonials') return;

    try {
        const targetKey = sourceKey === 'home' ? 'testimonials' : 'home';
        const [rows] = await pool.query(
            `SELECT content, draft_content, is_published FROM tbl_module_content WHERE school_id = ? AND module_key = ?`,
            [schoolId, targetKey]
        );

        const targetRow = rows[0];
        let targetContent = {};
        let targetDraftContent = null;
        let isPublished = targetRow ? (targetRow.is_published === 1 ? 1 : 0) : 0;

        if (targetRow) {
            targetContent = typeof targetRow.content === 'string' ? JSON.parse(targetRow.content || '{}') : (targetRow.content || {});
            if (targetRow.draft_content) {
                targetDraftContent = typeof targetRow.draft_content === 'string' ? JSON.parse(targetRow.draft_content) : targetRow.draft_content;
            }
        } else {
            if (targetKey === 'testimonials') {
                targetContent = { heading: '', testimonials: [], videoTestimonials: [] };
            } else {
                targetContent = { testimonials: [] };
            }
        }

        const sourceTestimonials = Array.isArray(sourceContent?.testimonials) ? sourceContent.testimonials : [];

        if (targetKey === 'testimonials') {
            targetContent.testimonials = sourceTestimonials;
            if (sourceContent.testimonialsHeading) {
                targetContent.heading = sourceContent.testimonialsHeading;
            }
            if (sourceContent.testimonialsHeadingColor) {
                targetContent.headingColor = sourceContent.testimonialsHeadingColor;
            }
            if (sourceContent.testimonialsHeadingFont) {
                targetContent.headingFont = sourceContent.testimonialsHeadingFont;
            }

            if (targetDraftContent) {
                targetDraftContent.testimonials = sourceTestimonials;
                if (sourceContent.testimonialsHeading) {
                    targetDraftContent.heading = sourceContent.testimonialsHeading;
                }
                if (sourceContent.testimonialsHeadingColor) {
                    targetDraftContent.headingColor = sourceContent.testimonialsHeadingColor;
                }
                if (sourceContent.testimonialsHeadingFont) {
                    targetDraftContent.headingFont = sourceContent.testimonialsHeadingFont;
                }
            }
        } else {
            targetContent.testimonials = sourceTestimonials;
            if (sourceContent.heading) {
                targetContent.testimonialsHeading = sourceContent.heading;
            }
            if (sourceContent.headingColor) {
                targetContent.testimonialsHeadingColor = sourceContent.headingColor;
            }
            if (sourceContent.headingFont) {
                targetContent.testimonialsHeadingFont = sourceContent.headingFont;
            }

            if (targetDraftContent) {
                targetDraftContent.testimonials = sourceTestimonials;
                if (sourceContent.heading) {
                    targetDraftContent.testimonialsHeading = sourceContent.heading;
                }
                if (sourceContent.headingColor) {
                    targetDraftContent.testimonialsHeadingColor = sourceContent.headingColor;
                }
                if (sourceContent.headingFont) {
                    targetDraftContent.testimonialsHeadingFont = sourceContent.headingFont;
                }
            }
        }

        if (shouldPublish) {
            const updatedContentJson = JSON.stringify(targetDraftContent || targetContent);
            await pool.query(
                `INSERT INTO tbl_module_content (school_id, module_key, content, draft_content, is_published)
                 VALUES (?, ?, ?, NULL, ?)
                 ON DUPLICATE KEY UPDATE
                 content = VALUES(content),
                 draft_content = NULL,
                 is_published = VALUES(is_published),
                 updated_at = CURRENT_TIMESTAMP`,
                [schoolId, targetKey, updatedContentJson, isPublished || 1]
            );
        } else {
            const draftToSave = targetDraftContent || { ...targetContent };
            const draftJson = JSON.stringify(draftToSave);
            const contentJson = JSON.stringify(targetContent);
            await pool.query(
                `INSERT INTO tbl_module_content (school_id, module_key, content, draft_content, is_published)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 draft_content = VALUES(draft_content),
                 updated_at = CURRENT_TIMESTAMP`,
                [schoolId, targetKey, contentJson, draftJson, isPublished]
            );
        }
    } catch (err) {
        console.error('[content.service] syncTestimonialsBetweenHomeAndModule error:', err?.message);
    }
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

    // Auto-sync testimonials between 'home' and 'testimonials' modules
    if (moduleKey === 'home' || moduleKey === 'testimonials') {
        await syncTestimonialsBetweenHomeAndModule(schoolId, moduleKey, content, shouldPublish);
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

    let content = rows.length > 0
        ? (typeof rows[0].content === 'string' ? JSON.parse(rows[0].content) : rows[0].content)
        : null;

    // Fallback sync for testimonials between public home and public testimonials
    if (moduleKey === 'home') {
        if (content && (!content.testimonials || content.testimonials.length === 0)) {
            const [testRows] = await pool.query(
                `SELECT content FROM tbl_module_content WHERE school_id = ? AND module_key = 'testimonials' AND is_published = 1`,
                [schoolId]
            );
            if (testRows.length > 0) {
                const testC = typeof testRows[0].content === 'string' ? JSON.parse(testRows[0].content) : testRows[0].content;
                if (testC?.testimonials?.length > 0) {
                    content.testimonials = testC.testimonials;
                }
            }
        }
    } else if (moduleKey === 'testimonials') {
        if (!content) {
            // If testimonials module wasn't explicitly published yet, but home is published with testimonials
            const [homeRows] = await pool.query(
                `SELECT content FROM tbl_module_content WHERE school_id = ? AND module_key = 'home' AND is_published = 1`,
                [schoolId]
            );
            if (homeRows.length > 0) {
                const homeC = typeof homeRows[0].content === 'string' ? JSON.parse(homeRows[0].content) : homeRows[0].content;
                if (homeC?.testimonials?.length > 0) {
                    content = {
                        heading: homeC.testimonialsHeading || 'What People Say About Us',
                        headingColor: homeC.testimonialsHeadingColor || '',
                        headingFont: homeC.testimonialsHeadingFont || '',
                        testimonials: homeC.testimonials,
                        videoTestimonials: []
                    };
                }
            }
        } else if (!content.testimonials || content.testimonials.length === 0) {
            const [homeRows] = await pool.query(
                `SELECT content FROM tbl_module_content WHERE school_id = ? AND module_key = 'home' AND is_published = 1`,
                [schoolId]
            );
            if (homeRows.length > 0) {
                const homeC = typeof homeRows[0].content === 'string' ? JSON.parse(homeRows[0].content) : homeRows[0].content;
                if (homeC?.testimonials?.length > 0) {
                    content.testimonials = homeC.testimonials;
                }
            }
        }
    }

    return content;
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