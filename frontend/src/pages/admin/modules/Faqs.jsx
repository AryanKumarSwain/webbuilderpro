import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import useSchoolStore from '../../../store/schoolStore';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const EditIcon = ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export const FAQ_CATEGORIES = [
    'General',
    'Admissions',
    'Academics',
    'Fees & Payment',
    'Transport',
    'Facilities',
    'Examinations',
];

const defaultContent = {
    heading: 'Frequently Asked Questions',
    description: 'Find answers to common questions about admissions, academics, school timings, and campus facilities.',
    faqs: [
        {
            id: 'faq-1',
            question: 'What is the admission procedure and eligibility criteria?',
            answer: 'Admissions are open for the upcoming academic session. Parents can register online via the Admission Enquiry section or visit the school admissions desk during working hours.',
            category: 'Admissions',
        },
        {
            id: 'faq-2',
            question: 'What are the school timings and working hours?',
            answer: 'Regular school timings are from 8:00 AM to 2:00 PM Monday through Friday, and 8:00 AM to 12:30 PM on scheduled Saturdays.',
            category: 'General',
        },
        {
            id: 'faq-3',
            question: 'Does the school provide safe transportation for students?',
            answer: 'Yes, the school operates a fleet of GPS-tracked, CCTV-monitored buses covering all major residential routes, with trained female attendants on every vehicle.',
            category: 'Transport',
        },
        {
            id: 'faq-4',
            question: 'Which educational curriculum and board is followed?',
            answer: 'Our school follows an experiential, child-centric curriculum aligned with modern NEP guidelines and accredited education board standards.',
            category: 'Academics',
        },
    ],
};

const Faqs = () => {
    const { tc: storeTc, school } = useSchoolStore();
    const tc = storeTc || { primary: '#1e3a8a', secondary: '#3b82f6', dark: '#0f172a' };
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [expandedFaqId, setExpandedFaqId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('faqs');
            if (res.data) {
                const merged = { ...defaultContent, ...res.data.content };
                setContent(merged);
                setSavedSnapshot(JSON.stringify(merged));
                setIsPublished(res.data.is_published === 1);
            } else {
                setSavedSnapshot(JSON.stringify(defaultContent));
            }
        } catch (e) {
            console.log('No content yet, using defaults');
            setSavedSnapshot(JSON.stringify(defaultContent));
        } finally {
            setLoading(false);
        }
    };

    const fetchPublishedFlag = async () => {
        const res = await getModuleContentApi('faqs');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('faqs', content, publish ? 1 : isPublished ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('faqs', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('FAQs published to website! 🎉');
            } else {
                toast.success('FAQs draft saved!');
            }
        } catch (e) {
            toast.error('Failed to save FAQs');
        } finally {
            setSaving(false);
            setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            let current = await fetchPublishedFlag();
            if (current) {
                await togglePublishApi('faqs', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('FAQs unpublished from public website');
        } catch (e) {
            toast.error('Failed to unpublish');
        }
    };

    const updateField = (field, value) => {
        setContent((prev) => ({ ...prev, [field]: value }));
    };

    const addFaq = () => {
        const newFaq = {
            id: `faq-${Date.now()}`,
            question: '',
            answer: '',
            category: 'General',
        };
        setContent((prev) => ({
            ...prev,
            faqs: [newFaq, ...(prev.faqs || [])],
        }));
        setExpandedFaqId(newFaq.id);
    };

    const updateFaq = (id, key, val) => {
        setContent((prev) => ({
            ...prev,
            faqs: (prev.faqs || []).map((f) => (f.id === id ? { ...f, [key]: val } : f)),
        }));
    };

    const removeFaq = (id) => {
        setContent((prev) => ({
            ...prev,
            faqs: (prev.faqs || []).filter((f) => f.id !== id),
        }));
    };

    const moveFaq = (index, direction) => {
        setContent((prev) => {
            const list = [...(prev.faqs || [])];
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= list.length) return prev;
            const temp = list[index];
            list[index] = list[targetIndex];
            list[targetIndex] = temp;
            return { ...prev, faqs: list };
        });
    };

    const inputStyle = {
        width: '100%',
        padding: '11px 14px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '13.5px',
        color: '#0f172a',
        outline: 'none',
        boxSizing: 'border-box',
        background: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '11px',
        fontWeight: 600,
        color: '#64748b',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    const filteredFaqs = (content.faqs || []).filter((f) => {
        const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
        const matchesSearch =
            !searchTerm ||
            f.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.answer?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'faqSpin 1s linear infinite' }}></div>
                <style>{`@keyframes faqSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes faqSpin { to { transform: rotate(360deg); } }
                @keyframes faqFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                .faq-section { animation: faqFadeIn 0.35s ease forwards; }
                .faq-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; }
                .faq-item-card { transition: all 0.2s ease; }
                .faq-item-card:hover { border-color: #cbd5e1 !important; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
                .faq-btn-move:hover { background: #f1f5f9 !important; color: #0f172a !important; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
                {/* Hero Header */}
                <div style={{
                    background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`,
                    borderRadius: '22px', padding: '2.4rem 2.5rem', marginBottom: '1.75rem',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: `0 20px 50px ${hexToRgba(tc.primary, 0.22)}, 0 4px 20px rgba(0,0,0,0.12)`,
                    color: '#ffffff',
                }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                                        Admin / News & Events / FAQs
                                    </span>
                                </div>
                                <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
                                    Frequently Asked Questions (FAQs)
                                </h1>
                                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.8)', maxWidth: '520px', lineHeight: 1.55 }}>
                                    Add clear questions and answers to help parents and students find fast information about admissions, timings, facilities, and school policies.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '5px 12px', borderRadius: '999px',
                                    background: isPublished ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.12)',
                                    border: `1px solid ${isPublished ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.25)'}`,
                                    fontSize: '12px', fontWeight: 600,
                                }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPublished ? '#4ade80' : '#cbd5e1' }} />
                                    <span>{isPublished ? 'Live on Website' : 'Draft Mode'}</span>
                                </div>

                                <ModuleActionButtons
                                    tc={tc}
                                    isDirty={isDirty}
                                    saving={saving}
                                    publishing={publishing}
                                    isPublished={isPublished}
                                    onSave={() => handleSave(false)}
                                    onPublish={() => handleSave(true)}
                                    onUnpublish={handleUnpublish}
                                    viewUrl={school?.slug ? `/school/${school.slug}/faqs` : null}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Intro Card */}
                <div className="faq-section" style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
                        Page Header & Introduction
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Page Title</label>
                            <input
                                className="faq-input"
                                type="text"
                                value={content.heading || ''}
                                onChange={(e) => updateField('heading', e.target.value)}
                                placeholder="Frequently Asked Questions"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Category Tags Available</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
                                {FAQ_CATEGORIES.map((cat) => (
                                    <span key={cat} style={{
                                        fontSize: '11px',
                                        padding: '4px 9px',
                                        borderRadius: '6px',
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        fontWeight: 600,
                                    }}>
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                        <label style={labelStyle}>Subtitle / Description</label>
                        <textarea
                            className="faq-input"
                            rows={2}
                            value={content.description || ''}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="A helpful line explaining what visitors can find in this section..."
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>
                </div>

                {/* FAQ Questions List Card */}
                <div className="faq-section" style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    marginBottom: '2rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '1.25rem', flexWrap: 'wrap', gap: '12px',
                    }}>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                Questions & Answers ({content.faqs?.length || 0})
                            </h2>
                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                Drag or use arrows to rearrange the order in which questions appear on your public website.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={addFaq}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '7px',
                                padding: '9px 18px', borderRadius: '8px',
                                background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`,
                                color: '#ffffff', border: 'none',
                                fontSize: '13px', fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.25)}`,
                            }}
                        >
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add Question</span>
                        </button>
                    </div>

                    {/* Filter & Search Bar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        marginBottom: '1.25rem', flexWrap: 'wrap',
                    }}>
                        <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
                            <svg width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                className="faq-input"
                                type="text"
                                placeholder="Search questions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ ...inputStyle, paddingLeft: '36px', paddingRight: '12px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                            {['All', ...FAQ_CATEGORIES].map((cat) => {
                                const active = selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        style={{
                                            fontSize: '11.5px',
                                            fontWeight: active ? 700 : 500,
                                            padding: '6px 12px',
                                            borderRadius: '999px',
                                            border: active ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0',
                                            background: active ? tc.light : '#ffffff',
                                            color: active ? tc.primary : '#475569',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* FAQ Items */}
                    {filteredFaqs.length === 0 ? (
                        <div style={{
                            padding: '3rem 1.5rem', textAlign: 'center',
                            border: '1.5px dashed #cbd5e1', borderRadius: '12px',
                            background: '#f8fafc',
                        }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: '#e2e8f0', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto 12px', color: '#64748b',
                            }}>
                                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                                No questions found
                            </p>
                            <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px' }}>
                                {searchTerm ? 'Try changing your search keywords or filter category.' : 'Click "Add Question" to start adding FAQs for parents and students.'}
                            </p>
                            <button
                                type="button"
                                onClick={addFaq}
                                style={{
                                    padding: '8px 16px', borderRadius: '6px',
                                    background: tc.primary, color: '#fff',
                                    border: 'none', fontSize: '12.5px', fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                + Add First Question
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {filteredFaqs.map((faq, index) => {
                                const isExpanded = expandedFaqId === faq.id;
                                return (
                                    <div
                                        key={faq.id}
                                        className="faq-item-card"
                                        style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            background: '#ffffff',
                                        }}
                                    >
                                        {/* Item Header */}
                                        <div
                                            onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                                            style={{
                                                padding: '12px 16px',
                                                background: isExpanded ? '#f8fafc' : '#ffffff',
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer', gap: '12px',
                                                borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                <span style={{
                                                    fontSize: '11px', fontWeight: 700,
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    background: tc.light, color: tc.primary,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}>
                                                    {index + 1}
                                                </span>
                                                <span style={{
                                                    fontSize: '14px', fontWeight: 600, color: '#0f172a',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>
                                                    {faq.question || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Untitled Question...</span>}
                                                </span>
                                                {faq.category && (
                                                    <span style={{
                                                        fontSize: '10.5px', fontWeight: 600,
                                                        padding: '2px 8px', borderRadius: '4px',
                                                        background: '#f1f5f9', color: '#475569',
                                                        flexShrink: 0,
                                                    }}>
                                                        {faq.category}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    title="Move Up"
                                                    disabled={index === 0}
                                                    onClick={() => moveFaq(index, -1)}
                                                    className="faq-btn-move"
                                                    style={{
                                                        width: '28px', height: '28px', borderRadius: '6px',
                                                        border: '1px solid #e2e8f0', background: '#fff',
                                                        color: '#64748b', cursor: index === 0 ? 'not-allowed' : 'pointer',
                                                        opacity: index === 0 ? 0.35 : 1,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Move Down"
                                                    disabled={index === filteredFaqs.length - 1}
                                                    onClick={() => moveFaq(index, 1)}
                                                    className="faq-btn-move"
                                                    style={{
                                                        width: '28px', height: '28px', borderRadius: '6px',
                                                        border: '1px solid #e2e8f0', background: '#fff',
                                                        color: '#64748b', cursor: index === filteredFaqs.length - 1 ? 'not-allowed' : 'pointer',
                                                        opacity: index === filteredFaqs.length - 1 ? 0.35 : 1,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}
                                                >
                                                    ▼
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Delete Question"
                                                    onClick={() => {
                                                        if (window.confirm('Delete this FAQ question?')) {
                                                            removeFaq(faq.id);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '28px', height: '28px', borderRadius: '6px',
                                                        border: '1px solid #fecaca', background: '#fef2f2',
                                                        color: '#ef4444', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '15px',
                                                    }}
                                                >
                                                    ×
                                                </button>
                                                <button
                                                    type="button"
                                                    title={isExpanded ? "Close Edit" : "Edit Question"}
                                                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                                                    style={{
                                                        width: '28px', height: '28px', borderRadius: '6px',
                                                        border: isExpanded ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0',
                                                        background: isExpanded ? (tc.light || '#eff6ff') : '#ffffff',
                                                        color: isExpanded ? tc.primary : '#64748b',
                                                        cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.18s ease',
                                                    }}
                                                >
                                                    <EditIcon size={13} color={isExpanded ? tc.primary : '#64748b'} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Edit Form */}
                                        {isExpanded && (
                                            <div style={{ padding: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={labelStyle}>Question Text *</label>
                                                        <input
                                                            className="faq-input"
                                                            type="text"
                                                            value={faq.question || ''}
                                                            onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                                                            placeholder="e.g. What are the admission criteria for kindergarten?"
                                                            style={inputStyle}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={labelStyle}>Category Tag</label>
                                                        <select
                                                            className="faq-input"
                                                            value={faq.category || 'General'}
                                                            onChange={(e) => updateFaq(faq.id, 'category', e.target.value)}
                                                            style={{ ...inputStyle, cursor: 'pointer' }}
                                                        >
                                                            {FAQ_CATEGORIES.map((c) => (
                                                                <option key={c} value={c}>
                                                                    {c}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label style={labelStyle}>Answer Text *</label>
                                                    <textarea
                                                        className="faq-input"
                                                        rows={4}
                                                        value={faq.answer || ''}
                                                        onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                                                        placeholder="Provide a clear, helpful answer that addresses the question..."
                                                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Faqs;
