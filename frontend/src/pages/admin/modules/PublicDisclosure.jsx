import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadPdfApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import useSchoolStore from '../../../store/schoolStore';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

// Default categories prefilled with the standard CBSE Mandatory Disclosure labels.
// 'info' categories = label + free-text details (admin just fills in the Details column).
// 'documents' categories = label + a PDF upload per row.
const defaultContent = {
    heading: '', description: '',
    disclosurePdf: { label: 'Mandatory Public Disclosure', pdfUrl: '' },
    categories: [
        {
            id: 'cat-a', name: 'General Information', type: 'info',
            rows: [
                { id: 'a1', label: 'Name of the School', details: '' },
                { id: 'a2', label: 'Affiliation No. (if applicable)', details: '' },
                { id: 'a3', label: 'School Code', details: '' },
                { id: 'a4', label: 'Complete Address with Pin Code', details: '' },
                { id: 'a5', label: 'Principal Name', details: '' },
                { id: 'a6', label: 'School Email ID', details: '' },
                { id: 'a7', label: 'Contact Details (Landline/Mobile)', details: '' },
            ],
        },
        {
            id: 'cat-b', name: 'Documents and Information', type: 'documents',
            rows: [
                { id: 'b1', label: 'Copies of Affiliation/Upgradation Letter and Recent Extension of Affiliation, if any', pdfUrl: '' },
                { id: 'b2', label: 'Copies of Societies/Trust/Company Registration/Renewal Certificate, as applicable', pdfUrl: '' },
                { id: 'b3', label: 'Copy of No Objection Certificate (NOC) Issued, if applicable, by the State Govt./UT', pdfUrl: '' },
                { id: 'b4', label: "Copies of Recognition Certificate under RTE Act, 2009, and it's renewal if applicable", pdfUrl: '' },
                { id: 'b5', label: 'Copy of Valid Building Safety Certificate', pdfUrl: '' },
                { id: 'b6', label: 'Copy of Valid Fire Safety Certificate', pdfUrl: '' },
            ],
        },
        {
            id: 'cat-c', name: 'Results and Academics', type: 'documents',
            rows: [
                { id: 'c1', label: 'Fee Structure of the School', pdfUrl: '' },
                { id: 'c2', label: 'Annual Academic Calendar', pdfUrl: '' },
                { id: 'c3', label: 'List of School Management Committee (SMC)', pdfUrl: '' },
                { id: 'c4', label: 'List of Parents Teachers Association (PTA) Members', pdfUrl: '' },
                { id: 'c5', label: 'Last Three-Year Result of the Board Examination as per Applicability', pdfUrl: '' },
            ],
        },
        {
            id: 'cat-d', name: 'Staff Details (Teaching)', type: 'info',
            rows: [
                { id: 'd1', label: 'Principal', details: '' },
                { id: 'd2', label: 'No. of Teachers (PGT / TGT / PRT)', details: '' },
                { id: 'd3', label: 'Teacher Section Ratio', details: '' },
                { id: 'd4', label: 'Details of Special Educator', details: '' },
                { id: 'd5', label: 'Details of Counsellor and Wellness Teacher', details: '' },
            ],
        },
        {
            id: 'cat-e', name: 'School Infrastructure', type: 'info',
            rows: [
                { id: 'e1', label: 'Total Campus Area of School in Square Metre', details: '' },
                { id: 'e2', label: 'No. and Size of Classroom in Square Metre', details: '' },
                { id: 'e3', label: 'No. and Size of Laboratories including Computer Labs in Square Metre', details: '' },
                { id: 'e4', label: 'Internet Facility (Y/N)', details: '' },
                { id: 'e5', label: 'No. of Girls Toilets', details: '' },
                { id: 'e6', label: 'No. of Boys Toilets', details: '' },
            ],
        },
    ],
};

// ── Migrates any previously-saved category shape into the current { rows: [...] } shape.
// Earlier versions of this module saved `documents: [{id,title,pdfUrl}]` instead of
// `rows: [{id,label,pdfUrl}]` — this keeps old saved data from crashing the new UI. ──
const normalizeCategories = (categories) => {
    if (!Array.isArray(categories)) return defaultContent.categories;
    return categories.map(cat => {
        if (Array.isArray(cat.rows)) return { type: 'documents', ...cat };
        if (Array.isArray(cat.documents)) {
            return {
                ...cat,
                type: cat.type || 'documents',
                rows: cat.documents.map(d => ({ id: d.id, label: d.title || d.label || '', pdfUrl: d.pdfUrl || '' })),
            };
        }
        return { ...cat, type: cat.type || 'documents', rows: [] };
    });
};

const PublicDisclosure = () => {
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
            const res = await getModuleContentApi('disclosure');
            if (res.data) {
                const merged = { ...defaultContent, ...res.data.content };
                merged.categories = normalizeCategories(res.data.content?.categories);
                if (!merged.disclosurePdf) merged.disclosurePdf = defaultContent.disclosurePdf;
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
            await saveModuleContentApi('disclosure', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Mandatory Public Disclosure page published! 🎉');
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
            await togglePublishApi('disclosure', 0);
            setIsPublished(false);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => setContent(prev => ({ ...prev, [field]: value }));

    const updateCategory = (catIdx, field, value) => {
        const updated = [...content.categories];
        updated[catIdx] = { ...updated[catIdx], [field]: value };
        updateField('categories', updated);
    };

    const uploadDisclosurePdf = async (file) => {
        setUploading(prev => ({ ...prev, disclosurePdf: true }));
        try {
            const res = await uploadPdfApi(file);
            updateField('disclosurePdf', { ...content.disclosurePdf, pdfUrl: res.data.url });
            toast.success('PDF uploaded!');
        } catch (e) { toast.error(e?.response?.data?.message || 'Failed to upload PDF'); }
        finally { setUploading(prev => ({ ...prev, disclosurePdf: false })); }
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
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .pd-section { animation: fadeInUp 0.35s ease forwards; }
                .pd-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .pd-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .pd-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @media (max-width: 700px) {
                    .pd-pdf-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .pd-hero-inner { gap: 12px !important; }
                    .pd-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .pd-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .pd-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .pd-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .pd-status-badge { padding: 4px 9px !important; }
                    .pd-status-badge span { font-size: 9.5px !important; }
                    .pd-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }

                    /* ── Category row cards — a proper stacked card (label + remove button
                       together up top, detail/PDF fields below) instead of a bare 3-way stack
                       with column headers that stop meaning anything once stacked ── */
                    .pd-col-header { display: none !important; }
                    .pd-row-grid {
                        display: flex !important; flex-wrap: wrap !important; align-items: center !important;
                        gap: 8px !important; background: #fafbfc !important; border: 1px solid #f1f5f9 !important;
                        border-radius: 12px !important; padding: 10px !important; margin-bottom: 8px !important;
                    }
                    .pd-row-label { order: 1 !important; flex: 1 1 auto !important; min-width: 0 !important; }
                    .pd-row-remove { order: 2 !important; flex-shrink: 0 !important; }
                    .pd-row-detail { order: 3 !important; flex-basis: 100% !important; width: 100% !important; }
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
                            <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / Pages / Mandatory Public Disclosure</span>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Mandatory Public Disclosure</h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                            CBSE and board-mandated compliance certificates, affiliation orders, and infrastructure certificates.
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Compliance Docs</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.documents?.length || 0} Certificates Active`}</p>
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Board Standard</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'Affiliation Validated'}</p>
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
                        moduleKey="disclosure"
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

                <div className="pd-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Top section — heading, description */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="pd-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
                                    placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: content.headingItalic ? 'italic' : 'normal' }} />
                                <ItalicToggle active={!!content.headingItalic} onToggle={() => updateField('headingItalic', !content.headingItalic)} />
                            </div>
                            <HeadingStyleField
                                color={content.headingColor} onColorChange={val => updateField('headingColor', val)}
                                font={content.headingFont} onFontChange={val => updateField('headingFont', val)}
                                defaultColor="#ffffff"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <RichTextEditor value={content.description} onChange={val => updateField('description', val)}
                                placeholder="A short note about transparency and compliance..." minHeight="100px" />
                        </div>
                    </div>

                    {/* Category sections */}
                    {content.categories.map((cat, catIdx) => (
                        <CategorySection key={cat.id} category={cat} catIndex={catIdx}
                            onRenameCategory={(name) => updateCategory(catIdx, 'name', name)}
                            onRemoveCategory={content.categories.length > 1 ? () => updateField('categories', content.categories.filter((_, i) => i !== catIdx)) : null}
                            onUpdateRow={(rowIdx, field, val) => {
                                const updatedRows = [...cat.rows];
                                updatedRows[rowIdx] = { ...updatedRows[rowIdx], [field]: val };
                                updateCategory(catIdx, 'rows', updatedRows);
                            }}
                            onRemoveRow={(rowIdx) => updateCategory(catIdx, 'rows', cat.rows.filter((_, i) => i !== rowIdx))}
                            onAddRow={() => updateCategory(catIdx, 'rows',
                                [...cat.rows, cat.type === 'info'
                                    ? { id: `row-${Date.now()}`, label: '', details: '' }
                                    : { id: `row-${Date.now()}`, label: '', pdfUrl: '', linkUrl: '', description: '' }]
                            )}
                            uploading={uploading}
                            setUploading={setUploading}
                        />
                    ))}

                    {/* Add new category */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => updateField('categories', [...content.categories, { id: `cat-${Date.now()}`, name: '', type: 'info', rows: [] }])}
                            style={{ flex: 1, padding: '14px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '12px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                            + Add Info Table (text details)
                        </button>
                        <button onClick={() => updateField('categories', [...content.categories, { id: `cat-${Date.now()}`, name: '', type: 'documents', rows: [] }])}
                            style={{ flex: 1, padding: '14px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '12px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                            + Add Document Table (PDF uploads)
                        </button>
                    </div>

                    {/* Standalone Mandatory Public Disclosure PDF button */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Mandatory Public Disclosure PDF</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>The consolidated official disclosure document — shown as a standalone button at the bottom of the page</p>
                        <div className="pd-pdf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Button Label</label>
                                <input className="pd-input" type="text" value={content.disclosurePdf.label}
                                    onChange={e => updateField('disclosurePdf', { ...content.disclosurePdf, label: e.target.value })}
                                    placeholder="Enter Button Label" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>PDF</label>
                                <div onClick={() => document.getElementById('pd-disclosure-pdf').click()}
                                    style={{ padding: '11px 14px', border: '1px dashed #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: content.disclosurePdf.pdfUrl ? '#15803d' : '#64748b', background: content.disclosurePdf.pdfUrl ? '#f0fdf4' : '#fafafa', textAlign: 'center' }}>
                                    {uploading.disclosurePdf ? 'Uploading...' : content.disclosurePdf.pdfUrl ? '✓ PDF uploaded — click to change' : '📄 Click to upload PDF'}
                                </div>
                                <input id="pd-disclosure-pdf" type="file" accept="application/pdf"
                                    onChange={e => { const f = e.target.files[0]; if (f) uploadDisclosurePdf(f); }} style={{ display: 'none' }} />
                                {content.disclosurePdf.pdfUrl && !uploading.disclosurePdf && (
                                    <button type="button" onClick={() => updateField('disclosurePdf', { ...content.disclosurePdf, pdfUrl: '' })}
                                        style={{ marginTop: '6px', fontSize: '11.5px', fontWeight: 600, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                                        Remove PDF
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};

// ── Category Section — header (editable name + remove) + rows table.
// Row shape depends on category.type: 'info' rows have a free-text "details" textarea,
// 'documents' rows have a PDF upload, matching the two table styles in the reference site. ──
const CategorySection = ({ category, catIndex, onRenameCategory, onRemoveCategory, onUpdateRow, onRemoveRow, onAddRow, uploading, setUploading }) => {
    const { tc } = useSchoolStore();
    const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const letter = String.fromCharCode(65 + catIndex);

    const handlePdfUpload = async (rowId, rowIdx, file) => {
        setUploading(prev => ({ ...prev, [rowId]: true }));
        try {
            const res = await uploadPdfApi(file);
            onUpdateRow(rowIdx, 'pdfUrl', res.data.url);
            toast.success('PDF uploaded!');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload PDF');
        } finally {
            setUploading(prev => ({ ...prev, [rowId]: false }));
        }
    };

    return (
        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: tc.primary, flexShrink: 0 }}>{letter}.</span>
                <input type="text" value={category.name} onChange={e => onRenameCategory(e.target.value)}
                    placeholder="Category name"
                    style={{ flex: 1, padding: '10px 14px', border: '0.5px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', fontWeight: 700, color: '#0f172a', outline: 'none', background: '#fafafa' }} />
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                    {category.type === 'info' ? 'Info Table' : 'Document Table'}
                </span>
                {onRemoveCategory && (
                    <button onClick={onRemoveCategory} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '9px 14px', flexShrink: 0 }}>
                        Remove
                    </button>
                )}
            </div>

            {/* Column headers — hidden on mobile since rows become stacked cards there, where a shared column header no longer means anything */}
            <div className="pd-col-header" style={{ display: 'grid', gridTemplateColumns: category.type === 'info' ? '2fr 2fr 70px' : '1.6fr 1.6fr 70px', gap: '10px', padding: '0 0 8px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Information</span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{category.type === 'info' ? 'Details' : 'PDF, Link or Text'}</span>
                <span></span>
            </div>

            {(category.rows || []).map((row, rowIdx) => (
                <div key={row.id} className="pd-row-grid" style={{ display: 'grid', gridTemplateColumns: category.type === 'info' ? '2fr 2fr 70px' : '1.6fr 1.6fr 70px', gap: '10px', alignItems: 'start', padding: '10px 0', borderBottom: '0.5px solid #f8fafc' }}>
                    <input className="pd-input pd-row-label" type="text" value={row.label} onChange={e => onUpdateRow(rowIdx, 'label', e.target.value)}
                        placeholder="Enter Label" style={inputStyle} />
                    {category.type === 'info' ? (
                        <textarea className="pd-input pd-row-detail" value={row.details} onChange={e => onUpdateRow(rowIdx, 'details', e.target.value)}
                            placeholder="Type details here..." rows={2}
                            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'system-ui, sans-serif' }} />
                    ) : (
                        <div className="pd-row-detail" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div onClick={() => document.getElementById(`pd-row-pdf-${row.id}`).click()}
                                style={{ padding: '9px 12px', border: '1px dashed #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: row.pdfUrl ? '#15803d' : '#64748b', background: row.pdfUrl ? '#f0fdf4' : '#fafafa', textAlign: 'center' }}>
                                {uploading[row.id] ? 'Uploading...' : row.pdfUrl ? '✓ Uploaded — click to change' : '📄 Upload PDF'}
                            </div>
                            <input id={`pd-row-pdf-${row.id}`} type="file" accept="application/pdf"
                                onChange={e => { const f = e.target.files[0]; if (f) handlePdfUpload(row.id, rowIdx, f); }} style={{ display: 'none' }} />
                            {row.pdfUrl && !uploading[row.id] && (
                                <button type="button" onClick={() => onUpdateRow(rowIdx, 'pdfUrl', '')}
                                    style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0', alignSelf: 'flex-start' }}>
                                    Remove PDF
                                </button>
                            )}
                            <input className="pd-input" type="text" value={row.linkUrl || ''} onChange={e => onUpdateRow(rowIdx, 'linkUrl', e.target.value)}
                                placeholder="OR paste a link (https://...)" style={{ ...inputStyle, fontSize: '12px' }} />
                            <textarea className="pd-input" value={row.description || ''} onChange={e => onUpdateRow(rowIdx, 'description', e.target.value)}
                                placeholder="OR / additionally — type text here (optional)" rows={2}
                                style={{ ...inputStyle, fontSize: '12px', resize: 'vertical', fontFamily: 'system-ui, sans-serif' }} />
                        </div>
                    )}
                    <button className="pd-row-remove" onClick={() => onRemoveRow(rowIdx)} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '9px', height: 'fit-content' }}>×</button>
                </div>
            ))}

            <button onClick={onAddRow}
                style={{ width: '100%', marginTop: '12px', padding: '11px', background: 'transparent', border: '1.5px dashed #e2e8f0', borderRadius: '10px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                + Add Row
            </button>
        </div>
    );
};

export default PublicDisclosure;