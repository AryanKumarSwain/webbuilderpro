import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import useSchoolStore from "../store/schoolStore";
import useAuthStore from "../store/authStore";
import { getSelectedModulesApi } from "../api/school.api";
import { moduleRegistry } from "../config/moduleRegistry";
import { logoutApi } from "../api/auth.api";
import toast from "react-hot-toast";
import logo from "../assets/webbuilder-removebg-preview.png";
import logoCollapsed from "../assets/webbuilder-collapsed-removebg-preview.png";
import { getFontFamily } from "../constants/fonts";

const pageTitles = {
    "/admin/dashboard": "Dashboard",
    "/admin/accept-terms": "Terms & Conditions",
    "/admin/modules/select": "Select Modules",
    "/admin/billing": "Billing",
    "/admin/settings": "General Settings",
    "/admin/contact": "Contact Us",
    "/admin/module/home": "Home Page",
};

const SectionLabel = ({ children, tc }) => (
    <div style={{ padding: "10px 16px 6px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "14px", height: "2px", borderRadius: "2px", background: `linear-gradient(90deg, ${tc.primary}, ${tc.secondary})`, flexShrink: 0 }} />
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{children}</span>
    </div>
);

const AdminLayout = () => {
    // Desktop-only icon-collapse toggle (≥900px) — below that the sidebar hides entirely
    // and a hamburger + slide-in drawer takes over, same pattern as the public site's Navbar.
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [selectedModules, setSelectedModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [moduleSearch, setModuleSearch] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const searchInputRef = useRef(null);
    const { school, tc, bc, fetchSchool } = useSchoolStore();
    const { user, clearAuth } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    // ⌘K / Ctrl+K focuses the module search from anywhere in the admin panel.
    useEffect(() => {
        const onKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    // Close the mobile drawer on route change, and lock background scroll while it's open.
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    // Back-to-top float button — the admin navbar is `position: sticky`, which only
    // makes sense if the window itself scrolls (the `.admin-content-pad` pane below
    // just grows taller than the viewport rather than scrolling internally), so this
    // tracks window scroll rather than any inner element's scrollTop.
    useEffect(() => {
        window.scrollTo(0, 0);
        setShowBackToTop(false);
        const onScroll = () => setShowBackToTop(window.scrollY > 200);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, [location.pathname]);

    const scrollContentToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const hexToRgba = (hex, alpha) => {
        const h = hex.replace("#", "");
        const n = parseInt(h, 16);
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
    };

    const theme = {
        sidebarBg: bc.card,
        sidebarText: '#334155',
        sidebarTextMuted: '#94a3b8',
        sidebarActive: tc.primary,
        sidebarActiveBg: tc.light,
        sidebarActiveText: tc.primary,
        sidebarHover: tc.light,
        navbarBg: '#ffffff',
        navbarText: '#0f172a',
        contentBg: bc.surface,
    };

    useEffect(() => {
        fetchModules();
    }, [location.pathname]);

    useEffect(() => {
        fetchSchool();
    }, []);

    const fetchModules = async () => {
        try {
            const res = await getSelectedModulesApi();
            const { selectedModules: mods, isFirstLogin, hasActivePlan, hasAcceptedTerms } = res.data;
            if (!hasAcceptedTerms) {
                if (location.pathname !== "/admin/accept-terms") navigate("/admin/accept-terms");
                setLoading(false);
                return;
            }
            if (!hasActivePlan) {
                if (location.pathname !== "/admin/billing") navigate("/admin/billing");
                setLoading(false);
                return;
            }
            if (isFirstLogin) {
                navigate("/admin/modules/select");
                return;
            }
            const parsedMods = typeof mods === "string" ? JSON.parse(mods) : mods || [];
            setSelectedModules(parsedMods);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try { await logoutApi(); } catch (e) {}
        clearAuth();
        navigate("/login");
        toast.success("Logged out successfully");
    };

    const coreItems = [
        {
            key: "dashboard", label: "Dashboard", path: "/admin/dashboard",
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
        },
        {
            key: "contact", label: "Contact Us", path: "/admin/contact",
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
        },
        {
            key: "settings", label: "General Settings", path: "/admin/settings",
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
        },
        {
            key: "billing", label: "Plan & Billing", path: "/admin/billing",
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0v4"/></svg>,
        },
    ];

    // 'contact'/'settings' aren't real toggleable modules (see moduleRegistry.jsx's
    // "Configuration" category note) but can still end up in a school's saved
    // selected_modules (e.g. via ModuleSelector's old "Select All"). They already
    // have fixed entries in coreItems above (Main section), so they're dropped here
    // rather than also rendered a second time in the Modules section.
    const FIXED_NAV_MODULE_KEYS = ['contact', 'settings'];

    const moduleItems = selectedModules
        .filter((key) => !FIXED_NAV_MODULE_KEYS.includes(key))
        .map((key) => moduleRegistry.find((m) => m.key === key))
        .filter(Boolean)
        .map((m) => ({
            key: m.key,
            label: m.label,
            path: m.key === 'home' ? '/admin/module/home' : `/admin/module/${m.key}`,
            icon: m.icon,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

    const title =
        pageTitles[location.pathname] ||
        moduleRegistry.find((m) => `/admin/module/${m.key}` === location.pathname)?.label ||
        "Admin Panel";

    // Search only among this school's active modules — matches the sidebar's Modules list.
    const searchResults = moduleSearch.trim()
        ? moduleItems.filter((m) => m.label.toLowerCase().includes(moduleSearch.trim().toLowerCase()))
        : [];

    const goToSearchResult = (item) => {
        navigate(item.path);
        setModuleSearch("");
        setSearchFocused(false);
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.contentBg }}>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading...</p>
            </div>
        );
    }

    const NavItem = ({ item, index = 0, forceExpanded = false, onNavigate }) => {
        const isActive = location.pathname === item.path;
        const isCollapsed = collapsed && !forceExpanded;
        return (
            <div
                className="admin-nav-item"
                onClick={() => { navigate(item.path); onNavigate?.(); }}
                title={isCollapsed ? item.label : ""}
                style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: isCollapsed ? "8px 0" : "8px 12px",
                    margin: "2px 8px", borderRadius: "10px",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    cursor: "pointer", position: "relative",
                    background: isActive ? `linear-gradient(135deg, ${theme.sidebarActiveBg}, #ffffff)` : "transparent",
                    border: isActive ? `1px solid ${hexToRgba(tc.primary, 0.28)}` : "1px solid transparent",
                    boxShadow: isActive ? `0 2px 8px ${hexToRgba(tc.primary, 0.12)}` : "none",
                    animationDelay: `${Math.min(index, 12) * 0.03}s`,
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = theme.sidebarHover; e.currentTarget.style.borderColor = "#e2e8f0"; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
            >
                {isActive && !isCollapsed && (
                    <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "3px", height: "58%", borderRadius: "0 4px 4px 0", background: `linear-gradient(180deg, ${tc.primary}, ${tc.secondary})` }} />
                )}
                <span className="admin-nav-icon" style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                    background: isActive ? `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})` : hexToRgba(tc.primary, 0.06),
                    border: isActive ? "1px solid rgba(255,255,255,0.35)" : `1px solid ${hexToRgba(tc.primary, 0.14)}`,
                    color: isActive ? "#ffffff" : theme.sidebarTextMuted,
                    boxShadow: isActive ? `0 3px 10px ${hexToRgba(tc.primary, 0.35)}` : "none",
                }}>
                    {item.icon}
                </span>
                {!isCollapsed && (
                    <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 500, letterSpacing: "-0.1px", color: isActive ? theme.sidebarActiveText : theme.sidebarText, whiteSpace: "nowrap" }}>
                        {item.label}
                    </span>
                )}
                {isActive && isCollapsed && (
                    <span style={{ position: "absolute", bottom: "3px", left: "50%", transform: "translateX(-50%)", width: "4px", height: "4px", borderRadius: "50%", background: tc.primary }} />
                )}
            </div>
        );
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.contentBg, fontFamily: "system-ui, sans-serif" }}>
            <style>{`
                @media (max-width: 640px) {
                    .admin-navbar-username { display: none !important; }
                    .admin-navbar-logout-text { display: none !important; }
                }
                @media (max-width: 900px) {
                    .admin-sidebar { display: none !important; }
                    .admin-desktop-toggle { display: none !important; }
                    .admin-hamburger { display: flex !important; }
                    .admin-navbar-search { display: none !important; }
                }
                @keyframes adminDrawerBackdropIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes adminDrawerSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }

                /* ── Sidebar nav polish ── */
                @keyframes sidebarItemIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
                .admin-nav-item { animation: sidebarItemIn 0.35s cubic-bezier(0.16,1,0.3,1) both; transition: background 0.2s ease; }
                .admin-nav-icon { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease; }
                .admin-nav-item:hover .admin-nav-icon { transform: scale(1.1); }
                .admin-nav-item:active .admin-nav-icon { transform: scale(0.94); }
                @keyframes logoRingPulse { 0%, 100% { box-shadow: 0 0 0 0 ${hexToRgba(tc.primary, 0.35)}; } 50% { box-shadow: 0 0 0 6px ${hexToRgba(tc.primary, 0)}; } }
                .admin-logo-ring { animation: logoRingPulse 2.6s ease-in-out infinite; border-radius: 10px; }
            `}</style>

            {/* Sidebar — desktop only below 900px, replaced by the hamburger + drawer */}
            <div className="admin-sidebar" style={{
                width: collapsed ? "64px" : "260px",
                minHeight: "100vh",
                background: theme.sidebarBg,
                backgroundImage: "radial-gradient(rgba(15,23,42,0.035) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
                display: "flex", flexDirection: "column",
                transition: "width 0.25s ease",
                overflow: "hidden", flexShrink: 0,
                position: "relative",
                boxShadow: "1px 0 0 rgba(15,23,42,0.06), 4px 0 24px rgba(15,23,42,0.03)",
                fontFamily: "'Inter', system-ui, sans-serif",
            }}>
                {/* Decorative theme-colored orbs — same visual language as the page hero headers,
                    so the sidebar doesn't read as a flat, empty column ── */}
                <div style={{ position: "absolute", width: "220px", height: "220px", borderRadius: "50%", background: `radial-gradient(circle, ${hexToRgba(tc.secondary, 0.16)} 0%, transparent 70%)`, top: "-90px", left: "-70px", pointerEvents: "none" }} />
                <div style={{ position: "absolute", width: "260px", height: "260px", borderRadius: "50%", background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.1)} 0%, transparent 70%)`, bottom: "120px", right: "-120px", pointerEvents: "none" }} />

                {/* Logo */}
                <div style={{
                    height: "80px",
                    padding: collapsed ? "0" : "0 16px",
                    display: "flex", alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1,
                }}>
                    {collapsed ? (
                        <img src={logoCollapsed} alt="Logo" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
                    ) : (
                        <img src={logo} alt="Web Builder Pro" style={{ width: "200px", height: "90px", objectFit: "contain", objectPosition: "left center", display: "block", marginLeft: "8px" }} />
                    )}
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, borderBottom: "1px solid #f1f5f9" }} />
                    <div style={{ position: "absolute", left: "16px", right: "16px", bottom: 0, height: "2px", borderRadius: "2px", background: `linear-gradient(90deg, ${tc.primary}, ${tc.secondary}, transparent)`, opacity: 0.55 }} />
                </div>

                {/* Scrollable nav area — fills remaining space so the branding footer below always stays pinned to the bottom */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "10px 8px 0", zIndex: 1, position: "relative" }}>
                    {/* Core Nav */}
                    <div style={{ border: "1px solid #f1f5f9", borderRadius: "14px", background: "rgba(255,255,255,0.6)", padding: "4px 0" }}>
                        {!collapsed && (
                            <SectionLabel tc={tc}>Main</SectionLabel>
                        )}
                        <nav style={{ padding: "4px 0" }}>
                            {coreItems.map((item, i) => <NavItem key={item.key} item={item} index={i} />)}
                        </nav>
                    </div>

                    {/* Modules Nav */}
                    {moduleItems.length > 0 && (
                        <div style={{ border: "1px solid #f1f5f9", borderRadius: "14px", background: "rgba(255,255,255,0.6)", padding: "4px 0" }}>
                            {!collapsed && (
                                <SectionLabel tc={tc}>Modules</SectionLabel>
                            )}
                            <nav style={{ padding: "4px 0" }}>
                                {moduleItems.map((item, i) => <NavItem key={item.key} item={item} index={coreItems.length + i} />)}
                            </nav>
                        </div>
                    )}
                </div>

                {/* School branding — pinned at the bottom, always visible, never scrolls away */}
                {school && (
                    <div style={{ flexShrink: 0, borderTop: "0.5px solid #f1f5f9", padding: collapsed ? "10px 8px" : "12px", position: "relative", zIndex: 1 }}>
                        <div style={{
                            padding: collapsed ? "8px 0" : "10px 12px",
                            borderRadius: "14px",
                            background: `linear-gradient(135deg, ${tc.light}, #ffffff)`,
                            border: `1px solid ${hexToRgba(tc.primary, 0.14)}`,
                            display: "flex", alignItems: "center", gap: "12px",
                            justifyContent: collapsed ? "center" : "flex-start",
                        }}>
                            <div className="admin-logo-ring" style={{ flexShrink: 0 }}>
                                {school.logo_url ? (
                                    <img src={school.logo_url} alt={school.name} style={{ width: "44px", height: "44px", objectFit: "contain", borderRadius: "10px", display: "block" }} />
                                ) : (
                                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})` }}></div>
                                )}
                            </div>
                            {!collapsed && (
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: "9.5px", fontWeight: 700, color: tc.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>School Admin</p>
                                    <span style={{
                                        fontFamily: getFontFamily(school.nav_font), fontSize: "14.5px", fontWeight: 700,
                                        letterSpacing: "-0.1px", color: theme.sidebarText, lineHeight: 1.3,
                                        minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                    }}>
                                        {school.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Main */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* Navbar */}
                <div style={{
                    height: "64px", background: theme.navbarBg,
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 24px 0 16px",
                    position: "sticky", top: 0, zIndex: 100,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <button
                            className="admin-desktop-toggle"
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ width: "32px", height: "32px", background: "transparent", border: "0.5px solid #e2e8f0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: theme.navbarText }}
                        >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                        <button
                            className="admin-hamburger"
                            onClick={() => setMobileOpen(true)}
                            style={{ display: "none", width: "32px", height: "32px", background: "transparent", border: "0.5px solid #e2e8f0", borderRadius: "8px", alignItems: "center", justifyContent: "center", cursor: "pointer", color: theme.navbarText }}
                            aria-label="Open menu"
                        >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                        <div>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Admin / </span>
                            <span style={{ fontSize: "14px", fontWeight: 500, color: theme.navbarText }}>{title}</span>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        {/* Module search — searches this school's active modules only; picking a
                            result navigates straight into that module's admin page. Sits just
                            left of the admin avatar, ⌘K/Ctrl+K focuses it from anywhere. */}
                        <div className="admin-navbar-search" style={{ position: "relative", width: "236px" }}>
                            <svg width="14" height="14" fill="none" stroke={searchFocused ? tc.primary : "#94a3b8"} strokeWidth="2.2" viewBox="0 0 24 24" style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", transition: "stroke 0.15s ease" }}>
                                <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={moduleSearch}
                                onChange={(e) => setModuleSearch(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                                placeholder="Search modules"
                                style={{
                                    width: "100%", padding: moduleSearch || searchFocused ? "8px 12px 8px 32px" : "8px 44px 8px 32px",
                                    borderRadius: "8px", fontSize: "13px", color: theme.navbarText, outline: "none", boxSizing: "border-box",
                                    background: searchFocused ? "#ffffff" : "#f8fafc",
                                    border: `1px solid ${searchFocused ? tc.primary : "#e2e8f0"}`,
                                    boxShadow: searchFocused ? `0 0 0 3px ${hexToRgba(tc.primary, 0.12)}` : "none",
                                    transition: "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
                                }}
                            />
                            {!moduleSearch && !searchFocused && (
                                <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "1px", padding: "2px 6px", borderRadius: "5px", background: "#eef1f6", border: "0.5px solid #e2e8f0", fontSize: "10.5px", fontWeight: 600, color: "#94a3b8", pointerEvents: "none" }}>
                                    ⌘K
                                </span>
                            )}
                            {searchFocused && moduleSearch.trim() && (
                                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: "300px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 16px 36px rgba(15,23,42,0.16)", overflow: "hidden", zIndex: 150 }}>
                                    {searchResults.length === 0 ? (
                                        <div style={{ padding: "22px 16px", textAlign: "center" }}>
                                            <p style={{ fontSize: "12.5px", color: "#94a3b8" }}>No active modules match <span style={{ fontWeight: 600, color: "#64748b" }}>"{moduleSearch.trim()}"</span></p>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ padding: "9px 14px", borderBottom: "0.5px solid #f1f5f9", background: "#fafbfc" }}>
                                                <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                    Modules · {searchResults.length}
                                                </span>
                                            </div>
                                            {searchResults.map((item, i) => (
                                                <div key={item.key} onMouseDown={() => goToSearchResult(item)} className="admin-search-result"
                                                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 14px", cursor: "pointer", borderBottom: i < searchResults.length - 1 ? "0.5px solid #f8fafc" : "none" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.sidebarHover; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                                >
                                                    <span style={{ width: "28px", height: "28px", borderRadius: "8px", background: hexToRgba(tc.primary, 0.1), display: "flex", alignItems: "center", justifyContent: "center", color: tc.primary, flexShrink: 0 }}>
                                                        {item.icon}
                                                    </span>
                                                    <span style={{ fontSize: "13px", fontWeight: 500, color: theme.navbarText, flex: 1 }}>{item.label}</span>
                                                    <svg width="13" height="13" fill="none" stroke="#cbd5e1" strokeWidth="2.3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ width: "30px", height: "30px", background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff" }}>
                            {user?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <span className="admin-navbar-username" style={{ fontSize: "13px", fontWeight: 500, color: theme.navbarText }}>
                            {user?.name || "Admin"}
                        </span>
                        <div style={{ width: "1px", height: "20px", background: "#e2e8f0" }}></div>
                        <button
                            onClick={handleLogout}
                            style={{ padding: "6px 12px", background: "transparent", border: "0.5px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                        >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            <span className="admin-navbar-logout-text">Logout</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="admin-content-pad" style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
                    <Outlet />
                </div>
            </div>

            {/* Back to top — floats over any admin page once it's scrolled even a little */}
            <button
                onClick={scrollContentToTop}
                aria-label="Back to top"
                style={{
                    position: "fixed", bottom: "24px", right: "24px", zIndex: 200,
                    width: "44px", height: "44px", borderRadius: "50%", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `linear-gradient(160deg, ${tc.secondary}, ${tc.primary} 65%, ${tc.dark})`,
                    color: "#ffffff",
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 10px ${hexToRgba(tc.dark, 0.3)}, 0 10px 24px ${hexToRgba(tc.primary, 0.45)}`,
                    opacity: showBackToTop ? 1 : 0,
                    transform: showBackToTop ? "translateY(0) scale(1)" : "translateY(14px) scale(0.85)",
                    pointerEvents: showBackToTop ? "auto" : "none",
                    transition: "opacity 0.25s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                }}
            >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>

            {/* Mobile drawer — hamburger-triggered slide-in sidebar for <900px, same pattern
                as the public site's Navbar mobile menu ── */}
            {mobileOpen && (
                <>
                    <div onClick={() => setMobileOpen(false)}
                        style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 998, animation: "adminDrawerBackdropIn 0.2s ease" }} />
                    <div style={{
                        position: "fixed", top: 0, left: 0, bottom: 0, width: "min(280px, 84vw)", zIndex: 999,
                        background: theme.sidebarBg,
                        backgroundImage: "radial-gradient(rgba(15,23,42,0.035) 1px, transparent 1px)",
                        backgroundSize: "18px 18px",
                        display: "flex", flexDirection: "column", overflow: "hidden",
                        boxShadow: "0 0 40px rgba(0,0,0,0.25)", animation: "adminDrawerSlideIn 0.25s cubic-bezier(0.16,1,0.3,1)",
                        fontFamily: "'Inter', system-ui, sans-serif",
                    }}>
                        <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: `radial-gradient(circle, ${hexToRgba(tc.secondary, 0.16)} 0%, transparent 70%)`, top: "-80px", left: "-60px", pointerEvents: "none" }} />
                        <div style={{ position: "absolute", width: "220px", height: "220px", borderRadius: "50%", background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.1)} 0%, transparent 70%)`, bottom: "100px", right: "-100px", pointerEvents: "none" }} />

                        {/* Logo + close */}
                        <div style={{ height: "80px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "0.5px solid #f1f5f9", position: "relative", zIndex: 1 }}>
                            <img src={logo} alt="Web Builder Pro" style={{ width: "170px", height: "76px", objectFit: "contain", objectPosition: "left center", display: "block" }} />
                            <button onClick={() => setMobileOpen(false)}
                                style={{ width: "32px", height: "32px", background: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: theme.navbarText, flexShrink: 0 }}
                                aria-label="Close menu">
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18"/></svg>
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "10px 8px 0", position: "relative", zIndex: 1 }}>
                            <div style={{ border: "1px solid #f1f5f9", borderRadius: "14px", background: "rgba(255,255,255,0.6)", padding: "4px 0" }}>
                                <SectionLabel tc={tc}>Main</SectionLabel>
                                <nav style={{ padding: "4px 0" }}>
                                    {coreItems.map((item, i) => <NavItem key={item.key} item={item} index={i} forceExpanded onNavigate={() => setMobileOpen(false)} />)}
                                </nav>
                            </div>
                            {moduleItems.length > 0 && (
                                <div style={{ border: "1px solid #f1f5f9", borderRadius: "14px", background: "rgba(255,255,255,0.6)", padding: "4px 0" }}>
                                    <SectionLabel tc={tc}>Modules</SectionLabel>
                                    <nav style={{ padding: "4px 0" }}>
                                        {moduleItems.map((item, i) => <NavItem key={item.key} item={item} index={coreItems.length + i} forceExpanded onNavigate={() => setMobileOpen(false)} />)}
                                    </nav>
                                </div>
                            )}
                        </div>

                        {school && (
                            <div style={{ flexShrink: 0, borderTop: "0.5px solid #f1f5f9", padding: "12px", position: "relative", zIndex: 1 }}>
                                <div style={{
                                    padding: "10px 12px", borderRadius: "14px",
                                    background: `linear-gradient(135deg, ${tc.light}, #ffffff)`,
                                    border: `1px solid ${hexToRgba(tc.primary, 0.14)}`,
                                    display: "flex", alignItems: "center", gap: "12px",
                                }}>
                                    <div className="admin-logo-ring" style={{ flexShrink: 0 }}>
                                        {school.logo_url ? (
                                            <img src={school.logo_url} alt={school.name} style={{ width: "44px", height: "44px", objectFit: "contain", borderRadius: "10px", display: "block" }} />
                                        ) : (
                                            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})` }}></div>
                                        )}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: "9.5px", fontWeight: 700, color: tc.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>School Admin</p>
                                        <span style={{ fontFamily: getFontFamily(school.nav_font), fontSize: "14px", fontWeight: 700, letterSpacing: "-0.1px", color: theme.sidebarText, lineHeight: 1.3, minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {school.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminLayout;