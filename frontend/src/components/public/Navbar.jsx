import { useState, useEffect, useRef, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { GOOGLE_FONTS_URL, getFontFamily } from "../../constants/fonts";
import { NAVBAR_ITEMS, isModuleEnabled } from "../../constants/publicNav";
import { getPublicModuleContentApi } from "../../api/content.api";
import { isLevelComplete } from "../../utils/courseLevels";

const ChevronDown = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: '5px', flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
);

const ChevronRight = ({ color }) => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" style={{ marginLeft: '8px', flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
);

const MenuIcon = ({ color }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
);

const CloseIcon = ({ color }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
    </svg>
);

// ── Small contact/social icon set for the mobile drawer footer, mirroring Footer.jsx ──
const DrawerContactIcon = ({ type, color }) => {
    const stroke = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (type === 'phone') return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>;
    if (type === 'mail') return <svg width="14" height="14" viewBox="0 0 24 24" {...stroke}><path d="M22 6l-10 7L2 6" /><path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2z" /></svg>;
    return null;
};

const DrawerSocialIcon = ({ type }) => {
    const icons = {
        facebook: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-.83 0-1.5.67-1.5 1.5V12h3l-.5 3H13v6.95c5.05-.5 9-4.76 9-9.95z",
        instagram: "M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.46.66.25 1.21.59 1.76 1.14.5.5.85 1 1.11 1.65.25.65.42 1.39.46 2.45C21.99 8.36 22 8.7 22 11.42v1.16c0 2.72-.01 3.06-.06 4.12-.05 1.06-.22 1.79-.46 2.43-.25.66-.59 1.21-1.14 1.76-.5.5-1 .85-1.65 1.11-.65.25-1.39.42-2.45.46-1.06.05-1.4.06-4.12.06h-1.16c-2.72 0-3.06-.01-4.12-.06-1.06-.05-1.79-.22-2.43-.46-.66-.25-1.21-.59-1.76-1.14-.5-.5-.85-1-1.11-1.65-.25-.65-.42-1.39-.46-2.45C2.01 15.64 2 15.3 2 12.58v-1.16c0-2.72.01-3.06.06-4.12.05-1.06.22-1.79.46-2.43.25-.66.59-1.21 1.14-1.76.5-.5 1-.85 1.65-1.11.65-.25 1.39-.42 2.45-.46C8.36 2.01 8.7 2 11.42 2h1.16zm-.4 1.62h-.4c-2.67 0-2.99.01-4.04.06-.97.04-1.5.2-1.85.34-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.35-.3.88-.34 1.85-.05 1.05-.06 1.37-.06 4.04v.4c0 2.67.01 2.99.06 4.04.04.97.2 1.5.34 1.85.18.47.4.8.75 1.15.35.35.68.57 1.15.75.35.14.88.3 1.85.34 1.05.05 1.37.06 4.04.06h.4c2.67 0 2.99-.01 4.04-.06.97-.04 1.5-.2 1.85-.34.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.35.3-.88.34-1.85.05-1.05.06-1.37.06-4.04v-.4c0-2.67-.01-2.99-.06-4.04-.04-.97-.2-1.5-.34-1.85-.18-.47-.4-.8-.75-1.15-.35-.35-.68-.57-1.15-.75-.35-.14-.88-.3-1.85-.34-1.05-.05-1.37-.06-4.04-.06zM12 6.87a5.13 5.13 0 110 10.26 5.13 5.13 0 010-10.26zm0 1.62a3.51 3.51 0 100 7.02 3.51 3.51 0 000-7.02zm5.34-2.88a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
        youtube: "M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15.5v-7l6 3.5-6 3.5z",
        twitter: "M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.49-1.75.85-2.72 1.05a3.78 3.78 0 00-6.44 3.44c-3.16-.16-5.95-1.67-7.83-3.97-.33.56-.51 1.21-.51 1.9 0 1.31.67 2.46 1.69 3.14-.62-.02-1.21-.19-1.72-.47v.05c0 1.83 1.3 3.36 3.03 3.71-.32.09-.65.13-1 .13-.24 0-.48-.02-.71-.07.48 1.51 1.88 2.6 3.54 2.63A7.59 7.59 0 012 19.54c1.6 1.03 3.5 1.62 5.54 1.62 6.65 0 10.28-5.51 10.28-10.29 0-.16 0-.31-.01-.47.71-.51 1.32-1.15 1.81-1.88-.66.29-1.36.49-2.07.59z",
        linkedin: "M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.34 18V9.94H5.7V18h2.64zM7.03 8.78a1.53 1.53 0 100-3.06 1.53 1.53 0 000 3.06zM18.31 18v-4.36c0-2.33-1.25-3.42-2.91-3.42a2.5 2.5 0 00-2.27 1.26h-.03V9.94h-2.53c.03.71 0 8.06 0 8.06h2.53v-4.5c0-.24.02-.48.09-.65.2-.48.65-.99 1.4-.99.99 0 1.39.75 1.39 1.86V18h2.53z",
    };
    if (!icons[type]) return null;
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d={icons[type]} /></svg>;
};

const ChevronDownSm = ({ color, open }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}>
        <path d="M6 9l6 6 6-6" />
    </svg>
);

// ── Shared top navbar — logo/name on the left, Home + hover dropdowns on the right.
// Dropdown items with subItems (Infrastructure, Courses, and the top-level Sports item)
// open a nested flyout to the right on hover, instead of listing everything inline. ──
const Navbar = forwardRef(({ school, slug, tc, scrollY = 0, activeKey, forceSolid = false, topOffset = 0 }, ref) => {
    const navigate = useNavigate();
    // Navbar background is always solid white now (no transparent-over-hero state),
    // so this is always true — kept as a variable since text/border colors below key off it.
    const navbarSolid = true;
    const navFont = getFontFamily(school.nav_font);
    const [openTop, setOpenTop] = useState(null);
    const [openSub, setOpenSub] = useState(null);
    const [coursesContent, setCoursesContent] = useState(null);
    const [infraContent, setInfraContent] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileGroup, setMobileGroup] = useState(null);
    const [mobileSub, setMobileSub] = useState(null);
    const topCloseTimer = useRef(null);
    const subCloseTimer = useRef(null);

    useEffect(() => {
        if (!school?.id) return;
        getPublicModuleContentApi(school.id, 'courses').then(res => setCoursesContent(res.data || {})).catch(() => setCoursesContent({}));
        getPublicModuleContentApi(school.id, 'infrastructure').then(res => setInfraContent(res.data || {})).catch(() => setInfraContent({}));
    }, [school?.id]);

    // Lock background scroll while the mobile drawer is open.
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    // Browser-tab favicon — the school's own logo if uploaded, falling back to the
    // platform default (index.html's static /favicon.png) otherwise. Navbar is the
    // one component every public school page already renders, so this covers all
    // of them without touching each page individually.
    useEffect(() => {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = school?.logo_url || '/favicon.png';
    }, [school?.logo_url]);

    // Browser-tab title — same reasoning as the favicon above, index.html's
    // static <title>Web Builder Pro</title> otherwise never changes.
    useEffect(() => {
        if (school?.name) document.title = school.name;
    }, [school?.name]);

    const openTopMenu = (label) => { clearTimeout(topCloseTimer.current); setOpenTop(label); setOpenSub(null); };
    const scheduleTopClose = () => { topCloseTimer.current = setTimeout(() => { setOpenTop(null); setOpenSub(null); }, 150); };
    const openSubMenu = (key) => { clearTimeout(subCloseTimer.current); setOpenSub(key); };
    const scheduleSubClose = () => { subCloseTimer.current = setTimeout(() => setOpenSub(null), 150); };
    const keepOpen = () => { clearTimeout(topCloseTimer.current); clearTimeout(subCloseTimer.current); };
    const go = (path) => {
        setOpenTop(null); setOpenSub(null);
        setMobileOpen(false); setMobileGroup(null); setMobileSub(null);
        navigate(path);
    };
    const toggleMobileGroup = (label) => { setMobileGroup(prev => prev === label ? null : label); setMobileSub(null); };
    const toggleMobileSub = (key) => { setMobileSub(prev => prev === key ? null : key); };

    // 'home' always stays in the nav — there's no fallback UI for a disabled landing page,
    // so unselecting it isn't treated as removable the way other modules are.
    // 'gallery-video' isn't its own module_key — it's the Video Gallery tab of the 'gallery' module.
    const navEnabled = (key) => {
        if (key === 'home') return true;
        return isModuleEnabled(school, key === 'gallery-video' ? 'gallery' : key);
    };

    const visibleNavItems = NAVBAR_ITEMS
        .map(item => item.links ? { ...item, links: item.links.filter(l => navEnabled(l.key)) } : item)
        .filter(item => {
            if (item.links) return item.links.length > 0;
            return navEnabled(item.key);
        });

    const getSubItems = (link) => {
        if (link.dynamicSubItems === 'courses') {
            return (link.subItems || []).filter(s => isLevelComplete(coursesContent?.[s.key]));
        }
        if (link.dynamicSubItems === 'infrastructure') {
            return (infraContent?.categories || []).map(cat => ({ label: cat.name, path: (s) => `/school/${s}/infrastructure/${cat.slug}` }));
        }
        return link.subItems;
    };

    const textColor = navbarSolid ? '#0f172a' : '#ffffff';
    const affiliationBadges = Array.isArray(school.affiliation_badges) ? school.affiliation_badges.filter(b => b?.url) : [];
    const drawerSocials = [
        { type: 'facebook', url: school.facebook },
        { type: 'instagram', url: school.instagram },
        { type: 'youtube', url: school.youtube },
        { type: 'twitter', url: school.twitter },
        { type: 'linkedin', url: school.linkedin },
    ].filter(s => s.url);

    const dropdownPanelStyle = (isOpen) => ({
        position: 'absolute', top: 'calc(100% + 10px)', left: '50%',
        transform: isOpen ? 'translate(-50%,0) scale(1)' : 'translate(-50%,-6px) scale(0.98)',
        transformOrigin: 'top center',
        minWidth: '208px', background: '#ffffff', borderRadius: 0,
        border: `1.5px solid ${tc.primary}35`,
        boxShadow: '0 18px 40px rgba(15,23,42,0.16)',
        padding: '5px', opacity: isOpen ? 1 : 0, visibility: isOpen ? 'visible' : 'hidden',
        transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: isOpen ? 'auto' : 'none', zIndex: 10,
    });

    const flyoutPanelStyle = (isOpen) => ({
        position: 'absolute', top: '-6px', left: 'calc(100% + 6px)',
        minWidth: '192px', background: '#ffffff', borderRadius: 0,
        border: `1.5px solid ${tc.primary}35`,
        boxShadow: '0 16px 36px rgba(15,23,42,0.18)',
        padding: '5px', opacity: isOpen ? 1 : 0, visibility: isOpen ? 'visible' : 'hidden',
        transform: isOpen ? 'translateX(0)' : 'translateX(-6px)',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
        pointerEvents: isOpen ? 'auto' : 'none', zIndex: 11,
    });

    const rowStyle = (isActive) => ({
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        padding: '7px 10px', borderRadius: 0, cursor: 'pointer',
        fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? tc.primary : '#1e293b',
        background: isActive ? tc.light : 'transparent',
        borderLeft: isActive ? `2.5px solid ${tc.primary}` : '2.5px solid transparent',
        transition: 'background 0.15s ease, border-color 0.15s ease',
    });

    // ── Row content — small accent dot + label (+ optional chevron for a nested flyout).
    // Shared across the group dropdown, the single-flyout (Sports) rows, and nested flyouts. ──
    const RowLabel = ({ label, isActive, hasSub }) => (
        <>
            <span style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isActive ? tc.secondary : `${tc.primary}40`, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            </span>
            {hasSub && <ChevronRight color={isActive ? tc.primary : '#94a3b8'} />}
        </>
    );

    const Pointer = () => (
        <span style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '12px', height: '12px', background: '#fff', borderLeft: `1.5px solid ${tc.primary}35`, borderTop: `1.5px solid ${tc.primary}35` }} />
    );

    return (
        <>
            <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
            <style>{`
                @media (max-width: 960px) {
                    .navbar-desktop-items { display: none !important; }
                    .navbar-badges { display: none !important; }
                    /* .navbar-right is now empty (its children are hidden above) — drop it
                       so justify-content:space-between pushes the hamburger hard to the
                       right edge instead of leaving it floating mid-gap. */
                    .navbar-right { display: none !important; }
                    .navbar-hamburger { display: flex !important; }
                }
                @media (max-width: 1280px) {
                    .navbar-badges img { height: 46px !important; }
                    .navbar-badges span { display: none !important; }
                    .navbar-right { gap: 1rem !important; }
                }
                @media (max-width: 480px) {
                    .navbar-logo-box { width: 42px !important; height: 42px !important; }
                    .navbar-school-name { font-size: 14px !important; }
                    .navbar-inner { padding: 0 1.1rem !important; }
                }
                .mobile-drawer-row { transition: background 0.18s ease, transform 0.15s ease; }
                .mobile-drawer-row:active { transform: scale(0.97); }
                .nav-drop-row + .nav-drop-row { border-top: 1px solid ${tc.primary}14; }
                .nav-drop-panel { position: relative; }
                .nav-drop-panel::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, ${tc.primary}, ${tc.secondary}); }
                @keyframes mobileRowIn { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
                .mobile-drawer-row-wrap { animation: mobileRowIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }
                .mobile-submenu { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s cubic-bezier(0.16,1,0.3,1); }
                .mobile-submenu.open { grid-template-rows: 1fr; }
                .mobile-submenu > div { overflow: hidden; }
                .mobile-chevron-btn { transition: background 0.2s ease, color 0.2s ease; }
                .mobile-drawer-panel::-webkit-scrollbar { width: 5px; }
                .mobile-drawer-panel::-webkit-scrollbar-thumb { background: ${tc.primary}30; border-radius: 3px; }
            `}</style>
            <nav ref={ref} className="navbar-inner" style={{
                position: 'fixed', top: `${topOffset}px`, left: 0, right: 0, zIndex: 1000,
                height: '92px', padding: '0 3rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid #f1f5f9',
                transition: 'all 0.3s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', minWidth: 0, flexShrink: 1 }} onClick={() => go(`/school/${slug}`)}>
                    {school.logo_url ? (
                        <img className="navbar-logo-box" src={school.logo_url} alt={school.name} style={{ height: '54px', width: '54px', objectFit: 'contain', flexShrink: 0 }} />
                    ) : (
                        <div className="navbar-logo-box" style={{ width: '54px', height: '54px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '10px', flexShrink: 0 }}></div>
                    )}
                    <p className="navbar-school-name" style={{ fontFamily: navFont, fontSize: '17px', fontWeight: 700, color: (mobileOpen ? '#0f172a' : textColor), letterSpacing: '0.03em', textTransform: 'uppercase', transition: 'color 0.3s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                        {school.name}
                    </p>
                </div>

                {/* ── Mobile hamburger toggle — hidden on desktop, shown ≤960px ── */}
                <button className="navbar-hamburger" onClick={() => setMobileOpen(o => !o)}
                    style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '9px', border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
                    {mobileOpen ? <CloseIcon color="#0f172a" /> : <MenuIcon color={textColor} />}
                </button>

                <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexShrink: 0 }}>
                <div className="navbar-desktop-items" style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', flexShrink: 0 }}>
                    {visibleNavItems.map(item => {
                        // ── Plain link (Home, Mandatory Public Disclosure) ──
                        if (item.path && !item.links && !item.subItems) {
                            const isActive = activeKey === item.key;
                            return (
                                <span key={item.key} onClick={() => go(item.path(slug))}
                                    style={{ cursor: 'pointer', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', textTransform: 'uppercase', color: isActive ? tc.secondary : textColor, paddingBottom: '6px', borderBottom: '2px solid transparent', transition: 'color 0.25s ease' }}>
                                    {item.label}
                                </span>
                            );
                        }

                        // ── Single top-level flyout (Sports) ──
                        if (item.subItems && !item.links) {
                            const isOpen = openTop === item.label;
                            const isActive = activeKey === item.key;
                            return (
                                <div key={item.label} onMouseEnter={() => openTopMenu(item.label)} onMouseLeave={scheduleTopClose} style={{ position: 'relative' }}>
                                    <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', textTransform: 'uppercase', color: isActive ? tc.secondary : textColor, paddingBottom: '6px', borderBottom: isOpen ? `2px solid ${tc.secondary}` : '2px solid transparent', transition: 'color 0.25s ease, border-color 0.25s ease' }}
                                        onClick={() => go(item.path(slug))}>
                                        {item.label}
                                        <ChevronDown />
                                    </span>
                                    <div className="nav-drop-panel" style={dropdownPanelStyle(isOpen)} onMouseEnter={keepOpen} onMouseLeave={scheduleTopClose}>
                                        <Pointer />
                                        {item.subItems.map(sub => (
                                            <div key={sub.label} className="nav-drop-row" onClick={() => go(sub.path(slug))} style={rowStyle(false)}
                                                onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(90deg, ${tc.light}, transparent)`}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <RowLabel label={sub.label} isActive={false} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        // ── Group dropdown (About Us, Academics, Gallery) ──
                        const isOpen = openTop === item.label;
                        const groupHasActive = item.links.some(l => l.key === activeKey);
                        return (
                            <div key={item.label} onMouseEnter={() => openTopMenu(item.label)} onMouseLeave={scheduleTopClose} style={{ position: 'relative' }}>
                                <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', textTransform: 'uppercase', color: groupHasActive ? tc.secondary : textColor, paddingBottom: '6px', borderBottom: isOpen ? `2px solid ${tc.secondary}` : '2px solid transparent', transition: 'color 0.25s ease, border-color 0.25s ease' }}>
                                    {item.label}
                                    <ChevronDown />
                                </span>

                                <div className="nav-drop-panel" style={dropdownPanelStyle(isOpen)} onMouseEnter={keepOpen} onMouseLeave={scheduleTopClose}>
                                    <Pointer />
                                    {item.links.map(link => {
                                        const isCourses = link.key === 'courses';
                                        const subItems = getSubItems(link);
                                        const hasSub = subItems?.length > 0;
                                        const isSubOpen = openSub === link.key;
                                        const isActive = activeKey === link.key;
                                        return (
                                            <div key={link.key} className="nav-drop-row" style={{ position: 'relative' }}
                                                onMouseEnter={() => hasSub && openSubMenu(link.key)}
                                                onMouseLeave={scheduleSubClose}>
                                                <div onClick={() => { if (!isCourses) go(link.path(slug)); }}
                                                    style={{ ...rowStyle(isActive), cursor: isCourses ? 'default' : 'pointer' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(90deg, ${tc.light}, transparent)`}
                                                    onMouseLeave={e => e.currentTarget.style.background = isActive ? tc.light : 'transparent'}>
                                                    <RowLabel label={link.label} isActive={isActive} hasSub={hasSub} />
                                                </div>
                                                {hasSub && (
                                                    <div className="nav-drop-panel" style={flyoutPanelStyle(isSubOpen)} onMouseEnter={keepOpen} onMouseLeave={scheduleSubClose}>
                                                        {subItems.map(sub => (
                                                            <div key={sub.label} className="nav-drop-row" onClick={() => go(sub.path(slug))} style={rowStyle(false)}
                                                                onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(90deg, ${tc.light}, transparent)`}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                                <RowLabel label={sub.label} isActive={false} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {affiliationBadges.length > 0 && (
                    <div className="navbar-badges" style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingLeft: '1.4rem', borderLeft: `1px solid ${navbarSolid ? '#e2e8f0' : 'rgba(255,255,255,0.25)'}`, flexShrink: 0, transition: 'border-color 0.3s' }}>
                        {affiliationBadges.map(badge => (
                            <div key={badge.id || badge.url} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                                <img src={badge.url} alt={badge.label || ''} title={badge.label || ''}
                                    style={{ height: '58px', width: 'auto', maxWidth: '92px', objectFit: 'contain' }} />
                                {badge.label && (
                                    <span style={{ fontSize: '8.5px', fontWeight: 700, color: textColor, textAlign: 'center', letterSpacing: '0.01em', whiteSpace: 'nowrap', maxWidth: '76px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {badge.label}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </nav>

            {/* ── Mobile nav — dark backdrop + slide-in drawer from the right, tap-based
                accordion version of the same nav data (hover dropdowns don't work on touch).
                Always mounted so both open and close animate; visibility toggled via
                opacity/transform + pointerEvents rather than conditional rendering. ── */}
            <div onClick={() => setMobileOpen(false)} style={{
                position: 'fixed', top: `${92 + topOffset}px`, left: 0, right: 0, bottom: 0, zIndex: 998,
                background: 'rgba(15,23,42,0.55)', opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? 'auto' : 'none',
                transition: 'opacity 0.3s ease',
            }} />

            <div className="mobile-drawer-shell" style={{
                position: 'fixed', top: `${92 + topOffset}px`, right: 0, bottom: 0, zIndex: 999,
                width: 'min(86vw, 340px)', background: '#ffffff', display: 'flex', flexDirection: 'column',
                boxShadow: '-16px 0 44px rgba(15,23,42,0.28)', overflow: 'hidden',
                transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
            }}>
                {/* Drawer header — themed gradient banner */}
                <div style={{ padding: '1.15rem 1.35rem', background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0, cursor: 'pointer' }} onClick={() => go(`/school/${slug}`)}>
                        {school.logo_url ? (
                            <img src={school.logo_url} alt={school.name} style={{ height: '38px', width: '38px', objectFit: 'contain', borderRadius: '8px', background: '#fff', padding: '3px', flexShrink: 0 }} />
                        ) : (
                            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                        )}
                        <p style={{ fontFamily: navFont, fontSize: '13.5px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                            {school.name}
                        </p>
                    </div>
                    <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
                        style={{ width: '32px', height: '32px', borderRadius: '9px', border: 'none', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <CloseIcon color="#ffffff" />
                    </button>
                </div>

                {/* Scrollable nav list — key remounts on open so the row entrance animation replays each time */}
                <div key={String(mobileOpen)} className="mobile-drawer-panel" style={{ flex: 1, overflowY: 'auto', padding: '0.7rem' }}>
                    {visibleNavItems.map((item, idx) => {
                        // Plain link
                        if (item.path && !item.links && !item.subItems) {
                            const isActive = activeKey === item.key;
                            return (
                                <div key={item.key} className="mobile-drawer-row-wrap" style={{ marginBottom: '3px', animationDelay: `${idx * 0.04}s` }}>
                                    <div onClick={() => go(item.path(slug))} className="mobile-drawer-row"
                                        style={{ padding: '13px 14px', position: 'relative', borderRadius: '11px', fontSize: '14px', fontWeight: 700, color: isActive ? tc.primary : '#0f172a', background: isActive ? tc.light : 'transparent', cursor: 'pointer' }}>
                                        {isActive && <span style={{ position: 'absolute', left: '3px', top: '24%', bottom: '24%', width: '3px', borderRadius: '3px', background: `linear-gradient(180deg, ${tc.primary}, ${tc.secondary})` }} />}
                                        {item.label}
                                    </div>
                                </div>
                            );
                        }

                        // Single top-level flyout (Sports) — tap label to navigate, tap chevron to expand subitems
                        if (item.subItems && !item.links) {
                            const isExpanded = mobileGroup === item.label;
                            const isActive = activeKey === item.key;
                            return (
                                <div key={item.label} className="mobile-drawer-row-wrap" style={{ marginBottom: '3px', animationDelay: `${idx * 0.04}s` }}>
                                    <div className="mobile-drawer-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', position: 'relative', borderRadius: '11px', background: (isActive || isExpanded) ? tc.light : 'transparent' }}>
                                        {(isActive || isExpanded) && <span style={{ position: 'absolute', left: '3px', top: '24%', bottom: '24%', width: '3px', borderRadius: '3px', background: `linear-gradient(180deg, ${tc.primary}, ${tc.secondary})` }} />}
                                        <span onClick={() => go(item.path(slug))} style={{ fontSize: '14px', fontWeight: 700, color: isActive ? tc.primary : '#0f172a', cursor: 'pointer' }}>
                                            {item.label}
                                        </span>
                                        <span onClick={() => toggleMobileGroup(item.label)} className="mobile-chevron-btn"
                                            style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isExpanded ? '#ffffff' : 'transparent', color: isExpanded ? tc.primary : '#94a3b8' }}>
                                            <ChevronDownSm color={isExpanded ? tc.primary : '#94a3b8'} open={isExpanded} />
                                        </span>
                                    </div>
                                    <div className={`mobile-submenu${isExpanded ? ' open' : ''}`}>
                                        <div style={{ background: tc.light, borderRadius: '11px', margin: '3px 0 0', padding: '4px' }}>
                                            {item.subItems.map(sub => (
                                                <div key={sub.label} onClick={() => go(sub.path(slug))} className="mobile-drawer-row"
                                                    style={{ padding: '11px 12px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                                                    {sub.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Group dropdown (About Us, Academics, Gallery, News & Events, Admissions)
                        const isExpanded = mobileGroup === item.label;
                        const groupHasActive = item.links.some(l => l.key === activeKey);
                        return (
                            <div key={item.label} className="mobile-drawer-row-wrap" style={{ marginBottom: '3px', animationDelay: `${idx * 0.04}s` }}>
                                <div onClick={() => toggleMobileGroup(item.label)} className="mobile-drawer-row"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', position: 'relative', borderRadius: '11px', cursor: 'pointer', background: (groupHasActive || isExpanded) ? tc.light : 'transparent' }}>
                                    {(groupHasActive || isExpanded) && <span style={{ position: 'absolute', left: '3px', top: '24%', bottom: '24%', width: '3px', borderRadius: '3px', background: `linear-gradient(180deg, ${tc.primary}, ${tc.secondary})` }} />}
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: groupHasActive ? tc.primary : '#0f172a' }}>{item.label}</span>
                                    <span className="mobile-chevron-btn" style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isExpanded ? '#ffffff' : 'transparent', color: isExpanded ? tc.primary : '#94a3b8' }}>
                                        <ChevronDownSm color={isExpanded ? tc.primary : '#94a3b8'} open={isExpanded} />
                                    </span>
                                </div>
                                <div className={`mobile-submenu${isExpanded ? ' open' : ''}`}>
                                    <div style={{ background: tc.light, borderRadius: '11px', margin: '3px 0 0', padding: '4px' }}>
                                        {item.links.map(link => {
                                            const isCourses = link.key === 'courses';
                                            const subItems = getSubItems(link);
                                            const hasSub = subItems?.length > 0;
                                            const isSubExpanded = mobileSub === link.key;
                                            const isActive = activeKey === link.key;
                                            return (
                                                <div key={link.key}>
                                                    <div className="mobile-drawer-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', borderRadius: '8px', position: 'relative' }}>
                                                        {isActive && <span style={{ position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)', width: '5px', height: '5px', borderRadius: '50%', background: tc.primary }} />}
                                                        <span onClick={() => { if (!isCourses) go(link.path(slug)); else if (hasSub) toggleMobileSub(link.key); }}
                                                            style={{ fontSize: '13.5px', fontWeight: 600, color: isActive ? tc.primary : '#334155', cursor: 'pointer', paddingLeft: isActive ? '10px' : '0' }}>
                                                            {link.label}
                                                        </span>
                                                        {hasSub && (
                                                            <span onClick={() => toggleMobileSub(link.key)} className="mobile-chevron-btn"
                                                                style={{ width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isSubExpanded ? '#ffffff' : 'transparent', color: isSubExpanded ? tc.primary : '#94a3b8' }}>
                                                                <ChevronDownSm color={isSubExpanded ? tc.primary : '#94a3b8'} open={isSubExpanded} />
                                                            </span>
                                                        )}
                                                    </div>
                                                    {hasSub && (
                                                        <div className={`mobile-submenu${isSubExpanded ? ' open' : ''}`}>
                                                            <div style={{ background: '#ffffff', borderRadius: '8px', padding: '4px', margin: '2px 0 0', borderLeft: `2px solid ${tc.primary}30` }}>
                                                                {subItems.map(sub => (
                                                                    <div key={sub.label} onClick={() => go(sub.path(slug))} className="mobile-drawer-row"
                                                                        style={{ padding: '10px 12px 10px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                                                                        {sub.label}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Drawer footer — quick contact + social links */}
                {(school.phone || school.email || drawerSocials.length > 0) && (
                    <div style={{ padding: '1rem 1.35rem 1.15rem', borderTop: '1px solid #f1f5f9', background: '#f8fafc', flexShrink: 0 }}>
                        {school.phone && (
                            <a href={`tel:${school.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', fontWeight: 600, color: '#334155', textDecoration: 'none', marginBottom: '9px' }}>
                                <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: tc.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <DrawerContactIcon type="phone" color={tc.primary} />
                                </span>
                                {school.phone}
                            </a>
                        )}
                        {school.email && (
                            <a href={`mailto:${school.email}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', fontWeight: 600, color: '#334155', textDecoration: 'none' }}>
                                <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: tc.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <DrawerContactIcon type="mail" color={tc.primary} />
                                </span>
                                {school.email}
                            </a>
                        )}
                        {drawerSocials.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                {drawerSocials.map(s => (
                                    <a key={s.type} href={s.url} target="_blank" rel="noopener noreferrer"
                                        style={{ width: '30px', height: '30px', borderRadius: '8px', background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <DrawerSocialIcon type={s.type} />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
});

Navbar.displayName = 'Navbar';

export default Navbar;
