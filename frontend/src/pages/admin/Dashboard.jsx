import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSchoolProfileApi, getSelectedModulesApi } from '../../api/school.api';
import { moduleRegistry } from '../../config/moduleRegistry';
import useAuthStore from '../../store/authStore';
import useSchoolStore from '../../store/schoolStore';
import StorageUsageBar from '../../components/admin/StorageUsageBar';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

// ── Time-of-day icon shown next to the greeting label ──
const GreetingIcon = ({ hour, size = 15, color = 'rgba(255,255,255,0.55)' }) => {
    if (hour < 12) return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <circle cx="12" cy="12" r="4.5" />
            <path strokeLinecap="round" d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
    );
    if (hour < 17) return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 18a4 4 0 01-.5-7.97A5.5 5.5 0 0116.9 8.05 4.5 4.5 0 0117.5 17M6.5 18h11" />
            <path strokeLinecap="round" d="M12 3v1.2M4.6 6.6l.85.85M19.4 6.6l-.85.85" />
        </svg>
    );
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.4 14.7A8.5 8.5 0 019.3 3.6a8.5 8.5 0 1011.1 11.1z" />
        </svg>
    );
};

const IconExternalLink = ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-8 8M8 5H6a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-2" />
    </svg>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { tc } = useSchoolStore();
    const [school, setSchool] = useState(null);
    const [selectedModules, setSelectedModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredAction, setHoveredAction] = useState(null);
    const [hoveredModule, setHoveredModule] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, modulesRes] = await Promise.all([
                getSchoolProfileApi(),
                getSelectedModulesApi()
            ]);
            setSchool(profileRes.data);
            const mods = modulesRes.data.selectedModules;
            setSelectedModules(typeof mods === 'string' ? JSON.parse(mods) : (mods || []));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const hour = new Date().getHours();
    const getGreeting = () => {
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const isLive = school?.status === 'active';

    const stats = [
        {
            label: 'Active Modules',
            value: selectedModules.length,
            sub: 'Pages on your website',
            gradient: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
            shadowColor: hexToRgba(tc.primary, 0.28),
            icon: <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
        },
        {
            label: 'Website Status',
            value: isLive ? 'Live' : 'Pending',
            sub: isLive ? 'Visible to all visitors' : 'Not yet live',
            gradient: isLive ? 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' : 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
            shadowColor: isLive ? 'rgba(5,150,105,0.28)' : 'rgba(217,119,6,0.28)',
            icon: <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>,
        },
        {
            label: 'School Slug',
            value: school?.slug || '—',
            sub: 'Your unique website URL',
            gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            shadowColor: 'rgba(37,99,235,0.28)',
            icon: <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
        },
        {
            label: 'Theme',
            value: school?.theme || 'default',
            sub: 'Active color theme',
            gradient: 'linear-gradient(135deg, #4a1d96 0%, #7c3aed 100%)',
            shadowColor: 'rgba(124,58,237,0.28)',
            icon: <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>,
        },
    ];

    const quickActions = [
        {
            label: 'General Settings',
            desc: 'Update school profile and info',
            path: '/admin/settings',
            gradient: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`,
            shadowColor: hexToRgba(tc.primary, 0.3),
            icon: <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
        },
        {
            label: 'Manage Modules',
            desc: 'Add or remove website pages',
            path: '/admin/modules/select',
            gradient: 'linear-gradient(135deg, #064e3b, #059669)',
            shadowColor: 'rgba(5,150,105,0.3)',
            icon: <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
        },
        {
            label: 'Contact Us',
            desc: 'Update address and social links',
            path: '/admin/contact',
            gradient: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
            shadowColor: 'rgba(37,99,235,0.3)',
            icon: <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
        },
    ];

    return (
        <>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes heroIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes drift1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-24px, 18px) scale(1.08); }
                }
                @keyframes drift2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(20px, -14px) scale(1.05); }
                }
                @keyframes ringPulse {
                    0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.35); }
                    70% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
                    100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
                }
                @keyframes dotPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.55; transform: scale(0.8); }
                }
                .dash-stat { animation: fadeInUp 0.4s ease forwards; cursor: default; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.25s ease; }
                .dash-stat:nth-child(1) { animation-delay: 0.05s; opacity: 0; }
                .dash-stat:nth-child(2) { animation-delay: 0.1s; opacity: 0; }
                .dash-stat:nth-child(3) { animation-delay: 0.15s; opacity: 0; }
                .dash-stat:nth-child(4) { animation-delay: 0.2s; opacity: 0; }
                .dash-stat:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(15,23,42,0.1) !important; }
                .dash-stat:hover .dash-stat-icon { transform: scale(1.08) rotate(-4deg); }
                .dash-stat-icon { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
                .hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .hero-orb-1 { animation: drift1 9s ease-in-out infinite; }
                .hero-orb-2 { animation: drift2 11s ease-in-out infinite; }
                .live-dot { animation: dotPulse 1.8s ease-in-out infinite; }
                .school-logo-ring { animation: ringPulse 2.6s ease-out infinite; }
                .visit-site-link { transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease; }
                .visit-site-link:hover { transform: translateY(-1px); filter: brightness(1.08); }
                @media (max-width: 900px) {
                    .dash-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
                    .dash-bottom-grid { grid-template-columns: 1fr !important; }
                    .dash-modules-grid { grid-template-columns: repeat(3,1fr) !important; }
                }
                @media (max-width: 480px) {
                    .dash-modules-grid { grid-template-columns: repeat(2,1fr) !important; }
                }
                @media (max-width: 640px) {
                    /* ── Hero header — compact, ~half the desktop height ── */
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .dash-hero-inner { gap: 0.85rem !important; }
                    .dash-hero-greeting { margin-bottom: 6px !important; }
                    .dash-hero-greeting p { font-size: 10px !important; }
                    .dash-hero-greeting svg { width: 12px !important; height: 12px !important; }
                    .dash-hero-title { font-size: 19px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .dash-hero-desc { font-size: 11px !important; line-height: 1.5 !important; max-width: 100% !important; }

                    /* ── School card inside hero — smaller logo/text, full width, no wasted height ── */
                    .dash-school-card { padding: 0.7rem 0.85rem !important; gap: 10px !important; min-width: 0 !important; width: 100% !important; border-radius: 12px !important; }
                    .dash-school-card-top { gap: 10px !important; }
                    .dash-school-logo, .dash-school-logo-placeholder { width: 34px !important; height: 34px !important; border-radius: 9px !important; }
                    .dash-school-logo-placeholder svg { width: 17px !important; height: 17px !important; }
                    .dash-school-name { font-size: 12px !important; max-width: 60vw !important; white-space: normal !important; overflow-wrap: break-word !important; word-break: normal !important; margin-bottom: 4px !important; }
                    .dash-school-badge { font-size: 9.5px !important; padding: 2px 8px 2px 6px !important; }
                    .visit-site-link { font-size: 11px !important; padding: 9px 12px !important; }

                    /* ── Stat cards — 2-per-row grid, tighter padding, no cut/ellipsis text ── */
                    .dash-stats-grid { gap: 10px !important; margin-bottom: 1rem !important; }
                    .dash-stat { padding: 0.9rem 0.8rem !important; border-radius: 13px !important; }
                    .dash-stat-header { margin-bottom: 10px !important; }
                    .dash-stat-label { font-size: 10px !important; white-space: normal !important; overflow-wrap: break-word !important; word-break: normal !important; }
                    .dash-stat-icon { width: 28px !important; height: 28px !important; border-radius: 9px !important; }
                    .dash-stat-icon svg { width: 16px !important; height: 16px !important; }
                    .dash-stat-value { font-size: 18px !important; white-space: normal !important; overflow-wrap: break-word !important; word-break: normal !important; line-height: 1.2 !important; }
                    .dash-stat-sub { font-size: 10.5px !important; white-space: normal !important; overflow-wrap: break-word !important; word-break: normal !important; }
                    .dash-stat:active { transform: scale(0.96) !important; transition: transform 0.12s ease !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Welcome Hero */}
                <div className="dash-hero" style={{
                    background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`,
                    borderRadius: '22px',
                    padding: '2.75rem 3rem',
                    marginBottom: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 24px 60px ${hexToRgba(tc.primary, 0.28)}, 0 4px 20px rgba(0,0,0,0.18)`
                }}>
                    {/* Dot-grid texture */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>

                    {/* Animated bg blobs */}
                    <div className="hero-orb-1" style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.3)} 0%, transparent 70%)`, top: '-150px', right: '5%', pointerEvents: 'none' }}></div>
                    <div className="hero-orb-2" style={{ position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.secondary, 0.22)} 0%, transparent 70%)`, bottom: '-100px', right: '35%', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.15)} 0%, transparent 70%)`, top: '20%', left: '40%', pointerEvents: 'none' }}></div>

                    <div className="dash-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                            <div className="hero-item dash-hero-greeting" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', animationDelay: '0.05s' }}>
                                <GreetingIcon hour={hour} />
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                                    {getGreeting()}
                                </p>
                            </div>
                            <h1 className="hero-item dash-hero-title" style={{ fontSize: '34px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', lineHeight: 1.15, letterSpacing: '-0.6px', animationDelay: '0.1s' }}>
                                Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
                            </h1>
                            <p className="hero-item dash-hero-desc" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, maxWidth: '440px', animationDelay: '0.15s' }}>
                                Here's a snapshot of your school website — manage content, modules and settings, all from one place.
                            </p>
                        </div>

                        {/* School Card */}
                        <div className="hero-item dash-school-card" style={{
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '18px',
                            padding: '1.35rem 1.6rem',
                            display: 'flex', flexDirection: 'column', gap: '14px',
                            backdropFilter: 'blur(14px)',
                            minWidth: '260px',
                            animationDelay: '0.2s',
                        }}>
                            <div className="dash-school-card-top" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="school-logo-ring" style={{ borderRadius: '14px', flexShrink: 0 }}>
                                    {school?.logo_url ? (
                                        <img className="dash-school-logo" src={school.logo_url} alt="School" style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.18)', display: 'block' }} />
                                    ) : (
                                        <div className="dash-school-logo-placeholder" style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
                                            <svg width="24" height="24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p className="dash-school-name" style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff', marginBottom: '7px', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{school?.name}</p>
                                    <span className="dash-school-badge" style={{
                                        fontSize: '11px', padding: '3px 10px 3px 8px', borderRadius: '20px', fontWeight: 600,
                                        background: isLive ? 'rgba(21,128,61,0.25)' : 'rgba(161,98,7,0.25)',
                                        color: isLive ? '#86efac' : '#fde68a',
                                        border: isLive ? '1px solid rgba(134,239,172,0.2)' : '1px solid rgba(253,230,138,0.2)',
                                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                                    }}>
                                        <span className="live-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: isLive ? '#4ade80' : '#fbbf24', display: 'inline-block' }}></span>
                                        {isLive ? 'Live' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                            {school?.slug && (
                                <a href={school.custom_domain ? `https://${school.custom_domain}` : `/school/${school.slug}`} target="_blank" rel="noreferrer" className="visit-site-link"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                        fontSize: '12.5px', fontWeight: 700, color: '#ffffff', textDecoration: 'none',
                                        background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`,
                                        borderRadius: '10px', padding: '10px 14px', marginTop: '2px',
                                        boxShadow: `0 6px 16px ${hexToRgba(tc.primary, 0.4)}`,
                                        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                    }}>
                                    View Live Website <IconExternalLink size={12} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="dash-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '1.5rem' }}>
                    {stats.map((s, i) => (
                        <div
                            key={i}
                            className="dash-stat"
                            style={{
                                background: '#ffffff',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                border: '1px solid #f1f5f9',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Top accent line */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: s.gradient }}></div>

                            <div className="dash-stat-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                                <p className="dash-stat-label" style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                                <div className="dash-stat-icon" style={{ width: '36px', height: '36px', borderRadius: '11px', background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${s.shadowColor}`, flexShrink: 0 }}>
                                    {s.icon}
                                </div>
                            </div>
                            <p className="dash-stat-value" style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', lineHeight: 1 }}>{s.value}</p>
                            <p className="dash-stat-sub" style={{ fontSize: '12px', color: '#94a3b8' }}>{s.sub}</p>
                        </div>
                    ))}
                </div>

                <StorageUsageBar />

                {/* Bottom Grid */}
                <div className="dash-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.25rem' }}>

                    {/* Quick Actions */}
                    <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '4px', height: '16px', background: tc.primary, borderRadius: '2px', display: 'inline-block' }}></span>
                            Quick Actions
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {quickActions.map((action, i) => (
                                <div
                                    key={i}
                                    onClick={() => navigate(action.path)}
                                    onMouseEnter={() => setHoveredAction(i)}
                                    onMouseLeave={() => setHoveredAction(null)}
                                    style={{
                                        padding: '14px 16px',
                                        background: '#ffffff',
                                        border: hoveredAction === i ? '1px solid #e2e8f0' : '1px solid #f1f5f9',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        transform: hoveredAction === i ? 'translateX(6px) translateY(-1px)' : 'none',
                                        boxShadow: hoveredAction === i ? `0 8px 24px ${action.shadowColor}` : '0 1px 4px rgba(0,0,0,0.04)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '12px',
                                        background: action.gradient,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 4px 12px ${action.shadowColor}`,
                                        flexShrink: 0,
                                        transition: 'transform 0.2s',
                                        transform: hoveredAction === i ? 'scale(1.1) rotate(-3deg)' : 'scale(1)'
                                    }}>
                                        {action.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{action.label}</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{action.desc}</p>
                                    </div>
                                    <svg style={{ color: hoveredAction === i ? tc.primary : '#cbd5e1', transition: 'all 0.2s', transform: hoveredAction === i ? 'translateX(3px)' : 'none', flexShrink: 0 }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Modules */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '4px', height: '16px', background: tc.primary, borderRadius: '2px', display: 'inline-block' }}></span>
                                Active Modules
                                <span style={{ fontSize: '11px', background: tc.light, color: tc.primary, padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                                    {selectedModules.length}
                                </span>
                            </p>
                            <span
                                onClick={() => navigate('/admin/modules/select')}
                                style={{ fontSize: '12px', color: tc.primary, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                                Manage
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                                </svg>
                            </span>
                        </div>

                        <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                            {selectedModules.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <div style={{ width: '48px', height: '48px', background: tc.light, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                        <svg width="24" height="24" fill="none" stroke={tc.primary} strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 500 }}>No modules selected</p>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>Add pages to your school website</p>
                                    <button onClick={() => navigate('/admin/modules/select')} style={{ padding: '8px 20px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                                        Select Modules
                                    </button>
                                </div>
                            ) : (
                                <div className="dash-modules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
                                    {selectedModules.slice(0, 10).map((key, i) => {
                                        const mod = moduleRegistry.find(m => m.key === key);
                                        if (!mod) return null;
                                        return (
                                            <div
                                                key={key}
                                                onClick={() => navigate(`/admin/module/${key}`)}
                                                onMouseEnter={() => setHoveredModule(key)}
                                                onMouseLeave={() => setHoveredModule(null)}
                                                style={{
                                                    padding: '18px 8px',
                                                    borderRight: (i + 1) % 5 !== 0 ? '1px solid #f8fafc' : 'none',
                                                    borderBottom: i < selectedModules.slice(0, 10).length - 5 ? '1px solid #f8fafc' : 'none',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                                    cursor: 'pointer',
                                                    background: hoveredModule === key ? tc.light : 'transparent',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <div style={{
                                                    width: '36px', height: '36px',
                                                    borderRadius: '10px',
                                                    background: hoveredModule === key ? `linear-gradient(135deg,${tc.primary},${tc.secondary})` : '#f8fafc',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                    boxShadow: hoveredModule === key ? `0 4px 12px ${hexToRgba(tc.primary, 0.25)}` : 'none',
                                                    transform: hoveredModule === key ? 'scale(1.1)' : 'scale(1)',
                                                    color: hoveredModule === key ? '#ffffff' : tc.primary,
                                                }}>
                                                    {mod.icon}
                                                </div>
                                                <span style={{ fontSize: '10px', color: hoveredModule === key ? tc.primary : '#64748b', textAlign: 'center', lineHeight: 1.3, fontWeight: hoveredModule === key ? 600 : 400 }}>
                                                    {mod.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {selectedModules.length > 10 && (
                                <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #f8fafc', background: '#fafafa' }}>
                                    <span onClick={() => navigate('/admin/modules/select')} style={{ fontSize: '12px', color: tc.primary, cursor: 'pointer', fontWeight: 600 }}>
                                        +{selectedModules.length - 10} more modules →
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
