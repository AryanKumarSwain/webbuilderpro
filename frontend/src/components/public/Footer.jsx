import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicModuleContentApi, getPublishedModulesApi } from "../../api/content.api";
import { COURSE_LEVELS, isLevelComplete } from "../../utils/courseLevels";
import { isModuleEnabled } from "../../constants/publicNav";
import WhatsAppButton from "./WhatsAppButton";

const SocialIcon = ({ type }) => {
    const icons = {
        facebook: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-.83 0-1.5.67-1.5 1.5V12h3l-.5 3H13v6.95c5.05-.5 9-4.76 9-9.95z",
        instagram: "M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.46.66.25 1.21.59 1.76 1.14.5.5.85 1 1.11 1.65.25.65.42 1.39.46 2.45C21.99 8.36 22 8.7 22 11.42v1.16c0 2.72-.01 3.06-.06 4.12-.05 1.06-.22 1.79-.46 2.43-.25.66-.59 1.21-1.14 1.76-.5.5-1 .85-1.65 1.11-.65.25-1.39.42-2.45.46-1.06.05-1.4.06-4.12.06h-1.16c-2.72 0-3.06-.01-4.12-.06-1.06-.05-1.79-.22-2.43-.46-.66-.25-1.21-.59-1.76-1.14-.5-.5-.85-1-1.11-1.65-.25-.65-.42-1.39-.46-2.45C2.01 15.64 2 15.3 2 12.58v-1.16c0-2.72.01-3.06.06-4.12.05-1.06.22-1.79.46-2.43.25-.66.59-1.21 1.14-1.76.5-.5 1-.85 1.65-1.11.65-.25 1.39-.42 2.45-.46C8.36 2.01 8.7 2 11.42 2h1.16zm-.4 1.62h-.4c-2.67 0-2.99.01-4.04.06-.97.04-1.5.2-1.85.34-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.35-.3.88-.34 1.85-.05 1.05-.06 1.37-.06 4.04v.4c0 2.67.01 2.99.06 4.04.04.97.2 1.5.34 1.85.18.47.4.8.75 1.15.35.35.68.57 1.15.75.35.14.88.3 1.85.34 1.05.05 1.37.06 4.04.06h.4c2.67 0 2.99-.01 4.04-.06.97-.04 1.5-.2 1.85-.34.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.35.3-.88.34-1.85.05-1.05.06-1.37.06-4.04v-.4c0-2.67-.01-2.99-.06-4.04-.04-.97-.2-1.5-.34-1.85-.18-.47-.4-.8-.75-1.15-.35-.35-.68-.57-1.15-.75-.35-.14-.88-.3-1.85-.34-1.05-.05-1.37-.06-4.04-.06zM12 6.87a5.13 5.13 0 110 10.26 5.13 5.13 0 010-10.26zm0 1.62a3.51 3.51 0 100 7.02 3.51 3.51 0 000-7.02zm5.34-2.88a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
        youtube: "M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15.5v-7l6 3.5-6 3.5z",
        twitter: "M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.49-1.75.85-2.72 1.05a3.78 3.78 0 00-6.44 3.44c-3.16-.16-5.95-1.67-7.83-3.97-.33.56-.51 1.21-.51 1.9 0 1.31.67 2.46 1.69 3.14-.62-.02-1.21-.19-1.72-.47v.05c0 1.83 1.3 3.36 3.03 3.71-.32.09-.65.13-1 .13-.24 0-.48-.02-.71-.07.48 1.51 1.88 2.6 3.54 2.63A7.59 7.59 0 012 19.54c1.6 1.03 3.5 1.62 5.54 1.62 6.65 0 10.28-5.51 10.28-10.29 0-.16 0-.31-.01-.47.71-.51 1.32-1.15 1.81-1.88-.66.29-1.36.49-2.07.59z",
        linkedin: "M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.34 18V9.94H5.7V18h2.64zM7.03 8.78a1.53 1.53 0 100-3.06 1.53 1.53 0 000 3.06zM18.31 18v-4.36c0-2.33-1.25-3.42-2.91-3.42a2.5 2.5 0 00-2.27 1.26h-.03V9.94h-2.53c.03.71 0 8.06 0 8.06h2.53v-4.5c0-.24.02-.48.09-.65.2-.48.65-.99 1.4-.99.99 0 1.39.75 1.39 1.86V18h2.53z",
    };
    if (!icons[type]) return null;
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={icons[type]} /></svg>;
};

const ContactIcon = ({ type, color }) => {
    const stroke = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (type === 'pin') return <svg width="15" height="15" viewBox="0 0 24 24" {...stroke}><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    if (type === 'phone') return <svg width="15" height="15" viewBox="0 0 24 24" {...stroke}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>;
    if (type === 'mobile') return <svg width="15" height="15" viewBox="0 0 24 24" {...stroke}><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>;
    if (type === 'mail') return <svg width="15" height="15" viewBox="0 0 24 24" {...stroke}><path d="M22 6l-10 7L2 6" /><path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2z" /></svg>;
    return null;
};

// ── Footer nav links — flattened into one "Quick Links" list rather than the old
// About Us / Academics / Highlights sub-categories, to match the single-column
// quick-links layout of the reference design. `key` on every link maps to the
// module's `module_key` in tbl_module_content, so the footer only shows links to
// modules the school has actually published (see publishedKeys). NOTE: this is a
// separate, independently-maintained list from `FOOTER_NAV_GROUPS` in
// constants/publicNav.js — that export is currently unused by this component.
const FOOTER_LINKS = [
    { key: 'about',          label: 'About Us',       path: (slug) => `/school/${slug}/about` },
    { key: 'faculty',        label: 'Faculty',        path: (slug) => `/school/${slug}/faculty` },
    { key: 'infrastructure', label: 'Infrastructure', path: (slug) => `/school/${slug}/infrastructure` },
    { key: 'alumni',         label: 'Alumni',         path: (slug) => `/school/${slug}/alumni` },
    { key: 'testimonials',   label: 'Testimonials',   path: (slug) => `/school/${slug}/testimonials` },
    { key: 'tc',             label: 'TC Information', path: (slug) => `/school/${slug}/tc` },
    { key: 'courses',            label: 'Courses',              path: (slug) => `/school/${slug}/courses` },
    { key: 'fee',                label: 'Fee Structure',        path: (slug) => `/school/${slug}/fee` },
    { key: 'admissionProcedure', label: 'Admission Procedure',  path: (slug) => `/school/${slug}/admission-procedure` },
    { key: 'bookList',           label: 'Book List',            path: (slug) => `/school/${slug}/book-list` },
    { key: 'disclosure',         label: 'Mandatory Public Disclosure', path: (slug) => `/school/${slug}/public-disclosure` },
    { key: 'sports',       label: 'Sports',       path: (slug) => `/school/${slug}/sports` },
    { key: 'gallery',      label: 'Gallery',      path: (slug) => `/school/${slug}/gallery/photo` },
    { key: 'achievements', label: 'Achievements', path: (slug) => `/school/${slug}/achievements` },
    { key: 'announcements', label: 'Announcements',      path: (slug) => `/school/${slug}/announcements` },
    { key: 'events',        label: 'Events & Activities', path: (slug) => `/school/${slug}/events` },
    { key: 'calendar',      label: 'Event Calendar',     path: (slug) => `/school/${slug}/calendar` },
    { key: 'circulars',     label: 'Circulars',          path: (slug) => `/school/${slug}/circulars` },
    { key: 'results',       label: 'Results',            path: (slug) => `/school/${slug}/results` },
    // Admission/Career Enquiry have no standalone public page — they open the same
    // floating enquiry modal (EnquiryWidget.jsx) as the Home hero's CTA buttons do,
    // via these window events, so `action` is used instead of `path` for these two.
    { key: 'admission', label: 'Admission Enquiry', action: () => window.dispatchEvent(new Event('open-admission-enquiry')) },
    { key: 'career',    label: 'Career Enquiry',    action: () => window.dispatchEvent(new Event('open-career-enquiry')) },
];

// ── Small accent-bar section heading, matching the reference design's
// "| Quick Links" / "| Contact Us" style. ──
const SectionHeading = ({ children, accent }) => (
    <p style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '14.5px', fontWeight: 700, color: '#ffffff', marginBottom: '1.2rem' }}>
        <span style={{ width: '3px', height: '15px', borderRadius: '2px', background: accent, flexShrink: 0 }} />
        {children}
    </p>
);

const Footer = ({ school, slug, tc, bgImage }) => {
    const footerBg = tc.dark;
    const accent = tc.secondary;
    const navigate = useNavigate();
    const [coursesContent, setCoursesContent] = useState(null);
    const [publishedKeys, setPublishedKeys] = useState([]);

    useEffect(() => {
        if (!school?.id) return;
        getPublicModuleContentApi(school.id, 'courses')
            .then(res => setCoursesContent(res.data || {}))
            .catch(() => setCoursesContent({}));
        getPublishedModulesApi(school.id)
            .then(res => setPublishedKeys(res.data || []))
            .catch(() => setPublishedKeys([]));
    }, [school?.id]);

    // Footer's Courses link routes to whichever fully-filled level page exists — there's no
    // generic "/courses" overview page, so this picks the first complete one instead.
    const firstCompleteLevel = COURSE_LEVELS.find(l => isLevelComplete(coursesContent?.[l.key]));

    const socials = [
        { type: 'facebook', url: school.facebook },
        { type: 'instagram', url: school.instagram },
        { type: 'youtube',   url: school.youtube },
        { type: 'twitter',   url: school.twitter },
        { type: 'linkedin',  url: school.linkedin },
    ].filter(s => s.url);

    const quickLinks = FOOTER_LINKS.filter(link => publishedKeys.includes(link.key) && isModuleEnabled(school, link.key));

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const linkStyle = {
        fontSize: '13.5px',
        color: 'rgba(255,255,255,0.62)',
        cursor: 'pointer',
        transition: 'color 0.2s',
        lineHeight: 1.5,
        display: 'block',
        marginBottom: '16px',
        breakInside: 'avoid',
    };

    const contactRowStyle = { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '13px' };
    const contactTextStyle = { fontSize: '13px', color: 'rgba(255,255,255,0.68)', lineHeight: 1.6, textDecoration: 'none' };

    return (
        <>
        <WhatsAppButton school={school} />
        <footer style={{ position: 'relative', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif", color: 'rgba(255,255,255,0.85)' }}>
            <style>{`
                @media (max-width: 900px) {
                    .footer-main-grid { grid-template-columns: repeat(2, minmax(200px, 1fr)) !important; }
                }
                @media (max-width: 480px) {
                    .footer-main-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 700px) {
                    .footer-quicklinks { columns: 3 !important; column-gap: 14px !important; }
                }
                @media (max-width: 480px) {
                    .footer-quicklinks { columns: 3 !important; column-gap: 10px !important; }
                    .footer-quicklinks .footer-link { font-size: 11.5px !important; margin-bottom: 12px !important; }
                }
                .footer-link:hover { color: #ffffff !important; }
                .footer-social:hover { color: #fff !important; }
                .footer-totop:hover { color: #fff !important; }
                .footer-quicklinks { column-gap: 28px; column-rule: 1px solid rgba(255,255,255,0.14); }
            `}</style>

            {/* Background — a subtle diagonal navy-toned gradient off the school's own
                 theme dark shade, so the footer's accent bars/icons (tc.secondary) always
                 read against it, whatever theme the school picked. */}
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${footerBg} 0%, #0a1830 55%, ${footerBg} 100%)` }}>
                {bgImage && (
                    <img src={bgImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: bgImage ? `linear-gradient(180deg, ${footerBg}99, ${footerBg}e6)` : `linear-gradient(180deg, ${footerBg}cc, ${footerBg}f7)` }} />
            </div>

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1280px', margin: '0 auto', padding: 'clamp(2.5rem,5vw,3.5rem) clamp(1.25rem,6vw,3rem) 2rem' }}>

                <div className="footer-main-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(240px,1fr) minmax(280px,1.3fr) minmax(210px,0.9fr) minmax(280px,1.6fr)',
                    gap: '2.5rem',
                    alignItems: 'start',
                }}>

                    {/* ── Column 1: Brand — badge logo + name/locality, socials ── */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                            {school.logo_url ? (
                                <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 0 3px ${accent}55` }}>
                                    <img src={school.logo_url} alt={school.name} style={{ width: '78%', height: '78%', objectFit: 'contain', display: 'block' }} />
                                </div>
                            ) : (
                                <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontWeight: 800, fontSize: '18px', letterSpacing: '0.02em' }}>
                                    {(school.name || 'S').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.01em', lineHeight: 1.3, marginBottom: '3px' }}>
                                    {school.name}
                                </p>
                                {school.city && (
                                    <p style={{ fontSize: '12px', color: accent, fontWeight: 600, letterSpacing: '0.01em' }}>{school.city}</p>
                                )}
                            </div>
                        </div>

                        {school.footer_about_text && (
                            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, marginBottom: '16px' }}>
                                {school.footer_about_text}
                            </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {socials.map(s => (
                                <a key={s.type} href={s.url} target="_blank" rel="noopener noreferrer" className="footer-social"
                                    style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.75)', transition: 'background 0.2s, color 0.2s, border-color 0.2s', textDecoration: 'none' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.borderColor = accent; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                                    <SocialIcon type={s.type} />
                                </a>
                            ))}
                            <button onClick={scrollToTop} aria-label="Back to top" title="Back to top" className="footer-totop"
                                style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* ── Column 2: Quick Links — all published modules, flattened into one list ── */}
                    {quickLinks.length > 0 && (
                        <div>
                            <SectionHeading accent={accent}>Quick Links</SectionHeading>
                            <div className="footer-quicklinks" style={quickLinks.length > 6 ? { columns: 3 } : undefined}>
                                {quickLinks.map(link => {
                                    const isCourses = link.key === 'courses';
                                    const disabled = isCourses && !firstCompleteLevel;
                                    const handleClick = () => {
                                        if (disabled) return;
                                        if (link.action) return link.action();
                                        navigate(isCourses ? firstCompleteLevel.path(slug) : link.path(slug));
                                    };
                                    return (
                                        <span key={link.label} onClick={handleClick} className="footer-link"
                                            style={{ ...linkStyle, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' }}>
                                            {link.label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Column 3: Contact Us ── */}
                    <div>
                        <SectionHeading accent={accent}>Contact Us</SectionHeading>
                        {school.address && (
                            <div style={contactRowStyle}>
                                <span style={{ marginTop: '2px', flexShrink: 0 }}><ContactIcon type="pin" color={accent} /></span>
                                <span style={contactTextStyle}>{school.address}</span>
                            </div>
                        )}
                        {school.phone && (
                            <div style={contactRowStyle}>
                                <span style={{ flexShrink: 0 }}><ContactIcon type="phone" color={accent} /></span>
                                <a href={`tel:${school.phone}`} className="footer-link" style={contactTextStyle}>{school.phone}</a>
                            </div>
                        )}
                        {school.phone2 && (
                            <div style={contactRowStyle}>
                                <span style={{ flexShrink: 0 }}><ContactIcon type="mobile" color={accent} /></span>
                                <a href={`tel:${school.phone2}`} className="footer-link" style={contactTextStyle}>{school.phone2}</a>
                            </div>
                        )}
                        {school.email && (
                            <div style={contactRowStyle}>
                                <span style={{ flexShrink: 0 }}><ContactIcon type="mail" color={accent} /></span>
                                <a href={`mailto:${school.email}`} className="footer-link" style={contactTextStyle}>{school.email}</a>
                            </div>
                        )}
                    </div>

                    {/* ── Column 4: Map ── */}
                    {school.map_url && (
                        <div>
                            <SectionHeading accent={accent}>Our Location</SectionHeading>
                            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
                                <iframe src={school.map_url} width="100%" height="320" style={{ border: 0, display: 'block', minWidth: '260px' }} loading="lazy" title="School location" />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Bottom bar ── */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2.5rem', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>© {new Date().getFullYear()} {school.name}. All Rights Reserved.</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        Powered by <a href="/" target="_blank" rel="noopener noreferrer" style={{ color: accent, fontWeight: 600, textDecoration: 'none' }}>Web Builder Pro</a>
                    </p>
                </div>

            </div>
        </footer>
        </>
    );
};

export default Footer;
