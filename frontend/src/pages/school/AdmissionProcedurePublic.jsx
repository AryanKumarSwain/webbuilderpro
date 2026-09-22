import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import AdmissionEnquiryForm from "../../components/public/AdmissionEnquiryForm";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily, getHeadingSizeCss } from "../../constants/fonts";
import { RTE_FONT_CSS, RTE_LIST_CSS } from "../../constants/rteContentStyles";

import { sanitizeHtml } from "../../utils/sanitizeHtml";
const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.15 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.65s ease ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
            {children}
        </div>
    );
};

const PhoneIcon = ({ color }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
);
const MailIcon = ({ color }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 6l-10 7L2 6" /><path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2z" /></svg>
);
const PinIcon = ({ color }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const DocIcon = ({ color }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
);

// ── One "Explain Your Admission Procedure" block — a large ghost numeral marks each
// section editorially (Stripe/Linear-style), outlined in the theme color so it stays
// visible against any base theme background instead of just a faint flat tint.
// Heading picks up its own color/font/size, description renders through the same
// RTE pipeline as everywhere else. ──
const ProcedureBlock = ({ block, idx, isLast, tc }) => (
    <Reveal delay={Math.min(idx * 0.08, 0.4)}>
        <div style={{ position: 'relative', padding: idx === 0 ? '0 0 2.25rem' : '2.25rem 0', borderBottom: isLast ? 'none' : '1px solid #eef1f6' }}>
            <div style={{
                position: 'absolute', top: idx === 0 ? '-8px' : '14px', left: 0,
                fontSize: 'clamp(46px,6.5vw,78px)', fontWeight: 800, lineHeight: 1, userSelect: 'none', zIndex: 0,
                color: `${tc.primary}14`, WebkitTextStroke: `1.5px ${tc.primary}70`,
            }}>
                {String(idx + 1).padStart(2, '0')}
            </div>
            <div style={{ position: 'relative', zIndex: 1, paddingLeft: 'clamp(58px,8.5vw,104px)' }}>
                {block.heading && (
                    <h3 style={{
                        fontFamily: block.headingFont ? getFontFamily(block.headingFont) : "'Playfair Display', Georgia, serif",
                        fontSize: getHeadingSizeCss(block.headingSize),
                        fontWeight: 700,
                        color: block.headingColor || tc.dark,
                        fontStyle: block.headingItalic ? 'italic' : 'normal',
                        marginBottom: '10px',
                        letterSpacing: '-0.3px',
                    }}>
                        {block.heading}
                    </h3>
                )}
                {block.description && (
                    <div className="rte-content" style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.85 }}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.description) }} />
                )}
            </div>
        </div>
    </Reveal>
);

// ── One "Ways to Reach Us" row — icon chip + label, optionally a clickable link ──
const ContactRow = ({ icon, label, sub, href, tc }) => {
    const Wrapper = href ? 'a' : 'div';
    return (
        <Wrapper href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', padding: '4px 0' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', flexShrink: 0, background: `${tc.primary}12`, color: tc.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{label}</p>
                {sub && <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '1px' }}>{sub}</p>}
            </div>
        </Wrapper>
    );
};

const AdmissionProcedurePublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);

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
                const contentRes = await getPublicModuleContentApi(res.data.id, 'admissionProcedure');
                if (contentRes.data) setContent(contentRes.data);
            }
        } catch (e) {
            navigate('/school-not-found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid #f0c4c4', borderTop: '3px solid #8b2252', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!school) return null;

    const tc = getThemeColors(school.theme);
    const bc = getBaseColors(school.base_theme);

    if (!isModuleEnabled(school, 'admissionProcedure')) return <NotPublished tc={tc} slug={slug} label="Admission Procedure" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Admission Procedure" />;

    const formUrl = content.formPdfUrl || content.formLinkUrl;
    const visibleBlocks = (content.procedureBlocks || []).filter(b => b.heading || b.description);

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
                .rte-content ul, .rte-content ol { padding-left: 1.4em; margin-bottom: 0.6em; }
                .rte-content .ql-size-small { font-size: 0.85em; }
                .rte-content .ql-size-large { font-size: 1.2em; }
                .rte-content .ql-size-huge { font-size: 1.5em; }
                ${RTE_FONT_CSS}
                ${RTE_LIST_CSS}
                .ap-map-link:hover { filter: brightness(1.04); }
                @media (max-width: 860px) {
                    .ap-contact-grid { grid-template-columns: 1fr !important; }
                }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="admissionProcedure" />

                {/* ── Header — no banner photo, clean gradient header (matches About Us) ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Admission Procedure'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Admission Procedure Explained — admin-authored, repeatable heading + description blocks ── */}
                {visibleBlocks.length > 0 && (
                    <div style={{ padding: '4.5rem clamp(1.25rem,6vw,3rem) 0.5rem', background: bc.surface }}>
                        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                            <Reveal>
                                <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
                                    <p style={{ fontSize: '12px', color: tc.primary, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>How It Works</p>
                                    <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(26px,3vw,36px)', fontWeight: 800, color: tc.dark, letterSpacing: '-1px' }}>Admission Process</h2>
                                </div>
                            </Reveal>
                            {visibleBlocks.map((block, idx) => (
                                <ProcedureBlock key={block.id || idx} block={block} idx={idx} isLast={idx === visibleBlocks.length - 1} tc={tc} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Get in touch — contact info + map (left) and inline admission form (right) ── */}
                <div style={{ padding: '4rem clamp(1.25rem,6vw,3rem) 7rem' }}>
                    <div className="ap-contact-grid" style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: '2.5rem', alignItems: 'start' }}>

                        {/* Left — assistance + contact channels + map */}
                        <Reveal>
                            <div>
                                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px,2.4vw,28px)', fontWeight: 700, color: tc.dark, marginBottom: '14px' }}>
                                    We're Here to Assist You!
                                </h2>
                                {content.description ? (
                                    <div className="rte-content" style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.85, marginBottom: '1.75rem' }}
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.description) }} />
                                ) : (
                                    <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.85, marginBottom: '1.75rem' }}>
                                        At {school.name}, we value communication and engagement. Whether you're a prospective parent, student, or educator, our team is here to answer your queries, provide guidance, and assist you in any way possible.
                                    </p>
                                )}

                                <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Ways to Reach Us</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '2rem' }}>
                                    {school.phone && (
                                        <ContactRow tc={tc} icon={<PhoneIcon color={tc.primary} />} label="Call Us"
                                            sub={[school.phone, school.phone2].filter(Boolean).join(' | ')} href={`tel:${school.phone}`} />
                                    )}
                                    {school.email && (
                                        <ContactRow tc={tc} icon={<MailIcon color={tc.primary} />} label="Email Us" sub={school.email} href={`mailto:${school.email}`} />
                                    )}
                                    {school.address && (
                                        <ContactRow tc={tc} icon={<PinIcon color={tc.primary} />} label="Visit Us" sub={school.address} />
                                    )}
                                    {formUrl && (
                                        <ContactRow tc={tc} icon={<DocIcon color={tc.primary} />} label="Online Admission Form"
                                            sub={content.formPdfUrl ? 'Download the admission form PDF' : 'View the admission form'} href={formUrl} />
                                    )}
                                </div>

                                {school.map_url && (
                                    <div>
                                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Find Our Location</p>
                                        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
                                            <iframe src={school.map_url} width="100%" height="200" style={{ border: 0, display: 'block' }} loading="lazy" title="School location" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Reveal>

                        {/* Right — inline admission enquiry form, sharp corners for a more formal/professional feel */}
                        <Reveal delay={0.1}>
                            <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 12px 36px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                                <div style={{ padding: '1.5rem 2rem', background: tc.dark, borderBottom: `3px solid ${tc.secondary}` }}>
                                    <h3 style={{ fontSize: 'clamp(17px,1.8vw,20px)', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.2px' }}>
                                        Admissions Open
                                    </h3>
                                </div>
                                <div style={{ padding: '2rem' }}>
                                    <AdmissionEnquiryForm school={school} tc={tc} />
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default AdmissionProcedurePublic;
