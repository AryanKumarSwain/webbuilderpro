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
    uploadPublicResumeHandler,
    uploadVideoHandler,
} = require('./content.controller');
const { protect, isAdmin } = require('../../middlewares/auth.middleware');
const { requireActivePlan } = require('../../middlewares/plan.middleware');
const { uploadContentImage, uploadPdf, uploadVideo } = require('../../config/cloudinary');
const { checkStorageLimitMiddleware, checkPublicStorageLimitMiddleware } = require('../../utils/storage.utils');
const { enquiryLimiter } = require('../../middlewares/rateLimit.middleware');
// ── Public Routes ────────────────────────────────────
router.get('/public/:schoolId/modules/published', getPublishedModules);
router.get('/public/:schoolId/:moduleKey', getPublicModuleContent);
// Career enquiry form's resume upload — the only public (unauthenticated)
// upload route. Previously the form called the admin-only /upload-pdf, which
// always 401'd for an actual anonymous visitor (only "worked" when whoever was
// testing it happened to be logged into the admin panel in the same browser).
router.post('/public/:schoolId/upload-resume', enquiryLimiter, checkPublicStorageLimitMiddleware, uploadPdf.single('pdf'), uploadPublicResumeHandler);

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