import axiosInstance from '../config/axios';
import { assertImageSizeOk, assertHeroVideoSizeOk } from '../utils/fileValidation';
import { compressFormDataImage } from '../utils/compressImage';

// ── Profile ──────────────────────────────────────────
export const getSchoolProfileApi = async () => {
    const response = await axiosInstance.get('/school/profile');
    return response.data;
};

export const updateSchoolProfileApi = async (profileData) => {
    const response = await axiosInstance.put('/school/profile', profileData);
    return response.data;
};

// ── Admin Account (the admin's own name/login email) ─────────────────
export const updateAdminAccountApi = async (accountData) => {
    const response = await axiosInstance.put('/school/account', accountData);
    return response.data;
};

// ── Settings ─────────────────────────────────────────
export const updateSchoolSettingsApi = async (settingsData) => {
    const response = await axiosInstance.put('/school/settings', settingsData);
    return response.data;
};

// ── Modules ──────────────────────────────────────────
export const getSelectedModulesApi = async () => {
    const response = await axiosInstance.get('/school/modules');
    return response.data;
};

export const selectModulesApi = async (modules) => {
    const response = await axiosInstance.post('/school/modules', { modules });
    return response.data;
};

// ── Terms Consent ─────────────────────────────────────
export const acceptTermsApi = async () => {
    const response = await axiosInstance.post('/school/accept-terms');
    return response.data;
};

export const getPublicSchoolApi = async (slug) => {
    const response = await axiosInstance.get(`/school/public/${slug}`);
    return response.data;
};

// Resolves a hostname (e.g. www.theirschool.com) to the school it belongs to, if any
// school has connected that domain via Settings -> Custom Domain.
export const resolveSchoolByDomainApi = async (domain) => {
    const response = await axiosInstance.get(`/school/public-domain/${domain}`);
    return response.data;
};

export const uploadHeroVideoApi = async (formData) => {
    assertHeroVideoSizeOk(formData.get('heroVideo'));
    const response = await axiosInstance.post('/school/hero-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadSchoolLogoApi = async (formData) => {
    assertImageSizeOk(formData.get('schoolLogo'));
    await compressFormDataImage(formData, 'schoolLogo');
    const response = await axiosInstance.post('/school/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadWelcomeBannerApi = async (formData) => {
    assertImageSizeOk(formData.get('welcomeBanner'));
    await compressFormDataImage(formData, 'welcomeBanner');
    const response = await axiosInstance.post('/school/welcome-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadFooterBackgroundApi = async (formData) => {
    assertImageSizeOk(formData.get('footerBg'));
    await compressFormDataImage(formData, 'footerBg');
    const response = await axiosInstance.post('/school/footer-bg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadProspectusApi = async (formData) => {
    const response = await axiosInstance.post('/school/prospectus', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// ── Storage Usage ─────────────────────────────────────
export const getStorageUsageApi = async () => {
    const response = await axiosInstance.get('/school/storage-usage');
    return response.data;
};

// Reconciles the media ledger against saved content (drops orphaned uploads),
// then returns the refreshed usage figures plus a `removed` count.
export const recalculateStorageApi = async () => {
    const response = await axiosInstance.post('/school/storage-usage/recalculate');
    return response.data;
};
