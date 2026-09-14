const { pool } = require("../config/db");
const { cloudinary } = require("../config/cloudinary");
const AppError = require("./error.utils");

// tbl_media_usage.resource_type ('image'|'pdf'|'video') -> Cloudinary's own
// resource_type param for uploader.destroy ('image'|'raw'|'video').
const CLD_RESOURCE_TYPE = { image: "image", pdf: "raw", video: "video" };

// ── Record Media Usage ───────────────────────────────
// Appends one row to the storage ledger and bumps the school's denormalized
// running total in the same call, so the dashboard usage bar is a cheap
// single-row read instead of a SUM() over the ledger every time.
const recordMediaUsage = async ({ schoolId, moduleKey, resourceType, sizeBytes, url, publicId }) => {
    await pool.query(
        `INSERT INTO tbl_media_usage (school_id, module_key, resource_type, file_url, file_size_bytes, cloudinary_public_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [schoolId, moduleKey || null, resourceType, url, sizeBytes, publicId || null]
    );
    await pool.query(
        "UPDATE tbl_schools SET storage_used_bytes = storage_used_bytes + ? WHERE id = ?",
        [sizeBytes, schoolId]
    );
};

// ── Storage reclaim ──────────────────────────────────
// The ledger only ever grew (recordMediaUsage adds; nothing subtracted), so
// deleting content from a module never freed the school's quota. These helpers
// drop ledger rows whose asset is no longer referenced by any saved content,
// delete the Cloudinary asset too (best-effort), and re-derive the school's
// storage_used_bytes from the surviving ledger rows.

// Deletes the Cloudinary assets + ledger rows for `orphanRows`. Cloudinary
// failures are swallowed (a lingering file is a minor cost; freeing the quota is
// the point). Returns how many ledger rows were removed.
const purgeLedgerRows = async (orphanRows) => {
    if (orphanRows.length === 0) return 0;

    await Promise.allSettled(
        orphanRows
            .filter((r) => r.cloudinary_public_id)
            .map((r) =>
                cloudinary.uploader.destroy(r.cloudinary_public_id, {
                    resource_type: CLD_RESOURCE_TYPE[r.resource_type] || "image",
                })
            )
    );

    await pool.query(
        `DELETE FROM tbl_media_usage WHERE id IN (${orphanRows.map(() => "?").join(",")})`,
        orphanRows.map((r) => r.id)
    );
    return orphanRows.length;
};

// Authoritative recompute — also heals any historical drift between the
// denormalized total and the ledger.
const setSchoolStorageToLedgerSum = async (schoolId) => {
    await pool.query(
        `UPDATE tbl_schools s
        SET storage_used_bytes = (
            SELECT COALESCE(SUM(file_size_bytes), 0) FROM tbl_media_usage WHERE school_id = s.id
        )
        WHERE s.id = ?`,
        [schoolId]
    );
};

// Branding assets (no module_key) that live on tbl_schools columns. The Home
// hero video is deliberately NOT here — it's bucketed under module_key = 'home'
// for the usage breakdown and reconciled by reconcileHeroVideoMedia. pdf rows in
// the no-module bucket (prospectus, career resumes) are referenced from other
// tables and left alone.
const SCHOOL_ASSET_URL_COLUMNS = ["logo_url", "welcome_banner_url", "footer_bg_url"];

// Reconciles the module_key IS NULL / image+video ledger rows against the asset
// URLs currently on the school row. `schoolRow` may be passed in (e.g. the row
// updateSchoolProfileService just re-read) to skip a query.
const reconcileSchoolAssetMedia = async (schoolId, schoolRow = null) => {
    let row = schoolRow;
    if (!row) {
        const [rows] = await pool.query(
            `SELECT ${SCHOOL_ASSET_URL_COLUMNS.join(", ")} FROM tbl_schools WHERE id = ?`,
            [schoolId]
        );
        row = rows[0];
    }
    if (!row) return 0;

    const referenced = SCHOOL_ASSET_URL_COLUMNS.map((c) => row[c]).filter(Boolean).join("\n");

    const [ledger] = await pool.query(
        `SELECT id, file_url, cloudinary_public_id, resource_type
        FROM tbl_media_usage
        WHERE school_id = ? AND module_key IS NULL AND resource_type IN ('image', 'video')`,
        [schoolId]
    );
    const orphans = ledger.filter((r) => r.file_url && !referenced.includes(r.file_url));
    const removed = await purgeLedgerRows(orphans);
    if (removed > 0) await setSchoolStorageToLedgerSum(schoolId);
    return removed;
};

// The Home hero video lives on tbl_schools.hero_video_url, but its usage is
// attributed to the 'home' module (module_key = 'home', resource_type = 'video').
// Re-tags any legacy row that was logged with no module_key, then drops any
// 'home' video row that isn't the current hero video.
const reconcileHeroVideoMedia = async (schoolId) => {
    const [s] = await pool.query("SELECT hero_video_url FROM tbl_schools WHERE id = ?", [schoolId]);
    const url = s[0]?.hero_video_url || null;

    if (url) {
        await pool.query(
            `UPDATE tbl_media_usage SET module_key = 'home'
            WHERE school_id = ? AND module_key IS NULL AND resource_type = 'video' AND file_url = ?`,
            [schoolId, url]
        );
    }

    const [rows] = await pool.query(
        `SELECT id, file_url, cloudinary_public_id, resource_type
        FROM tbl_media_usage
        WHERE school_id = ? AND module_key = 'home' AND resource_type = 'video'`,
        [schoolId]
    );
    const orphans = rows.filter((r) => r.file_url && r.file_url !== url);
    const removed = await purgeLedgerRows(orphans);
    if (removed > 0) await setSchoolStorageToLedgerSum(schoolId);
    return removed;
};

// Called after every module save: any ledger row for this module whose file_url
// is no longer present in the saved content JSON is an orphan.
const reconcileModuleMedia = async (schoolId, moduleKey, content) => {
    // Only act on a real content payload — a missing / non-object `content` from
    // a malformed save must never be read as "every asset was deleted".
    if (!content || typeof content !== "object") return 0;
    const json = JSON.stringify(content);
    const [rows] = await pool.query(
        `SELECT id, file_url, cloudinary_public_id, resource_type
        FROM tbl_media_usage WHERE school_id = ? AND module_key = ?`,
        [schoolId, moduleKey]
    );
    // The Home hero video is a module_key='home' row but lives on tbl_schools,
    // not in this content JSON — reconcileHeroVideoMedia owns it.
    const candidates = moduleKey === "home" ? rows.filter((r) => r.resource_type !== "video") : rows;
    const orphans = candidates.filter((r) => r.file_url && !json.includes(r.file_url));
    const removed = await purgeLedgerRows(orphans);
    if (removed > 0) await setSchoolStorageToLedgerSum(schoolId);
    return removed;
};

// Dashboard "Recalculate storage" button — reconciles every module_key that has
// a saved content row, then recomputes the total. Ledger rows with no module_key
// (logos, banners, resumes — tracked on other tables) are intentionally left
// untouched here.
const recalculateSchoolStorage = async (schoolId) => {
    const [contentRows] = await pool.query(
        `SELECT module_key, content FROM tbl_module_content WHERE school_id = ?`,
        [schoolId]
    );
    const jsonByModule = {};
    for (const r of contentRows) {
        jsonByModule[r.module_key] =
            typeof r.content === "string" ? r.content : JSON.stringify(r.content);
    }

    const [rows] = await pool.query(
        `SELECT id, module_key, file_url, cloudinary_public_id, resource_type
        FROM tbl_media_usage WHERE school_id = ?`,
        [schoolId]
    );

    const orphans = rows.filter((r) => {
        if (!r.module_key) return false;                 // school-asset bucket — handled below
        const json = jsonByModule[r.module_key];
        if (json === undefined) return false;            // no saved content to judge against
        return r.file_url && !json.includes(r.file_url);
    });

    const removed = await purgeLedgerRows(orphans);
    const assetRemoved = await reconcileSchoolAssetMedia(schoolId);
    const heroRemoved = await reconcileHeroVideoMedia(schoolId);
    await setSchoolStorageToLedgerSum(schoolId);         // always recompute
    return { removed: removed + assetRemoved + heroRemoved };
};

// ── Check Storage Limit ──────────────────────────────
// A school with no plan yet is treated as unlimited here — in practice this
// can't happen for real content uploads since a school without an active plan
// never gets past the /admin/billing gate on the frontend.
const checkStorageLimit = async (schoolId, incomingBytes) => {
    const [rows] = await pool.query(
        `SELECT s.storage_used_bytes, p.storage_mb
        FROM tbl_schools s
        LEFT JOIN tbl_plans p ON s.plan_id = p.id
        WHERE s.id = ?`,
        [schoolId]
    );
    if (rows.length === 0) throw new AppError("School not found", 404);
    const { storage_used_bytes, storage_mb } = rows[0];

    if (storage_mb == null) return;

    const limitBytes = storage_mb * 1024 * 1024;
    if (Number(storage_used_bytes) + Number(incomingBytes) > limitBytes) {
        throw new AppError("Storage limit reached for your plan — upgrade your plan to upload more", 413);
    }
};

// ── Express Middleware — pre-check before the multer/Cloudinary upload ──
// Uses Content-Length as a close-enough estimate of the incoming file size, so an
// over-limit request gets rejected before it spends any Cloudinary upload bandwidth.
const { sendError } = require("./response.utils");

const checkStorageLimitMiddleware = async (req, res, next) => {
    try {
        const incomingBytes = Number(req.headers["content-length"]) || 0;
        await checkStorageLimit(req.user.schoolId, incomingBytes);
        next();
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// Same check, for a public (unauthenticated) upload route where there's no
// req.user — schoolId comes from the URL param instead. Used by the career
// enquiry form's public resume upload.
const checkPublicStorageLimitMiddleware = async (req, res, next) => {
    try {
        const incomingBytes = Number(req.headers["content-length"]) || 0;
        await checkStorageLimit(req.params.schoolId, incomingBytes);
        next();
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

module.exports = {
    recordMediaUsage,
    checkStorageLimit,
    checkStorageLimitMiddleware,
    checkPublicStorageLimitMiddleware,
    reconcileModuleMedia,
    reconcileSchoolAssetMedia,
    reconcileHeroVideoMedia,
    recalculateSchoolStorage,
};
