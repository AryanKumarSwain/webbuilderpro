import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import ScrollTabs from '../../../components/admin/ScrollTabs';
import toast from 'react-hot-toast';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ImageCropModal from '../../../components/common/ImageCropModal';
import ImageThumbnailCard, { CropIcon, loadCropSrc } from '../../../components/common/ImageThumbnailCard';
import { moveItem } from '../../../utils/reorder';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import useSchoolStore from '../../../store/schoolStore';

const GALLERY_LIMIT = 10;

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const LEVELS = [
    {
        key: 'preprimary', label: 'Pre Primary School',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
        key: 'primary', label: 'Primary School',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
        key: 'middle', label: 'Middle School',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    },
    {
        key: 'high', label: 'High School',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
    },
    {
        key: 'senior', label: 'Senior School',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    },
];

const LEVEL_SLUGS = {
    preprimary: '/pre-primary-school',
    primary: '/primary-school',
    middle: '/middle-school',
    high: '/high-school',
    senior: '/senior-school',
};

const ImageIcon = () => (
    <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);

const defaultLevelData = {
    enabled: false,
    aboutHeading: '',
    aboutQuote: '',
    aboutAuthor: '',
    aboutAuthorDesignation: '',
    aboutImage: '',
    uniqueHeading: '',
    uniqueText: '',
    uniqueImage: '',
    gallery: [],
};

const defaultContent = {
    preprimary: { ...defaultLevelData },
    primary: { ...defaultLevelData },
    middle: { ...defaultLevelData },
    high: { ...defaultLevelData },
    senior: { ...defaultLevelData },
};

const Courses = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [activeLevel, setActiveLevel] = useState(null);
    const [activeTab, setActiveTab] = useState('about');
    const [uploading, setUploading] = useState({});
    const [cropTarget, setCropTarget] = useState(null); // { kind: 'field' | 'gallery', field?, aspect, src }
    const [imageQueue, setImageQueue] = useState([]); // remaining gallery files still waiting to be cropped

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('courses');
            if (res.data) {
                const merged = { ...defaultContent };
                Object.keys(res.data.content || {}).forEach(k => {
                    merged[k] = { ...defaultLevelData, ...res.data.content[k] };
                });
                setContent(merged);
                setSavedSnapshot(res.data.has_draft_changes ? JSON.stringify(res.data.published_content || defaultContent) : JSON.stringify(merged));
                setIsPublished(res.data.is_published === 1);
                const firstEnabled = LEVELS.find(l => merged[l.key]?.enabled);
                if (firstEnabled) setActiveLevel(firstEnabled.key);
            }
        } catch (e) {
            console.log('No content yet');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('courses', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Courses published!');
            }
            else toast.success('Saved!');
        } catch (e) {
            toast.error('Failed to save');
        } finally {
            setSaving(false); setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            await togglePublishApi('courses', 0);
            setIsPublished(false);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const toggleLevel = (key) => {
        const newEnabled = !content[key].enabled;
        setContent(prev => ({ ...prev, [key]: { ...prev[key], enabled: newEnabled } }));
        if (newEnabled) { setActiveLevel(key); setActiveTab('about'); }
        else if (activeLevel === key) {
            const next = LEVELS.find(l => l.key !== key && content[l.key].enabled);
            setActiveLevel(next ? next.key : null);
        }
    };

    const updateField = (field, value) => {
        setContent(prev => ({ ...prev, [activeLevel]: { ...prev[activeLevel], [field]: value } }));
    };

    const handleImageUpload = async (file, field) => {
        setUploading(prev => ({ ...prev, [field]: true }));
        try {
            const res = await uploadContentImageApi(file);
            updateField(field, res.data.url);
            toast.success('Uploaded!');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload');
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    // Gallery
    const addGalleryImage = async (file) => {
        setUploading(prev => ({ ...prev, gallery: true }));
        try {
            const res = await uploadContentImageApi(file);
            const current = content[activeLevel].gallery || [];
            updateField('gallery', [...current, res.data.url]);
            toast.success('Image added!');
        } catch (e) {
            toast.error('Failed');
        } finally {
            setUploading(prev => ({ ...prev, gallery: false }));
        }
    };

    const removeGalleryImage = (idx) => {
        const current = content[activeLevel].gallery || [];
        updateField('gallery', current.filter((_, i) => i !== idx));
    };

    const recropGalleryImage = async (idx, url) => {
        setImageQueue([]);
        const src = await loadCropSrc(url);
        setCropTarget({ kind: 'recropGallery', index: idx, aspect: null, src });
    };

    const moveGalleryImage = (idx, direction) => {
        const current = content[activeLevel].gallery || [];
        const updated = moveItem(current, idx, direction);
        updateField('gallery', updated);
    };

    // Each file is cropped one at a time (freeform, no locked aspect — adjustable from
    // every side) before upload. Once confirmed, the next queued file automatically
    // opens in the crop modal.
    const startGalleryUpload = (files) => {
        if (files.length === 0) return;
        const current = content[activeLevel].gallery || [];
        const remaining = GALLERY_LIMIT - current.length;
        if (remaining <= 0) {
            toast.error(`Gallery is limited to ${GALLERY_LIMIT} images`);
            return;
        }
        if (files.length > remaining) {
            toast.error(`Only ${remaining} more image${remaining === 1 ? '' : 's'} can be added (max ${GALLERY_LIMIT})`);
        }
        const allowed = files.slice(0, remaining);
        setImageQueue(allowed.slice(1));
        setCropTarget({ kind: 'gallery', aspect: null, src: URL.createObjectURL(allowed[0]) });
    };

    const onCropConfirmed = async (croppedFile) => {
        const t = cropTarget;
        setCropTarget(null);
        if (t.kind === 'field') {
            await handleImageUpload(croppedFile, t.field);
        } else if (t.kind === 'recropGallery') {
            setUploading(prev => ({ ...prev, gallery: true }));
            try {
                const res = await uploadContentImageApi(croppedFile);
                const current = [...(content[activeLevel].gallery || [])];
                current[t.index] = res.data.url;
                updateField('gallery', current);
                toast.success('Image updated!');
            } catch (e) {
                toast.error('Failed to update image');
            } finally {
                setUploading(prev => ({ ...prev, gallery: false }));
            }
        } else if (t.kind === 'gallery') {
            await addGalleryImage(croppedFile);
        }
        if (t.kind === 'gallery' && imageQueue.length > 0) {
            const [next, ...rest] = imageQueue;
            setImageQueue(rest);
            setCropTarget({ kind: 'gallery', aspect: null, src: URL.createObjectURL(next) });
        }
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px', border: '1px solid #e5e9f0',
        borderRadius: '10px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s, background 0.2s'
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    const ImageBox = ({ label, value, field, hint, aspect = 16 / 9, previewAspect, previewMaxWidth }) => {
        // previewAspect/previewMaxWidth shape the field preview to match how the image actually
        // renders on the live site (e.g. portrait 3/4), instead of a wide banner box.
        const shaped = !!previewAspect;
        return (
        <div>
            <label style={labelStyle}>{label}</label>
            <div onClick={() => document.getElementById(`img-${field}`).click()}
                style={{
                    position: 'relative', border: value ? '1px solid #e2e8f0' : '1.5px dashed #cbd5e1', borderRadius: '8px', padding: value ? 0 : '2rem', textAlign: 'center', cursor: 'pointer', background: value ? 'transparent' : '#fafafa', boxShadow: value ? '0 6px 18px rgba(15,23,42,0.08)' : 'none', overflow: 'hidden',
                    ...(shaped
                        ? { width: previewMaxWidth || '260px', aspectRatio: previewAspect, display: 'flex', flexDirection: 'column', alignItems: value ? 'stretch' : 'center', justifyContent: value ? 'stretch' : 'center' }
                        : { minHeight: value ? '160px' : 'auto' }),
                }}>
                {uploading[field] ? (
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <p style={{ fontSize: '12px', color: '#64748b' }}>Uploading...</p>
                    </div>
                ) : value ? (
                    <>
                        <img src={value} alt="" style={shaped ? { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } : { width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                        <button
                            type="button"
                            onClick={async (e) => {
                                e.stopPropagation();
                                const src = await loadCropSrc(value);
                                setCropTarget({ kind: 'field', field, aspect, src });
                            }}
                            title="Recrop this image"
                            style={{
                                position: 'absolute', top: '8px', left: '8px',
                                padding: '3px 8px', borderRadius: '5px',
                                background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
                                color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)',
                                cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '4px',
                                zIndex: 2,
                            }}
                        >
                            <CropIcon size={11} color="#ffffff" />
                            <span>Recrop</span>
                        </button>
                        <button type="button" onClick={e => { e.stopPropagation(); updateField(field, ''); }}
                            style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                            title="Remove image">✕</button>
                    </>
                ) : (
                    <>
                        <div style={{ color: '#cbd5e1', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><ImageIcon /></div>
                        <p style={{ fontSize: '13px', color: '#64748b' }}>Click to upload</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{hint ? `${hint} · JPG, PNG, WEBP · Max 1MB` : 'JPG, PNG, WEBP · Max 1MB'}</p>
                    </>
                )}
            </div>
            <input id={`img-${field}`} type="file" accept="image/*"
                onChange={e => {
                    const f = e.target.files[0];
                    e.target.value = '';
                    if (f) setCropTarget({ kind: 'field', field, aspect, src: URL.createObjectURL(f) });
                }}
                style={{ display: 'none' }} />
        </div>
        );
    };

    const tabs = [
        { key: 'about', label: 'About' },
        { key: 'unique', label: 'Why Unique' },
        { key: 'gallery', label: 'Gallery' },
    ];

    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const activeData = activeLevel ? content[activeLevel] : null;

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .crs-section { animation: fadeInUp 0.35s ease forwards; }
                .crs-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .level-toggle { transition: all 0.2s; }
                .crs-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .crs-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @media (max-width: 700px) {
                    .crs-2col { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    /* ── Hero header — compact, same treatment as the other module pages ── */
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .crs-hero-inner { gap: 12px !important; }
                    .crs-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .crs-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .crs-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .crs-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .crs-status-badge { padding: 4px 9px !important; }
                    .crs-status-badge span { font-size: 9.5px !important; }
                    .crs-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }

                    /* ── School-level toggle cards — 2-per-row instead of 5 tiny squeezed tiles ── */
                    .crs-levels-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }

                    /* ── Level tabs + Section tabs — horizontal swipeable strips ── */
                    .crs-tabs { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; scrollbar-width: none !important; padding-bottom: 2px !important; }
                    .crs-tabs::-webkit-scrollbar { display: none !important; }
                    .crs-tabs button { flex-shrink: 0 !important; padding: 8px 14px !important; font-size: 12px !important; white-space: nowrap !important; }

                    /* ── Gallery thumbnails — 2-per-row instead of 4 tiny tiles ── */
                    .crs-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
        <div className="dash-hero" style={{
            background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.secondary || tc.dark} 100%)`,
            borderRadius: '24px',
            padding: '2.25rem 2.75rem',
            marginBottom: '1.75rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 16px 40px ${hexToRgba(tc.primary, 0.28)}`
        }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', width: '380px', height: '380px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.secondary || tc.primary, 0.28)} 0%, transparent 70%)`, top: '-140px', right: '-80px', pointerEvents: 'none', filter: 'blur(30px)' }}></div>
            <div style={{ position: 'absolute', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', bottom: '-80px', left: '15%', pointerEvents: 'none', filter: 'blur(20px)' }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.22)', marginBottom: '12px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></div>
                            <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / Pages / Courses</span>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Academic Levels & Wings</h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                            Enable and configure school levels (Pre-Primary, Primary, Middle, Secondary, Senior Secondary).
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: isPublished ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.12)', border: `1.5px solid ${isPublished ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.25)'}`, borderRadius: '999px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#4ade80' : '#facc15' }}></div>
                                <span style={{ fontSize: '11px', color: isPublished ? '#bbf7d0' : '#ffffff', fontWeight: 700, letterSpacing: '0.03em' }}>
                                    {isPublished ? 'Live on Website' : 'Draft (Unpublished)'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Standardized Whiter Frosted Glass Panel */}
                    <div className="dash-hero-stats-panel" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.13) 100%)',
                        border: '1.5px solid rgba(255,255,255,0.42)',
                        borderRadius: '16px',
                        padding: '0.75rem 1.1rem',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.18), inset 0 1px 1.5px rgba(255,255,255,0.5)',
                        width: '230px',
                        minWidth: '230px',
                        maxWidth: '230px',
                        flexShrink: 0,
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.18)' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.22)',
                                border: '1px solid rgba(255,255,255,0.38)',
                                color: '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>School Wings</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.levels?.filter(l => l.enabled)?.length || 0} Levels Active`}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '5px 0' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.22)',
                                border: '1px solid rgba(255,255,255,0.38)',
                                color: '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Syllabus</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'Comprehensive Curriculum'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero Bottom Actions */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.16)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                            {isDirty ? '⚠️ You have unsaved changes in this module' : '✓ All changes are currently up to date'}
                        </span>
                    </div>
                    <ModuleActionButtons
                        tc={tc}
                        moduleKey="courses"
                        subPath={activeLevel && LEVEL_SLUGS[activeLevel] ? LEVEL_SLUGS[activeLevel] : '/courses'}
                        content={content}
                        saving={saving}
                        publishing={publishing}
                        isPublished={isPublished}
                        isDirty={isDirty}
                        onPublish={() => handleSave(true)}
                        onUnpublish={handleUnpublish}
                    />
                </div>
            </div>
        </div>

                {/* Level Toggles */}
                <div className="crs-levels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '1.75rem' }}>
                    {LEVELS.map(lv => {
                        const enabled = content[lv.key]?.enabled;
                        return (
                            <div key={lv.key} className="level-toggle"
                                onClick={() => toggleLevel(lv.key)}
                                style={{
                                    padding: '1.15rem', borderRadius: '8px', cursor: 'pointer',
                                    border: enabled ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0',
                                    background: enabled ? tc.light : '#ffffff',
                                    boxShadow: enabled ? `0 6px 16px ${hexToRgba(tc.primary, 0.1)}` : 'none',
                                }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: enabled ? tc.primary : '#94a3b8' }}>{lv.icon}</span>
                                    <div style={{ width: '34px', height: '18px', borderRadius: '9px', background: enabled ? tc.primary : '#e2e8f0', position: 'relative', transition: 'all 0.2s' }}>
                                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: enabled ? '18px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
                                    </div>
                                </div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: enabled ? tc.primary : '#0f172a' }}>{lv.label}</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{enabled ? 'Enabled' : 'Tap to enable'}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Active Level Editor */}
                {!activeLevel ? (
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '3.5rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div style={{ color: '#cbd5e1', display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                            <svg width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <p style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a', marginBottom: '6px' }}>No level enabled yet</p>
                        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Enable a school level above to start filling its details</p>
                    </div>
                ) : (
                    <div className="crs-section">
                        {/* Level tabs (if multiple enabled) */}
                        <ScrollTabs colors={tc} style={{ marginBottom: '1rem' }}>
                            {LEVELS.filter(l => content[l.key].enabled).map(l => (
                                <button key={l.key} onClick={() => { setActiveLevel(l.key); setActiveTab('about'); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '6px', border: activeLevel === l.key ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0', background: activeLevel === l.key ? tc.light : '#ffffff', color: activeLevel === l.key ? tc.primary : '#64748b', fontSize: '13px', fontWeight: activeLevel === l.key ? 600 : 400, cursor: 'pointer' }}>
                                    <span style={{ display: 'flex' }}>{l.icon}</span>
                                    {l.label}
                                </button>
                            ))}
                        </ScrollTabs>

                        {/* Section Tabs */}
                        <ScrollTabs colors={tc} style={{ marginBottom: '1.25rem' }}>
                            {tabs.map(t => (
                                <button key={t.key} onClick={() => setActiveTab(t.key)}
                                    style={{ padding: '9px 18px', borderRadius: '6px', border: activeTab === t.key ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0', fontSize: '12.5px', cursor: 'pointer', background: activeTab === t.key ? tc.light : '#ffffff', color: activeTab === t.key ? tc.primary : '#64748b', fontWeight: activeTab === t.key ? 600 : 400 }}>
                                    {t.label}
                                </button>
                            ))}
                        </ScrollTabs>

                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

                            {/* About Tab */}
                            {activeTab === 'about' && (
                                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <ImageBox label="About Section Image" value={activeData.aboutImage} field="aboutImage" hint="Freely adjustable from every side — keep it tall/vertical" aspect={null} previewAspect="3/4" previewMaxWidth="260px" />
                                    <div>
                                        <label style={labelStyle}>Heading</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <textarea className="crs-input" value={activeData.aboutHeading} onChange={e => updateField('aboutHeading', e.target.value)}
                                                placeholder="Enter Heading" rows={2} style={{ ...inputStyle, resize: 'vertical', fontStyle: activeData.aboutHeadingItalic ? 'italic' : 'normal' }} />
                                            <ItalicToggle active={!!activeData.aboutHeadingItalic} onToggle={() => updateField('aboutHeadingItalic', !activeData.aboutHeadingItalic)} />
                                        </div>
                                        <HeadingStyleField
                                            color={activeData.aboutHeadingColor} onColorChange={val => updateField('aboutHeadingColor', val)}
                                            font={activeData.aboutHeadingFont} onFontChange={val => updateField('aboutHeadingFont', val)}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Quote / Description</label>
                                        <RichTextEditor key={`${activeLevel}-about`} value={activeData.aboutQuote} onChange={val => updateField('aboutQuote', val)}
                                            placeholder="Write a warm description about this section of the school..." minHeight="150px"
                                            maxWidth="745px" fontSize="16px" fontFamily="'Inter', system-ui, sans-serif" />
                                    </div>
                                    <div className="crs-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        <div>
                                            <label style={labelStyle}>Author Name</label>
                                            <input className="crs-input" type="text" value={activeData.aboutAuthor} onChange={e => updateField('aboutAuthor', e.target.value)}
                                                placeholder="Enter Author Name" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Designation</label>
                                            <input className="crs-input" type="text" value={activeData.aboutAuthorDesignation} onChange={e => updateField('aboutAuthorDesignation', e.target.value)}
                                                placeholder="Enter Designation" style={inputStyle} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Why Unique Tab */}
                            {activeTab === 'unique' && (
                                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <ImageBox label="Why Unique Section Image" value={activeData.uniqueImage} field="uniqueImage" hint="Freely adjustable from every side — keep it tall/vertical" aspect={null} previewAspect="3/4" previewMaxWidth="260px" />
                                    <div>
                                        <label style={labelStyle}>Heading</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input className="crs-input" type="text" value={activeData.uniqueHeading} onChange={e => updateField('uniqueHeading', e.target.value)}
                                                placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: activeData.uniqueHeadingItalic ? 'italic' : 'normal' }} />
                                            <ItalicToggle active={!!activeData.uniqueHeadingItalic} onToggle={() => updateField('uniqueHeadingItalic', !activeData.uniqueHeadingItalic)} />
                                        </div>
                                        <HeadingStyleField
                                            color={activeData.uniqueHeadingColor} onColorChange={val => updateField('uniqueHeadingColor', val)}
                                            font={activeData.uniqueHeadingFont} onFontChange={val => updateField('uniqueHeadingFont', val)}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Description</label>
                                        <RichTextEditor key={`${activeLevel}-unique`} value={activeData.uniqueText} onChange={val => updateField('uniqueText', val)}
                                            placeholder="What makes this section of your school special..." minHeight="180px"
                                            maxWidth="745px" fontSize="16px" fontFamily="'Inter', system-ui, sans-serif" />
                                    </div>
                                </div>
                            )}

                            {/* Gallery Tab */}
                            {activeTab === 'gallery' && (
                                <div style={{ padding: '2rem' }}>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '1rem' }}>{(activeData.gallery || []).length} / {GALLERY_LIMIT} images added</p>
                                    <div className="crs-gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '1.25rem' }}>
                                        {(activeData.gallery || []).map((img, i) => (
                                            <ImageThumbnailCard
                                                key={i}
                                                url={img}
                                                index={i}
                                                total={(activeData.gallery || []).length}
                                                onRecrop={recropGalleryImage}
                                                onRemove={removeGalleryImage}
                                                onMove={moveGalleryImage}
                                                aspectRatio="1"
                                            />
                                        ))}
                                    </div>
                                    {(activeData.gallery || []).length >= GALLERY_LIMIT ? (
                                        <div style={{ border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', background: '#fafafa' }}>
                                            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Gallery limit of {GALLERY_LIMIT} images reached — remove one to add another.</p>
                                        </div>
                                    ) : (
                                        <div onClick={() => document.getElementById('gallery-input').click()}
                                            style={{ border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                                            {uploading.gallery ? (
                                                <p style={{ fontSize: '13px', color: '#64748b' }}>Uploading...</p>
                                            ) : (
                                                <>
                                                    <p style={{ fontSize: '13px', color: '#64748b' }}>+ Click to add gallery images (multiple allowed)</p>
                                                    <p style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>You'll get a crop tool for each image (freely adjustable from every side) before it's added. Square photos work best · JPG, PNG, WEBP · Max 1MB each · Up to {GALLERY_LIMIT} images.</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <input id="gallery-input" type="file" accept="image/*" multiple
                                        onChange={e => {
                                            const files = Array.from(e.target.files);
                                            e.target.value = '';
                                            if (files.length > 0) startGalleryUpload(files);
                                        }}
                                        style={{ display: 'none' }} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {cropTarget && (
                <ImageCropModal
                    imageSrc={cropTarget.src}
                    aspect={cropTarget.aspect}
                    onCancel={() => { setCropTarget(null); setImageQueue([]); }}
                    onCropComplete={onCropConfirmed}
                />
            )}
        </>
    );
};

export default Courses;
