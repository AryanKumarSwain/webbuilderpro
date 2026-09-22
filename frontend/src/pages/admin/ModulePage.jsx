import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleRegistry } from '../../config/moduleRegistry';
import useSchoolStore from '../../store/schoolStore';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const modulePageMap = {
    'home': '/admin/module/home',
    'about': '/admin/module/about',
    'fee': '/admin/module/fee',
    'courses': '/admin/module/courses',
    'faculty': '/admin/module/faculty',
    'infrastructure': '/admin/module/infrastructure',
    'sports': '/admin/module/sports',
    'gallery': '/admin/module/gallery',
    'achievements': '/admin/module/achievements',
    'alumni': '/admin/module/alumni',
    'testimonials': '/admin/module/testimonials',
    'admissionProcedure': '/admin/module/admissionProcedure',
    'bookList': '/admin/module/bookList',
    'parentsCorner': '/admin/module/parentsCorner',
    'disclosure': '/admin/module/disclosure',
    'tc': '/admin/module/tc',
    'announcements': '/admin/module/announcements',
    'events': '/admin/module/events',
    'circulars': '/admin/module/circulars',
    'faqs': '/admin/module/faqs',
    'calendar': '/admin/module/calendar',
    'results': '/admin/module/results',
    'admission': '/admin/module/admission',
    'career': '/admin/module/career',
};

const ModulePage = () => {
    const { moduleKey } = useParams();
    const navigate = useNavigate();
    const { tc } = useSchoolStore();

    // If a dedicated page exists, redirect to it
    useEffect(() => {
        if (modulePageMap[moduleKey]) {
            navigate(modulePageMap[moduleKey], { replace: true });
        }
    }, [moduleKey]);

    const module = moduleRegistry.find(m => m.key === moduleKey);

    if (!module) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>404</div>
                    <p style={{ fontSize: '16px', color: '#0f172a', fontWeight: 500, marginBottom: '6px' }}>Module not found</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>This module doesn't exist in the registry</p>
                    <button onClick={() => navigate('/admin/dashboard')}
                        style={{ padding: '9px 20px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // If a redirect is about to happen, render nothing
    if (modulePageMap[moduleKey]) return null;

    const categoryColors = {
        pages: { gradient: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, shadow: hexToRgba(tc.primary, 0.25), dot: tc.secondary },
        dynamic: { gradient: 'linear-gradient(135deg, #0f1e3d 0%, #1e3a5f 40%, #1a2d5a 100%)', shadow: 'rgba(37,99,235,0.25)', dot: '#60a5fa' },
        settings: { gradient: 'linear-gradient(135deg, #0a1f0f 0%, #1a3d20 40%, #0f2d15 100%)', shadow: 'rgba(5,150,105,0.25)', dot: '#6ee7b7' },
    };

    const colors = categoryColors[module.category] || categoryColors.pages;

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                .module-page { animation: fadeInUp 0.35s ease forwards; }
            `}</style>

            <div className="module-page" style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Hero Header */}
                <div style={{ background: colors.gradient, borderRadius: '10px', padding: '2.5rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 20px 60px ${colors.shadow}, 0 4px 20px rgba(0,0,0,0.15)` }}>
                    <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${colors.shadow} 0%, transparent 70%)`, top: '-100px', right: '8%', pointerEvents: 'none' }}></div>
                    
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.dot }}></div>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Admin / {module.category} / {module.label}
                                </p>
                            </div>
                            <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '10px', letterSpacing: '-0.5px' }}>
                                {module.label}
                            </h1>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                Manage and publish content for the <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{module.label}</strong> page on your school's public website.
                            </p>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', backdropFilter: 'blur(8px)', minWidth: '130px' }}>
                            <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                {module.icon}
                            </div>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>
                                {module.category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Coming Soon Card */}
                <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '10px', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: '72px', height: '72px', background: tc.light, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: `0 8px 24px ${hexToRgba(tc.primary, 0.12)}`, color: tc.primary }}>
                        {module.icon}
                    </div>

                    <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                        {module.label} — Coming in Milestone 2
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '440px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
                        The content editor for this module is being built. You'll be able to add, edit and publish content for your school website here.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '2rem' }}>
                        {[
                            { label: 'Module Setup', done: true },
                            { label: 'Content Editor', done: false },
                            { label: 'Preview & Publish', done: false },
                        ].map((step, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step.done ? `linear-gradient(135deg,${tc.primary},${tc.secondary})` : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: step.done ? `0 4px 10px ${hexToRgba(tc.primary, 0.3)}` : 'none' }}>
                                    {step.done ? (
                                        <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                    ) : (
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                                    )}
                                </div>
                                <span style={{ fontSize: '12px', color: step.done ? tc.primary : '#94a3b8', fontWeight: step.done ? 600 : 400 }}>{step.label}</span>
                                {i < 2 && <div style={{ width: '24px', height: '1px', background: '#e2e8f0' }}></div>}
                            </div>
                        ))}
                    </div>

                    <button onClick={() => navigate('/admin/dashboard')}
                        style={{ padding: '10px 24px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, boxShadow: `0 4px 14px ${hexToRgba(tc.primary, 0.3)}`, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </>
    );
};

export default ModulePage;