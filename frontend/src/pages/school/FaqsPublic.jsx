import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
                    margin-bottom: 1rem;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
                    overflow: hidden;
                }
                .faq-card.open {
                    border-color: ${tc.primary}50;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
                }
                .faq-question-btn {
                    width: 100%;
                    padding: 1.25rem 1.5rem;
                    text-align: left;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1.25rem;
                    font-family: inherit;
                }
                .faq-question-btn:hover .faq-question-text {
                    color: ${tc.primary};
                }
                .faq-pill {
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 16px;
                    border-radius: 9999px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    color: #475569;
                    user-select: none;
                }
                .faq-pill.active {
                    background: ${tc.primary};
                    color: #ffffff;
                    border-color: ${tc.primary};
                    box-shadow: 0 4px 12px ${tc.primary}30;
                }
                .faq-search-input {
                    width: 100%;
                    padding: 0.85rem 1.1rem 0.85rem 2.85rem;
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    font-size: 15px;
                    background: #ffffff;
                    color: #0f172a;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .faq-search-input:focus {
                    border-color: ${tc.primary};
                    box-shadow: 0 0 0 4px ${tc.primary}18;
                }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="faqs" />

                {/* ── Header ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 2rem) clamp(1.25rem,6vw,3rem) 2.5rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', color: '#ffffff', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                            <HelpIcon size={14} color="#ffffff" />
                            <span>Frequently Asked Questions</span>
                        </div>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '14px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Frequently Asked Questions'}
                        </h1>
                        <div style={{ width: '50px', height: '3px', background: tc.secondary, margin: '0 auto 16px', borderRadius: '2px' }}></div>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
                            Find clear, quick answers to common questions asked by parents, students, and visitors.
                        </p>
                    </div>
                </div>

                {/* ── Main Content Area ── */}
                <div style={{ flex: 1, padding: '3rem clamp(1.25rem,6vw,3rem) 5rem' }}>
                    <div style={{ maxWidth: '880px', margin: '0 auto' }}>

                        {/* Optional RTE Description */}
                        {content.description && (
                            <Reveal>
                                <div className="rte-content" style={{ maxWidth: '800px', margin: '0 auto 2.5rem', fontSize: '15.5px', color: '#475569', lineHeight: 1.8, textAlign: 'center' }}
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.description) }} />
                            </Reveal>
                        )}

                        {/* Search & Actions Bar */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                    <SearchIcon color={tc.primary} />
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
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', padding: '4px 8px' }}>
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Pills & Expand/Collapse Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => expandAll(filteredFaqs)}
                                            style={{ background: 'none', border: 'none', color: tc.primary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}>
                                            Expand All
                                        </button>
                                        <span style={{ color: '#cbd5e1' }}>•</span>
                                        <button
                                            onClick={collapseAll}
                                            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}>
                                            Collapse All
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FAQs Accordion List */}
                        {filteredFaqs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: bc.card || '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#94a3b8' }}>
                                    <HelpIcon size={24} color="#94a3b8" />
                                </div>
                                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>No FAQs found</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                                    {searchQuery ? `No answers match your search "${searchQuery}". Try a different keyword.` : "We haven't added any questions in this category yet."}
                                </p>
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                        style={{ padding: '8px 18px', background: tc.primary, color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="faqs-list">
                                {filteredFaqs.map((item, idx) => {
                                    const isOpen = !!openIds[item.id];
                                    return (
                                        <Reveal key={item.id || idx} delay={Math.min(idx * 0.04, 0.25)}>
                                            <div className={`faq-card ${isOpen ? 'open' : ''}`}>
                                                <button
                                                    className="faq-question-btn"
                                                    onClick={() => toggleFaq(item.id)}
                                                    aria-expanded={isOpen}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', textAlign: 'left', flex: 1 }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 800, color: tc.primary, background: `${tc.primary}15`, width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                                            {idx + 1}
                                                        </span>
                                                        <div>
                                                            <h3 className="faq-question-text" style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.45, transition: 'color 0.18s ease' }}>
                                                                {item.question}
                                                            </h3>
                                                            {item.category && item.category !== 'General' && (
                                                                <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: tc.primary, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                    {item.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isOpen ? `${tc.primary}12` : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <ChevronIcon open={isOpen} color={isOpen ? tc.primary : "#64748b"} />
                                                    </div>
                                                </button>

                                                {isOpen && (
                                                    <div style={{ padding: '0 1.5rem 1.4rem 3.8rem', color: '#475569', fontSize: '15px', lineHeight: 1.8, borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
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
                        <div style={{ marginTop: '4rem', padding: '2.5rem 2rem', borderRadius: '16px', background: `linear-gradient(135deg, ${tc.primary}10, ${tc.secondary}15)`, border: `1.5px dashed ${tc.primary}40`, textAlign: 'center' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                                Still have questions?
                            </h3>
                            <p style={{ fontSize: '14.5px', color: '#64748b', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                                Can't find the answer you're looking for? Reach out directly to our administration or admissions team.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <Link
                                    to={`/school/${slug}/contact`}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', background: tc.primary, color: '#ffffff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: `0 4px 14px ${tc.primary}35` }}>
                                    Contact Us
                                </Link>
                                {school.phone && (
                                    <a
                                        href={`tel:${school.phone}`}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', background: '#ffffff', color: '#1e293b', fontWeight: 600, fontSize: '14px', textDecoration: 'none', border: '1.5px solid #e2e8f0' }}>
                                        Call: {school.phone}
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
