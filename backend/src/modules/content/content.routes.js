const express = require('express');
const router = express.Router();
const {
    getModuleContent,
    saveModuleContent,
    togglePublish,
    getPublicModuleContent,
    getPublishedModules,
    uploadContentImageHandler,
    uploadPdfHandler,
    uploadVideoHandler,
} = require('./content.controller');
const { protect, isAdmin } = require('../../middlewares/auth.middleware');
const { requireActivePlan } = require('../../middlewares/plan.middleware');
const { uploadContentImage, uploadPdf, uploadVideo } = require('../../config/cloudinary');
const { checkStorageLimitMiddleware } = require('../../utils/storage.utils');
// ── Public Routes ────────────────────────────────────
router.get('/public/:schoolId/modules/published', getPublishedModules);
router.get('/public/:schoolId/:moduleKey', getPublicModuleContent);

// ── Protected Routes ─────────────────────────────────
router.use(protect);
router.use(isAdmin);

router.post('/upload-image', requireActivePlan, checkStorageLimitMiddleware, uploadContentImage.single('image'), uploadContentImageHandler);
router.post('/upload-pdf', requireActivePlan, checkStorageLimitMiddleware, uploadPdf.single('pdf'), uploadPdfHandler);
router.post('/upload-video', requireActivePlan, checkStorageLimitMiddleware, uploadVideo.single('video'), uploadVideoHandler);
router.get('/:moduleKey', getModuleContent);
router.post('/:moduleKey', requireActivePlan, saveModuleContent);
router.patch('/:moduleKey/publish', requireActivePlan, togglePublish);

module.exports = router;