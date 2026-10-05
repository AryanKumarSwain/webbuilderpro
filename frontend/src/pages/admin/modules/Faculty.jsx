import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import ImageCropModal from '../../../components/common/ImageCropModal';
import ReorderButtons from '../../../components/common/ReorderButtons';
import useSchoolStore from '../../../store/schoolStore';
import { moveItem } from '../../../utils/reorder';
import { CropIcon, loadCropSrc } from '../../../components/common/ImageThumbnailCard';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const CROP_ASPECTS = { member: null };

const defaultContent = { members: [] };

const Faculty = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [uploading, setUploading] = useState({});
    const [cropTarget, setCropTarget] = useState(null); // { mode: 'banner' | 'member', id?, src }

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('faculty');
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
            await saveModuleContentApi('faculty', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Faculty published! 🎉');
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
            await togglePublishApi('faculty', 0);
            setIsPublished(false);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const addMember = () => {
    setContent(prev => ({
        ...prev,
        members: [{ id: `m-${Date.now()}`, photo: '', name: '', designation: '', qualification: '', experience: '', level: 'general', udiseCode: '' }, ...prev.members]
    }));
};

    const updateMember = (id, field, value) => {
        setContent(prev => ({
            ...prev,
            members: prev.members.map(m => m.id === id ? { ...m, [field]: value } : m)
        }));
    };

    const removeMember = (id) => {
        setContent(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
    };

    const moveMember = (idx, dir) => {
        setContent(prev => ({ ...prev, members: moveItem(prev.members, idx, dir) }));
    };

    const onCropConfirmed = async (croppedFile) => {
        const target = cropTarget;
        setCropTarget(null);
        setUploading(prev => ({ ...prev, [target.id]: true }));
        try {
            const res = await uploadContentImageApi(croppedFile);
            updateMember(target.id, 'photo', res.data.url);
            toast.success('Photo uploaded!');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload');
        } finally {
            setUploading(prev => ({ ...prev, [target.id]: false }));
        }
    };

    const inputStyle = {
        width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0',
        borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none',
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
                .fac-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 640px) {
                    .fac-member-grid { grid-template-columns: 1fr !important; }
                    .fac-quals-grid { grid-template-columns: 1fr 1fr !important; }
                }
                .fac-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .fac-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .fac-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .fac-hero-inner { gap: 12px !important; }
                    .fac-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .fac-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .fac-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .fac-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .fac-status-badge { padding: 4px 9px !important; }
                    .fac-status-badge span { font-size: 9.5px !important; }
                    .fac-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
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
                            <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / Pages / Faculty</span>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Faculty & Department Staff</h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                            Showcase your inspiring educators, qualifications, teaching experience, and leadership.
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Faculty Members</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.members?.length || 0} Teachers Listed`}</p>
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Staff Profiles</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'Verified Educators'}</p>
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
                        moduleKey="faculty"
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

                {/* Add Faculty Member */}
                <div style={{ display: 'flex', marginBottom: '1.75rem' }}>
                    <button onClick={addMember}
                        style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                        + Add Faculty Member
                    </button>
                </div>

                {/* Members */}
                <div className="fac-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {content.members.map((m, idx) => (
                        <div key={m.id} style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div className="fac-member-grid" style={{ display: 'grid', gridTemplateColumns: '26px 110px 1fr', gap: '20px' }}>
                                {/* Order */}
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <ReorderButtons index={idx} length={content.members.length} onMove={moveMember} />
                                </div>
                                {/* Photo */}
                                <div>
                                    <div onClick={() => document.getElementById(`photo-${m.id}`).click()}
                                        style={{ position: 'relative', width: '110px', height: '110px', borderRadius: '12px', border: m.photo ? '1px solid #e2e8f0' : '1.5px dashed #e2e8f0', boxShadow: m.photo ? '0 6px 18px rgba(15,23,42,0.08)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: m.photo ? 'transparent' : '#fafafa' }}>
                                        {uploading[m.id] ? (
                                            <div style={{ width: '22px', height: '22px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        ) : m.photo ? (
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button
                                                    type="button"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const crop = await loadCropSrc(m.photo);
                                                        setCropTarget({ mode: 'member', id: m.id, src: crop });
                                                    }}
                                                    style={{
                                                        position: 'absolute', top: '5px', left: '5px',
                                                        padding: '3px 7px', borderRadius: '5px',
                                                        background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)',
                                                        color: '#fff', fontSize: '9.5px', fontWeight: 600,
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', zIndex: 2
                                                    }}
                                                >
                                                    <CropIcon size={11} color="#fff" />
                                                    <span>Recrop</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateMember(m.id, 'photo', '');
                                                    }}
                                                    style={{
                                                        position: 'absolute', top: '5px', right: '5px',
                                                        width: '20px', height: '20px', borderRadius: '50%',
                                                        background: 'rgba(239,68,68,0.85)',
                                                        color: '#fff', border: 'none', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', zIndex: 2
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>📷 Photo</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'center', lineHeight: 1.4 }}>Square photo · Max 1MB</p>
                                </div>
                                <input id={`photo-${m.id}`} type="file" accept="image/*"
                                    onChange={e => {
                                        const f = e.target.files[0];
                                        e.target.value = '';
                                        if (f) setCropTarget({ mode: 'member', id: m.id, src: URL.createObjectURL(f) });
                                    }}
                                    style={{ display: 'none' }} />

                                {/* Fields */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
    <div>
        <label style={labelStyle}>Name</label>
        <input className="fac-input" type="text" value={m.name} onChange={e => updateMember(m.id, 'name', e.target.value)} placeholder="Enter Full Name" style={inputStyle} />
    </div>
    <div>
        <label style={labelStyle}>Designation / Subject</label>
        <input className="fac-input" type="text" value={m.designation} onChange={e => updateMember(m.id, 'designation', e.target.value)} placeholder="Enter Designation / Subject" style={inputStyle} />
    </div>
</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
    <div>
        <label style={labelStyle}>Teaches At</label>
        <select className="fac-input" value={m.level || 'general'} onChange={e => updateMember(m.id, 'level', e.target.value)} style={inputStyle}>
            <option value="general">General (All Levels)</option>
            <option value="pgt">PGT</option>
            <option value="tgt">TGT</option>
            <option value="prt">PRT</option>
            <option value="ntt">NTT</option>
        </select>
    </div>
    <div>
        <label style={labelStyle}>Udise National Code/ Oasis ID</label>
        <input className="fac-input" type="text" value={m.udiseCode || ''} onChange={e => updateMember(m.id, 'udiseCode', e.target.value)} placeholder="Enter Udise National Code/ Oasis ID" style={inputStyle} />
    </div>
</div>
                                    <div className="fac-quals-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 48px', gap: '10px' }}>
                                        <div>
                                            <label style={labelStyle}>Qualification</label>
                                            <input className="fac-input" type="text" value={m.qualification} onChange={e => updateMember(m.id, 'qualification', e.target.value)} placeholder="Enter Qualification" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Experience</label>
                                            <input className="fac-input" type="text" value={m.experience} onChange={e => updateMember(m.id, 'experience', e.target.value)} placeholder="Enter Experience" style={inputStyle} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button onClick={() => removeMember(m.id)} style={{ width: '100%', height: '38px', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>×</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {cropTarget && (
                <ImageCropModal
                    imageSrc={cropTarget.src}
                    aspect={CROP_ASPECTS[cropTarget.mode]}
                    onCancel={() => setCropTarget(null)}
                    onCropComplete={onCropConfirmed}
                />
            )}
        </>
    );
};

export default Faculty;