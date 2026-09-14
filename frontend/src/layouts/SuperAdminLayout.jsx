import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import logo from '../assets/webbuilder-removebg-preview.png';
import logoCollapsed from '../assets/webbuilder-collapsed-removebg-preview.png';

const navItems = [
    {
        key: 'dashboard', label: 'Dashboard', path: '/super-admin/dashboard',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    },
    {
        key: 'schools', label: 'Manage Schools', path: '/super-admin/schools',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
    },
    {
        key: 'create-school', label: 'Create School', path: '/super-admin/schools/create',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
    },
    {
        key: 'plans', label: 'Plans & Pricing', path: '/super-admin/plans',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
    },
    {
        key: 'subdomain-requests', label: 'Subdomain Requests', path: '/super-admin/subdomain-requests',
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18"/></svg>
    },
];

const pageTitles = {
    '/super-admin/dashboard': 'Dashboard',
    '/super-admin/schools': 'Manage Schools',
    '/super-admin/schools/create': 'Create School',
    '/super-admin/plans': 'Plans & Pricing',
    '/super-admin/subdomain-requests': 'Subdomain Requests',
};

const SuperAdminLayout = () => {
    // Default to the collapsed (icon-only) sidebar on tablet widths so it doesn't
    // eat most of the screen — the toggle button still lets the admin expand it manually.
    // Below 900px the sidebar is hidden entirely in favor of a hamburger + slide-in drawer.
    const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const title = pageTitles[location.pathname] || 'Super Admin';

    // Close the mobile drawer on route change, and lock background scroll while it's open.
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const NavItem = ({ item, forceExpanded = false, onNavigate }) => {
        const isActive = location.pathname === item.path;
        const isCollapsed = collapsed && !forceExpanded;
        return (
            <div
                onClick={() => { navigate(item.path); onNavigate?.(); }}
                title={isCollapsed ? item.label : ''}
                style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: isCollapsed ? '10px 0' : '9px 16px',
                    margin: '1px 8px', borderRadius: '8px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    cursor: 'pointer',
                    background: isActive ? '#eef2ff' : 'transparent',
                    transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
                <span style={{ color: isActive ? '#4f6ef7' : '#94a3b8', flexShrink: 0 }}>
                    {item.icon}
                </span>
                {!isCollapsed && (
                    <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? '#3c4fd1' : '#334155', whiteSpace: 'nowrap' }}>
                        {item.label}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f5f9', fontFamily: 'system-ui, sans-serif' }}>
            <style>{`
                @media (max-width: 900px) {
                    .sa-sidebar { display: none !important; }
                    .navbar-desktop-toggle { display: none !important; }
                    .navbar-hamburger { display: flex !important; }
                }
                @media (max-width: 640px) {
                    .sa-content-pad { padding: 16px !important; }
                }
                @keyframes saDrawerBackdropIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes saDrawerSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
            `}</style>

            {/* ── Sidebar — desktop/tablet only, replaced by the hamburger + drawer below 900px ── */}
            <div className="sa-sidebar" style={{
                width: collapsed ? '64px' : '260px',
                minHeight: '100vh',
                background: '#ffffff',
                borderRight: '1px solid #eef1f6',
                display: 'flex', flexDirection: 'column',
                transition: 'width 0.25s ease',
                overflow: 'hidden', flexShrink: 0,
            }}>

                {/* Logo */}
                <div style={{
                    height: '80px',
                    padding: collapsed ? '0' : '0 16px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    flexShrink: 0,
                    borderBottom: '1px solid #eef1f6',
                }}>
                    {collapsed ? (
                        <img src={logoCollapsed} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    ) : (
                        <img src={logo} alt="Web Builder Pro" style={{ width: '200px', height: '90px', objectFit: 'contain', objectPosition: 'left center', display: 'block', marginLeft: '8px' }} />
                    )}
                </div>

                {/* Nav */}
                <div style={{ flex: 1, overflowY: 'auto', paddingTop: '14px' }}>
                    {!collapsed && (
                        <div style={{ padding: '4px 20px 8px', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                            Main
                        </div>
                    )}
                    <nav style={{ padding: '4px 0' }}>
                        {navItems.map((item) => <NavItem key={item.key} item={item} />)}
                    </nav>
                </div>

                {/* Footer badge */}
                {!collapsed && (
                    <div style={{ flexShrink: 0, borderTop: '1px solid #eef1f6', padding: '14px 20px' }}>
                        <p style={{ fontSize: '10.5px', color: '#cbd5e1', letterSpacing: '0.03em' }}>Web Builder Pro · Platform</p>
                    </div>
                )}
            </div>

            {/* ── Main ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <Navbar title={title} onToggle={() => setCollapsed(!collapsed)} onMobileOpen={() => setMobileOpen(true)} />
                <div className="sa-content-pad" style={{ flex: 1, padding: '24px', overflowY: 'auto', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>
                    <Outlet />
                </div>
            </div>

            {/* ── Mobile drawer — hamburger-triggered slide-in sidebar below 900px ── */}
            {mobileOpen && (
                <>
                    <div onClick={() => setMobileOpen(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 998, animation: 'saDrawerBackdropIn 0.2s ease' }} />
                    <div style={{
                        position: 'fixed', top: 0, left: 0, bottom: 0, width: 'min(280px, 84vw)', zIndex: 999,
                        background: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        boxShadow: '0 0 40px rgba(0,0,0,0.25)', animation: 'saDrawerSlideIn 0.25s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                        {/* Logo + close */}
                        <div style={{ height: '80px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid #eef1f6' }}>
                            <img src={logo} alt="Web Builder Pro" style={{ width: '170px', height: '76px', objectFit: 'contain', objectPosition: 'left center', display: 'block' }} />
                            <button onClick={() => setMobileOpen(false)}
                                style={{ width: '32px', height: '32px', background: '#f8fafc', border: '1px solid #eef1f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#334155', flexShrink: 0 }}
                                aria-label="Close menu">
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18"/></svg>
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '14px' }}>
                            <div style={{ padding: '4px 20px 8px', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                                Main
                            </div>
                            <nav style={{ padding: '4px 0' }}>
                                {navItems.map((item) => <NavItem key={item.key} item={item} forceExpanded onNavigate={() => setMobileOpen(false)} />)}
                            </nav>
                        </div>

                        <div style={{ flexShrink: 0, borderTop: '1px solid #eef1f6', padding: '14px 20px' }}>
                            <p style={{ fontSize: '10.5px', color: '#cbd5e1', letterSpacing: '0.03em' }}>Web Builder Pro · Platform</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SuperAdminLayout;
