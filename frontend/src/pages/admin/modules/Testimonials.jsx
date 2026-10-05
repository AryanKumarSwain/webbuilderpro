import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import ScrollTabs from '../../../components/admin/ScrollTabs';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ImageCropModal from '../../../components/common/ImageCropModal';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import ReorderButtons from '../../../components/common/ReorderButtons';
import useSchoolStore from '../../../store/schoolStore';
import { moveItem } from '../../../utils/reorder';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = { heading: '', testimonials: [], videoTestimonials: [] };

const TABS = [
    { key: 'text', label: 'Text Testimonials', icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
    { key: 'video', label: 'Video Testimonials', icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
];

const Testimonials = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [activeTab, setActiveTab] = useState('text');
    const [uploading, setUploading] = useState({});
    const [uploadingThumb, setUploadingThumb] = useState({});

    useEffect(() => {
        fetchContent();

        let channel;
        try {
            channel = new BroadcastChannel('testimonials_sync');
            channel.onmessage = (e) => {
                if (e.data?.type === 'TESTIMONIALS_UPDATED') {
                    fetchContent();
                }
            };
        } catch (_) {}

        const onFocus = () => {
            fetchContent();
        };
        window.addEventListener('focus', onFocus);

        return () => {
            if (channel) channel.close();
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('testimonials');
            if (res.data) {
                const merged = { ...defaultContent, ...res.data.content };
                setContent(merged);
                setSavedSnapshot(res.data.has_draft_changes ? JSON.stringify(res.data.published_content || defaultContent) : JSON.stringify(merged));
                setIsPublished(res.data.is_published === 1);
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
            await saveModuleContentApi('testimonials', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            try {
                const channel = new BroadcastChannel('testimonials_sync');
                channel.postMessage({ type: 'TESTIMONIALS_UPDATED', source: 'testimonials', timestamp: Date.now() });
                channel.close();
            } catch (_) {}
            if (publish) {
                setIsPublished(true);
                toast.success('Testimonials page published! 🎉');
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
            await togglePublishApi('testimonials', 0);
            setIsPublished(false);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => setContent(prev => ({ ...prev, [field]: value }));

    const inputStyle = {
        width: '100%', padding: '11px 14px', border: '1px solid #e5e9f0',
        borderRadius: '10px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s, background 0.2s',
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .test-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 600px) {
                    .test-photo-grid { grid-template-columns: 1fr !important; }
                    .test-video-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .test-hero-inner { gap: 12px !important; }
                    .test-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .test-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .test-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .test-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .test-status-badge { padding: 4px 9px !important; }
                    .test-status-badge span { font-size: 9.5px !important; }
                    .test-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                }
                .test-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .test-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .test-hero-orb { animation: drift1 9s ease-in-out infinite; }
                .test-card { animation: fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.25s ease; }
                .test-card:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(15,23,42,0.10); border-color: ${hexToRgba(tc.primary, 0.15)}; }
                .test-vcard { animation: fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
                .test-vcard:hover { border-color: ${hexToRgba(tc.primary, 0.3)}; box-shadow: 0 8px 22px rgba(15,23,42,0.08); }
                .test-badge { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700; color: #fff; background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary}); box-shadow: 0 3px 8px ${hexToRgba(tc.primary, 0.3)}; flex-shrink: 0; }
                .test-remove-btn { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, color 0.2s ease; }
                .test-remove-btn:hover { background: #ef4444 !important; color: #fff !important; transform: rotate(90deg) scale(1.05); }
                .test-photobox { transition: border-color 0.2s ease, background 0.2s ease; }
                .test-photobox:hover { border-color: ${tc.primary} !important; background: ${hexToRgba(tc.primary, 0.04)} !important; }
                .test-addbtn { transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
                .test-addbtn:hover { transform: translateY(-2px); background: ${hexToRgba(tc.primary, 0.06)} !important; box-shadow: 0 8px 20px ${hexToRgba(tc.primary, 0.2)}; }
                .test-section-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary}); margin-right: 8px; }
                .test-star { cursor: pointer; transition: transform 0.15s ease; }
                .test-star:hover { transform: scale(1.15); }
                .test-tab-btn { transition: all 0.15s ease; }
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
                            <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / Pages / Testimonials</span>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Student & Parent Testimonials</h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                            What parents, alumni, and visitors say about your school — builds trust for prospective admissions.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: isPublished ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.12)', border: `1.5px solid ${isPublished ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.25)'}`, borderRadius: '999px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#4ade80' : '#facc15' }}></div>
                                <span style={{ fontSize: '11px', color: isPublished ? '#bbf7d0' : '#ffffff', fontWeight: 700, letterSpacing: '0.03em' }}>
                                    {isPublished ? 'Live on Website' : 'Draft (Unpublished)'}
                                </span>
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.28)', borderRadius: '999px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                <span style={{ fontSize: '11px', color: '#e0f2fe', fontWeight: 700, letterSpacing: '0.02em' }}>
                                    Synced with Home Page
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Testimonials</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.testimonials?.length || 0} Reviews Online`}</p>
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Rating</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'5.0 Star Praise'}</p>
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
                        moduleKey="testimonials"
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

                <div className="test-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Top section — shared page heading */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}><span className="test-section-dot"></span>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="test-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
                                    placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: content.headingItalic ? 'italic' : 'normal' }} />
                                <ItalicToggle active={!!content.headingItalic} onToggle={() => updateField('headingItalic', !content.headingItalic)} />
                            </div>
                            <HeadingStyleField
                                color={content.headingColor} onColorChange={val => updateField('headingColor', val)}
                                font={content.headingFont} onFontChange={val => updateField('headingFont', val)}
                            />
                        </div>
                    </div>

                    {/* Text / Video tabs */}
                    <ScrollTabs colors={tc}>
                        {TABS.map(t => (
                            <button key={t.key} type="button" className="test-tab-btn" onClick={() => setActiveTab(t.key)}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: activeTab === t.key ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0', fontSize: '13px', cursor: 'pointer', background: activeTab === t.key ? tc.light : '#ffffff', color: activeTab === t.key ? tc.primary : '#64748b', fontWeight: activeTab === t.key ? 600 : 400, display: 'flex', alignItems: 'center', gap: '7px', boxShadow: activeTab === t.key ? `0 4px 12px ${hexToRgba(tc.primary, 0.15)}` : 'none' }}>
                                <span style={{ color: activeTab === t.key ? tc.primary : '#94a3b8' }}>{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </ScrollTabs>

                    {activeTab === 'text' ? (
                        <>
                            <div style={{ display: 'flex' }}>
                                <button className="test-addbtn" onClick={() => updateField('testimonials', [{
                                    id: `test-${Date.now()}`, photo: '', name: '', type: 'parent', role: '', rating: 5, quote: ''
                                }, ...content.testimonials])}
                                    style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                                    + Add Text Testimonial
                                </button>
                            </div>

                            {content.testimonials.map((t, idx) => (
                                <TestimonialCard key={t.id} testimonial={t} index={idx} length={content.testimonials.length}
                                    onMove={(i, dir) => updateField('testimonials', moveItem(content.testimonials, i, dir))}
                                    onUpdate={(field, val) => {
                                        const updated = [...content.testimonials];
                                        updated[idx] = { ...updated[idx], [field]: val };
                                        updateField('testimonials', updated);
                                    }}
                                    onRemove={() => updateField('testimonials', content.testimonials.filter((_, i) => i !== idx))}
                                    onUploadPhoto={async (file) => {
                                        setUploading(prev => ({ ...prev, [`test-${t.id}`]: true }));
                                        try {
                                            const res = await uploadContentImageApi(file);
                                            const updated = [...content.testimonials];
                                            updated[idx] = { ...updated[idx], photo: res.data.url };
                                            updateField('testimonials', updated);
                                        } catch (e) { toast.error(e?.response?.data?.message || 'Failed to upload'); }
                                        finally { setUploading(prev => ({ ...prev, [`test-${t.id}`]: false })); }
                                    }}
                                    uploading={uploading[`test-${t.id}`]}
                                />
                            ))}
                            {content.testimonials.length === 0 && (
                                <p style={{ fontSize: '11px', color: '#cbd5e1' }}>No text testimonials added yet.</p>
                            )}
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex' }}>
                                <button className="test-addbtn" onClick={() => updateField('videoTestimonials', [{
                                    id: `vtest-${Date.now()}`, thumbnail: '', name: '', type: 'parent', role: '', rating: 5, youtubeUrl: ''
                                }, ...content.videoTestimonials])}
                                    style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                                    + Add Video Testimonial
                                </button>
                            </div>

                            <div className="test-video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                                {content.videoTestimonials.map((t, idx) => (
                                    <VideoTestimonialCard key={t.id} testimonial={t} index={idx} length={content.videoTestimonials.length}
                                        onMove={(i, dir) => updateField('videoTestimonials', moveItem(content.videoTestimonials, i, dir))}
                                        onUpdate={(field, val) => {
                                            const updated = [...content.videoTestimonials];
                                            updated[idx] = { ...updated[idx], [field]: val };
                                            updateField('videoTestimonials', updated);
                                        }}
                                        onRemove={() => updateField('videoTestimonials', content.videoTestimonials.filter((_, i) => i !== idx))}
                                        onUploadThumb={async (file) => {
                                            setUploadingThumb(prev => ({ ...prev, [`vtest-${t.id}`]: true }));
                                            try {
                                                const res = await uploadContentImageApi(file);
                                                const updated = [...content.videoTestimonials];
                                                updated[idx] = { ...updated[idx], thumbnail: res.data.url };
                                                updateField('videoTestimonials', updated);
                                            } catch (e) { toast.error(e?.response?.data?.message || 'Failed to upload'); }
                                            finally { setUploadingThumb(prev => ({ ...prev, [`vtest-${t.id}`]: false })); }
                                        }}
                                        uploading={uploadingThumb[`vtest-${t.id}`]}
                                    />
                                ))}
                            </div>
                            {content.videoTestimonials.length === 0 && (
                                <p style={{ fontSize: '11px', color: '#cbd5e1' }}>No video testimonials added yet.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

// ── Text Testimonial Card ──
const TestimonialCard = ({ testimonial, index, length, onMove, onUpdate, onRemove, onUploadPhoto, uploading }) => {
    const { tc } = useSchoolStore();
    const [cropSrc, setCropSrc] = useState(null);
    const inputStyle = { width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div className="test-card" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', animationDelay: `${Math.min(index, 8) * 0.05}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="test-badge">{index + 1}</span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{testimonial.name || 'New Testimonial'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ReorderButtons index={index} length={length} onMove={onMove} vertical={false} />
                    <button className="test-remove-btn" onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
                </div>
            </div>

            <div className="test-photo-grid" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem' }}>
                {/* Photo upload */}
                <div>
                    <label style={labelStyle}>Photo (optional)</label>
                    <div className="test-photobox" onClick={() => document.getElementById(`test-photo-${testimonial.id}`).click()}
                        style={{ height: '140px', borderRadius: '12px', border: testimonial.photo ? '1px solid #e2e8f0' : '1.5px dashed #e2e8f0', boxShadow: testimonial.photo ? '0 6px 18px rgba(15,23,42,0.08)' : 'none', background: testimonial.photo ? 'transparent' : '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {uploading ? (
                            <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        ) : testimonial.photo ? (
                            <img src={testimonial.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>👤 Upload</span>
                        )}
                    </div>
                    <input id={`test-photo-${testimonial.id}`} type="file" accept="image/*"
                        onChange={e => {
                            const f = e.target.files[0];
                            e.target.value = '';
                            if (f) setCropSrc(URL.createObjectURL(f));
                        }} style={{ display: 'none' }} />
                    <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>Falls back to initials if left blank · Max 1MB</p>
                </div>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.7fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Name</label>
                            <input className="test-input" type="text" value={testimonial.name} onChange={e => onUpdate('name', e.target.value)} placeholder="Enter Full Name" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Type</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {['parent', 'alumni', 'visitor'].map(type => (
                                    <button key={type} type="button" onClick={() => onUpdate('type', type)}
                                        style={{
                                            flex: 1, padding: '10px 6px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                                            border: `1px solid ${testimonial.type === type ? tc.primary : '#e5e9f0'}`,
                                            background: testimonial.type === type ? hexToRgba(tc.primary, 0.08) : '#f8fafc',
                                            color: testimonial.type === type ? tc.primary : '#64748b',
                                        }}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Role / Relation (optional)</label>
                        <input className="test-input" type="text" value={testimonial.role} onChange={e => onUpdate('role', e.target.value)}
                            placeholder="Enter Role (e.g. Parent of Grade 5 Student)" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Rating</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <svg key={star} className="test-star" onClick={() => onUpdate('rating', star)}
                                    width="22" height="22" viewBox="0 0 24 24"
                                    fill={star <= (testimonial.rating || 0) ? '#f59e0b' : 'none'}
                                    stroke={star <= (testimonial.rating || 0) ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5l2.9 6 6.6.7-4.9 4.6 1.2 6.5L12 16.9l-5.8 3.4 1.2-6.5-4.9-4.6 6.6-.7L12 2.5z" />
                                </svg>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Quote</label>
                        <RichTextEditor value={testimonial.quote} onChange={val => onUpdate('quote', val)}
                            placeholder="Enter Testimonial Quote" minHeight="90px" fontSize="13px" />
                    </div>
                </div>
            </div>

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={1}
                    onCancel={() => setCropSrc(null)}
                    onCropComplete={(croppedFile) => { setCropSrc(null); onUploadPhoto(croppedFile); }}
                />
            )}
        </div>
    );
};

// ── Video Testimonial Card — compact, sharp-bordered, no wasted space.
// Thumbnail uses a free-form crop (aspect=null), same as the About Us History gallery,
// so the admin can pull the crop box edges to any shape instead of being locked to a ratio. ──
const VideoTestimonialCard = ({ testimonial, index, length, onMove, onUpdate, onRemove, onUploadThumb, uploading }) => {
    const { tc } = useSchoolStore();
    const [cropSrc, setCropSrc] = useState(null);
    const inputStyle = { width: '100%', padding: '8px 11px', border: '1px solid #e5e9f0', borderRadius: '8px', fontSize: '12.5px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const labelStyle = { display: 'block', fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div className="test-vcard" style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '12px', padding: '10px', animationDelay: `${Math.min(index, 8) * 0.04}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="test-badge" style={{ width: '22px', height: '22px', fontSize: '10px' }}>{index + 1}</span>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{testimonial.name || 'New Video'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ReorderButtons index={index} length={length} onMove={onMove} vertical={false} />
                    <button className="test-remove-btn" onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '13px', width: '24px', height: '24px' }}>×</button>
                </div>
            </div>

            {/* Thumbnail */}
            <div className="test-photobox" onClick={() => document.getElementById(`vtest-thumb-${testimonial.id}`).click()}
                style={{ position: 'relative', height: '110px', borderRadius: '9px', border: testimonial.thumbnail ? '1px solid #e2e8f0' : '1.5px dashed #e2e8f0', background: testimonial.thumbnail ? `url(${testimonial.thumbnail}) center/cover` : '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '8px' }}>
                {uploading ? (
                    <div style={{ width: '18px', height: '18px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                ) : testimonial.thumbnail ? (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={tc.primary}><path d="M8 5v14l11-7z" /></svg>
                    </div>
                ) : (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>🎬 Upload Thumbnail</span>
                )}
            </div>
            <input id={`vtest-thumb-${testimonial.id}`} type="file" accept="image/*"
                onChange={e => {
                    const f = e.target.files[0];
                    e.target.value = '';
                    if (f) setCropSrc(URL.createObjectURL(f));
                }} style={{ display: 'none' }} />

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                    <div>
                        <label style={labelStyle}>Name</label>
                        <input type="text" value={testimonial.name} onChange={e => onUpdate('name', e.target.value)} placeholder="Enter Full Name" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Role (optional)</label>
                        <input type="text" value={testimonial.role} onChange={e => onUpdate('role', e.target.value)} placeholder="e.g. Parent" style={inputStyle} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                    {['parent', 'alumni', 'visitor'].map(type => (
                        <button key={type} type="button" onClick={() => onUpdate('type', type)}
                            style={{
                                flex: 1, padding: '6px 4px', borderRadius: '7px', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                                border: `1px solid ${testimonial.type === type ? tc.primary : '#e5e9f0'}`,
                                background: testimonial.type === type ? hexToRgba(tc.primary, 0.08) : '#f8fafc',
                                color: testimonial.type === type ? tc.primary : '#64748b',
                            }}>
                            {type}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '3px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className="test-star" onClick={() => onUpdate('rating', star)}
                            width="16" height="16" viewBox="0 0 24 24"
                            fill={star <= (testimonial.rating || 0) ? '#f59e0b' : 'none'}
                            stroke={star <= (testimonial.rating || 0) ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5l2.9 6 6.6.7-4.9 4.6 1.2 6.5L12 16.9l-5.8 3.4 1.2-6.5-4.9-4.6 6.6-.7L12 2.5z" />
                        </svg>
                    ))}
                </div>
                <div>
                    <label style={labelStyle}>YouTube Link</label>
                    <input type="text" value={testimonial.youtubeUrl} onChange={e => onUpdate('youtubeUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." style={inputStyle} />
                </div>
            </div>

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={null}
                    onCancel={() => setCropSrc(null)}
                    onCropComplete={(croppedFile) => { setCropSrc(null); onUploadThumb(croppedFile); }}
                />
            )}
        </div>
    );
};

export default Testimonials;
