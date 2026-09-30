import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadPdfApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import ReorderButtons from '../../../components/common/ReorderButtons';
import ImageSizeHint from '../../../components/admin/ImageSizeHint';
import useSchoolStore from '../../../store/schoolStore';
import { moveItem } from '../../../utils/reorder';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = { heading: '', cardTitle: '', description: '', rows: [] };

const BookList = () => {
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
            const res = await getModuleContentApi('bookList');
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
            await saveModuleContentApi('bookList', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Book List published! 🎉');
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
            await togglePublishApi('bookList', 0);
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
                .bl-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .bl-hero-inner { gap: 12px !important; }
                    .bl-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .bl-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .bl-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .bl-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .bl-status-badge { padding: 4px 9px !important; }
                    .bl-status-badge span { font-size: 9.5px !important; }
                    .bl-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                }
                .bl-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .bl-row { animation: fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
                .bl-remove-btn { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, color 0.2s ease; }
                .bl-remove-btn:hover { background: #ef4444 !important; color: #fff !important; transform: rotate(90deg) scale(1.05); }
                .bl-addbtn { transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
                .bl-addbtn:hover { transform: translateY(-2px); background: ${hexToRgba(tc.primary, 0.06)} !important; box-shadow: 0 8px 20px ${hexToRgba(tc.primary, 0.2)}; }
                .bl-section-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, ${tc.primary}, ${tc.secondary}); margin-right: 8px; }
                .bl-pdf { transition: border-color 0.2s ease, transform 0.2s ease; }
                .bl-pdf:hover { transform: translateY(-1px); }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="bl-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="bl-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div>
                                <p className="bl-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Book List</p>
                                <h1 className="bl-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Book List</h1>
                                <p className="bl-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                    Class-wise textbook lists parents can view online — no download required.
                                </p>
                            </div>
                            <div className="bl-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{isPublished ? 'Published' : 'Draft'}</span>
                            </div>
                        </div>
                        <div className="bl-hero-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <ModuleActionButtons
                                tc={tc}
                                moduleKey="bookList"
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

                <div className="bl-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Top section — heading + card title + description */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}><span className="bl-section-dot"></span>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="bl-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
                                    placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: content.headingItalic ? 'italic' : 'normal' }} />
                                <ItalicToggle active={!!content.headingItalic} onToggle={() => updateField('headingItalic', !content.headingItalic)} />
                            </div>
                            <HeadingStyleField
                                color={content.headingColor} onColorChange={val => updateField('headingColor', val)}
                                font={content.headingFont} onFontChange={val => updateField('headingFont', val)}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Card Title (optional)</label>
                            <input className="bl-input" type="text" value={content.cardTitle} onChange={e => updateField('cardTitle', e.target.value)}
                                placeholder="Enter Card Title (e.g. Book List - Academic Year 2026-27)" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <RichTextEditor value={content.description} onChange={val => updateField('description', val)}
                                placeholder="A short note about the book list — where it applies, how to use it..." minHeight="120px" fontSize="15px" />
                        </div>
                    </div>

                    {/* Add Row */}
                    <div style={{ display: 'flex' }}>
                        <button className="bl-addbtn" onClick={() => updateField('rows', [...content.rows, {
                            id: `bl-${Date.now()}`, className: '', pdfUrl: '', linkUrl: ''
                        }])}
                            style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                            + Add Class
                        </button>
                    </div>

                    {/* Rows table */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                        {content.rows.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>No classes yet — click "+ Add Class" to add a book list entry.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {content.rows.map((row, idx) => (
                                    <div key={row.id} className="bl-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: idx < content.rows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <input type="text" value={row.className} onChange={e => {
                                            const updated = [...content.rows]; updated[idx] = { ...row, className: e.target.value }; updateField('rows', updated);
                                        }} placeholder="Enter Class Name (e.g. Learners, Class 5)" style={inputStyle} />

                                        <div>
                                            <label className="bl-pdf" style={{ display: 'block', padding: '10px 12px', border: row.pdfUrl ? '1.5px solid #bbf7d0' : '1.5px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '12.5px', color: row.pdfUrl ? '#15803d' : '#64748b', background: row.pdfUrl ? '#f0fdf4' : '#fafafa', textAlign: 'center' }}>
                                                {uploading[row.id] ? 'Uploading...' : row.pdfUrl ? '✓ PDF uploaded — click to change' : '📄 Upload PDF'}
                                                <input type="file" accept="application/pdf" style={{ display: 'none' }}
                                                    onChange={async e => {
                                                        const f = e.target.files[0]; e.target.value = '';
                                                        if (!f) return;
                                                        setUploading(prev => ({ ...prev, [row.id]: true }));
                                                        try {
                                                            const res = await uploadPdfApi(f);
                                                            const updated = [...content.rows]; updated[idx] = { ...row, pdfUrl: res.data.url }; updateField('rows', updated);
                                                        } catch (err) { toast.error(err?.response?.data?.message || 'Failed to upload'); }
                                                        finally { setUploading(prev => ({ ...prev, [row.id]: false })); }
                                                    }} />
                                            </label>
                                            {row.pdfUrl && !uploading[row.id] && (
                                                <button type="button" onClick={() => { const updated = [...content.rows]; updated[idx] = { ...row, pdfUrl: '' }; updateField('rows', updated); }}
                                                    style={{ marginTop: '4px', fontSize: '11px', fontWeight: 600, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                                                    Remove PDF
                                                </button>
                                            )}
                                        </div>

                                        <input type="text" value={row.linkUrl || ''} onChange={e => {
                                            const updated = [...content.rows]; updated[idx] = { ...row, linkUrl: e.target.value }; updateField('rows', updated);
                                        }} placeholder="Or Link URL (optional)" style={inputStyle} />

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ReorderButtons index={idx} length={content.rows.length} onMove={(i, dir) => updateField('rows', moveItem(content.rows, i, dir))} vertical={false} />
                                            <button className="bl-remove-btn" onClick={() => updateField('rows', content.rows.filter((_, i) => i !== idx))}
                                                style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px', flexShrink: 0 }}>×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {content.rows.length > 0 && (
                        <ImageSizeHint>PDF under 3MB. Parents open this directly in a new tab to view — it isn't force-downloaded.</ImageSizeHint>
                    )}
                </div>
            </div>
        </>
    );
};

export default BookList;
