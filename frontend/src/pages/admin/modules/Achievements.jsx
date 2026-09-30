import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
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

const defaultContent = {
    heading: '',
    description: '',
    subHeading: 'Awards & Achievements',
    achievements: [],
    certifications: [],
};

const CATEGORIES = ['Academic', 'Sports', 'Cultural', 'Co-Curricular', 'Other'];

const Achievements = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [uploading, setUploading] = useState({});
    const [cropTarget, setCropTarget] = useState(null); // { mode: 'achievement' | 'cert', id, src }

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('achievements');
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
            await saveModuleContentApi('achievements', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Achievements published!');
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
            await togglePublishApi('achievements', 0);
            setIsPublished(false);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => setContent(prev => ({ ...prev, [field]: value }));

    // ── Achievement entries ──
    const addAchievement = () => {
        const newItem = { id: `ach-${Date.now()}`, title: '', name: '', designation: '', quote: '', year: '', category: 'Academic', photo: '' };
        updateField('achievements', [newItem, ...content.achievements]);
    };

    const updateAchievement = (id, field, value) => {
        updateField('achievements', content.achievements.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const removeAchievement = (id) => {
        updateField('achievements', content.achievements.filter(a => a.id !== id));
    };

    const moveAchievement = (idx, dir) => {
        updateField('achievements', moveItem(content.achievements, idx, dir));
    };

    const onAchievementPhotoSelected = (id, file) => {
        setCropTarget({ mode: 'achievement', id, src: URL.createObjectURL(file) });
    };

    // ── Certifications ──
    const addCertification = () => {
        updateField('certifications', [{ id: `cert-${Date.now()}`, image: '', title: '', info: '' }, ...content.certifications]);
    };

    const updateCertification = (id, field, value) => {
        updateField('certifications', content.certifications.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const removeCertification = (id) => {
        updateField('certifications', content.certifications.filter(c => c.id !== id));
    };

    const moveCertification = (idx, dir) => {
        updateField('certifications', moveItem(content.certifications, idx, dir));
    };

    const onCertImageSelected = (id, file) => {
        setCropTarget({ mode: 'cert', id, src: URL.createObjectURL(file) });
    };

    // ── Crop confirm handler — shared by achievement photos and certification images ──
    const onCropConfirmed = async (croppedFile) => {
        const target = cropTarget;
        setCropTarget(null);
        const uploadKey = target.mode === 'cert' ? `cert-${target.id}` : target.id;
        setUploading(prev => ({ ...prev, [uploadKey]: true }));
        try {
            const res = await uploadContentImageApi(croppedFile);
            if (target.mode === 'cert') {
                updateCertification(target.id, 'image', res.data.url);
                toast.success('Certificate uploaded');
            } else {
                updateAchievement(target.id, 'photo', res.data.url);
                toast.success('Photo uploaded');
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload');
        } finally {
            setUploading(prev => ({ ...prev, [uploadKey]: false }));
        }
    };

    const inputStyle = {
        width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0',
        borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'system-ui, sans-serif',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
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
                .ach-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 700px) {
                    .ach-photo-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 480px) {
                    .ach-title-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .ach-hero-inner { gap: 12px !important; }
                    .ach-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .ach-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .ach-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .ach-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .ach-status-badge { padding: 4px 9px !important; }
                    .ach-status-badge span { font-size: 9.5px !important; }
                    .ach-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }

                    /* ── Certifications — 4-per-row leaves almost no room on a phone; 2-per-row
                       compact cards instead ── */
                    .ach-cert-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
                    .ach-cert-card-photo { height: 90px !important; }
                    .ach-cert-card-body { padding: 8px !important; gap: 5px !important; }
                    .ach-cert-card-body input { font-size: 11px !important; padding: 7px 8px !important; }
                }
                input[type=text]:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .ach-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .ach-hero-orb { animation: drift1 9s ease-in-out infinite; }
                .ach-card { animation: fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.25s ease; }
                .ach-card:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(15,23,42,0.10); border-color: ${hexToRgba(tc.primary, 0.15)}; }
                .ach-badge { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700; color: #fff; background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary}); box-shadow: 0 3px 8px ${hexToRgba(tc.primary, 0.3)}; flex-shrink: 0; }
                .ach-remove-btn { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, color 0.2s ease; }
                .ach-remove-btn:hover { background: #ef4444 !important; color: #fff !important; transform: rotate(90deg) scale(1.05); }
                .ach-photobox { transition: border-color 0.2s ease, background 0.2s ease; }
                .ach-photobox:hover { border-color: ${tc.primary} !important; background: ${hexToRgba(tc.primary, 0.04)} !important; }
                .ach-addbtn { transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; }
                .ach-addbtn:hover { transform: translateY(-1px); background: ${hexToRgba(tc.primary, 0.05)}; box-shadow: 0 4px 14px ${hexToRgba(tc.primary, 0.14)}; }
                .ach-cert-addbtn { transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease; }
                .ach-cert-addbtn:hover { border-color: ${tc.primary} !important; color: ${tc.primary} !important; background: ${hexToRgba(tc.primary, 0.04)} !important; }
                .ach-cert-card { animation: fadeInUp 0.4s ease both; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease; overflow: hidden; }
                .ach-cert-card:hover { transform: translateY(-4px); box-shadow: 0 12px 26px rgba(15,23,42,0.12); }
                .ach-cert-img { transition: transform 0.45s cubic-bezier(0.16,1,0.3,1); }
                .ach-cert-card:hover .ach-cert-img { transform: scale(1.08); }
                .ach-section-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary}); margin-right: 8px; }
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
                            <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / Pages / Achievements</span>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Achievements & Laurels</h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                            Showcase student olympiads, sports trophies, academic honors, and certificates.
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Hall of Fame</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.achievements?.length || 0} Achievements`}</p>
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Status</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'Public Honors Live'}</p>
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
                        moduleKey="achievements"
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

                {/* Heading + Description */}
                <div className="ach-section" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Heading</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)} placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: content.headingItalic ? 'italic' : 'normal' }} />
                            <ItalicToggle active={!!content.headingItalic} onToggle={() => updateField('headingItalic', !content.headingItalic)} />
                        </div>
                        <HeadingStyleField
                            color={content.headingColor} onColorChange={val => updateField('headingColor', val)}
                            font={content.headingFont} onFontChange={val => updateField('headingFont', val)}
                        />
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Description</label>
                        <RichTextEditor value={content.description} onChange={val => updateField('description', val)} placeholder="A brief overview of the school's achievements..." minHeight="120px"
                            maxWidth="1000px" fontSize="15px" fontFamily="'Inter', system-ui, sans-serif" />
                    </div>
                    <div style={{ paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                        <label style={labelStyle}>Section Header (shown below the top banner)</label>
                        <input type="text" value={content.subHeading} onChange={e => updateField('subHeading', e.target.value)}
                            placeholder="Enter Section Header Text" style={inputStyle} />
                        <p style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '5px' }}>Leave blank to hide this section on the public page.</p>
                    </div>
                </div>

                {/* Achievement Entries */}
                <div className="ach-section" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}><span className="ach-section-dot"></span>Achievement Entries <span style={{ color: '#94a3b8', fontWeight: 400 }}>({content.achievements.length})</span></p>
                        <button className="ach-addbtn" onClick={addAchievement} style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                            + Add Achievement
                        </button>
                    </div>

                    {content.achievements.length === 0 && (
                        <div style={{ background: '#ffffff', border: '1.5px dashed #e5e7eb', borderRadius: '18px', padding: '2.5rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '13px', color: '#94a3b8' }}>No achievements added yet</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {content.achievements.map((a, idx) => {
                            const photoKey = a.id;
                            return (
                                <div key={a.id} className="ach-card" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)', animationDelay: `${Math.min(idx, 8) * 0.05}s` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span className="ach-badge">{idx + 1}</span>
                                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{a.name || 'New Achievement'}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <ReorderButtons index={idx} length={content.achievements.length} onMove={moveAchievement} vertical={false} />
                                            <button className="ach-remove-btn" onClick={() => removeAchievement(a.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
                                        </div>
                                    </div>

                                    <div className="ach-photo-grid" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px' }}>
                                        {/* Photo */}
                                        <div>
                                            <label style={labelStyle}>Photo</label>
                                            <div className="ach-photobox" onClick={() => document.getElementById(`ach-photo-${a.id}`).click()}
                                                style={{ width: '100%', height: '220px', borderRadius: '14px', border: a.photo ? '1px solid #e5e7eb' : '1.5px dashed #e5e7eb', boxShadow: a.photo ? '0 6px 18px rgba(15,23,42,0.08)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: a.photo ? 'transparent' : '#fafafa' }}>
                                                {uploading[photoKey] ? (
                                                    <div style={{ width: '22px', height: '22px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                ) : a.photo ? (
                                                    <img src={a.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Click to upload</span>
                                                )}
                                            </div>
                                            <input id={`ach-photo-${a.id}`} type="file" accept="image/*"
                                                onChange={e => { const f = e.target.files[0]; if (f) onAchievementPhotoSelected(a.id, f); e.target.value = ''; }}
                                                style={{ display: 'none' }} />
                                            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>Portrait photo works best · JPG, PNG, WEBP · Max 1MB</p>
                                        </div>

                                        {/* Fields */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                                <div>
                                                    <label style={labelStyle}>Person Name</label>
                                                    <input type="text" value={a.name} onChange={e => updateAchievement(a.id, 'name', e.target.value)} placeholder="Enter Person Name" style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Designation / Class</label>
                                                    <input type="text" value={a.designation} onChange={e => updateAchievement(a.id, 'designation', e.target.value)} placeholder="Enter Designation / Class" style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Year</label>
                                                    <input type="text" value={a.year} onChange={e => updateAchievement(a.id, 'year', e.target.value)} placeholder="Enter Year" style={inputStyle} />
                                                </div>
                                            </div>

                                            <div className="ach-title-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '10px' }}>
                                                <div>
                                                    <label style={labelStyle}>Achievement Title</label>
                                                    <input type="text" value={a.title} onChange={e => updateAchievement(a.id, 'title', e.target.value)} placeholder="Enter Achievement Title" style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Category</label>
                                                    <select value={a.category} onChange={e => updateAchievement(a.id, 'category', e.target.value)} style={inputStyle}>
                                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={labelStyle}>Description / Quote</label>
                                                <RichTextEditor value={a.quote} onChange={val => updateAchievement(a.id, 'quote', val)} placeholder="Write about the achievement in detail..." minHeight="110px"
                                                    maxWidth="850px" fontSize="16.5px" fontFamily="'Inter', system-ui, sans-serif" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Certifications */}
                <div className="ach-section" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}><span className="ach-section-dot"></span>Certifications</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>Upload certificate images with basic info — shown in a grid. Landscape (4:3) works best · JPG, PNG, WEBP · Max 1MB each.</p>
                    <button className="ach-cert-addbtn" onClick={addCertification} style={{ width: '100%', padding: '11px', background: 'transparent', border: '1.5px dashed #e5e7eb', borderRadius: '12px', fontSize: '13px', color: '#64748b', cursor: 'pointer', marginBottom: '1rem' }}>
                        + Add Certification
                    </button>
                    <div className="ach-cert-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
                        {content.certifications.map((c, ci) => (
                            <div key={c.id} className="ach-cert-card" style={{ border: '1px solid #f1f5f9', borderRadius: '14px', animationDelay: `${Math.min(ci, 8) * 0.05}s` }}>
                                <div className="ach-cert-card-photo" onClick={() => document.getElementById(`cert-img-${c.id}`).click()}
                                    style={{ height: '130px', background: '#fafbfc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {uploading[`cert-${c.id}`] ? (
                                        <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    ) : c.image ? (
                                        <img className="ach-cert-img" src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Upload</span>
                                    )}
                                </div>
                                <input id={`cert-img-${c.id}`} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) onCertImageSelected(c.id, f); e.target.value = ''; }} style={{ display: 'none' }} />
                                <div className="ach-cert-card-body" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <input type="text" value={c.title} onChange={e => updateCertification(c.id, 'title', e.target.value)} placeholder="Title" style={{ ...inputStyle, fontSize: '12px', padding: '8px 10px' }} />
                                    <input type="text" value={c.info} onChange={e => updateCertification(c.id, 'info', e.target.value)} placeholder="Basic info" style={{ ...inputStyle, fontSize: '12px', padding: '8px 10px' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <ReorderButtons index={ci} length={content.certifications.length} onMove={moveCertification} vertical={false} />
                                        <button onClick={() => removeCertification(c.id)} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Crop Modal — freeform, adjustable from every side */}
            {cropTarget && (
                <ImageCropModal
                    imageSrc={cropTarget.src}
                    aspect={null}
                    onCancel={() => setCropTarget(null)}
                    onCropComplete={onCropConfirmed}
                />
            )}
        </>
    );
};

export default Achievements;