import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import ImageCropModal from '../../../components/common/ImageCropModal';
import ReorderButtons from '../../../components/common/ReorderButtons';
import { moveItem } from '../../../utils/reorder';
import useSchoolStore from '../../../store/schoolStore';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = { heading: '', headingItalic: false, headingColor: '', headingFont: '', description: '', sections: [] };

const ParentsCorner = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState({});
    const [cropTarget, setCropTarget] = useState(null); // { idx, src }

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('parentsCorner');
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
            await saveModuleContentApi('parentsCorner', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Parents Corner published! 🎉');
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
            await togglePublishApi('parentsCorner', 0);
            setIsPublished(false);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => setContent(prev => ({ ...prev, [field]: value }));

    const addSection = () => updateField('sections', [...content.sections, {
        id: `pc-${Date.now()}`, heading: '', headingItalic: false, headingColor: '', headingFont: '', headingSize: '', photo: '', description: '',
    }]);
    const updateSection = (idx, field, value) => {
        const updated = [...content.sections];
        updated[idx] = { ...updated[idx], [field]: value };
        updateField('sections', updated);
    };
    const removeSection = (idx) => updateField('sections', content.sections.filter((_, i) => i !== idx));
    const moveSection = (idx, dir) => updateField('sections', moveItem(content.sections, idx, dir));

    const handlePhotoSelected = (idx, file) => setCropTarget({ idx, src: URL.createObjectURL(file) });
    const handlePhotoCropped = async (croppedFile) => {
        const idx = cropTarget.idx;
        setCropTarget(null);
        setUploadingPhoto(prev => ({ ...prev, [idx]: true }));
        try {
            const res = await uploadContentImageApi(croppedFile);
            updateSection(idx, 'photo', res.data.url);
        } catch (e) { toast.error(e?.response?.data?.message || 'Failed to upload photo'); }
        finally { setUploadingPhoto(prev => ({ ...prev, [idx]: false })); }
    };

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
                .pc-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .pc-hero-inner { gap: 12px !important; }
                    .pc-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .pc-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .pc-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .pc-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .pc-status-badge { padding: 4px 9px !important; }
                    .pc-status-badge span { font-size: 9.5px !important; }
                    .pc-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                }
                .pc-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .pc-section-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary}); margin-right: 8px; }
                .pc-block { transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease; animation: fadeInUp 0.3s ease forwards; }
                .pc-block:hover { border-color: ${hexToRgba(tc.primary, 0.3)} !important; box-shadow: 0 6px 20px rgba(15,23,42,0.06); }
                .pc-block-num { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1); }
                .pc-block:hover .pc-block-num { transform: scale(1.08) rotate(-4deg); }
                .pc-add-block:hover { border-color: ${tc.primary} !important; background: ${tc.light} !important; transform: translateY(-1px); }
                .pc-add-block { transition: all 0.2s ease; }
                .pc-photobox { transition: border-color 0.2s ease, background 0.2s ease; }
                .pc-photobox:hover { border-color: ${tc.primary} !important; background: ${hexToRgba(tc.primary, 0.04)} !important; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="pc-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="pc-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div>
                                <p className="pc-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Parents Corner</p>
                                <h1 className="pc-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Parents Corner</h1>
                                <p className="pc-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                    A dedicated space for parents — uniform details, school guidelines, and anything else they should know. Add as many photo + text sections as you need.
                                </p>
                            </div>
                            <div className="pc-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{isPublished ? 'Published' : 'Draft'}</span>
                            </div>
                        </div>
                        <div className="pc-hero-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <ModuleActionButtons
                                tc={tc}
                                moduleKey="parentsCorner"
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

                <div className="pc-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Top section — heading + description */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}><span className="pc-section-dot"></span>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="pc-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
                                    placeholder="Enter Heading (e.g. Parents Corner)" style={{ ...inputStyle, fontStyle: content.headingItalic ? 'italic' : 'normal' }} />
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
                                placeholder="A short intro for parents about this page..." minHeight="120px" fontSize="15px" />
                        </div>
                    </div>

                    {/* Sections — repeatable heading + photo + description blocks */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}><span className="pc-section-dot"></span>Sections</label>
                            <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                                Add a section for each topic — Uniform Details, General Guidelines, Books & Stationery, Transport, and so on. Each gets its own heading, an optional photo, and rich text.
                            </p>
                        </div>

                        {content.sections.length === 0 ? (
                            <div style={{ padding: '2.5rem', textAlign: 'center', border: '1.5px dashed #e2e8f0', borderRadius: '12px' }}>
                                <p style={{ fontSize: '13px', color: '#94a3b8' }}>No sections yet — click "+ Add Section" to start with Uniform Details or Guidelines.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {content.sections.map((section, idx) => (
                                    <div key={section.id} className="pc-block" style={{ background: '#fafbfc', border: '1px solid #eef1f6', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div className="pc-block-num" style={{ width: '30px', height: '30px', borderRadius: '9px', background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, color: '#fff', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 10px ${hexToRgba(tc.primary, 0.3)}` }}>
                                                {String(idx + 1).padStart(2, '0')}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <ReorderButtons index={idx} length={content.sections.length} onMove={moveSection} vertical={false} />
                                                <button type="button" onClick={() => removeSection(idx)}
                                                    style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px', flexShrink: 0 }}>×</button>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Heading</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input className="pc-input" type="text" value={section.heading} onChange={e => updateSection(idx, 'heading', e.target.value)}
                                                    placeholder="Enter Heading (e.g. Uniform Details)" style={{ ...inputStyle, fontStyle: section.headingItalic ? 'italic' : 'normal' }} />
                                                <ItalicToggle active={!!section.headingItalic} onToggle={() => updateSection(idx, 'headingItalic', !section.headingItalic)} />
                                            </div>
                                            <HeadingStyleField
                                                color={section.headingColor} onColorChange={val => updateSection(idx, 'headingColor', val)}
                                                font={section.headingFont} onFontChange={val => updateSection(idx, 'headingFont', val)}
                                                size={section.headingSize} onSizeChange={val => updateSection(idx, 'headingSize', val)}
                                            />
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Photo (optional)</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <label className="pc-photobox" onClick={e => { if (uploadingPhoto[idx]) e.preventDefault(); }}
                                                    style={{ width: '96px', height: '96px', borderRadius: '12px', flexShrink: 0, border: section.photo ? '1px solid #e2e8f0' : '1.5px dashed #cbd5e1', boxShadow: section.photo ? '0 6px 18px rgba(15,23,42,0.08)' : 'none', background: section.photo ? 'transparent' : '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                    {uploadingPhoto[idx] ? (
                                                        <div style={{ width: '18px', height: '18px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                    ) : section.photo ? (
                                                        <img src={section.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span style={{ fontSize: '10.5px', color: '#94a3b8', textAlign: 'center', padding: '0 6px' }}>+ Upload</span>
                                                    )}
                                                    <input type="file" accept="image/*" style={{ display: 'none' }}
                                                        onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handlePhotoSelected(idx, f); }} />
                                                </label>
                                                {section.photo && (
                                                    <button type="button" onClick={() => updateSection(idx, 'photo', '')}
                                                        style={{ fontSize: '11.5px', fontWeight: 600, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                                                        Remove Photo
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Description</label>
                                            <RichTextEditor value={section.description} onChange={val => updateSection(idx, 'description', val)}
                                                placeholder="Explain this section for parents..." minHeight="100px" fontSize="14px" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button type="button" className="pc-add-block" onClick={addSection}
                            style={{ padding: '13px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                            + Add Section
                        </button>
                    </div>
                </div>
            </div>
            {cropTarget && (
                <ImageCropModal
                    imageSrc={cropTarget.src}
                    aspect={null}
                    onCancel={() => setCropTarget(null)}
                    onCropComplete={handlePhotoCropped}
                />
            )}
        </>
    );
};

export default ParentsCorner;
