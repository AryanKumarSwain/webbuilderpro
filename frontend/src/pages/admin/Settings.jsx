import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchoolProfileApi, updateSchoolProfileApi, updateAdminAccountApi, updateSchoolSettingsApi, uploadSchoolLogoApi, uploadWelcomeBannerApi, uploadFooterBackgroundApi, uploadProspectusApi } from '../../api/school.api';
import { uploadContentImageApi } from '../../api/content.api';
import { getMySubdomainRequestApi } from '../../api/subdomainRequest.api';
import { getActivePlansApi } from '../../api/plans.api';
import SubdomainRequestForm from '../../components/admin/SubdomainRequestForm';
import useSchoolStore from '../../store/schoolStore';
import ImageCropModal from '../../components/common/ImageCropModal';
import { FONT_OPTIONS, GOOGLE_FONTS_URL, getFontFamily } from '../../constants/fonts';
import { BASE_COLOR_OPTIONS } from '../../constants/publicNav';
import { MUSIC_TRACKS } from '../../constants/musicTracks';
import { sanitizePhoneDigits, isValidPhone } from '../../utils/phone';
import toast from 'react-hot-toast';

const MAX_AFFILIATION_BADGES = 3;

const InfoIcon = () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const BuildingIcon = ({ size = 32, color = '#cbd5e1' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
);

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const AdminSettings = () => {
    const navigate = useNavigate();
    const { tc, setTheme: setStoreTheme, setBaseTheme: setStoreBaseTheme, setLogo: setStoreLogo } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [hoveredTheme, setHoveredTheme] = useState(null);
    const [themeCategory, setThemeCategory] = useState('all'); // 'all' | 'gradient' | 'solid'
    const [baseCategory, setBaseCategory] = useState('all');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [removingLogo, setRemovingLogo] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoCropSrc, setLogoCropSrc] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '', phone: '', phone2: '', address: '', city: '', state: '', pincode: '', intro_message: '', intro_message_enabled: true
    });
    const [accountData, setAccountData] = useState({ name: '', email: '' });
    const [savingAccount, setSavingAccount] = useState(false);
    const [settingsData, setSettingsData] = useState({
        theme: '', base_theme: 'white', logo_url: '', nav_font: 'inter'
    });
    const [bannerData, setBannerData] = useState({
        welcome_banner_enabled: false, welcome_banner_url: '', welcome_banner_link: ''
    });
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [bannerCropSrc, setBannerCropSrc] = useState(null);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [removingBanner, setRemovingBanner] = useState(false);
    const [togglingBanner, setTogglingBanner] = useState(false);
    const [savingBannerLink, setSavingBannerLink] = useState(false);

    const [footerBgUrl, setFooterBgUrl] = useState('');
    const [footerBgFile, setFooterBgFile] = useState(null);
    const [footerBgPreview, setFooterBgPreview] = useState(null);
    const [footerBgCropSrc, setFooterBgCropSrc] = useState(null);
    const [uploadingFooterBg, setUploadingFooterBg] = useState(false);
    const [removingFooterBg, setRemovingFooterBg] = useState(false);
    const [footerAboutText, setFooterAboutText] = useState('');
    const [savingFooterAboutText, setSavingFooterAboutText] = useState(false);

    const [musicData, setMusicData] = useState({ bg_music_enabled: false, bg_music_track: '' });
    const [selectingTrack, setSelectingTrack] = useState(false);
    const [togglingMusic, setTogglingMusic] = useState(false);

    const [badges, setBadges] = useState([]);
    const [uploadingBadge, setUploadingBadge] = useState(null);
    const [savingBadges, setSavingBadges] = useState(false);

    const [customDomain, setCustomDomain] = useState('');
    const [savingDomain, setSavingDomain] = useState(false);

    // Free wbpro.in subdomain — separate from the custom-domain field above
    // (that one's for a school's own external domain). null while loading;
    // {} explicitly means "never requested one".
    const [subdomainRequest, setSubdomainRequest] = useState(null);

    const [prospectusUrl, setProspectusUrl] = useState('');
    const [prospectusFile, setProspectusFile] = useState(null);
    const [uploadingProspectus, setUploadingProspectus] = useState(false);
    const [removingProspectus, setRemovingProspectus] = useState(false);

    const [schoolAppLabel, setSchoolAppLabel] = useState('');
    const [schoolAppUrl, setSchoolAppUrl] = useState('');
    const [savingSchoolApp, setSavingSchoolApp] = useState(false);

    // Plan & Billing — plan_id/plan_end_date come straight off the school row
    // (already fetched by fetchProfile below); allPlans resolves plan_id to a
    // display name/price via the same public GET /plans Billing.jsx uses.
    const [planInfo, setPlanInfo] = useState({ plan_id: null, plan_start_date: null, plan_end_date: null });
    const [allPlans, setAllPlans] = useState([]);

    const tabsScrollRef = useRef(null);
    const scrollTabs = (dir) => tabsScrollRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

    useEffect(() => { fetchProfile(); }, []);
    useEffect(() => {
        getMySubdomainRequestApi()
            .then((res) => setSubdomainRequest(res.data || {}))
            .catch(() => setSubdomainRequest({}));
    }, []);
    useEffect(() => {
        getActivePlansApi()
            .then((res) => setAllPlans(res.data || []))
            .catch(() => setAllPlans([]));
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await getSchoolProfileApi();
            const school = res.data;
            setProfileData({
                name: school.name || '',
                phone: school.phone || '',
                phone2: school.phone2 || '',
                address: school.address || '',
                city: school.city || '',
                state: school.state || '',
                pincode: school.pincode || '',
                intro_message: school.intro_message || '',
                intro_message_enabled: school.intro_message_enabled === undefined ? true : !!school.intro_message_enabled,
            });
            setAccountData({
                name: school.admin_name || '',
                email: school.admin_email || '',
            });
            setSettingsData({
                theme: school.theme === 'default' ? 'rosePink' : (school.theme || ''),
                base_theme: school.base_theme || 'white',
                logo_url: school.logo_url || '',
                nav_font: school.nav_font || 'inter',
            });
            setBannerData({
                welcome_banner_enabled: !!school.welcome_banner_enabled,
                welcome_banner_url: school.welcome_banner_url || '',
                welcome_banner_link: school.welcome_banner_link || '',
            });
            setFooterBgUrl(school.footer_bg_url || '');
            setFooterAboutText(school.footer_about_text || '');
            setMusicData({
                bg_music_enabled: !!school.bg_music_enabled,
                bg_music_track: school.bg_music_track || '',
            });
            const parsedBadges = typeof school.affiliation_badges === 'string'
                ? JSON.parse(school.affiliation_badges || '[]')
                : (school.affiliation_badges || []);
            setBadges(Array.isArray(parsedBadges) ? parsedBadges : []);
            setCustomDomain(school.custom_domain || '');
            setProspectusUrl(school.prospectus_url || '');
            setSchoolAppLabel(school.school_app_label || '');
            setSchoolAppUrl(school.school_app_url || '');
            setPlanInfo({
                plan_id: school.plan_id ?? null,
                plan_start_date: school.plan_start_date || null,
                plan_end_date: school.plan_end_date || null,
            });
        } catch (e) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone' || name === 'phone2') {
            setProfileData({ ...profileData, [name]: sanitizePhoneDigits(value) });
            return;
        }
        setProfileData({ ...profileData, [name]: value });
    };

    const handleProfileSave = async () => {
        if (profileData.phone && !isValidPhone(profileData.phone)) {
            toast.error('Phone number must be exactly 10 digits');
            return;
        }
        if (profileData.phone2 && !isValidPhone(profileData.phone2)) {
            toast.error('Alternate phone number must be exactly 10 digits');
            return;
        }
        setSaving(true);
        try {
            await updateSchoolProfileApi(profileData);
            toast.success('Profile updated successfully!');
        } catch (e) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAccountChange = (e) => {
        const { name, value } = e.target;
        setAccountData({ ...accountData, [name]: value });
    };

    const handleAccountSave = async () => {
        const name = accountData.name.trim();
        const email = accountData.email.trim().toLowerCase();
        if (!name) {
            toast.error('Name is required');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error('Enter a valid email address');
            return;
        }
        setSavingAccount(true);
        try {
            await updateAdminAccountApi({ name, email });
            setAccountData({ name, email });
            toast.success('Account updated! Use your new email next time you log in.');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to update account');
        } finally {
            setSavingAccount(false);
        }
    };

    const handleDomainSave = async () => {
        const domain = customDomain.trim().toLowerCase();
        if (domain && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
            toast.error('Enter a valid domain, e.g. www.yourschool.com');
            return;
        }
        setSavingDomain(true);
        try {
            await updateSchoolProfileApi({ custom_domain: domain || null });
            setCustomDomain(domain);
            toast.success(domain ? 'Custom domain saved!' : 'Custom domain removed');
        } catch (e) {
            toast.error('Failed to save custom domain');
        } finally {
            setSavingDomain(false);
        }
    };

    const handleFooterAboutTextSave = async () => {
        const text = footerAboutText.trim();
        setSavingFooterAboutText(true);
        try {
            await updateSchoolProfileApi({ footer_about_text: text || null });
            setFooterAboutText(text);
            toast.success(text ? 'Footer text saved!' : 'Footer text removed');
        } catch (e) {
            toast.error('Failed to save footer text');
        } finally {
            setSavingFooterAboutText(false);
        }
    };

    const saveSchoolApp = async (label, url) => {
        if (url && !/^https?:\/\/.+/i.test(url)) {
            toast.error('Enter a valid link starting with http:// or https://');
            return;
        }
        setSavingSchoolApp(true);
        try {
            await updateSchoolProfileApi({ school_app_label: label || null, school_app_url: url || null });
            setSchoolAppLabel(label);
            setSchoolAppUrl(url);
            toast.success(url ? 'School App button saved!' : 'School App button removed');
        } catch (e) {
            toast.error('Failed to save School App button');
        } finally {
            setSavingSchoolApp(false);
        }
    };
    const handleSchoolAppSave = () => saveSchoolApp(schoolAppLabel.trim(), schoolAppUrl.trim());
    const handleSchoolAppClear = () => saveSchoolApp('', '');

    const handleProspectusChange = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (file) setProspectusFile(file);
    };

    const handleProspectusUpload = async () => {
        if (!prospectusFile) return;
        setUploadingProspectus(true);
        try {
            const formData = new FormData();
            formData.append('prospectus', prospectusFile);
            const res = await uploadProspectusApi(formData);
            setProspectusUrl(res.data.prospectus_url);
            setProspectusFile(null);
            toast.success('Prospectus uploaded!');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload prospectus');
        } finally {
            setUploadingProspectus(false);
        }
    };

    const handleProspectusRemove = async () => {
        setRemovingProspectus(true);
        try {
            await updateSchoolProfileApi({ prospectus_url: null });
            setProspectusUrl('');
            toast.success('Prospectus removed');
        } catch (e) {
            toast.error('Failed to remove prospectus');
        } finally {
            setRemovingProspectus(false);
        }
    };

    const handleThemeSave = async (theme) => {
        setSaving(true);
        try {
            await updateSchoolSettingsApi({ theme });
            setSettingsData({ ...settingsData, theme });
            setStoreTheme(theme);
            toast.success('Theme updated!');
        } catch (e) {
            toast.error('Failed to update theme');
        } finally {
            setSaving(false);
        }
    };

    const handleBaseThemeSave = async (base_theme) => {
        setSaving(true);
        try {
            await updateSchoolSettingsApi({ base_theme });
            setSettingsData({ ...settingsData, base_theme });
            setStoreBaseTheme(base_theme);
            toast.success('Base color updated!');
        } catch (e) {
            toast.error('Failed to update base color');
        } finally {
            setSaving(false);
        }
    };

    const handleFontSave = async (field, fontKey) => {
        setSaving(true);
        try {
            await updateSchoolSettingsApi({ [field]: fontKey });
            setSettingsData({ ...settingsData, [field]: fontKey });
            toast.success('Font updated!');
        } catch (e) {
            toast.error('Failed to update font');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (file) setLogoCropSrc(URL.createObjectURL(file));
    };

    const handleLogoCropConfirmed = (croppedFile) => {
        setLogoCropSrc(null);
        setLogoFile(croppedFile);
        setLogoPreview(URL.createObjectURL(croppedFile));
    };

    const handleLogoUpload = async () => {
        if (!logoFile) { toast.error('Please select a logo'); return; }
        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('schoolLogo', logoFile);
            const res = await uploadSchoolLogoApi(formData);
            setSettingsData(prev => ({ ...prev, logo_url: res.data.logo_url }));
            setStoreLogo(res.data.logo_url); // reflect in the sidebar immediately
            toast.success('Logo uploaded successfully!');
            setLogoFile(null);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleLogoRemove = async () => {
        setRemovingLogo(true);
        try {
            await updateSchoolProfileApi({ logo_url: null });
            setSettingsData(prev => ({ ...prev, logo_url: '' }));
            setStoreLogo(null); // clear it from the sidebar immediately
            setLogoFile(null);
            setLogoPreview(null);
            toast.success('Logo removed');
        } catch (e) {
            toast.error('Failed to remove logo');
        } finally {
            setRemovingLogo(false);
        }
    };

    // ── Welcome Banner (optional popup shown once on the homepage) ──
    const handleBannerFileChange = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (file) setBannerCropSrc(URL.createObjectURL(file));
    };

    const handleBannerCropConfirmed = (croppedFile) => {
        setBannerCropSrc(null);
        setBannerFile(croppedFile);
        setBannerPreview(URL.createObjectURL(croppedFile));
    };

    const handleBannerUpload = async () => {
        if (!bannerFile) { toast.error('Please select a banner image'); return; }
        setUploadingBanner(true);
        try {
            const formData = new FormData();
            formData.append('welcomeBanner', bannerFile);
            const res = await uploadWelcomeBannerApi(formData);
            setBannerData(prev => ({ ...prev, welcome_banner_url: res.data.welcome_banner_url }));
            toast.success('Welcome banner uploaded successfully!');
            setBannerFile(null);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload banner');
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleBannerRemove = async () => {
        setRemovingBanner(true);
        try {
            await updateSchoolProfileApi({ welcome_banner_url: null, welcome_banner_enabled: 0 });
            setBannerData(prev => ({ ...prev, welcome_banner_url: '', welcome_banner_enabled: false }));
            setBannerFile(null);
            setBannerPreview(null);
            toast.success('Banner image removed');
        } catch (e) {
            toast.error('Failed to remove banner image');
        } finally {
            setRemovingBanner(false);
        }
    };

    const handleBannerToggle = async () => {
        const next = !bannerData.welcome_banner_enabled;
        setTogglingBanner(true);
        try {
            await updateSchoolProfileApi({ welcome_banner_enabled: next ? 1 : 0 });
            setBannerData(prev => ({ ...prev, welcome_banner_enabled: next }));
            toast.success(next ? 'Welcome banner enabled' : 'Welcome banner disabled');
        } catch (e) {
            toast.error('Failed to update banner status');
        } finally {
            setTogglingBanner(false);
        }
    };

    const handleBannerLinkChange = (e) => {
        setBannerData(prev => ({ ...prev, welcome_banner_link: e.target.value }));
    };

    const handleBannerLinkSave = async () => {
        setSavingBannerLink(true);
        try {
            await updateSchoolProfileApi({ welcome_banner_link: bannerData.welcome_banner_link });
            toast.success('Link saved!');
        } catch (e) {
            toast.error('Failed to save link');
        } finally {
            setSavingBannerLink(false);
        }
    };

    // ── Footer Background (subtle background image behind the site footer) ──
    const handleFooterBgChange = (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (file) setFooterBgCropSrc(URL.createObjectURL(file));
    };

    const handleFooterBgCropConfirmed = (croppedFile) => {
        setFooterBgCropSrc(null);
        setFooterBgFile(croppedFile);
        setFooterBgPreview(URL.createObjectURL(croppedFile));
    };

    const handleFooterBgUpload = async () => {
        if (!footerBgFile) { toast.error('Please select a background image'); return; }
        setUploadingFooterBg(true);
        try {
            const formData = new FormData();
            formData.append('footerBg', footerBgFile);
            const res = await uploadFooterBackgroundApi(formData);
            setFooterBgUrl(res.data.footer_bg_url);
            toast.success('Footer background uploaded successfully!');
            setFooterBgFile(null);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload footer background');
        } finally {
            setUploadingFooterBg(false);
        }
    };

    const handleFooterBgRemove = async () => {
        setRemovingFooterBg(true);
        try {
            await updateSchoolProfileApi({ footer_bg_url: null });
            setFooterBgUrl('');
            setFooterBgFile(null);
            setFooterBgPreview(null);
            toast.success('Footer background removed');
        } catch (e) {
            toast.error('Failed to remove footer background');
        } finally {
            setRemovingFooterBg(false);
        }
    };

    // ── Background Music (optional, plays on the homepage) — school picks from a
    // small curated preset rather than uploading their own file, to avoid
    // copyright issues; `bg_music_track` stores the preset track's key ──
    const handleMusicTrackSelect = async (key) => {
        setSelectingTrack(true);
        try {
            await updateSchoolProfileApi({ bg_music_track: key });
            setMusicData(prev => ({ ...prev, bg_music_track: key }));
            toast.success('Track selected!');
        } catch (e) {
            toast.error('Failed to select track');
        } finally {
            setSelectingTrack(false);
        }
    };

    const handleMusicToggle = async () => {
        const next = !musicData.bg_music_enabled;
        setTogglingMusic(true);
        try {
            await updateSchoolProfileApi({ bg_music_enabled: next ? 1 : 0 });
            setMusicData(prev => ({ ...prev, bg_music_enabled: next }));
            toast.success(next ? 'Background music enabled' : 'Background music disabled');
        } catch (e) {
            toast.error('Failed to update music status');
        } finally {
            setTogglingMusic(false);
        }
    };

    // ── Affiliation Badges (optional, up to 3) — shown top-right of the navbar next to
    // the nav items, e.g. a board seal (CBSE) or accreditation logo (Cambridge) ──
    const addBadgeSlot = () => {
        if (badges.length >= MAX_AFFILIATION_BADGES) return;
        setBadges(prev => [...prev, { id: `badge-${Date.now()}`, url: '', label: '' }]);
    };

    const updateBadge = (id, field, value) => {
        setBadges(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const removeBadge = (id) => {
        setBadges(prev => prev.filter(b => b.id !== id));
    };

    const uploadBadgeImage = async (id, file) => {
        setUploadingBadge(id);
        try {
            const res = await uploadContentImageApi(file);
            updateBadge(id, 'url', res.data.url);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload badge image');
        } finally {
            setUploadingBadge(null);
        }
    };

    const handleBadgesSave = async () => {
        setSavingBadges(true);
        try {
            const cleaned = badges.filter(b => b.url);
            await updateSchoolProfileApi({ affiliation_badges: JSON.stringify(cleaned) });
            setBadges(cleaned);
            toast.success('Affiliation badges saved!');
        } catch (e) {
            toast.error('Failed to save badges');
        } finally {
            setSavingBadges(false);
        }
    };

    const gradientThemes = [
        // ── Classic Gradients ──
        { key: 'rosePink', label: 'Rose Pink', desc: 'Warm & elegant', color: '#8b2252', gradient: 'linear-gradient(135deg,#8b2252,#c9687e)', shadow: 'rgba(139,34,82,0.35)' },
        { key: 'blue', label: 'Ocean Blue', desc: 'Professional & trustworthy', color: '#1e3a5f', gradient: 'linear-gradient(135deg,#1e3a5f,#2563eb)', shadow: 'rgba(37,99,235,0.35)' },
        { key: 'green', label: 'Emerald', desc: 'Fresh & natural', color: '#064e3b', gradient: 'linear-gradient(135deg,#064e3b,#059669)', shadow: 'rgba(5,150,105,0.35)' },
        { key: 'purple', label: 'Royal Purple', desc: 'Premium & creative', color: '#4a1d96', gradient: 'linear-gradient(135deg,#4a1d96,#7c3aed)', shadow: 'rgba(124,58,237,0.35)' },
        { key: 'orange', label: 'Sunset Orange', desc: 'Bold & energetic', color: '#7c2d12', gradient: 'linear-gradient(135deg,#7c2d12,#ea580c)', shadow: 'rgba(234,88,12,0.35)' },
        { key: 'dark', label: 'Dark Gold', desc: 'Sophisticated & premium', color: '#0f0c05', gradient: 'linear-gradient(135deg,#0f0c05,#c9a227)', shadow: 'rgba(201,162,39,0.35)' },
        { key: 'beige', label: 'Warm Beige', desc: 'Sober & understated', color: '#7a624a', gradient: 'linear-gradient(135deg,#7a624a,#cbab7c)', shadow: 'rgba(122,98,74,0.35)' },
        { key: 'slate', label: 'Slate Gray', desc: 'Calm & minimal', color: '#414b56', gradient: 'linear-gradient(135deg,#414b56,#8b98a8)', shadow: 'rgba(65,75,86,0.35)' },
        { key: 'cream', label: 'Ivory Cream', desc: 'Soft & refined', color: '#9c8a63', gradient: 'linear-gradient(135deg,#9c8a63,#e6d7b0)', shadow: 'rgba(156,138,99,0.35)' },
        { key: 'red', label: 'Crimson Red', desc: 'Bold & passionate', color: '#7f1d1d', gradient: 'linear-gradient(135deg,#7f1d1d,#dc2626)', shadow: 'rgba(220,38,38,0.35)' },
        { key: 'teal', label: 'Deep Teal', desc: 'Fresh & modern', color: '#134e4a', gradient: 'linear-gradient(135deg,#134e4a,#0d9488)', shadow: 'rgba(13,148,136,0.35)' },
        { key: 'navy', label: 'Midnight Navy', desc: 'Sharp & authoritative', color: '#0f1c3f', gradient: 'linear-gradient(135deg,#0f1c3f,#3b5bdb)', shadow: 'rgba(59,91,219,0.35)' },
        { key: 'burgundy', label: 'Burgundy Wine', desc: 'Deep & distinguished', color: '#4a0e1f', gradient: 'linear-gradient(135deg,#4a0e1f,#be123c)', shadow: 'rgba(190,18,60,0.35)' },
        { key: 'olive', label: 'Olive Forest', desc: 'Earthy & grounded', color: '#1f2e0a', gradient: 'linear-gradient(135deg,#1f2e0a,#65a30d)', shadow: 'rgba(101,163,13,0.35)' },
        { key: 'cyan', label: 'Turquoise Cyan', desc: 'Vibrant & lively', color: '#0e3b45', gradient: 'linear-gradient(135deg,#0e3b45,#0891b2)', shadow: 'rgba(8,145,178,0.35)' },
        { key: 'amber', label: 'Amber Gold', desc: 'Warm & inviting', color: '#78350f', gradient: 'linear-gradient(135deg,#78350f,#f59e0b)', shadow: 'rgba(245,158,11,0.35)' },
        { key: 'charcoal', label: 'Charcoal Black', desc: 'Sleek & modern', color: '#18181b', gradient: 'linear-gradient(135deg,#18181b,#71717a)', shadow: 'rgba(113,113,122,0.35)' },
        { key: 'lavender', label: 'Lavender Violet', desc: 'Gentle & creative', color: '#3f2d63', gradient: 'linear-gradient(135deg,#3f2d63,#a78bfa)', shadow: 'rgba(167,139,250,0.35)' },
        { key: 'coral', label: 'Coral Blush', desc: 'Warm & welcoming', color: '#7c2d3d', gradient: 'linear-gradient(135deg,#7c2d3d,#fb7185)', shadow: 'rgba(251,113,133,0.35)' },
        { key: 'plainCream', label: 'Plain Cream', desc: 'Soft & neutral', color: '#8a7550', gradient: 'linear-gradient(135deg,#8a7550,#f3ecd9)', shadow: 'rgba(138,117,80,0.35)' },
        { key: 'mustard', label: 'Mustard Yellow', desc: 'Cheerful & vibrant', color: '#7a5c00', gradient: 'linear-gradient(135deg,#7a5c00,#eab308)', shadow: 'rgba(234,179,8,0.35)' },
        { key: 'indigo', label: 'Indigo', desc: 'Deep & modern', color: '#312e81', gradient: 'linear-gradient(135deg,#312e81,#6366f1)', shadow: 'rgba(99,102,241,0.35)' },

        // ── Light & Bright Gradients ──
        { key: 'brightCyan', label: 'Electric Cyan', desc: 'Luminous bright aqua', color: '#0891b2', gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)', shadow: 'rgba(6,182,212,0.35)' },
        { key: 'brightLime', label: 'Fresh Lime', desc: 'Energetic bright lime', color: '#4d7c0f', gradient: 'linear-gradient(135deg,#4d7c0f,#84cc16)', shadow: 'rgba(132,204,22,0.35)' },
        { key: 'brightViolet', label: 'Electric Violet', desc: 'Vivid electric violet', color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)', shadow: 'rgba(168,85,247,0.35)' },
        { key: 'brightTangerine', label: 'Neon Tangerine', desc: 'Punchy vibrant orange', color: '#ea580c', gradient: 'linear-gradient(135deg,#ea580c,#f97316)', shadow: 'rgba(249,115,22,0.35)' },
        { key: 'brightMagenta', label: 'Vivid Magenta', desc: 'Bold bright fuchsia', color: '#c026d3', gradient: 'linear-gradient(135deg,#c026d3,#e879f9)', shadow: 'rgba(232,121,249,0.35)' },
        { key: 'brightSunshine', label: 'Golden Sunshine', desc: 'Bright sunny glow', color: '#ca8a04', gradient: 'linear-gradient(135deg,#ca8a04,#facc15)', shadow: 'rgba(250,204,21,0.35)' },
        { key: 'brightSky', label: 'Sky Cerulean', desc: 'Clear bright sky', color: '#0284c7', gradient: 'linear-gradient(135deg,#0284c7,#38bdf8)', shadow: 'rgba(56,189,248,0.35)' },
        { key: 'brightWatermelon', label: 'Neon Coral', desc: 'Bright punchy coral', color: '#e11d48', gradient: 'linear-gradient(135deg,#e11d48,#fb7185)', shadow: 'rgba(251,113,133,0.35)' },
        { key: 'pastelMint', label: 'Pastel Mint', desc: 'Refreshing soft mint', color: '#059669', gradient: 'linear-gradient(135deg,#059669,#34d399)', shadow: 'rgba(52,211,153,0.35)' },
        { key: 'pastelLilac', label: 'Soft Lilac', desc: 'Gentle pastel lavender', color: '#6d28d9', gradient: 'linear-gradient(135deg,#6d28d9,#c4b5fd)', shadow: 'rgba(196,181,253,0.35)' },
        { key: 'pastelPeach', label: 'Soft Peach', desc: 'Warm gentle peach', color: '#c2410c', gradient: 'linear-gradient(135deg,#c2410c,#fdba74)', shadow: 'rgba(253,186,116,0.35)' },
        { key: 'pastelSky', label: 'Ice Blue', desc: 'Crisp light ice blue', color: '#0369a1', gradient: 'linear-gradient(135deg,#0369a1,#7dd3fc)', shadow: 'rgba(125,211,252,0.35)' },
    ];

    const lightSolidThemes = [
        // ── Light & Pastel Solid Colours (Without Gradient) ──
        { key: 'solidPowderBlue', label: 'Powder Blue', desc: 'Light airy sky blue', color: '#38bdf8', shadow: 'rgba(56,189,248,0.35)', isLight: true },
        { key: 'solidBabyBlue', label: 'Baby Blue', desc: 'Soft gentle pastel blue', color: '#60a5fa', shadow: 'rgba(96,165,250,0.35)', isLight: true },
        { key: 'solidPastelMint', label: 'Pastel Mint', desc: 'Light refreshing botanical mint', color: '#34d399', shadow: 'rgba(52,211,153,0.35)', isLight: true },
        { key: 'solidSeafoam', label: 'Seafoam Aqua', desc: 'Light coastal aquamarine', color: '#2dd4bf', shadow: 'rgba(45,212,191,0.35)', isLight: true },
        { key: 'solidSage', label: 'Soft Sage', desc: 'Gentle earthy sage green', color: '#84a98c', shadow: 'rgba(132,169,140,0.35)', isLight: true },
        { key: 'solidPastelPeach', label: 'Pastel Peach', desc: 'Warm gentle peach glow', color: '#fb923c', shadow: 'rgba(251,146,60,0.35)', isLight: true },
        { key: 'solidApricot', label: 'Apricot Cream', desc: 'Soft warm golden apricot', color: '#f8a567', shadow: 'rgba(248,165,103,0.35)', isLight: true },
        { key: 'solidPastelPink', label: 'Pastel Pink', desc: 'Sweet gentle pastel pink', color: '#f472b6', shadow: 'rgba(244,114,182,0.35)', isLight: true },
        { key: 'solidBlush', label: 'Blush Rose', desc: 'Light petal blush rose', color: '#fb7185', shadow: 'rgba(251,113,133,0.35)', isLight: true },
        { key: 'solidLavender', label: 'Soft Lavender', desc: 'Gentle calming lavender', color: '#a78bfa', shadow: 'rgba(167,139,250,0.35)', isLight: true },
        { key: 'solidPastelLilac', label: 'Pastel Lilac', desc: 'Light floral lilac blossom', color: '#c084fc', shadow: 'rgba(192,132,252,0.35)', isLight: true },
        { key: 'solidPeriwinkle', label: 'Soft Periwinkle', desc: 'Light dreamy blue-violet', color: '#818cf8', shadow: 'rgba(129,140,248,0.35)', isLight: true },
        { key: 'solidButtercup', label: 'Buttercup Yellow', desc: 'Cheerful light sunny yellow', color: '#facc15', shadow: 'rgba(250,204,21,0.35)', isLight: true },
        { key: 'solidVanilla', label: 'Vanilla Cream', desc: 'Soft warm golden cream', color: '#eab308', shadow: 'rgba(234,179,8,0.35)', isLight: true },
        { key: 'solidPistachio', label: 'Light Pistachio', desc: 'Bright energetic soft green', color: '#a3e635', shadow: 'rgba(163,230,53,0.35)', isLight: true },
        { key: 'solidIceCyan', label: 'Ice Cyan', desc: 'Crisp refreshing light cyan', color: '#22d3ee', shadow: 'rgba(34,211,238,0.35)', isLight: true },
        { key: 'solidSand', label: 'Soft Sand', desc: 'Warm light earthy neutral', color: '#c7ad8c', shadow: 'rgba(199,173,140,0.35)', isLight: true },
        { key: 'solidCloud', label: 'Cloud Silver', desc: 'Light architectural silver slate', color: '#94a3b8', shadow: 'rgba(148,163,184,0.35)', isLight: true },
    ];

    const classicSolidThemes = [
        // ── Classic Solid Colours (Without Gradient) ──
        { key: 'solidRoyalBlue', label: 'Royal Blue', desc: 'Solid classic school blue', color: '#1d4ed8', shadow: 'rgba(29,78,216,0.3)' },
        { key: 'solidNavy', label: 'Classic Navy', desc: 'Solid prestigious navy', color: '#0f2b5c', shadow: 'rgba(15,43,92,0.3)' },
        { key: 'solidSky', label: 'Sky Blue', desc: 'Solid bright sky blue', color: '#0284c7', shadow: 'rgba(2,132,199,0.3)' },
        { key: 'solidTeal', label: 'Deep Teal', desc: 'Solid modern academic teal', color: '#0f766e', shadow: 'rgba(15,118,110,0.3)' },
        { key: 'solidEmerald', label: 'Emerald Green', desc: 'Solid institutional green', color: '#047857', shadow: 'rgba(4,120,87,0.3)' },
        { key: 'solidForest', label: 'Forest Pine', desc: 'Solid deep woodland pine', color: '#14532d', shadow: 'rgba(20,83,45,0.3)' },
        { key: 'solidCrimson', label: 'Crimson Red', desc: 'Solid bold traditional red', color: '#b91c1c', shadow: 'rgba(185,28,28,0.3)' },
        { key: 'solidMaroon', label: 'Deep Maroon', desc: 'Solid convent school maroon', color: '#831843', shadow: 'rgba(131,24,67,0.3)' },
        { key: 'solidPurple', label: 'Regal Purple', desc: 'Solid distinguished purple', color: '#6b21a8', shadow: 'rgba(107,33,168,0.3)' },
        { key: 'solidSaffron', label: 'Saffron Orange', desc: 'Solid vibrant Indian saffron', color: '#d97706', shadow: 'rgba(217,119,6,0.3)' },
        { key: 'solidAmber', label: 'Sun Amber', desc: 'Solid warm golden amber', color: '#b45309', shadow: 'rgba(180,83,9,0.3)' },
        { key: 'solidCoral', label: 'Coral Pink', desc: 'Solid lively friendly coral', color: '#e11d48', shadow: 'rgba(225,29,72,0.3)' },
        { key: 'solidCharcoal', label: 'Onyx Black', desc: 'Solid ultra-clean minimalist', color: '#18181b', shadow: 'rgba(24,24,27,0.3)' },
        { key: 'solidSlate', label: 'Slate Gray', desc: 'Solid calm corporate slate', color: '#334155', shadow: 'rgba(51,65,85,0.3)' },
        { key: 'solidIndigo', label: 'Collegiate Indigo', desc: 'Solid deep varsity indigo', color: '#3730a3', shadow: 'rgba(55,48,163,0.3)' },
        { key: 'solidLemon', label: 'Bright Lemon', desc: 'Solid cheerful bright yellow', color: '#ca8a04', shadow: 'rgba(202,138,4,0.3)' },
        { key: 'solidLime', label: 'Vibrant Lime', desc: 'Solid fresh bright lime', color: '#4d7c0f', shadow: 'rgba(77,124,15,0.3)' },
        { key: 'solidRose', label: 'Rose Wine', desc: 'Solid rich heritage rose', color: '#9f1239', shadow: 'rgba(159,18,57,0.3)' },
    ];

    const solidThemes = [...lightSolidThemes, ...classicSolidThemes];
    const themes = [...gradientThemes, ...solidThemes];

    const inputStyle = {
        width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0',
        borderRadius: '6px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#ffffff', fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s'
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    const tabs = [
        { key: 'account', label: 'My Account', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
        { key: 'plan', label: 'Plan & Billing', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0v4"/></svg> },
        { key: 'profile', label: 'School Profile', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
        { key: 'logo', label: 'School Logo', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
        { key: 'theme', label: 'Website Theme', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg> },
        { key: 'baseColor', label: 'Base Color', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg> },
        { key: 'fonts', label: 'Fonts', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7M17 12l3 6m0 0l-3-6m3 6h-6"/></svg> },
        { key: 'welcomeBanner', label: 'Welcome Banner', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg> },
        { key: 'footerBg', label: 'Footer Background', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M4 15l4-4a2 2 0 012.8 0L16 16m-3-3l1.6-1.6a2 2 0 012.8 0L20 14"/></svg> },
        { key: 'bgMusic', label: 'Background Music', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
        { key: 'affiliationBadges', label: 'Affiliation Badges', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15a4 4 0 100-8 4 4 0 000 8z"/><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5"/></svg> },
        { key: 'customDomain', label: 'Custom Domain', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
        { key: 'prospectus', label: 'Prospectus', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
        { key: 'schoolApp', label: 'School App', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M11 18h2"/></svg> },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .settings-section { animation: fadeInUp 0.35s ease forwards; }
                .settings-tabs { scrollbar-width: none; -ms-overflow-style: none; }
                .settings-tabs::-webkit-scrollbar { display: none; }
                .settings-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; }
                .settings-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .settings-hero-orb { animation: drift1 9s ease-in-out infinite; }
                .settings-basecolor-card { transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important; }
                .settings-basecolor-card:hover { transform: translateY(-4px) !important; box-shadow: 0 10px 24px rgba(0,0,0,0.08) !important; }
                @media (max-width: 900px) {
                    .settings-3col { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 700px) {
                    .settings-section[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
                    .settings-3col { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    /* ── Tabs — horizontal swipeable strip instead of ugly uneven wrapping ── */
                    .settings-tabs { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; scrollbar-width: none !important; padding-bottom: 2px !important; margin-bottom: 1.25rem !important; }
                    .settings-tabs::-webkit-scrollbar { display: none !important; }
                    .settings-tabs button { flex-shrink: 0 !important; padding: 8px 14px !important; font-size: 12px !important; gap: 5px !important; }
                    .settings-tabs button svg { width: 14px !important; height: 14px !important; }

                    /* ── Hero header — compact, same treatment as the Dashboard hero ── */
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .dash-hero-greeting { margin-bottom: 6px !important; }
                    .dash-hero-greeting p { font-size: 10px !important; }
                    .dash-hero-greeting svg { width: 12px !important; height: 12px !important; }
                    .dash-hero-title { font-size: 19px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .dash-hero-desc { font-size: 11px !important; line-height: 1.5 !important; max-width: 100% !important; }

                    /* ── Logo tab — hide the Navbar Preview card, upload card takes full width ── */
                    .settings-navbar-preview { display: none !important; }

                    /* ── Theme / Base Color / Font swatch grids — 3-per-row compact cards ── */
                    .settings-3col, .settings-basecolor-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }

                    .settings-theme-card { border-radius: 8px !important; }
                    .settings-theme-swatch { height: 44px !important; }
                    .settings-theme-deco, .settings-theme-bars { display: none !important; }
                    .settings-theme-check { width: 16px !important; height: 16px !important; top: 4px !important; right: 4px !important; }
                    .settings-theme-check svg { width: 8px !important; height: 8px !important; }
                    .settings-theme-body { padding: 6px 5px !important; }
                    .settings-theme-label-row { gap: 4px !important; margin-bottom: 0 !important; }
                    .settings-theme-label { font-size: 9.5px !important; line-height: 1.25 !important; white-space: normal !important; overflow-wrap: break-word !important; word-break: normal !important; }
                    .settings-theme-desc { display: none !important; }

                    .settings-basecolor-card { border-radius: 8px !important; }
                    .settings-basecolor-swatch { height: 38px !important; }
                    .settings-basecolor-chip { height: 14px !important; left: 6px !important; right: 6px !important; bottom: 6px !important; border-radius: 4px !important; }
                    .settings-basecolor-check { width: 14px !important; height: 14px !important; top: 4px !important; right: 4px !important; }
                    .settings-basecolor-check svg { width: 7px !important; height: 7px !important; }
                    .settings-basecolor-body { padding: 6px 5px !important; }
                    .settings-basecolor-label { font-size: 9.5px !important; line-height: 1.25 !important; white-space: normal !important; overflow-wrap: break-word !important; word-break: normal !important; }

                    .settings-font-card { padding: 10px 5px !important; }
                    .settings-font-aa { font-size: 18px !important; margin-bottom: 4px !important; }
                    .settings-font-label { font-size: 9.5px !important; line-height: 1.25 !important; white-space: normal !important; overflow-wrap: break-word !important; word-break: normal !important; margin-bottom: 0 !important; }
                    .settings-font-desc { display: none !important; }
                    .settings-font-check { width: 14px !important; height: 14px !important; top: 4px !important; right: 4px !important; }
                    .settings-font-check svg { width: 7px !important; height: 7px !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Hero Header */}
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.5rem 2.75rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 20px 60px ${hexToRgba(tc.primary, 0.2)}, 0 4px 20px rgba(0,0,0,0.15)` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="settings-hero-orb" style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="settings-hero-item" style={{ animationDelay: '0.05s' }}>
                            <div className="dash-hero-greeting" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: tc.secondary }}></div>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin / Settings</p>
                            </div>
                            <h1 className="dash-hero-title" style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', letterSpacing: '-0.5px' }}>General Settings</h1>
                            <p className="dash-hero-desc" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '460px' }}>
                                Manage how your school is presented online — profile details, branding and the visual identity of your public website.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs — single scrollable row with prev/next buttons instead of wrapping to
                     multiple rows, since the tab count keeps growing as features are added. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.75rem' }}>
                    <button type="button" onClick={() => scrollTabs(-1)} aria-label="Scroll tabs left"
                        style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <div ref={tabsScrollRef} className="settings-tabs" style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto', scrollBehavior: 'smooth', flex: 1 }}>
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                style={{ padding: '10px 20px', borderRadius: '6px', border: activeTab === tab.key ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0', fontSize: '13px', cursor: 'pointer', background: activeTab === tab.key ? tc.light : '#ffffff', color: activeTab === tab.key ? tc.primary : '#64748b', fontWeight: activeTab === tab.key ? 600 : 400, display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.15s', boxShadow: activeTab === tab.key ? `0 4px 12px ${hexToRgba(tc.primary, 0.15)}` : 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                <span style={{ color: activeTab === tab.key ? tc.primary : '#94a3b8' }}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={() => scrollTabs(1)} aria-label="Scroll tabs right"
                        style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px', border: `1.5px solid ${tc.primary}`, background: tc.light, color: tc.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>

                {/* ── Plan & Billing Tab — the only proactive way to reach /admin/billing;
                     otherwise it's only reachable via AdminLayout's forced redirect when
                     hasActivePlan is false. Lets a school renew early or upgrade instead of
                     waiting for their plan to lapse. ── */}
                {activeTab === 'plan' && (() => {
                    const planEndDate = planInfo.plan_end_date ? new Date(planInfo.plan_end_date) : null;
                    const isExpired = !!planEndDate && planEndDate < new Date();
                    const currentPlan = allPlans.find(p => p.id === planInfo.plan_id);
                    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
                    return (
                        <div className="settings-section" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', maxWidth: '640px' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0v4" /></svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Plan & Billing</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Your current plan, renewal date, and upgrade options</p>
                                </div>
                                {planInfo.plan_id && (
                                    <span style={{
                                        fontSize: '10.5px', fontWeight: 700, borderRadius: '999px', padding: '4px 11px', flexShrink: 0,
                                        color: isExpired ? '#b91c1c' : '#15803d',
                                        background: isExpired ? '#fef2f2' : '#f0fdf4',
                                        border: `1px solid ${isExpired ? '#fecaca' : '#bbf7d0'}`,
                                    }}>
                                        {isExpired ? 'Expired' : 'Active'}
                                    </span>
                                )}
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {!planInfo.plan_id ? (
                                    <p style={{ fontSize: '13px', color: '#64748b' }}>You don't have an active plan yet — choose one to take your school website live.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                                            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '12px 14px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Plan</div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{currentPlan?.name || `Plan #${planInfo.plan_id}`}</div>
                                            </div>
                                            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '12px 14px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isExpired ? 'Expired On' : 'Valid Until'}</div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{fmtDate(planInfo.plan_end_date)}</div>
                                            </div>
                                        </div>
                                        {isExpired && (
                                            <p style={{ fontSize: '11.5px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                <InfoIcon /> Your plan has ended — renew to keep your school website live and editable.
                                            </p>
                                        )}
                                    </>
                                )}
                                <div>
                                    <button onClick={() => navigate('/admin/billing')}
                                        style={{ padding: '11px 20px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                        {!planInfo.plan_id ? 'Choose a Plan' : isExpired ? 'Renew Plan' : 'Extend / Upgrade Plan'}
                                    </button>
                                </div>
                                <p style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <InfoIcon /> Renewing early adds the new plan's tenure on top of your remaining days — you never lose unused time.
                                </p>
                            </div>
                        </div>
                    );
                })()}

                {/* ── My Account Tab — the admin's own name/login email, separate
                     from the School Profile tab below which is the school's
                     public-facing details. ── */}
                {activeTab === 'account' && (
                    <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>My Account</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Your name and the email you log in with</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Your Name</label>
                                    <input className="settings-input" type="text" name="name" value={accountData.name} onChange={handleAccountChange} placeholder="Enter Your Name" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Login Email</label>
                                    <input className="settings-input" type="email" name="email" value={accountData.email} onChange={handleAccountChange} placeholder="Enter Your Email" style={inputStyle} />
                                </div>
                                <p style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <InfoIcon /> Changing your email changes what you log in with — use the new one next time.
                                </p>
                                <div>
                                    <button onClick={handleAccountSave} disabled={savingAccount}
                                        style={{ padding: '11px 20px', background: savingAccount ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: savingAccount ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                        {savingAccount ? 'Saving...' : 'Save Account'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Profile Tab ── */}
                {activeTab === 'profile' && (
                    <div className="settings-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                        {/* Basic Info */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Basic Information</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>School name and contact number</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>School Name</label>
                                    <input className="settings-input" type="text" name="name" value={profileData.name} onChange={handleProfileChange} placeholder="Enter School Name" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone Number</label>
                                    <input className="settings-input" type="tel" inputMode="numeric" maxLength={10} name="phone" value={profileData.phone} onChange={handleProfileChange} placeholder="Enter Phone Number" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Alternate Phone Number</label>
                                    <input className="settings-input" type="tel" inputMode="numeric" maxLength={10} name="phone2" value={profileData.phone2} onChange={handleProfileChange} placeholder="Enter Alternate Phone Number" style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Location</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>School address details</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Address</label>
                                    <input className="settings-input" type="text" name="address" value={profileData.address} onChange={handleProfileChange} placeholder="Enter Street Address" style={inputStyle} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>City</label>
                                        <input className="settings-input" type="text" name="city" value={profileData.city} onChange={handleProfileChange} placeholder="Enter City" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>State</label>
                                        <input className="settings-input" type="text" name="state" value={profileData.state} onChange={handleProfileChange} placeholder="Enter State" style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Pincode</label>
                                    <input className="settings-input" type="text" name="pincode" value={profileData.pincode} onChange={handleProfileChange} placeholder="Enter Pincode" style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        {/* Intro Message — Full width */}
                        <div style={{ gridColumn: '1 / -1', background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#4a1d96,#7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4V2m10 2V2M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Website Intro Animation</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Message shown as loading animation when visitors open your website</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem' }}>
                                {/* Enable/disable */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', marginBottom: '16px', background: profileData.intro_message_enabled ? '#f0fdf4' : '#f8fafc', border: `1px solid ${profileData.intro_message_enabled ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '8px' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Show Intro Animation</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>White reveal animation plays once when a visitor opens your homepage</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setProfileData(prev => ({ ...prev, intro_message_enabled: !prev.intro_message_enabled }))}
                                        style={{
                                            width: '42px', height: '23px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                                            background: profileData.intro_message_enabled ? tc.primary : '#e2e8f0',
                                            position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0,
                                        }}>
                                        <span style={{
                                            position: 'absolute', top: '2.5px', left: profileData.intro_message_enabled ? '21px' : '3px',
                                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                        }} />
                                    </button>
                                </div>

                                <div>
                                    <label style={labelStyle}>Intro Message</label>
                                    <input
                                        className="settings-input"
                                        type="text"
                                        name="intro_message"
                                        value={profileData.intro_message}
                                        onChange={handleProfileChange}
                                        disabled={!profileData.intro_message_enabled}
                                        placeholder="Enter Intro Message"
                                        style={{ ...inputStyle, fontSize: '16px', fontWeight: 600, letterSpacing: '0.08em', ...(!profileData.intro_message_enabled ? { opacity: 0.5, cursor: 'not-allowed', background: '#f1f5f9' } : {}) }}
                                    />
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <InfoIcon /> {profileData.intro_message_enabled
                                            ? 'Keep it short and impactful — 2 to 5 words work best. E.g. "WE BELIEVE" or "EXCELLENCE IN EDUCATION"'
                                            : 'Turn on the toggle above to write an intro message'}
                                    </p>
                                </div>

                                {/* Preview */}
                                {profileData.intro_message_enabled && profileData.intro_message && (
                                    <div style={{ marginTop: '1rem', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', height: '120px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, opacity: 0.15 }}></div>
                                        <p style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative', zIndex: 1 }}>
                                            {profileData.intro_message}
                                        </p>
                                        <p style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '10px', color: '#94a3b8' }}>Preview</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Save */}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleProfileSave} disabled={saving}
                                style={{ padding: '12px 32px', background: saving ? hexToRgba(tc.primary, 0.5) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {saving ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</> : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Save Profile</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Logo Tab ── */}
                {activeTab === 'logo' && (
                    <div className="settings-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Upload School Logo</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Shown in navbar and hero section</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div onClick={() => document.getElementById('schoolLogoInput').click()}
                                    style={{ position: 'relative', border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: logoFile ? '#f8fafc' : '#fafafa', transition: 'all 0.2s' }}>
                                    {logoFile || settingsData.logo_url ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                            <img src={logoPreview || settingsData.logo_url} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                            <p style={{ fontSize: '12px', color: '#64748b' }}>Click to change logo</p>
                                            {settingsData.logo_url && !logoFile && (
                                                <button type="button" onClick={e => { e.stopPropagation(); handleLogoRemove(); }} disabled={removingLogo}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '50%', cursor: removingLogo ? 'wait' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Remove logo">×</button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><BuildingIcon /></div>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Click to upload school logo</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>PNG, JPG, WEBP · Max 1MB · Transparent PNG recommended</p>
                                        </>
                                    )}
                                </div>
                                <input id="schoolLogoInput" type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleLogoChange} style={{ display: 'none' }} />
                                <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg,#fdf0f5,#fff5f8)', borderRadius: '8px', border: '1px solid #f9c4d4' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: tc.primary, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}><InfoIcon /> Best practices</p>
                                    {['Use PNG with transparent background', 'Square format works best (1:1 ratio)', 'Minimum 200×200px resolution', 'Max file size: 1MB'].map((tip, i) => (
                                        <p key={i} style={{ fontSize: '11px', color: '#9f1239', marginBottom: '3px' }}>• {tip}</p>
                                    ))}
                                </div>
                                <button onClick={handleLogoUpload} disabled={uploadingLogo || !logoFile}
                                    style={{ padding: '11px', background: uploadingLogo || !logoFile ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: uploadingLogo || !logoFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: !logoFile ? 'none' : `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    {uploadingLogo ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Uploading...</> : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Upload Logo</>}
                                </button>
                            </div>
                        </div>

                        <div className="settings-navbar-preview" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#064e3b,#059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Navbar Preview</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>How logo appears on school website</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem' }}>
                                <div style={{ background: 'rgba(2,6,23,0.95)', borderRadius: '8px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {logoPreview || settingsData.logo_url ? (
                                            <img src={logoPreview || settingsData.logo_url} alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px' }} />
                                        ) : (
                                            <div style={{ width: '36px', height: '36px', background: hexToRgba(tc.primary, 0.5), borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                            </div>
                                        )}
                                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }}></div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{profileData.name || 'School Name'}</p>
                                    </div>
                                    <div style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', fontSize: '10px', color: '#ffffff', letterSpacing: '0.1em' }}>MENU ≡</div>
                                </div>
                                {settingsData.logo_url || logoPreview ? (
                                    <div style={{ padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', border: '0.5px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="14" height="14" fill="none" stroke="#15803d" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                        <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>{logoPreview ? 'New logo ready — click Upload' : 'Logo is live on your website ✓'}</p>
                                    </div>
                                ) : (
                                    <div style={{ padding: '10px 12px', background: '#fefce8', borderRadius: '8px', border: '0.5px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="14" height="14" fill="none" stroke="#a16207" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                        <p style={{ fontSize: '12px', color: '#a16207', fontWeight: 500 }}>No logo uploaded — default icon showing</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Theme Tab ── */}
                {activeTab === 'theme' && (
                    <div className="settings-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#4a1d96,#7c3aed)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Choose Website Theme</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Select color theme for your public school website</p>
                            </div>
                        </div>
                        <div style={{ padding: '1.75rem' }}>
                            {/* Filter Bar */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                marginBottom: '1.5rem', flexWrap: 'wrap',
                            }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>
                                    Filter:
                                </span>
                                {[
                                    { key: 'all', label: `All Colours (${gradientThemes.length + solidThemes.length})` },
                                    { key: 'lightSolid', label: `Light Solids (${lightSolidThemes.length})` },
                                    { key: 'solid', label: `Classic Solids (${classicSolidThemes.length})` },
                                    { key: 'gradient', label: `Gradient Colours (${gradientThemes.length})` },
                                ].map(cat => {
                                    const isCatActive = themeCategory === cat.key;
                                    return (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            onClick={() => setThemeCategory(cat.key)}
                                            style={{
                                                padding: '7px 15px',
                                                borderRadius: '999px',
                                                fontSize: '12px',
                                                fontWeight: isCatActive ? 700 : 500,
                                                border: isCatActive ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0',
                                                background: isCatActive ? tc.light : '#ffffff',
                                                color: isCatActive ? tc.primary : '#475569',
                                                cursor: 'pointer',
                                                transition: 'all 0.18s ease',
                                                boxShadow: isCatActive ? `0 2px 8px ${hexToRgba(tc.primary, 0.15)}` : 'none',
                                            }}
                                        >
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ── Section 1: Gradient Colours ── */}
                            {(themeCategory === 'all' || themeCategory === 'gradient') && (
                                <div style={{ marginBottom: themeCategory === 'all' ? '2.5rem' : '0' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9',
                                        flexWrap: 'wrap', gap: '8px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                                                letterSpacing: '0.08em', padding: '4px 11px', borderRadius: '6px',
                                                background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', color: '#ffffff',
                                            }}>
                                                Gradient Colours
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                Multi-shade dynamic gradients with light & bright accents
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                                            {gradientThemes.length} Themes
                                        </span>
                                    </div>

                                    <div className="settings-3col settings-theme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                        {gradientThemes.map(theme => {
                                            const isActive = settingsData.theme === theme.key || (theme.key === 'rosePink' && settingsData.theme === 'default');
                                            const isHovered = hoveredTheme === theme.key;
                                            return (
                                                <div key={theme.key} className="settings-theme-card" onClick={() => handleThemeSave(theme.key)} onMouseEnter={() => setHoveredTheme(theme.key)} onMouseLeave={() => setHoveredTheme(null)}
                                                    style={{ borderRadius: '8px', border: isActive ? `2px solid ${theme.color}` : '0.5px solid #f1f5f9', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease', transform: isActive ? 'translateY(-4px)' : isHovered ? 'translateY(-2px)' : 'none', boxShadow: isActive ? `0 12px 32px ${theme.shadow}` : isHovered ? `0 8px 20px ${theme.shadow}` : '0 2px 8px rgba(0,0,0,0.04)' }}>
                                                    <div className="settings-theme-swatch" style={{ height: '90px', background: theme.gradient, position: 'relative', overflow: 'hidden' }}>
                                                        <div className="settings-theme-deco" style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: '-30px', right: '-20px' }}></div>
                                                        <div className="settings-theme-bars" style={{ position: 'absolute', bottom: '12px', left: '14px', display: 'flex', gap: '5px' }}>
                                                            <div style={{ width: '32px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.7)' }}></div>
                                                            <div style={{ width: '20px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.35)' }}></div>
                                                        </div>
                                                        {isActive && <div className="settings-theme-check" style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" fill="none" stroke={theme.color} strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
                                                    </div>
                                                    <div className="settings-theme-body" style={{ padding: '12px 14px', background: '#ffffff' }}>
                                                        <div className="settings-theme-label-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.gradient, flexShrink: 0 }}></div>
                                                            <p className="settings-theme-label" style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? theme.color : '#0f172a' }}>{theme.label}</p>
                                                        </div>
                                                        <p className="settings-theme-desc" style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '18px' }}>{theme.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── Section 2: Light Solid Colours (Without Gradient) ── */}
                            {(themeCategory === 'all' || themeCategory === 'lightSolid') && (
                                <div style={{ marginBottom: themeCategory === 'all' ? '2.5rem' : '0' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9',
                                        flexWrap: 'wrap', gap: '8px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                                                letterSpacing: '0.08em', padding: '4px 11px', borderRadius: '6px',
                                                background: 'linear-gradient(135deg,#38bdf8,#818cf8)', color: '#ffffff',
                                            }}>
                                                Light Solid Colours
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                Fresh, soft, pastel, and airy flat tones without gradients — clean and modern
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                                            {lightSolidThemes.length} Themes
                                        </span>
                                    </div>

                                    <div className="settings-3col settings-theme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                        {lightSolidThemes.map(theme => {
                                            const isActive = settingsData.theme === theme.key;
                                            const isHovered = hoveredTheme === theme.key;
                                            return (
                                                <div key={theme.key} className="settings-theme-card" onClick={() => handleThemeSave(theme.key)} onMouseEnter={() => setHoveredTheme(theme.key)} onMouseLeave={() => setHoveredTheme(null)}
                                                    style={{ borderRadius: '8px', border: isActive ? `2px solid ${theme.color}` : '0.5px solid #f1f5f9', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease', transform: isActive ? 'translateY(-4px)' : isHovered ? 'translateY(-2px)' : 'none', boxShadow: isActive ? `0 12px 32px ${theme.shadow}` : isHovered ? `0 8px 20px ${theme.shadow}` : '0 2px 8px rgba(0,0,0,0.04)' }}>
                                                    <div className="settings-theme-swatch" style={{ height: '90px', background: theme.color, position: 'relative', overflow: 'hidden' }}>
                                                        <span className="settings-theme-deco" style={{
                                                            position: 'absolute', bottom: '10px', left: '12px',
                                                            fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase',
                                                            letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '4px',
                                                            background: 'rgba(0,0,0,0.12)', color: '#0f172a',
                                                        }}>
                                                            Light Solid
                                                        </span>
                                                        {isActive && <div className="settings-theme-check" style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}><svg width="12" height="12" fill="none" stroke={theme.color} strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
                                                    </div>
                                                    <div className="settings-theme-body" style={{ padding: '12px 14px', background: '#ffffff' }}>
                                                        <div className="settings-theme-label-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.color, flexShrink: 0 }}></div>
                                                            <p className="settings-theme-label" style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? theme.color : '#0f172a' }}>{theme.label}</p>
                                                        </div>
                                                        <p className="settings-theme-desc" style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '18px' }}>{theme.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── Section 3: Classic Solid Colours (Without Gradient) ── */}
                            {(themeCategory === 'all' || themeCategory === 'solid') && (
                                <div>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9',
                                        flexWrap: 'wrap', gap: '8px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                                                letterSpacing: '0.08em', padding: '4px 11px', borderRadius: '6px',
                                                background: '#0f172a', color: '#ffffff',
                                            }}>
                                                Classic Solid Colours
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                Pure, flat solid colors without gradients — bold, classic school identities
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                                            {classicSolidThemes.length} Themes
                                        </span>
                                    </div>

                                    <div className="settings-3col settings-theme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                        {classicSolidThemes.map(theme => {
                                            const isActive = settingsData.theme === theme.key;
                                            const isHovered = hoveredTheme === theme.key;
                                            return (
                                                <div key={theme.key} className="settings-theme-card" onClick={() => handleThemeSave(theme.key)} onMouseEnter={() => setHoveredTheme(theme.key)} onMouseLeave={() => setHoveredTheme(null)}
                                                    style={{ borderRadius: '8px', border: isActive ? `2px solid ${theme.color}` : '0.5px solid #f1f5f9', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease', transform: isActive ? 'translateY(-4px)' : isHovered ? 'translateY(-2px)' : 'none', boxShadow: isActive ? `0 12px 32px ${theme.shadow}` : isHovered ? `0 8px 20px ${theme.shadow}` : '0 2px 8px rgba(0,0,0,0.04)' }}>
                                                    <div className="settings-theme-swatch" style={{ height: '90px', background: theme.color, position: 'relative', overflow: 'hidden' }}>
                                                        <span className="settings-theme-deco" style={{
                                                            position: 'absolute', bottom: '10px', left: '12px',
                                                            fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase',
                                                            letterSpacing: '0.08em', padding: '2px 7px', borderRadius: '4px',
                                                            background: 'rgba(255,255,255,0.22)', color: '#ffffff',
                                                        }}>
                                                            Solid
                                                        </span>
                                                        {isActive && <div className="settings-theme-check" style={{ position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" fill="none" stroke={theme.color} strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
                                                    </div>
                                                    <div className="settings-theme-body" style={{ padding: '12px 14px', background: '#ffffff' }}>
                                                        <div className="settings-theme-label-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.color, flexShrink: 0 }}></div>
                                                            <p className="settings-theme-label" style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? theme.color : '#0f172a' }}>{theme.label}</p>
                                                        </div>
                                                        <p className="settings-theme-desc" style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '18px' }}>{theme.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '1.5rem', padding: '12px 16px', background: 'linear-gradient(135deg,#fdf0f5,#fff5f8)', borderRadius: '8px', border: '1px solid #f9c4d4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: tc.primary }}><InfoIcon /></span>
                                <p style={{ fontSize: '12px', color: tc.primary, fontWeight: 500 }}>Theme changes reflect on your public website and admin panel immediately.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Base Color Tab — independent of the accent theme above. Controls the
                     site's overall background + card shades (previously hardcoded white), so
                     the two can be mixed and matched (e.g. Ocean Blue accent + Cream base). ── */}
                {activeTab === 'baseColor' && (
                    <div className="settings-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#9c8a63,#e6d7b0)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(156,138,99,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Choose Base Color</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>The main background of your public website — cards and sections pick up a matching shade</p>
                                </div>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#e2e8f0', padding: '4px 10px', borderRadius: '6px' }}>
                                {BASE_COLOR_OPTIONS.length} Shades Available
                            </span>
                        </div>
                        <div style={{ padding: '1.75rem' }}>
                            {/* Filter Bar */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                marginBottom: '1.5rem', flexWrap: 'wrap',
                            }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>
                                    Filter:
                                </span>
                                {[
                                    { key: 'all', label: `All Shades (${BASE_COLOR_OPTIONS.length})` },
                                    { key: 'neutral', label: `Modern Neutrals (${BASE_COLOR_OPTIONS.filter(b => b.category === 'neutral').length})` },
                                    { key: 'warm', label: `Warm & Cream (${BASE_COLOR_OPTIONS.filter(b => b.category === 'warm').length})` },
                                    { key: 'cool', label: `Cool & Blues (${BASE_COLOR_OPTIONS.filter(b => b.category === 'cool').length})` },
                                    { key: 'green', label: `Botanical & Greens (${BASE_COLOR_OPTIONS.filter(b => b.category === 'green').length})` },
                                    { key: 'pink', label: `Pastels & Pinks (${BASE_COLOR_OPTIONS.filter(b => b.category === 'pink').length})` },
                                ].map(cat => {
                                    const isCatActive = baseCategory === cat.key;
                                    return (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            onClick={() => setBaseCategory(cat.key)}
                                            style={{
                                                padding: '7px 15px',
                                                borderRadius: '999px',
                                                fontSize: '12px',
                                                fontWeight: isCatActive ? 700 : 500,
                                                border: isCatActive ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0',
                                                background: isCatActive ? tc.light : '#ffffff',
                                                color: isCatActive ? tc.primary : '#475569',
                                                cursor: 'pointer',
                                                transition: 'all 0.18s ease',
                                                boxShadow: isCatActive ? `0 2px 8px ${hexToRgba(tc.primary, 0.15)}` : 'none',
                                            }}
                                        >
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="settings-basecolor-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                                {BASE_COLOR_OPTIONS
                                    .filter(base => baseCategory === 'all' || base.category === baseCategory)
                                    .map(base => {
                                        const isActive = settingsData.base_theme === base.key;
                                        return (
                                            <div key={base.key} className="settings-basecolor-card" onClick={() => handleBaseThemeSave(base.key)}
                                                style={{ borderRadius: '8px', border: isActive ? `2px solid ${tc.primary}` : '0.5px solid #f1f5f9', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease', transform: isActive ? 'translateY(-4px)' : 'none', boxShadow: isActive ? `0 12px 32px ${hexToRgba(tc.primary, 0.18)}` : '0 2px 8px rgba(0,0,0,0.04)' }}>
                                                <div className="settings-basecolor-swatch" style={{ height: '64px', background: base.surface, position: 'relative', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div className="settings-basecolor-chip" style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', height: '22px', borderRadius: '5px', background: base.card, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}></div>
                                                    {isActive && <div className="settings-basecolor-check" style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', background: tc.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
                                                </div>
                                                <div className="settings-basecolor-body" style={{ padding: '10px 12px', background: '#ffffff' }}>
                                                    <p className="settings-basecolor-label" style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? tc.primary : '#0f172a' }}>{base.label}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            <div style={{ marginTop: '1.5rem', padding: '12px 16px', background: 'linear-gradient(135deg,#fdf0f5,#fff5f8)', borderRadius: '8px', border: '1px solid #f9c4d4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: tc.primary }}><InfoIcon /></span>
                                <p style={{ fontSize: '12px', color: tc.primary, fontWeight: 500 }}>Base color sets your public website canvas and card background shades. Combine any base color with your chosen accent theme for a personalized look.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Fonts Tab ── */}
                {activeTab === 'fonts' && (
                    <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                            { field: 'nav_font', title: 'Navbar Font', desc: 'Font for the school name shown in the navbar', gradient: 'linear-gradient(135deg,#1e3a5f,#2563eb)', shadow: 'rgba(37,99,235,0.3)' },
                        ].map(section => (
                            <div key={section.field} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '38px', height: '38px', background: section.gradient, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${section.shadow}` }}>
                                        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7M17 12l3 6m0 0l-3-6m3 6h-6"/></svg>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>{section.title}</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{section.desc}</p>
                                    </div>
                                </div>
                                <div style={{ padding: '1.75rem' }}>
                                    <div className="settings-3col settings-font-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                        {FONT_OPTIONS.map(font => {
                                            const isActive = settingsData[section.field] === font.key;
                                            return (
                                                <div key={font.key} className="settings-font-card" onClick={() => handleFontSave(section.field, font.key)}
                                                    style={{ borderRadius: '8px', border: isActive ? `2px solid ${tc.primary}` : '0.5px solid #f1f5f9', padding: '18px 14px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', background: isActive ? tc.light : '#ffffff', boxShadow: isActive ? `0 8px 20px ${hexToRgba(tc.primary, 0.18)}` : '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
                                                    {isActive && <div className="settings-font-check" style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', background: tc.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
                                                    <p className="settings-font-aa" style={{ fontFamily: font.family, fontSize: '30px', fontWeight: 700, color: isActive ? tc.primary : '#0f172a', marginBottom: '8px' }}>Aa</p>
                                                    <p className="settings-font-label" style={{ fontFamily: font.family, fontSize: '13px', fontWeight: isActive ? 700 : 600, color: isActive ? tc.primary : '#334155', marginBottom: '2px' }}>{font.label}</p>
                                                    <p className="settings-font-desc" style={{ fontSize: '10.5px', color: '#94a3b8' }}>{font.desc}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg,#fdf0f5,#fff5f8)', borderRadius: '8px', border: '1px solid #f9c4d4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: tc.primary }}><InfoIcon /></span>
                            <p style={{ fontSize: '12px', color: tc.primary, fontWeight: 500 }}>Font changes reflect on your public website immediately. Looking for the homepage heading font? That's now set from the Home page module, alongside its color.</p>
                        </div>
                    </div>
                )}

                {/* ── Welcome Banner Tab — optional popup poster shown once on the homepage ── */}
                {activeTab === 'welcomeBanner' && (
                    <div className="settings-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Welcome Banner Popup</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional — a promotional poster (e.g. admissions open) shown once when a visitor opens your homepage</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {/* Enable/disable */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: bannerData.welcome_banner_enabled ? '#f0fdf4' : '#f8fafc', border: `1px solid ${bannerData.welcome_banner_enabled ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '8px' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Show Welcome Banner</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Popup appears once per visit on your homepage</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleBannerToggle}
                                        disabled={togglingBanner || (!bannerData.welcome_banner_url && !bannerData.welcome_banner_enabled)}
                                        title={!bannerData.welcome_banner_url && !bannerData.welcome_banner_enabled ? 'Upload a banner image first' : ''}
                                        style={{
                                            width: '42px', height: '23px', borderRadius: '999px', border: 'none',
                                            cursor: togglingBanner ? 'wait' : 'pointer',
                                            background: bannerData.welcome_banner_enabled ? tc.primary : '#e2e8f0',
                                            position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0,
                                            opacity: (!bannerData.welcome_banner_url && !bannerData.welcome_banner_enabled) ? 0.5 : 1,
                                        }}>
                                        <span style={{
                                            position: 'absolute', top: '2.5px', left: bannerData.welcome_banner_enabled ? '21px' : '3px',
                                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                        }} />
                                    </button>
                                </div>

                                {/* Image upload */}
                                <div>
                                    <label style={labelStyle}>Banner Image</label>
                                    <div onClick={() => document.getElementById('welcomeBannerInput').click()}
                                        style={{ position: 'relative', border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: bannerPreview || bannerData.welcome_banner_url ? 0 : '2rem', textAlign: 'center', cursor: 'pointer', background: bannerFile ? '#f8fafc' : '#fafafa', overflow: 'hidden', transition: 'all 0.2s' }}>
                                        {bannerPreview || bannerData.welcome_banner_url ? (
                                            <>
                                                <img src={bannerPreview || bannerData.welcome_banner_url} alt="Welcome banner" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block', background: '#0f172a' }} />
                                                {bannerData.welcome_banner_url && !bannerFile && (
                                                    <button type="button" onClick={e => { e.stopPropagation(); handleBannerRemove(); }} disabled={removingBanner}
                                                        style={{ position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '50%', cursor: removingBanner ? 'wait' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title="Remove banner image">×</button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖼️</div>
                                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Click to upload your banner poster</p>
                                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>JPG, PNG, WEBP · Max 1MB · Full poster image (logo, text, photos all baked in)</p>
                                            </>
                                        )}
                                    </div>
                                    <input id="welcomeBannerInput" type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleBannerFileChange} style={{ display: 'none' }} />
                                    {bannerPreview && (
                                        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>New image ready — click "Upload Banner" below to save it.</p>
                                    )}
                                </div>

                                <button onClick={handleBannerUpload} disabled={uploadingBanner || !bannerFile}
                                    style={{ padding: '11px', background: uploadingBanner || !bannerFile ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: uploadingBanner || !bannerFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: !bannerFile ? 'none' : `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    {uploadingBanner ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Uploading...</> : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Upload Banner</>}
                                </button>

                                {/* Click-through link */}
                                <div>
                                    <label style={labelStyle}>Click-through Link (optional)</label>
                                    <input className="settings-input" type="text" value={bannerData.welcome_banner_link} onChange={handleBannerLinkChange} placeholder="Enter Link URL (e.g. admission form link)" style={inputStyle} />
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <InfoIcon /> Clicking the banner opens this link in a new tab. Leave blank if the poster is just informational.
                                    </p>
                                </div>
                                <button onClick={handleBannerLinkSave} disabled={savingBannerLink}
                                    style={{ padding: '11px', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: savingBannerLink ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
                                    {savingBannerLink ? 'Saving...' : 'Save Link'}
                                </button>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#064e3b,#059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Live Preview</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>How the popup appears to visitors</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem' }}>
                                {bannerPreview || bannerData.welcome_banner_url ? (
                                    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: 'rgba(2,6,23,0.9)', padding: '1.5rem' }}>
                                        <div style={{ position: 'relative', maxWidth: '260px', margin: '0 auto', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                                            <img src={bannerPreview || bannerData.welcome_banner_url} alt="Preview" style={{ width: '100%', display: 'block' }} />
                                            <div style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>×</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '2.5rem', textAlign: 'center', border: '1.5px dashed #e2e8f0', borderRadius: '12px', background: '#fafafa' }}>
                                        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Upload a banner image to see the preview</p>
                                    </div>
                                )}
                                <div style={{ marginTop: '14px', padding: '10px 12px', background: bannerData.welcome_banner_enabled ? '#f0fdf4' : '#fefce8', borderRadius: '8px', border: `0.5px solid ${bannerData.welcome_banner_enabled ? '#bbf7d0' : '#fde68a'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {bannerData.welcome_banner_enabled ? (
                                        <>
                                            <svg width="14" height="14" fill="none" stroke="#15803d" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                            <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>Live — shown once per visit on your homepage ✓</p>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" fill="none" stroke="#a16207" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                            <p style={{ fontSize: '12px', color: '#a16207', fontWeight: 500 }}>Disabled — not shown on your website</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Footer Background Tab — subtle background image behind the site footer ── */}
                {activeTab === 'footerBg' && (
                    <div className="settings-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M4 15l4-4a2 2 0 012.8 0L16 16m-3-3l1.6-1.6a2 2 0 012.8 0L20 14"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Footer Background</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional — a faint background image shown behind your site's footer (school building, campus photo, etc.)</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div onClick={() => document.getElementById('footerBgInput').click()}
                                    style={{ position: 'relative', border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: footerBgPreview || footerBgUrl ? 0 : '2rem', textAlign: 'center', cursor: 'pointer', background: footerBgFile ? '#f8fafc' : '#fafafa', overflow: 'hidden', transition: 'all 0.2s' }}>
                                    {footerBgPreview || footerBgUrl ? (
                                        <>
                                            <img src={footerBgPreview || footerBgUrl} alt="Footer background" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                                            {footerBgUrl && !footerBgFile && (
                                                <button type="button" onClick={e => { e.stopPropagation(); handleFooterBgRemove(); }} disabled={removingFooterBg}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '50%', cursor: removingFooterBg ? 'wait' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Remove footer background">×</button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏫</div>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Click to upload a footer background image</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>JPG, PNG, WEBP · Max 1MB · Wide/landscape photos work best</p>
                                        </>
                                    )}
                                </div>
                                <input id="footerBgInput" type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleFooterBgChange} style={{ display: 'none' }} />
                                {footerBgPreview && (
                                    <p style={{ fontSize: '11px', color: '#64748b' }}>New image ready — click "Upload Background" below to save it.</p>
                                )}
                                <button onClick={handleFooterBgUpload} disabled={uploadingFooterBg || !footerBgFile}
                                    style={{ padding: '11px', background: uploadingFooterBg || !footerBgFile ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: uploadingFooterBg || !footerBgFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: !footerBgFile ? 'none' : `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    {uploadingFooterBg ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Uploading...</> : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Upload Background</>}
                                </button>

                                <div style={{ borderTop: '0.5px solid #f1f5f9', paddingTop: '16px', marginTop: '4px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Footer About Text</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>Shown below your logo in the footer, in place of the address/phone (which already appear in the Contact Us section) — keep it short, e.g. a one-line tagline about your school.</p>
                                    <textarea value={footerAboutText} onChange={e => setFooterAboutText(e.target.value)} maxLength={280} rows={3}
                                        placeholder="Enter a short line about your school for the footer"
                                        style={{ display: 'block', width: '100%', maxWidth: '280px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', background: '#f8fafc' }} />
                                    <button onClick={handleFooterAboutTextSave} disabled={savingFooterAboutText}
                                        style={{ marginTop: '10px', padding: '9px 18px', background: savingFooterAboutText ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, cursor: savingFooterAboutText ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                        {savingFooterAboutText ? 'Saving...' : 'Save Footer Text'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#064e3b,#059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Footer Preview</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>How the image sits behind your footer (shown faded)</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem' }}>
                                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#222831', padding: '2rem 1.5rem', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    {(footerBgPreview || footerBgUrl) && (
                                        <img src={footerBgPreview || footerBgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }} />
                                    )}
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#ffffff', marginBottom: '6px' }}>{profileData.name || 'School Name'}</p>
                                        {footerAboutText && (
                                            <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, marginBottom: '8px', maxWidth: '280px' }}>{footerAboutText}</p>
                                        )}
                                        <p style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.45)' }}>© {new Date().getFullYear()} · Powered by Web Builder Pro</p>
                                    </div>
                                </div>
                                {footerBgUrl || footerBgPreview ? (
                                    <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', border: '0.5px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="14" height="14" fill="none" stroke="#15803d" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                        <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>{footerBgPreview ? 'New image ready — click Upload' : 'Footer background is live on your website ✓'}</p>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '14px', padding: '10px 12px', background: '#fefce8', borderRadius: '8px', border: '0.5px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="14" height="14" fill="none" stroke="#a16207" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        <p style={{ fontSize: '12px', color: '#a16207', fontWeight: 500 }}>No background set — footer stays a plain solid color</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Background Music Tab — school picks from a small curated preset (no upload) to avoid copyright issues ── */}
                {activeTab === 'bgMusic' && (
                    <div className="settings-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Background Music</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional — plays softly on your homepage. Pick from a curated royalty-free set (no custom upload) so there's no copyright risk.</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {/* Enable/disable */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: musicData.bg_music_enabled ? '#f0fdf4' : '#f8fafc', border: `1px solid ${musicData.bg_music_enabled ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '8px' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Play Background Music</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Starts muted for visitors — they tap a speaker icon to turn it on</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleMusicToggle}
                                        disabled={togglingMusic || (!musicData.bg_music_track && !musicData.bg_music_enabled)}
                                        title={!musicData.bg_music_track && !musicData.bg_music_enabled ? 'Select a track first' : ''}
                                        style={{
                                            width: '42px', height: '23px', borderRadius: '999px', border: 'none',
                                            cursor: togglingMusic ? 'wait' : 'pointer',
                                            background: musicData.bg_music_enabled ? tc.primary : '#e2e8f0',
                                            position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0,
                                            opacity: (!musicData.bg_music_track && !musicData.bg_music_enabled) ? 0.5 : 1,
                                        }}>
                                        <span style={{
                                            position: 'absolute', top: '2.5px', left: musicData.bg_music_enabled ? '21px' : '3px',
                                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                        }} />
                                    </button>
                                </div>

                                {/* Track picker */}
                                <div>
                                    <label style={labelStyle}>Choose a Track</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {MUSIC_TRACKS.map(track => {
                                            const selected = musicData.bg_music_track === track.key;
                                            return (
                                                <div key={track.key}
                                                    onClick={() => !selectingTrack && handleMusicTrackSelect(track.key)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                                                        border: `1.5px solid ${selected ? tc.primary : '#e2e8f0'}`,
                                                        background: selected ? hexToRgba(tc.primary, 0.06) : '#fff',
                                                        borderRadius: '8px', cursor: selectingTrack ? 'wait' : 'pointer', transition: 'all 0.15s',
                                                    }}>
                                                    <div style={{
                                                        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                                                        border: `2px solid ${selected ? tc.primary : '#cbd5e1'}`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        {selected && <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: tc.primary }} />}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{track.label}</p>
                                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{track.description}</p>
                                                    </div>
                                                    <audio
                                                        src={track.url} controls preload="none"
                                                        onClick={e => e.stopPropagation()}
                                                        style={{ height: '30px', maxWidth: '160px' }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <InfoIcon /> All tracks are royalty-free — safe to use without any copyright concerns.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#064e3b,#059669)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Status</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>How this looks to visitors on your homepage</p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem' }}>
                                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', border: '1.5px dashed #e2e8f0', borderRadius: '12px', background: '#fafafa' }}>
                                    <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '50%', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 9l-6 6m0-6l6 6"/></svg>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#64748b' }}>A floating speaker icon appears bottom-right on your homepage. Visitors tap it to play/mute — nothing plays automatically with sound.</p>
                                </div>
                                <div style={{ marginTop: '14px', padding: '10px 12px', background: musicData.bg_music_enabled ? '#f0fdf4' : '#fefce8', borderRadius: '8px', border: `0.5px solid ${musicData.bg_music_enabled ? '#bbf7d0' : '#fde68a'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {musicData.bg_music_enabled ? (
                                        <>
                                            <svg width="14" height="14" fill="none" stroke="#15803d" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                            <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>Live — {MUSIC_TRACKS.find(t => t.key === musicData.bg_music_track)?.label || 'a track'} is playable on your homepage ✓</p>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" fill="none" stroke="#a16207" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                            <p style={{ fontSize: '12px', color: '#a16207', fontWeight: 500 }}>Disabled — not shown on your website</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Affiliation Badges Tab — board/accreditation logos (e.g. CBSE, Cambridge) shown top-right of the navbar ── */}
                {activeTab === 'affiliationBadges' && (
                    <div className="settings-section" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15a4 4 0 100-8 4 4 0 000 8z"/><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5"/></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Affiliation Badges</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional — up to {MAX_AFFILIATION_BADGES} board/accreditation logos (e.g. CBSE, Cambridge Assessment) shown top-right of your navbar, next to the menu</p>
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {badges.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', border: '1.5px dashed #e2e8f0', borderRadius: '12px', background: '#fafafa' }}>
                                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>No badges added yet</p>
                                </div>
                            )}

                            {badges.map((badge, idx) => (
                                <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '10px' }}>
                                    <div onClick={() => document.getElementById(`badge-upload-${badge.id}`).click()}
                                        style={{ width: '64px', height: '64px', flexShrink: 0, borderRadius: '10px', border: badge.url ? '1px solid #e2e8f0' : '1.5px dashed #cbd5e1', background: badge.url ? '#fff' : '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {uploadingBadge === badge.id ? (
                                            <div style={{ width: '18px', height: '18px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        ) : badge.url ? (
                                            <img src={badge.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>Upload</span>
                                        )}
                                    </div>
                                    <input id={`badge-upload-${badge.id}`} type="file" accept="image/png,image/jpg,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }}
                                        onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) uploadBadgeImage(badge.id, f); }} />
                                    <div style={{ flex: 1 }}>
                                        <input type="text" value={badge.label} onChange={e => updateBadge(badge.id, 'label', e.target.value)}
                                            placeholder="Enter Label (e.g. CBSE Affiliated)" style={inputStyle} />
                                    </div>
                                    <button type="button" onClick={() => removeBadge(badge.id)}
                                        style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px', flexShrink: 0 }}>×</button>
                                </div>
                            ))}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={addBadgeSlot} disabled={badges.length >= MAX_AFFILIATION_BADGES}
                                    style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: badges.length >= MAX_AFFILIATION_BADGES ? '#cbd5e1' : tc.primary, cursor: badges.length >= MAX_AFFILIATION_BADGES ? 'not-allowed' : 'pointer' }}>
                                    + Add Badge
                                </button>
                                <button onClick={handleBadgesSave} disabled={savingBadges}
                                    style={{ padding: '11px 20px', background: savingBadges ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: savingBadges ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    {savingBadges ? 'Saving...' : 'Save Badges'}
                                </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <InfoIcon /> Badges without an uploaded image are ignored on save. Small square/landscape logos with a transparent background work best.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Custom Domain — school points their own domain (or a wbpro.in subdomain,
                     e.g. stmarys.wbpro.in) at their site via a DNS CNAME record, added as a
                     domain in the Vercel project. Saving here just stores the domain string on
                     tbl_schools.custom_domain — once DNS/Vercel are set up, App.jsx's
                     RootRouter/CustomDomainRoutes (host-based routing) and app.js's CORS check
                     already resolve and allow it automatically, no further steps needed. ── */}
                {activeTab === 'customDomain' && (
                    <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* ── Free wbpro.in Subdomain — separate, mediated flow from the external
                             Custom Domain card below: request a label here (or right after a
                             Billing payment), a Super Admin does the DNS/Vercel work manually and
                             marks it live, which lands in this same tbl_schools.custom_domain
                             column — see backend/src/modules/subdomainRequest/. ── */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Free wbpro.in Subdomain</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Get a branded link like yourschool.wbpro.in — no domain purchase needed</p>
                                </div>
                                {subdomainRequest?.status && (
                                    <span style={{
                                        fontSize: '10.5px', fontWeight: 700, borderRadius: '999px', padding: '4px 11px', flexShrink: 0,
                                        color: subdomainRequest.status === 'fulfilled' ? '#15803d' : subdomainRequest.status === 'rejected' ? '#b91c1c' : '#b45309',
                                        background: subdomainRequest.status === 'fulfilled' ? '#f0fdf4' : subdomainRequest.status === 'rejected' ? '#fef2f2' : '#fffbeb',
                                        border: `1px solid ${subdomainRequest.status === 'fulfilled' ? '#bbf7d0' : subdomainRequest.status === 'rejected' ? '#fecaca' : '#fde68a'}`,
                                    }}>
                                        {subdomainRequest.status === 'fulfilled' ? 'Live' : subdomainRequest.status === 'rejected' ? 'Needs a different name' : 'Pending'}
                                    </span>
                                )}
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem' }}>
                                {subdomainRequest === null ? (
                                    <p style={{ fontSize: '12.5px', color: '#94a3b8' }}>Loading...</p>
                                ) : subdomainRequest.status === 'fulfilled' ? (
                                    <p style={{ fontSize: '13px', color: '#15803d', fontWeight: 600 }}>
                                        Your site is live at{' '}
                                        <a href={`https://${subdomainRequest.requested_label}.wbpro.in`} target="_blank" rel="noopener noreferrer" style={{ color: '#15803d', textDecoration: 'underline' }}>
                                            {subdomainRequest.requested_label}.wbpro.in
                                        </a>
                                    </p>
                                ) : subdomainRequest.status === 'pending' ? (
                                    <p style={{ fontSize: '13px', color: '#b45309' }}>
                                        Request for <strong>{subdomainRequest.requested_label}.wbpro.in</strong> received — you'll get an email within 24 hours once it's live.
                                    </p>
                                ) : (
                                    <SubdomainRequestForm
                                        tc={tc}
                                        submitLabel={subdomainRequest.status === 'rejected' ? 'Request a Different Subdomain' : 'Request Subdomain'}
                                        onSuccess={(data) => setSubdomainRequest({ requested_label: data.label, status: 'pending' })}
                                    />
                                )}
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18"/></svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Custom Domain</p>
                                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>Point your own domain at your school website instead of the default link</p>
                                </div>
                                {customDomain && (
                                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '999px', padding: '4px 11px', flexShrink: 0 }}>
                                        Pending Verification
                                    </span>
                                )}
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {subdomainRequest?.status === 'fulfilled' && (
                                    <p style={{ fontSize: '11.5px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                        <InfoIcon /> Your site is currently live at <strong>{subdomainRequest.requested_label}.wbpro.in</strong>. Saving a domain below will replace it with the domain you enter here.
                                    </p>
                                )}
                                <div>
                                    <label style={labelStyle}>Your Domain</label>
                                    <input className="settings-input" type="text" value={customDomain} onChange={e => setCustomDomain(e.target.value)}
                                        placeholder="e.g. www.yourschool.com" style={inputStyle} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={handleDomainSave} disabled={savingDomain}
                                        style={{ padding: '11px 20px', background: savingDomain ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: savingDomain ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                        {savingDomain ? 'Saving...' : 'Save Domain'}
                                    </button>
                                    {customDomain && (
                                        <button type="button" onClick={() => setCustomDomain('')} disabled={savingDomain}
                                            style={{ padding: '11px 18px', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#ef4444', cursor: savingDomain ? 'not-allowed' : 'pointer' }}>
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <p style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <InfoIcon /> We don't register or sell domains — buy one from any registrar (GoDaddy, Namecheap, etc.) and point it here.
                                </p>
                            </div>
                        </div>

                        {/* DNS instructions — VPS Direct A Record */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)' }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>How to connect your domain</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Point your DNS records to your VPS server IP at your domain registrar (GoDaddy, Namecheap, Cloudflare, Hostinger, etc.)</p>
                            </div>
                            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {/* Quick Server IP Copy Card */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    flexWrap: 'wrap',
                                    gap: '10px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }}></span>
                                        <div>
                                            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>VPS Server IP</div>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>165.99.222.209</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText('165.99.222.209');
                                            toast.success('Server IP 165.99.222.209 copied to clipboard!');
                                        }}
                                        style={{
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            color: '#0f172a',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            padding: '6px 14px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#94a3b8';
                                            e.currentTarget.style.background = '#f1f5f9';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.background = '#ffffff';
                                        }}
                                    >
                                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                        Copy Server IP
                                    </button>
                                </div>

                                <div>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Option 1: For a root domain (e.g. yourschool.com)</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {[['Type', 'A'], ['Host', '@'], ['Value', '165.99.222.209']].map(([k, v]) => (
                                            <div key={k} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '10px 12px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '2px', fontFamily: 'monospace' }}>{v}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Option 2: For a subdomain or www (e.g. www.yourschool.com)</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {[['Type', 'A'], ['Host', 'www'], ['Value', '165.99.222.209']].map(([k, v]) => (
                                            <div key={k} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '10px 12px' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '2px', fontFamily: 'monospace' }}>{v}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '11px 14px', fontSize: '12px', color: '#1e40af', lineHeight: 1.55 }}>
                                    <strong>DNS Propagation:</strong> After adding the A record in your domain registrar's DNS panel, DNS propagation typically takes 10 to 30 minutes (up to 24–48 hours). Once saved above, your school website will automatically load under your custom domain.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Prospectus — a single PDF, shown as a "Download Prospectus" floating
                     tab on the public site next to Admission/Career Enquiry (only when set). ── */}
                {activeTab === 'prospectus' && (
                    <div className="settings-section" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', maxWidth: '640px' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>School Prospectus</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional — shows a "Download Prospectus" tab on your public site, next to Admission/Career Enquiry</p>
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {prospectusUrl && !prospectusFile ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '10px' }}>
                                    <span style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="17" height="17" fill="none" stroke="#15803d" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>Prospectus is live on your website</p>
                                        <a href={prospectusUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11.5px', color: '#16a34a', textDecoration: 'underline' }}>View current PDF</a>
                                    </div>
                                    <button type="button" onClick={handleProspectusRemove} disabled={removingProspectus}
                                        style={{ width: '30px', height: '30px', background: '#ffffff', border: '0.5px solid #fecaca', borderRadius: '8px', color: '#ef4444', cursor: removingProspectus ? 'wait' : 'pointer', fontSize: '15px', flexShrink: 0 }}
                                        title="Remove prospectus">×</button>
                                </div>
                            ) : (
                                <div onClick={() => document.getElementById('prospectusInput').click()}
                                    style={{ border: '1.5px dashed #cbd5e1', borderRadius: '10px', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: prospectusFile ? '#f8fafc' : '#fafafa' }}>
                                    <div style={{ width: '44px', height: '44px', margin: '0 auto 10px', borderRadius: '12px', background: tc.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="20" height="20" fill="none" stroke={tc.primary} strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                    </div>
                                    {prospectusFile ? (
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{prospectusFile.name}</p>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Click to upload your school prospectus</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>PDF only · Max 3MB</p>
                                        </>
                                    )}
                                </div>
                            )}
                            <input id="prospectusInput" type="file" accept="application/pdf" onChange={handleProspectusChange} style={{ display: 'none' }} />
                            {prospectusFile && (
                                <button onClick={handleProspectusUpload} disabled={uploadingProspectus}
                                    style={{ padding: '11px', background: uploadingProspectus ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: uploadingProspectus ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    {uploadingProspectus ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Uploading...</> : 'Upload Prospectus'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── School App — an optional 4th floating right-edge tab, alongside
                     Admission/Career Enquiry and Prospectus, that links out to wherever the
                     school's own app is hosted (Play Store, App Store, or any other page). ── */}
                {activeTab === 'schoolApp' && (
                    <div className="settings-section" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', maxWidth: '640px' }}>
                        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M11 18h2"/></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>School App</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional — shows a floating tab on your public site, next to Admission/Career Enquiry and Prospectus, linking to your school's own app (Play Store, App Store, or anywhere else it's hosted)</p>
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Button Name</label>
                                <input className="settings-input" type="text" value={schoolAppLabel} onChange={e => setSchoolAppLabel(e.target.value)}
                                    placeholder="Enter button name, e.g. Get Our App"
                                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13.5px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Download Link</label>
                                <input className="settings-input" type="text" value={schoolAppUrl} onChange={e => setSchoolAppUrl(e.target.value)}
                                    placeholder="Paste your Play Store / App Store / download link"
                                    style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13.5px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handleSchoolAppSave} disabled={savingSchoolApp}
                                    style={{ padding: '11px 20px', background: savingSchoolApp ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: savingSchoolApp ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}` }}>
                                    {savingSchoolApp ? 'Saving...' : 'Save'}
                                </button>
                                {schoolAppUrl && (
                                    <button type="button" onClick={handleSchoolAppClear} disabled={savingSchoolApp}
                                        style={{ padding: '11px 18px', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#ef4444', cursor: savingSchoolApp ? 'not-allowed' : 'pointer' }}>
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {footerBgCropSrc && (
                <ImageCropModal
                    imageSrc={footerBgCropSrc}
                    aspect={null}
                    onCancel={() => setFooterBgCropSrc(null)}
                    onCropComplete={handleFooterBgCropConfirmed}
                    outputFormat="image/png"
                />
            )}

            {logoCropSrc && (
                <ImageCropModal
                    imageSrc={logoCropSrc}
                    aspect={null}
                    onCancel={() => setLogoCropSrc(null)}
                    onCropComplete={handleLogoCropConfirmed}
                    outputFormat="image/png"
                />
            )}

            {bannerCropSrc && (
                <ImageCropModal
                    imageSrc={bannerCropSrc}
                    aspect={null}
                    onCancel={() => setBannerCropSrc(null)}
                    onCropComplete={handleBannerCropConfirmed}
                    outputFormat="image/png"
                />
            )}
        </>
    );
};

export default AdminSettings;