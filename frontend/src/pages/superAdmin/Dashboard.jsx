import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStatsApi } from '../../api/superAdmin.api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const ICONS = {
    schools: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
    active: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    pending: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    suspended: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>,
    admins: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
    plus: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>,
    list: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>,
};

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const res = await getDashboardStatsApi();
            setStats(res.data);
        } catch (e) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const statusColor = (status) => {
        if (status === 'active') return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', dot: '#22c55e' };
        if (status === 'pending') return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' };
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#ef4444' };
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e0e7ff', borderTop: '3px solid #4f6ef7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading dashboard...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const total = stats?.total_schools || 0;
    const active = stats?.active_schools || 0;
    const pending = stats?.pending_schools || 0;
    const suspended = stats?.suspended_schools || 0;
    const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;

    const statCards = [
        { label: 'Total Schools', value: total, icon: ICONS.schools, color: '#4f6ef7', bg: '#eef2ff' },
        { label: 'Active', value: active, icon: ICONS.active, color: '#16a34a', bg: '#f0fdf4' },
        { label: 'Pending', value: pending, icon: ICONS.pending, color: '#d97706', bg: '#fffbeb' },
        { label: 'Suspended', value: suspended, icon: ICONS.suspended, color: '#dc2626', bg: '#fef2f2' },
        { label: 'Total Admins', value: stats?.total_admins || 0, icon: ICONS.admins, color: '#9333ea', bg: '#faf5ff' },
    ];

    const breakdownBars = [
        { label: 'Active Schools', value: active, color: '#22c55e' },
        { label: 'Pending Schools', value: pending, color: '#f59e0b' },
        { label: 'Suspended Schools', value: suspended, color: '#ef4444' },
    ];

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                .dash-section { animation: fadeInUp 0.4s ease forwards; opacity: 0; }
                @media (max-width: 900px) {
                    .dash-main-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 1180px) {
                    .dash-stats { grid-template-columns: repeat(3,1fr) !important; }
                }
                @media (max-width: 640px) {
                    .dash-stats { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
                    .dash-breakdown { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
                    .recent-table-header, .recent-table-row { grid-template-columns: 2fr 1fr !important; padding-left: 14px !important; padding-right: 14px !important; }
                    .recent-col-location, .recent-col-theme { display: none !important; }
                }
                .dash-section:nth-child(1) { animation-delay: 0.03s; }
                .dash-section:nth-child(2) { animation-delay: 0.08s; }
                .dash-section:nth-child(3) { animation-delay: 0.13s; }
                .dash-section:nth-child(4) { animation-delay: 0.18s; }
                .stat-card { transition: all 0.2s ease; }
                .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(15,23,42,0.08); }
                .school-row { transition: background 0.15s; }
                .school-row:hover { background: #f8fafc !important; }
                .cta-tile { transition: all 0.2s ease; cursor: pointer; }
                .cta-tile:hover { transform: translateY(-3px); }
                .create-btn:hover { background: #3c55d6 !important; }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* ── Header ── */}
                <div className="dash-section" style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                        {getGreeting()}, {user?.name || 'Admin'}
                    </h1>
                    <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
                        Manage all schools, admins and platform settings from here.
                    </p>
                </div>

                {/* ── Stat Strip ── */}
                <div className="dash-section dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', marginBottom: '1.5rem' }}>
                    {statCards.map((s, i) => (
                        <div key={i} className="stat-card" style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {s.icon}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: '21px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</p>
                                <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px', whiteSpace: 'nowrap' }}>{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main Grid ── */}
                <div className="dash-section dash-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', marginBottom: '1.5rem' }}>

                    {/* Recent Schools */}
                    <div style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>
                        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Recent Schools</p>
                                <p style={{ fontSize: '11.5px', color: '#94a3b8' }}>Latest registered schools</p>
                            </div>
                            <button onClick={() => navigate('/super-admin/schools')}
                                style={{ padding: '7px 14px', background: '#eef2ff', color: '#4f6ef7', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                View All
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>

                        <div className="recent-table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 24px', background: '#f8fafc' }}>
                            {['School', 'Location', 'Theme', 'Status'].map(h => (
                                <span key={h} className={h === 'Location' ? 'recent-col-location' : h === 'Theme' ? 'recent-col-theme' : ''} style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
                            ))}
                        </div>

                        {(stats?.recent_schools || []).length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <div style={{ width: '48px', height: '48px', background: '#eef2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <span style={{ color: '#4f6ef7' }}>{ICONS.schools}</span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>No schools yet</p>
                                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Create your first school to get started</p>
                            </div>
                        ) : (
                            (stats?.recent_schools || []).map((school, i) => {
                                const sc = statusColor(school.status);
                                return (
                                    <div key={i} className="school-row recent-table-row"
                                        onClick={() => navigate('/super-admin/schools')}
                                        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 24px', borderBottom: i < stats.recent_schools.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                            {school.logo_url ? (
                                                <img src={school.logo_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                                            ) : (
                                                <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#6d8bff,#4f6ef7)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                                                </div>
                                            )}
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{school.name}</p>
                                                <p style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{school.slug}</p>
                                            </div>
                                        </div>
                                        <span className="recent-col-location" style={{ fontSize: '12px', color: '#64748b' }}>{school.city ? `${school.city}, ${school.state}` : '—'}</span>
                                        <span className="recent-col-theme" style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>{school.theme || 'default'}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, display: 'inline-flex', alignItems: 'center', gap: '5px', width: 'fit-content', textTransform: 'capitalize' }}>
                                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.dot }}></div>
                                            {school.status}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Quick Action Tiles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="cta-tile" onClick={() => navigate('/super-admin/schools/create')}
                            style={{ background: 'linear-gradient(135deg,#6d8bff,#4f6ef7)', borderRadius: '14px', padding: '1.5rem', color: '#ffffff', boxShadow: '0 12px 28px rgba(79,110,247,0.3)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', top: '-40px', right: '-30px' }}></div>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.18)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                {ICONS.plus}
                            </div>
                            <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '3px', position: 'relative' }}>Create New School</p>
                            <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.75)', position: 'relative' }}>Add a school + admin account</p>
                        </div>

                        <div className="cta-tile" onClick={() => navigate('/super-admin/schools')}
                            style={{ background: 'linear-gradient(135deg,#34d399,#059669)', borderRadius: '14px', padding: '1.5rem', color: '#ffffff', boxShadow: '0 12px 28px rgba(5,150,105,0.28)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', top: '-40px', right: '-30px' }}></div>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.18)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                {ICONS.list}
                            </div>
                            <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '3px', position: 'relative' }}>Manage Schools</p>
                            <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.75)', position: 'relative' }}>View, activate or suspend</p>
                        </div>
                    </div>
                </div>

                {/* ── Status Breakdown ── */}
                <div className="dash-section" style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '14px', padding: '1.5rem 1.75rem', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1.5rem' }}>Platform Status Breakdown</p>
                    <div className="dash-breakdown" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2.5rem' }}>
                        {breakdownBars.map((b, i) => {
                            const p = pct(b.value);
                            return (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>{b.label}</span>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: b.color }}>{b.value} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>({p}%)</span></span>
                                    </div>
                                    <div style={{ position: 'relative', height: '6px', borderRadius: '3px', background: '#f1f5f9' }}>
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p}%`, borderRadius: '3px', background: b.color, transition: 'width 0.6s ease' }}></div>
                                        <div style={{ position: 'absolute', left: `calc(${p}% - 7px)`, top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', borderRadius: '50%', background: '#ffffff', border: `3px solid ${b.color}`, boxShadow: '0 2px 6px rgba(0,0,0,0.15)', transition: 'left 0.6s ease' }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SuperAdminDashboard;
