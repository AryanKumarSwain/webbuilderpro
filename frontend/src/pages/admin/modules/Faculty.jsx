import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import ImageCropModal from '../../../components/common/ImageCropModal';
import ReorderButtons from '../../../components/common/ReorderButtons';
import useSchoolStore from '../../../store/schoolStore';
import { moveItem } from '../../../utils/reorder';
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
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="fac-hero-orb" style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div className="fac-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="fac-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div className="fac-hero-item">
                                <p className="fac-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Faculty</p>
                                <h1 className="fac-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Faculty Members</h1>
                                <p className="fac-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                    Showcase your teachers — photo, qualification and experience.
                                </p>
                            </div>
                            <div className="fac-hero-item fac-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{isPublished ? 'Published' : 'Draft'}</span>
                            </div>
                        </div>
                        <div className="fac-hero-item fac-hero-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
                                        style={{ width: '110px', height: '110px', borderRadius: '12px', border: m.photo ? '1px solid #e2e8f0' : '1.5px dashed #e2e8f0', boxShadow: m.photo ? '0 6px 18px rgba(15,23,42,0.08)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: m.photo ? 'transparent' : '#fafafa' }}>
                                        {uploading[m.id] ? (
                                            <div style={{ width: '22px', height: '22px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        ) : m.photo ? (
                                            <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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