const express = require('express');
const router = express.Router();
const {
    getSchoolProfile,
    updateSchoolProfile,
    updateSchoolSettings,
    selectModules,
    getSelectedModules,
    acceptTerms,
    getPublicSchool,
    getSchoolByDomain,
    uploadHeroVideo,
    uploadSchoolLogo,
    uploadWelcomeBanner,
    uploadFooterBackground,
    uploadProspectus,
    getStorageUsage,
    recalculateStorage
} = require('./school.controller');
const { protect, isAdmin } = require('../../middlewares/auth.middleware');
const { requireActivePlan } = require('../../middlewares/plan.middleware');
const { upload, uploadContentImage, uploadPdf, uploadHeroVideo: uploadHeroVideoMiddleware } = require('../../config/cloudinary');
const { checkStorageLimitMiddleware } = require('../../utils/storage.utils');

// ── Public Routes — No Auth ──────────────────────────
router.get('/public/:slug', getPublicSchool);
router.get('/public-domain/:domain', getSchoolByDomain);

// ── Protected Routes ─────────────────────────────────
router.use(protect);
router.use(isAdmin);

// ── Profile Routes ───────────────────────────────────
router.get('/profile', getSchoolProfile);
router.put('/profile', requireActivePlan, updateSchoolProfile);


// ── Settings Routes ──────────────────────────────────
router.put('/settings', requireActivePlan, updateSchoolSettings);

// ── Module Routes ────────────────────────────────────
router.post('/modules', requireActivePlan, selectModules);
router.get('/modules', getSelectedModules);

// ── Terms Consent ─────────────────────────────────────
router.post('/accept-terms', acceptTerms);

// ── Storage Usage ─────────────────────────────────────
router.get('/storage-usage', getStorageUsage);
router.post('/storage-usage/recalculate', recalculateStorage);

// ── Logo Upload ──────────────────────────────────────
router.post('/logo', requireActivePlan, checkStorageLimitMiddleware, upload.single('schoolLogo'), uploadSchoolLogo);

// ── Video Upload — 5MB cap, tighter than the shared content-video uploader ──
router.post('/hero-video', requireActivePlan, checkStorageLimitMiddleware, uploadHeroVideoMiddleware.single('heroVideo'), uploadHeroVideo);

// ── Welcome Banner Upload ────────────────────────────
router.post('/welcome-banner', requireActivePlan, checkStorageLimitMiddleware, uploadContentImage.single('welcomeBanner'), uploadWelcomeBanner);

// ── Footer Background Upload ─────────────────────────
router.post('/footer-bg', requireActivePlan, checkStorageLimitMiddleware, uploadContentImage.single('footerBg'), uploadFooterBackground);

// ── Prospectus Upload ────────────────────────────────
router.post('/prospectus', requireActivePlan, checkStorageLimitMiddleware, uploadPdf.single('prospectus'), uploadProspectus);

module.exports = router;