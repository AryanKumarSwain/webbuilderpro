import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { logoutApi } from '../../api/auth.api';
import ChangePasswordModal from './ChangePasswordModal';
import toast from 'react-hot-toast';

// ── Top navbar for the Super Admin panel (the only place this component is used) ──
const Navbar = ({ title = 'Dashboard', onToggle, onMobileOpen }) => {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [showChangePassword, setShowChangePassword] = useState(false);

    const handleLogout = async () => {
        try { await logoutApi(); } catch (e) {}
        clearAuth();
        navigate('/super-admin/login');
        toast.success('Logged out successfully');
    };

    const pathParts = location.pathname.split('/').filter(Boolean).slice(1); // drop "super-admin"

    return (
        <>
            <style>{`
                .navbar-logout:hover { background: #fef2f2 !important; border-color: #fecaca !important; color: #b91c1c !important; }
                .navbar-change-pw:hover { background: #eef2ff !important; border-color: #c7d2fe !important; color: #4f6ef7 !important; }
                .navbar-toggle:hover { background: #f1f5f9 !important; border-color: #e2e8f0 !important; }
                .navbar-hamburger { display: none; }
                @media (max-width: 900px) {
                    .navbar-desktop-toggle { display: none !important; }
                    .navbar-hamburger { display: flex !important; }
                    .navbar-breadcrumb-root { display: none !important; }
                }
                @media (max-width: 640px) {
                    .navbar-username-block { display: none !important; }
                    .navbar-logout-text { display: none !important; }
                    .navbar-change-pw-btn, .navbar-logout-btn { padding: 7px 9px !important; }
                }
                @media (max-width: 420px) {
                    .navbar-root { padding: 0 12px 0 10px !important; }
                    .navbar-right { gap: 8px !important; }
                }
            `}</style>

            <div className="navbar-root" style={{
                height: '64px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px 0 16px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: '1px solid #eef1f6',
                gap: '10px',
            }}>

                {/* Left — toggle + breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <button
                        className="navbar-toggle navbar-desktop-toggle"
                        onClick={onToggle}
                        style={{
                            width: '34px', height: '34px',
                            background: 'transparent',
                            border: '1px solid #eef1f6',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b',
                            flexShrink: 0,
                            transition: 'all 0.15s'
                        }}
                    >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>

                    {/* Hamburger — mobile/tablet only, opens the slide-in drawer */}
                    <button
                        className="navbar-toggle navbar-hamburger"
                        onClick={onMobileOpen}
                        aria-label="Open menu"
                        style={{
                            width: '34px', height: '34px',
                            background: 'transparent',
                            border: '1px solid #eef1f6',
                            borderRadius: '8px',
                            alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b',
                            flexShrink: 0,
                            transition: 'all 0.15s'
                        }}
                    >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>

                    {/* Breadcrumb — the "Super Admin" root label + intermediate crumbs hide on
                        mobile (the hamburger + sidebar already establish context); the current
                        page title always stays visible and truncates rather than overflowing. */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span className="navbar-breadcrumb-root" style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>Super Admin</span>
                        {pathParts.map((part, i) => (
                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                {i < pathParts.length - 1 ? (
                                    <span className="navbar-breadcrumb-root" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <svg width="12" height="12" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                                        </svg>
                                        <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                            {part.replace(/-/g, ' ')}
                                        </span>
                                    </span>
                                ) : (
                                    <>
                                        <svg className="navbar-breadcrumb-root" width="12" height="12" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                                        </svg>
                                        <span style={{
                                            fontSize: '14px', fontWeight: 600, color: '#0f172a',
                                            textTransform: 'capitalize', letterSpacing: '-0.2px',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {part.replace(/-/g, ' ')}
                                        </span>
                                    </>
                                )}
                            </span>
                        ))}
                        {pathParts.length === 0 && (
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                        )}
                    </div>
                </div>

                {/* Right */}
                <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

                    {/* User avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '34px', height: '34px',
                            background: 'linear-gradient(135deg, #6d8bff, #4f6ef7)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 700,
                            color: '#ffffff',
                            boxShadow: '0 2px 10px rgba(79,110,247,0.3)',
                            flexShrink: 0
                        }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className="navbar-username-block">
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
                                {user?.name || 'Admin'}
                            </p>
                            <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Super Admin
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '24px', background: '#eef1f6' }}></div>

                    {/* Change Password */}
                    <button
                        className="navbar-change-pw navbar-change-pw-btn"
                        onClick={() => setShowChangePassword(true)}
                        style={{
                            padding: '7px 14px',
                            background: 'transparent',
                            border: '1px solid #eef1f6',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#64748b',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontWeight: 500,
                            transition: 'all 0.15s'
                        }}
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="10" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        <span className="navbar-logout-text">Change Password</span>
                    </button>

                    {/* Logout */}
                    <button
                        className="navbar-logout navbar-logout-btn"
                        onClick={handleLogout}
                        style={{
                            padding: '7px 14px',
                            background: 'transparent',
                            border: '1px solid #eef1f6',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#64748b',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontWeight: 500,
                            transition: 'all 0.15s'
                        }}
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        <span className="navbar-logout-text">Logout</span>
                    </button>
                </div>
            </div>

            {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
        </>
    );
};

export default Navbar;
