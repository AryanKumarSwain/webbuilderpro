const { pool } = require('../config/db');
const { sendError } = require('../utils/response.utils');
const { isPlanActive } = require('../config/plan.config');

// ── Require Active Plan ───────────────────────────────
// Backend enforcement to match the frontend's AdminLayout redirect — without
// this, an expired school could keep saving/uploading content by calling the
// API directly, bypassing the SPA gate entirely. Wired in front of
// content-mutating and upload routes only; never in front of login, billing,
// or read-only endpoints (an expired admin still needs to log in and pay).
const requireActivePlan = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            'SELECT plan_id, plan_end_date FROM tbl_schools WHERE id = ?',
            [req.user.schoolId]
        );

        if (rows.length === 0) {
            return sendError(res, 'School not found', 404);
        }

        const { plan_id, plan_end_date } = rows[0];
        if (!isPlanActive(plan_id, plan_end_date)) {
            return sendError(res, 'Your plan has expired — renew your plan to keep editing your website', 402);
        }

        next();
    } catch (error) {
        return sendError(res, 'Could not verify plan status', 500);
    }
};

module.exports = { requireActivePlan };
