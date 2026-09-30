import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadPdfApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import ImageSizeHint from '../../../components/admin/ImageSizeHint';
import ReorderButtons from '../../../components/common/ReorderButtons';
import { moveItem } from '../../../utils/reorder';
import useSchoolStore from '../../../store/schoolStore';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = { heading: '', description: '', formPdfUrl: '', formLinkUrl: '', procedureBlocks: [] };

const AdmissionProcedure = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [uploadingForm, setUploadingForm] = useState(false);

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('admissionProcedure');
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
            await saveModuleContentApi('admissionProcedure', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Admission Procedure published! 🎉');
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
            await togglePublishApi('admissionProcedure', 0);
            setIsPublished(false);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => setContent(prev => ({ ...prev, [field]: value }));

    const handleFormUpload = async (file) => {
        setUploadingForm(true);
        try {
            const res = await uploadPdfApi(file);
            updateField('formPdfUrl', res.data.url);
        } catch (e) { toast.error(e?.response?.data?.message || 'Failed to upload'); }
        finally { setUploadingForm(false); }
    };

    const addProcedureBlock = () => updateField('procedureBlocks', [...content.procedureBlocks, {
        id: `pb-${Date.now()}`, heading: '', headingItalic: false, headingColor: '', headingFont: '', headingSize: '', description: '',
    }]);
    const updateProcedureBlock = (idx, field, value) => {
        const updated = [...content.procedureBlocks];
        updated[idx] = { ...updated[idx], [field]: value };
        updateField('procedureBlocks', updated);
    };
    const removeProcedureBlock = (idx) => updateField('procedureBlocks', content.procedureBlocks.filter((_, i) => i !== idx));

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
                .ap-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .ap-hero-inner { gap: 12px !important; }
                    .ap-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .ap-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .ap-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .ap-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .ap-status-badge { padding: 4px 9px !important; }
                    .ap-status-badge span { font-size: 9.5px !important; }
                    .ap-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                }
                .ap-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .ap-section-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary}); margin-right: 8px; }
                .ap-pdf { transition: border-color 0.2s ease, transform 0.2s ease; }
                .ap-pdf:hover { transform: translateY(-1px); }
                .ap-block { transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease; animation: fadeInUp 0.3s ease forwards; }
                .ap-block:hover { border-color: ${hexToRgba(tc.primary, 0.3)} !important; box-shadow: 0 6px 20px rgba(15,23,42,0.06); }
                .ap-block-num { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1); }
                .ap-block:hover .ap-block-num { transform: scale(1.08) rotate(-4deg); }
                .ap-add-block:hover { border-color: ${tc.primary} !important; background: ${tc.light} !important; transform: translateY(-1px); }
                .ap-add-block { transition: all 0.2s ease; }
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
                            <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / Pages / Admission Procedure</span>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Admission Procedure</h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                            Step-by-step admission steps, eligibility guidelines, form attachments, and parent instructions.
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Process Steps</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.sections?.length || 0} Steps Configured`}</p>
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Admission Form</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.formPdfUrl ? "Form PDF Active" : "No Form Attached"}`}</p>
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
                        moduleKey="admissionProcedure"
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

                <div className="ap-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Explain the Admission Procedure — repeatable heading + description blocks */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}><span className="ap-section-dot"></span>Explain Your Admission Procedure</label>
                            <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                                Add as many sections as you need — eligibility criteria, step-by-step process, documents required, fee timeline. Each gets its own heading and rich description, styled independently.
                            </p>
                        </div>

                        {content.procedureBlocks.length === 0 ? (
                            <div style={{ padding: '2.5rem', textAlign: 'center', border: '1.5px dashed #e2e8f0', borderRadius: '12px' }}>
                                <p style={{ fontSize: '13px', color: '#94a3b8' }}>No sections yet — click "+ Add Section" to explain your admission procedure to parents.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {content.procedureBlocks.map((block, idx) => (
                                    <div key={block.id} className="ap-block" style={{ background: '#fafbfc', border: '1px solid #eef1f6', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div className="ap-block-num" style={{ width: '30px', height: '30px', borderRadius: '9px', background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, color: '#fff', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 10px ${hexToRgba(tc.primary, 0.3)}` }}>
                                                {String(idx + 1).padStart(2, '0')}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <ReorderButtons index={idx} length={content.procedureBlocks.length} onMove={(i, dir) => updateField('procedureBlocks', moveItem(content.procedureBlocks, i, dir))} vertical={false} />
                                                <button type="button" onClick={() => removeProcedureBlock(idx)}
                                                    style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px', flexShrink: 0 }}>×</button>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Heading</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input className="ap-input" type="text" value={block.heading} onChange={e => updateProcedureBlock(idx, 'heading', e.target.value)}
                                                    placeholder="Enter Heading (e.g. Eligibility Criteria)" style={{ ...inputStyle, fontStyle: block.headingItalic ? 'italic' : 'normal' }} />
                                                <ItalicToggle active={!!block.headingItalic} onToggle={() => updateProcedureBlock(idx, 'headingItalic', !block.headingItalic)} />
                                            </div>
                                            <HeadingStyleField
                                                color={block.headingColor} onColorChange={val => updateProcedureBlock(idx, 'headingColor', val)}
                                                font={block.headingFont} onFontChange={val => updateProcedureBlock(idx, 'headingFont', val)}
                                                size={block.headingSize} onSizeChange={val => updateProcedureBlock(idx, 'headingSize', val)}
                                            />
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Description</label>
                                            <RichTextEditor value={block.description} onChange={val => updateProcedureBlock(idx, 'description', val)}
                                                placeholder="Explain this part of the admission procedure..." minHeight="100px" fontSize="14px" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button type="button" className="ap-add-block" onClick={addProcedureBlock}
                            style={{ padding: '13px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                            + Add Section
                        </button>
                    </div>

                    {/* Top section — heading + description */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}><span className="ap-section-dot"></span>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="ap-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
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
                                placeholder="A short intro about how admissions work at your school..." minHeight="120px" fontSize="15px" />
                        </div>
                    </div>

                    {/* Admission Form Attachment */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <label style={labelStyle}><span className="ap-section-dot"></span>Admission Form Attachment</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>PDF (optional)</label>
                                <label className="ap-pdf" style={{ display: 'block', padding: '11px 14px', border: content.formPdfUrl ? '1.5px solid #bbf7d0' : '1.5px dashed #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: content.formPdfUrl ? '#15803d' : '#64748b', background: content.formPdfUrl ? '#f0fdf4' : '#fafafa', textAlign: 'center' }}>
                                    {uploadingForm ? 'Uploading...' : content.formPdfUrl ? '✓ PDF uploaded — click to change' : '📄 Click to upload Admission Form PDF'}
                                    <input type="file" accept="application/pdf" style={{ display: 'none' }}
                                        onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleFormUpload(f); }} />
                                </label>
                                {content.formPdfUrl && !uploadingForm && (
                                    <button type="button" onClick={() => updateField('formPdfUrl', '')}
                                        style={{ marginTop: '6px', fontSize: '11.5px', fontWeight: 600, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                                        Remove PDF
                                    </button>
                                )}
                                <ImageSizeHint>Under 3MB. Parents download this directly to fill and submit.</ImageSizeHint>
                            </div>
                            <div>
                                <label style={labelStyle}>Or Link URL (optional)</label>
                                <input className="ap-input" type="text" value={content.formLinkUrl || ''} onChange={e => updateField('formLinkUrl', e.target.value)} placeholder="https://..." style={inputStyle} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdmissionProcedure;
