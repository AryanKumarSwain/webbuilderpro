const {
    getSchoolProfileService,
    updateSchoolProfileService,
    updateSchoolSettingsService,
    selectModulesService,
    getSelectedModulesService,
    acceptTermsService,
    getPublicSchoolService,
    getSchoolSlugByDomainService,
    getStorageUsageService,
    updateAdminAccountService,
} = require('./school.service');
const { sendSuccess, sendError, handleControllerError } = require('../../utils/response.utils');
const { recordMediaUsage, recalculateSchoolStorage } = require('../../utils/storage.utils');

// ── Get School Profile ───────────────────────────────
const getSchoolProfile = async (req, res) => {
    try {
        const school = await getSchoolProfileService(req.user.schoolId);
        return sendSuccess(res, 'School profile received', school);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Update Admin Account (name/email — the admin's own login identity) ──
const updateAdminAccount = async (req, res) => {
    try {
        const result = await updateAdminAccountService(req.user.id, req.body);
        return sendSuccess(res, 'Account updated successfully', result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Update School Profile ────────────────────────────
const updateSchoolProfile = async (req, res) => {
    try {
        const school = await updateSchoolProfileService(req.user.schoolId, req.body);
        return sendSuccess(res, 'School profile updated', school);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Update School Settings ───────────────────────────
const updateSchoolSettings = async (req, res) => {
    try {
        const school = await updateSchoolSettingsService(req.user.schoolId, req.body);
        return sendSuccess(res, 'Settings updated', school);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Select Modules ───────────────────────────────────
const selectModules = async (req, res) => {
    try {
        const result = await selectModulesService(req.user.schoolId, req.body.modules);
        return sendSuccess(res, 'Modules selected', result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Get Selected Modules ─────────────────────────────
const getSelectedModules = async (req, res) => {
    try {
        const result = await getSelectedModulesService(req.user.schoolId);
        return sendSuccess(res, 'Selected modules received', result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Accept Terms ──────────────────────────────────────
const acceptTerms = async (req, res) => {
    try {
        const result = await acceptTermsService(req.user.schoolId);
        return sendSuccess(res, 'Terms accepted', result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Get Public School ────────────────────────────────
const getPublicSchool = async (req, res) => {
    try {
        const school = await getPublicSchoolService(req.params.slug);
        return sendSuccess(res, 'School data fetched', school);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Resolve School by Custom Domain ──────────────────
const getSchoolByDomain = async (req, res) => {
    try {
        const result = await getSchoolSlugByDomainService(req.params.domain);
        return sendSuccess(res, 'School resolved', result);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Upload Hero Video ────────────────────────────────
const uploadHeroVideo = async (req, res) => {
    try {
        if (!req.file) return sendError(res, 'No video file uploaded', 400);
        const videoUrl = req.file.path;
        const title = req.body.title || '';
        await updateSchoolProfileService(req.user.schoolId, {
            hero_video_url: videoUrl,
            hero_video_title: title
        });
        await recordMediaUsage({ schoolId: req.user.schoolId, moduleKey: 'home', resourceType: 'video', sizeBytes: req.file.size, url: videoUrl, publicId: req.file.filename });
        return sendSuccess(res, 'Hero video uploaded successfully', { hero_video_url: videoUrl });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Upload School Logo ───────────────────────────────
const uploadSchoolLogo = async (req, res) => {
    try {
        if (!req.file) return sendError(res, 'No file uploaded', 400);
        const logoUrl = req.file.path;
        await updateSchoolProfileService(req.user.schoolId, { logo_url: logoUrl });
        await recordMediaUsage({ schoolId: req.user.schoolId, moduleKey: null, resourceType: 'image', sizeBytes: req.file.size, url: logoUrl, publicId: req.file.filename });
        return sendSuccess(res, 'Logo uploaded successfully', { logo_url: logoUrl });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Upload Welcome Banner ────────────────────────────
const uploadWelcomeBanner = async (req, res) => {
    try {
        if (!req.file) return sendError(res, 'No file uploaded', 400);
        const bannerUrl = req.file.path;
        await updateSchoolProfileService(req.user.schoolId, { welcome_banner_url: bannerUrl });
        await recordMediaUsage({ schoolId: req.user.schoolId, moduleKey: null, resourceType: 'image', sizeBytes: req.file.size, url: bannerUrl, publicId: req.file.filename });
        return sendSuccess(res, 'Welcome banner uploaded successfully', { welcome_banner_url: bannerUrl });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Upload Footer Background ─────────────────────────
const uploadFooterBackground = async (req, res) => {
    try {
        if (!req.file) return sendError(res, 'No file uploaded', 400);
        const footerBgUrl = req.file.path;
        await updateSchoolProfileService(req.user.schoolId, { footer_bg_url: footerBgUrl });
        await recordMediaUsage({ schoolId: req.user.schoolId, moduleKey: null, resourceType: 'image', sizeBytes: req.file.size, url: footerBgUrl, publicId: req.file.filename });
        return sendSuccess(res, 'Footer background uploaded successfully', { footer_bg_url: footerBgUrl });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Upload Prospectus ─────────────────────────────────
const uploadProspectus = async (req, res) => {
    try {
        if (!req.file) return sendError(res, 'No file uploaded', 400);
        const prospectusUrl = req.file.path;
        await updateSchoolProfileService(req.user.schoolId, { prospectus_url: prospectusUrl });
        await recordMediaUsage({ schoolId: req.user.schoolId, moduleKey: null, resourceType: 'pdf', sizeBytes: req.file.size, url: prospectusUrl, publicId: req.file.filename });
        return sendSuccess(res, 'Prospectus uploaded successfully', { prospectus_url: prospectusUrl });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const stats = await getDashboardStatsService();
        return sendSuccess(res, 'Dashboard stats fetched', stats);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const getStorageUsage = async (req, res) => {
    try {
        const usage = await getStorageUsageService(req.user.schoolId);
        return sendSuccess(res, 'Storage usage fetched', usage);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

// Dashboard "Recalculate storage" — reconciles the media ledger against saved
// content (drops orphaned uploads, deletes them from Cloudinary), then returns
// the refreshed usage numbers plus how many rows were reclaimed.
const recalculateStorage = async (req, res) => {
    try {
        const { removed } = await recalculateSchoolStorage(req.user.schoolId);
        const usage = await getStorageUsageService(req.user.schoolId);
        return sendSuccess(res, 'Storage recalculated', { ...usage, removed });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

module.exports = {
    getSchoolProfile,
    updateSchoolProfile,
    updateAdminAccount,
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
    getDashboardStats,
    getStorageUsage,
    recalculateStorage,
};