const express = require('express');
const router = express.Router();
const {
    requestSubdomain,
    getMySubdomainRequest,
    getPendingSubdomainRequests,
    fulfillSubdomainRequest,
    rejectSubdomainRequest,
} = require('./subdomainRequest.controller');
const { protect, isAdmin, isSuperAdmin } = require('../../middlewares/auth.middleware');
const { requireActivePlan } = require('../../middlewares/plan.middleware');

// Everyone here must be logged in; which role beyond that varies per-route
// (School Admin submits/checks their own request, Super Admin fulfills the
// queue), so the role check is applied per-route rather than as a blanket
// router.use() like most other modules.
router.use(protect);

// ── School Admin ──────────────────────────────────────
router.post('/', isAdmin, requireActivePlan, requestSubdomain);
router.get('/mine', isAdmin, getMySubdomainRequest);

// ── Super Admin ────────────────────────────────────────
router.get('/pending', isSuperAdmin, getPendingSubdomainRequests);
router.patch('/:id/fulfill', isSuperAdmin, fulfillSubdomainRequest);
router.patch('/:id/reject', isSuperAdmin, rejectSubdomainRequest);

module.exports = router;
