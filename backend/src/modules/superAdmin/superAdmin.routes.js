const express = require('express');
const router = express.Router();
const {
    createSchool,
    getAllSchools,
    getSchoolByUuid,
    updateSchoolStatus,
    deleteSchool,
    createAdmin,
    updateAdminStatus,
    createSchoolWithAdmin,
    getDashboardStats,
} = require('./superAdmin.controller');
const { protect, isSuperAdmin } = require('../../middlewares/auth.middleware');
const { upload } = require('../../config/cloudinary');

router.use(protect);
router.use(isSuperAdmin);

// ── Dashboard ────────────────────────────────────────
router.get('/dashboard-stats', getDashboardStats);

// ── School Routes ────────────────────────────────────
router.post('/schools', createSchool);
router.get('/schools', getAllSchools);
router.get('/schools/:uuid', getSchoolByUuid);
router.patch('/schools/:uuid/status', updateSchoolStatus);
router.delete('/schools/:uuid', deleteSchool);

// ── Create School + Admin Together ───────────────────
router.post('/schools/create-with-admin', upload.single('schoolImage'), createSchoolWithAdmin);

// ── Admin Routes ─────────────────────────────────────
router.post('/admins', createAdmin);
router.patch('/admins/:uuid/status', updateAdminStatus);

module.exports = router;