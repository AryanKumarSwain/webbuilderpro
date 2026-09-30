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

const defaultContent = { heading: '', description: '', alumni: [] };

const Alumni = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [uploading, setUploading] = useState({});

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('alumni');
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
            await saveModuleContentApi('alumni', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Alumni page published! 🎉');
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
            await togglePublishApi('alumni', 0);
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
                .alumni-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 600px) {
                    .alumni-photo-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .alumni-hero-inner { gap: 12px !important; }
                    .alumni-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .alumni-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .alumni-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .alumni-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .alumni-status-badge { padding: 4px 9px !important; }
                    .alumni-status-badge span { font-size: 9.5px !important; }
                    .alumni-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                }
                .alumni-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .alumni-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .alumni-hero-orb { animation: drift1 9s ease-in-out infinite; }
                .alumni-card { animation: fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.25s ease; }
                .alumni-card:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(15,23,42,0.10); border-color: ${hexToRgba(tc.primary, 0.15)}; }
                .alumni-badge { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700; color: #fff; background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary}); box-shadow: 0 3px 8px ${hexToRgba(tc.primary, 0.3)}; flex-shrink: 0; }
                .alumni-remove-btn { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, color 0.2s ease; }
                .alumni-remove-btn:hover { background: #ef4444 !important; color: #fff !important; transform: rotate(90deg) scale(1.05); }
                .alumni-photobox { transition: border-color 0.2s ease, background 0.2s ease; }
                .alumni-photobox:hover { border-color: ${tc.primary} !important; background: ${hexToRgba(tc.primary, 0.04)} !important; }
                .alumni-addbtn { transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
                .alumni-addbtn:hover { transform: translateY(-2px); background: ${hexToRgba(tc.primary, 0.06)} !important; box-shadow: 0 8px 20px ${hexToRgba(tc.primary, 0.2)}; }
                .alumni-section-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary}); margin-right: 8px; }
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
                            <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / Pages / Alumni</span>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Distinguished Alumni</h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                            Highlight notable alumni — their inspiring university journeys and global career achievements.
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
                    <div style={{
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Alumni Network</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.alumni?.length || 0} Profiles Added`}</p>
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Reach</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'Global Presence'}</p>
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
                        moduleKey="alumni"
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

                <div className="alumni-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Top section */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}><span className="alumni-section-dot"></span>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="alumni-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
                                    placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: content.headingItalic ? 'italic' : 'normal' }} />
                                <ItalicToggle active={!!content.headingItalic} onToggle={() => updateField('headingItalic', !content.headingItalic)} />
                            </div>
                            <HeadingStyleField
                                color={content.headingColor} onColorChange={val => updateField('headingColor', val)}
                                font={content.headingFont} onFontChange={val => updateField('headingFont', val)}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <RichTextEditor value={content.description} onChange={val => updateField('description', val)}
                                placeholder="A note about our alumni network, their achievements, and how they stay connected..." minHeight="120px"
                                maxWidth="818px" fontSize="18px" fontFamily="'Playfair Display', Georgia, serif" />
                        </div>
                    </div>

                    {/* Add Alumnus */}
                    <div style={{ display: 'flex' }}>
                        <button className="alumni-addbtn" onClick={() => updateField('alumni', [{
                            id: `alum-${Date.now()}`, photo: '', name: '', batchYear: '', achievementHeadline: '', testimonial: '', linkedinUrl: ''
                        }, ...content.alumni])}
                            style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                            + Add Alumnus
                        </button>
                    </div>

                    {/* Alumni list */}
                    {content.alumni.map((al, idx) => (
                        <AlumnusCard key={al.id} alumnus={al} index={idx} length={content.alumni.length}
                            onMove={(i, dir) => updateField('alumni', moveItem(content.alumni, i, dir))}
                            onUpdate={(field, val) => {
                                const updated = [...content.alumni];
                                updated[idx] = { ...updated[idx], [field]: val };
                                updateField('alumni', updated);
                            }}
                            onRemove={() => updateField('alumni', content.alumni.filter((_, i) => i !== idx))}
                            onUploadPhoto={async (file) => {
                                setUploading(prev => ({ ...prev, [`alumnus-${al.id}`]: true }));
                                try {
                                    const res = await uploadContentImageApi(file);
                                    const updated = [...content.alumni];
                                    updated[idx] = { ...updated[idx], photo: res.data.url };
                                    updateField('alumni', updated);
                                } catch (e) { toast.error(e?.response?.data?.message || 'Failed to upload'); }
                                finally { setUploading(prev => ({ ...prev, [`alumnus-${al.id}`]: false })); }
                            }}
                            uploading={uploading[`alumnus-${al.id}`]}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

// ── Alumnus Card ──
const AlumnusCard = ({ alumnus, index, length, onMove, onUpdate, onRemove, onUploadPhoto, uploading }) => {
    const { tc } = useSchoolStore();
    const [cropSrc, setCropSrc] = useState(null);
    const inputStyle = { width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div className="alumni-card" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', animationDelay: `${Math.min(index, 8) * 0.05}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="alumni-badge">{index + 1}</span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{alumnus.name || 'New Alumnus'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ReorderButtons index={index} length={length} onMove={onMove} vertical={false} />
                    <button className="alumni-remove-btn" onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
                </div>
            </div>

            <div className="alumni-photo-grid" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem' }}>
                {/* Photo upload */}
                <div>
                    <label style={labelStyle}>Photo</label>
                    <div className="alumni-photobox" onClick={() => document.getElementById(`alumnus-photo-${alumnus.id}`).click()}
                        style={{ height: '140px', borderRadius: '12px', border: alumnus.photo ? '1px solid #e2e8f0' : '1.5px dashed #e2e8f0', boxShadow: alumnus.photo ? '0 6px 18px rgba(15,23,42,0.08)' : 'none', background: alumnus.photo ? 'transparent' : '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {uploading ? (
                            <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        ) : alumnus.photo ? (
                            <img src={alumnus.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>👤 Upload</span>
                        )}
                    </div>
                    <input id={`alumnus-photo-${alumnus.id}`} type="file" accept="image/*"
                        onChange={e => {
                            const f = e.target.files[0];
                            e.target.value = '';
                            if (f) setCropSrc(URL.createObjectURL(f));
                        }} style={{ display: 'none' }} />
                    <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>Portrait photo works best · JPG, PNG, WEBP · Max 1MB</p>
                </div>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Name</label>
                            <input className="alumni-input" type="text" value={alumnus.name} onChange={e => onUpdate('name', e.target.value)} placeholder="Enter Full Name" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Batch Year (optional)</label>
                            <input className="alumni-input" type="text" value={alumnus.batchYear} onChange={e => onUpdate('batchYear', e.target.value)} placeholder="Enter Batch Year" style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Achievement Headline</label>
                        <input className="alumni-input" type="text" value={alumnus.achievementHeadline} onChange={e => onUpdate('achievementHeadline', e.target.value)}
                            placeholder="Enter Achievement Headline" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Testimonial</label>
                        <RichTextEditor value={alumnus.testimonial} onChange={val => onUpdate('testimonial', val)}
                            placeholder="Enter Testimonial" minHeight="90px" fontSize="13px" />
                    </div>
                    <div>
                        <label style={labelStyle}>LinkedIn URL (optional)</label>
                        <input className="alumni-input" type="text" value={alumnus.linkedinUrl} onChange={e => onUpdate('linkedinUrl', e.target.value)} placeholder="Enter LinkedIn URL" style={inputStyle} />
                    </div>
                </div>
            </div>

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={null}
                    onCancel={() => setCropSrc(null)}
                    onCropComplete={(croppedFile) => { setCropSrc(null); onUploadPhoto(croppedFile); }}
                />
            )}
        </div>
    );
};

export default Alumni;