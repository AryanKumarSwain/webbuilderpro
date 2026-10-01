import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { RTE_FONT_CSS, RTE_LIST_CSS } from "../../constants/rteContentStyles";
import { sanitizeHtml } from "../../utils/sanitizeHtml";

const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.6s ease ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
            {children}
        </div>
    );
};

const ChevronIcon = ({ open, color }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)', flexShrink: 0 }}>
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const SearchIcon = ({ size = 18, color = "#94a3b8" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const HelpIcon = ({ size = 20, color = "#ffffff" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

const FaqsPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);

    // FAQ interaction state
    const [openIds, setOpenIds] = useState({});
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'faqs');
                if (contentRes.data) {
                    setContent(contentRes.data);
                    // Open the first item by default if available
                    if (contentRes.data.faqs && contentRes.data.faqs.length > 0) {
                        setOpenIds({ [contentRes.data.faqs[0].id]: true });
                    }
                }
            }
        } catch (e) {
            navigate('/school-not-found');
        } finally {
            setLoading(false);
        }
    };

    // Toggle FAQ item open/close
    const toggleFaq = (id) => {
        setOpenIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const expandAll = (faqsList) => {
        const next = {};
        faqsList.forEach(f => { next[f.id] = true; });
        setOpenIds(next);
    };

    const collapseAll = () => {
        setOpenIds({});
    };

    // Google FAQ Schema
    useEffect(() => {
        const rawFaqs = content?.faqs || [];
        if (rawFaqs.length === 0) return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": rawFaqs.filter(f => f.question && f.answer).map(f => ({
                "@type": "Question",
                "name": f.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.answer.replace(/<[^>]+>/g, '').trim()
                }
            }))
        };

        const scriptId = 'faq-public-schema-jsonld';
        let script = document.getElementById(scriptId);
        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }
        script.text = JSON.stringify(schema);

        return () => {
            const el = document.getElementById(scriptId);
            if (el) el.remove();
        };
    }, [content]);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid #f0c4c4', borderTop: '3px solid #8b2252', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!school) return null;

    const tc = getThemeColors(school.theme);
    const bc = getBaseColors(school.base_theme);

    if (!isModuleEnabled(school, 'faqs')) return <NotPublished tc={tc} slug={slug} label="FAQs" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="FAQs" />;

    const allFaqs = Array.isArray(content.faqs) ? content.faqs : [];

    // Distinct categories
    const categories = ['All', ...new Set(allFaqs.map(f => f.category || 'General').filter(Boolean))];

    // Filter by category and search query
    const filteredFaqs = allFaqs.filter(f => {
        const matchesCat = activeCategory === 'All' || (f.category || 'General') === activeCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q ||
            (f.question && f.question.toLowerCase().includes(q)) ||
            (f.answer && f.answer.toLowerCase().includes(q)) ||
            (f.category && f.category.toLowerCase().includes(q));
        return matchesCat && matchesQuery;
    });

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                body { background: ${bc.surface}; }
                .rte-content p { margin-bottom: 0.6em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
                ${RTE_FONT_CSS}
                ${RTE_LIST_CSS}

                .faq-card {
                    background: ${bc.card || '#ffffff'};
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                    margin-bottom: 0.75rem;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
                    overflow: hidden;
                }
                .faq-card.open {
                    border-color: ${tc.primary}50;
                    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
                }
                .faq-question-btn {
                    width: 100%;
                    padding: 1rem 1.25rem;
                    text-align: left;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.85rem;
                    font-family: inherit;
                }
                .faq-question-btn:hover .faq-question-text {
                    color: ${tc.primary};
                }
                .faq-pill {
                    display: inline-flex;
                    align-items: center;
                    padding: 5px 13px;
                    border-radius: 9999px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    color: #475569;
                    user-select: none;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .faq-pill.active {
                    background: ${tc.primary};
                    color: #ffffff;
                    border-color: ${tc.primary};
                    box-shadow: 0 2px 8px ${tc.primary}30;
                }
                .faq-search-input {
                    width: 100%;
                    padding: 0.7rem 1rem 0.7rem 2.4rem;
                    border-radius: 10px;
                    border: 1.5px solid #e2e8f0;
                    font-size: 13.5px;
                    background: #ffffff;
                    color: #0f172a;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .faq-search-input:focus {
                    border-color: ${tc.primary};
                    box-shadow: 0 0 0 3px ${tc.primary}18;
                }
                @media (max-width: 640px) {
                    .faq-hero-wrap { padding: calc(92px + 1.25rem) 1rem 1.75rem !important; }
                    .faq-hero-title { font-size: 23px !important; letter-spacing: -0.5px !important; }
                    .faq-hero-desc { font-size: 13px !important; line-height: 1.55 !important; }
                    .faq-main-wrap { padding: 1.5rem 0.75rem 4rem !important; }
                    .faq-question-btn { padding: 0.85rem 0.9rem !important; gap: 0.6rem !important; }
                    .faq-question-text { font-size: 13.5px !important; line-height: 1.38 !important; }
                    .faq-answer-wrap { padding: 0.75rem 0.9rem 1rem !important; font-size: 13px !important; line-height: 1.65 !important; }
                    .faq-pills-bar { overflow-x: auto !important; flex-wrap: nowrap !important; padding-bottom: 4px !important; scrollbar-width: none !important; -webkit-overflow-scrolling: touch; }
                    .faq-pills-bar::-webkit-scrollbar { display: none !important; }
                }
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="faqs" />

                {/* ── Header ── */}
                <div className="faq-hero-wrap" style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.75rem) clamp(1.25rem,6vw,3rem) 2rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px', margin: '0 auto' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', color: '#ffffff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                            <HelpIcon size={13} color="#ffffff" />
                            <span>Frequently Asked Questions</span>
                        </div>
                        <h1 className="faq-hero-title" style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px, 3.8vw, 40px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-0.8px', marginBottom: '12px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Frequently Asked Questions'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto 12px', borderRadius: '2px' }}></div>
                        <p className="faq-hero-desc" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
                            Find clear, quick answers to common questions asked by parents, students, and visitors.
                        </p>
                    </div>
                </div>

                {/* ── Main Content Area ── */}
                <div className="faq-main-wrap" style={{ flex: 1, padding: '2.25rem clamp(1.25rem,6vw,3rem) 4.5rem' }}>
                    <div style={{ maxWidth: '880px', margin: '0 auto' }}>

                        {/* Optional RTE Description */}
                        {content.description && (
                            <Reveal>
                                <div className="rte-content" style={{ maxWidth: '780px', margin: '0 auto 2rem', fontSize: '14px', color: '#475569', lineHeight: 1.75, textAlign: 'center' }}
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.description) }} />
                            </Reveal>
                        )}

                        {/* Search & Actions Bar */}
                        <div style={{ marginBottom: '1.75rem' }}>
                            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                    <SearchIcon size={16} color={tc.primary} />
                                </span>
                                <input
                                    type="text"
                                    className="faq-search-input"
                                    placeholder="Search questions or keywords..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', padding: '4px 6px' }}>
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Pills & Expand/Collapse Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div className="faq-pills-bar" style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            className={`faq-pill ${activeCategory === cat ? 'active' : ''}`}
                                            onClick={() => setActiveCategory(cat)}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {filteredFaqs.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                        <button
                                            onClick={() => expandAll(filteredFaqs)}
                                            style={{ background: 'none', border: 'none', color: tc.primary, fontSize: '12px', fontWeight: 650, cursor: 'pointer', padding: '3px 6px' }}>
                                            Expand All
                                        </button>
                                        <span style={{ color: '#cbd5e1', fontSize: '11px' }}>•</span>
                                        <button
                                            onClick={collapseAll}
                                            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', fontWeight: 650, cursor: 'pointer', padding: '3px 6px' }}>
                                            Collapse All
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FAQs Accordion List */}
                        {filteredFaqs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1.25rem', background: bc.card || '#ffffff', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem', color: '#94a3b8' }}>
                                    <HelpIcon size={22} color="#94a3b8" />
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '5px' }}>No FAQs found</h3>
                                <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '400px', margin: '0 auto 1.1rem' }}>
                                    {searchQuery ? `No answers match your search "${searchQuery}". Try a different keyword.` : "We haven't added any questions in this category yet."}
                                </p>
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                        style={{ padding: '7px 16px', background: tc.primary, color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="faqs-list">
                                {filteredFaqs.map((item, idx) => {
                                    const isOpen = !!openIds[item.id];
                                    return (
                                        <Reveal key={item.id || idx} delay={Math.min(idx * 0.03, 0.2)}>
                                            <div className={`faq-card ${isOpen ? 'open' : ''}`}>
                                                <button
                                                    className="faq-question-btn"
                                                    onClick={() => toggleFaq(item.id)}
                                                    aria-expanded={isOpen}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left', flex: 1, minWidth: 0 }}>
                                                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: tc.primary, background: `${tc.primary}14`, width: '25px', height: '25px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                                                            {idx + 1}
                                                        </span>
                                                        <div style={{ minWidth: 0 }}>
                                                            <h3 className="faq-question-text" style={{ fontSize: '15px', fontWeight: 650, color: '#0f172a', lineHeight: 1.4, transition: 'color 0.18s ease' }}>
                                                                {item.question}
                                                            </h3>
                                                            {item.category && item.category !== 'General' && (
                                                                <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, color: tc.primary, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                    {item.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: isOpen ? `${tc.primary}12` : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <ChevronIcon open={isOpen} color={isOpen ? tc.primary : "#64748b"} />
                                                    </div>
                                                </button>

                                                {isOpen && (
                                                    <div className="faq-answer-wrap" style={{ padding: '0.85rem 1.25rem 1.2rem 3.1rem', color: '#475569', fontSize: '13.5px', lineHeight: 1.7, borderTop: '1px solid #f1f5f9' }}>
                                                        <div className="rte-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }} />
                                                    </div>
                                                )}
                                            </div>
                                        </Reveal>
                                    );
                                })}
                            </div>
                        )}

                        {/* Still have questions card */}
                        <div style={{ marginTop: '3.5rem', padding: '2rem 1.5rem', borderRadius: '14px', background: `linear-gradient(135deg, ${tc.primary}0d, ${tc.secondary}12)`, border: `1.5px dashed ${tc.primary}35`, textAlign: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                                Still have questions?
                            </h3>
                            <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '480px', margin: '0 auto 1.25rem', lineHeight: 1.6 }}>
                                Can't find the answer you're looking for? Reach out directly to our administration or admissions team.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                                {school.phone && (
                                    <a
                                        href={`tel:${school.phone}`}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '9px', background: tc.primary, color: '#ffffff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', boxShadow: `0 3px 12px ${tc.primary}35` }}>
                                        Call: {school.phone}
                                    </a>
                                )}
                                {school.email && (
                                    <a
                                        href={`mailto:${school.email}`}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '9px', background: '#ffffff', color: '#1e293b', fontWeight: 600, fontSize: '13px', textDecoration: 'none', border: '1.5px solid #e2e8f0' }}>
                                        Email: {school.email}
                                    </a>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default FaqsPublic;
