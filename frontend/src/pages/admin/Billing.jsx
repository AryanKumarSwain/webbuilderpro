import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getActivePlansApi } from '../../api/plans.api';
import { createBillingOrderApi, verifyBillingPaymentApi } from '../../api/billing.api';
import { getMySubdomainRequestApi } from '../../api/subdomainRequest.api';
import SubdomainRequestForm from '../../components/admin/SubdomainRequestForm';
import useAuthStore from '../../store/authStore';
import useSchoolStore from '../../store/schoolStore';

// ── Distinct Curated Palettes for Plans ──
// Each tier receives a bespoke, vibrant aesthetic identity (e.g. Plan 1: Oceanic Azure,
// Plan 2: Royal Violet / Electric Indigo, Plan 3: Sunset Coral, Plan 4: Emerald Mint).
const PLAN_THEMES = [
    {
        id: 'azure',
        name: 'Azure',
        primary: '#0284c7',
        secondary: '#2563eb',
        dark: '#0369a1',
        light: '#f0f9ff',
        border: 'rgba(2, 132, 199, 0.28)',
        borderHover: '#0284c7',
        badgeBg: 'rgba(2, 132, 199, 0.12)',
        badgeText: '#0369a1',
        badgeBorder: 'rgba(2, 132, 199, 0.25)',
        cardBg: '#ffffff',
        topGradient: 'linear-gradient(135deg, rgba(2, 132, 199, 0.07), transparent 70%)',
        tileGradient: 'linear-gradient(135deg, #38bdf8, #0284c7)',
        tileShadow: '0 12px 24px rgba(2, 132, 199, 0.35), inset 0 2px 2px rgba(255,255,255,0.4)',
        buttonGradient: 'linear-gradient(135deg, #0284c7, #2563eb)',
        buttonShadow: '0 12px 24px rgba(2, 132, 199, 0.32)',
        checkBg: '#e0f2fe',
        checkColor: '#0284c7',
        hoverShadow: '0 28px 60px rgba(2, 132, 199, 0.20)',
        accentColor: '#0284c7',
        shadow: 'rgba(2, 132, 199, 0.35)',
    },
    {
        id: 'gold',
        name: 'Gold',
        primary: '#d97706',
        secondary: '#f59e0b',
        dark: '#78350f',
        light: '#fffbeb',
        border: 'rgba(245, 158, 11, 0.45)',
        borderHover: '#d97706',
        badgeBg: 'rgba(245, 158, 11, 0.14)',
        badgeText: '#b45309',
        badgeBorder: 'rgba(217, 119, 6, 0.32)',
        cardBg: '#ffffff',
        topGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.22), rgba(217, 119, 6, 0.05) 55%, transparent 100%)',
        tileGradient: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)',
        tileShadow: '0 12px 28px rgba(217, 119, 6, 0.48), inset 0 2px 3px rgba(255,255,255,0.7)',
        buttonGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #b45309 100%)',
        buttonShadow: '0 12px 26px rgba(217, 119, 6, 0.42)',
        checkBg: '#fef3c7',
        checkColor: '#d97706',
        hoverShadow: '0 28px 65px rgba(217, 119, 6, 0.32)',
        accentColor: '#d97706',
        shadow: 'rgba(217, 119, 6, 0.38)',
    },
    {
        id: 'coral',
        name: 'Coral',
        primary: '#ea580c',
        secondary: '#e11d48',
        dark: '#9a3412',
        light: '#fff7ed',
        border: 'rgba(234, 88, 12, 0.35)',
        borderHover: '#ea580c',
        badgeBg: 'rgba(234, 88, 12, 0.12)',
        badgeText: '#c2410c',
        badgeBorder: 'rgba(234, 88, 12, 0.25)',
        cardBg: '#ffffff',
        topGradient: 'linear-gradient(135deg, rgba(234, 88, 12, 0.07), transparent 70%)',
        tileGradient: 'linear-gradient(135deg, #fb923c, #ea580c)',
        tileShadow: '0 12px 24px rgba(234, 88, 12, 0.35), inset 0 2px 2px rgba(255,255,255,0.4)',
        buttonGradient: 'linear-gradient(135deg, #ea580c, #e11d48)',
        buttonShadow: '0 12px 26px rgba(234, 88, 12, 0.32)',
        checkBg: '#ffedd5',
        checkColor: '#ea580c',
        hoverShadow: '0 28px 60px rgba(234, 88, 12, 0.20)',
        accentColor: '#ea580c',
        shadow: 'rgba(234, 88, 12, 0.35)',
    },
    {
        id: 'emerald',
        name: 'Emerald',
        primary: '#059669',
        secondary: '#0d9488',
        dark: '#065f46',
        light: '#f0fdf4',
        border: 'rgba(5, 150, 105, 0.35)',
        borderHover: '#059669',
        badgeBg: 'rgba(5, 150, 105, 0.12)',
        badgeText: '#047857',
        badgeBorder: 'rgba(5, 150, 105, 0.25)',
        cardBg: '#ffffff',
        topGradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.07), transparent 70%)',
        tileGradient: 'linear-gradient(135deg, #34d399, #059669)',
        tileShadow: '0 12px 24px rgba(5, 150, 105, 0.35), inset 0 2px 2px rgba(255,255,255,0.4)',
        buttonGradient: 'linear-gradient(135deg, #059669, #0d9488)',
        buttonShadow: '0 12px 26px rgba(5, 150, 105, 0.32)',
        checkBg: '#dcfce7',
        checkColor: '#059669',
        hoverShadow: '0 28px 60px rgba(5, 150, 105, 0.20)',
        accentColor: '#059669',
        shadow: 'rgba(5, 150, 105, 0.35)',
    },
];

const getPlanTheme = (idx, plan) => {
    if (plan?.name?.toLowerCase().includes('pro')) return PLAN_THEMES[1];
    return PLAN_THEMES[idx % PLAN_THEMES.length];
};

// Custom brand logos for plans instead of plain letters B, P
const renderPlanLogo = (plan, idx) => {
    const isPro = plan?.name?.toLowerCase().includes('pro') || idx === 1;
    if (isPro) {
        // Royal Crown Emblem for Pro Plan
        return (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 18.5H21V20.5C21 21.05 20.55 21.5 20 21.5H4C3.45 21.5 3 21.05 3 20.5V18.5Z" fill="#ffffff" />
                <path d="M3.5 17L2 7.5L8 12L12 4L16 12L22 7.5L20.5 17H3.5Z" fill="#ffffff" />
                <circle cx="2" cy="6.5" r="1.6" fill="#ffffff" />
                <circle cx="12" cy="3.2" r="1.8" fill="#ffffff" />
                <circle cx="22" cy="6.5" r="1.6" fill="#ffffff" />
                <circle cx="12" cy="13.8" r="1.5" fill="#d97706" />
                <circle cx="7.2" cy="14.2" r="1.2" fill="#d97706" />
                <circle cx="16.8" cy="14.2" r="1.2" fill="#d97706" />
            </svg>
        );
    }
    // Launch Rocket Emblem for Basic / Starter Plan
    return (
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.5C12 2.5 17.5 5 18 12C18 14.5 16.5 17 16.5 17L12 15L7.5 17C7.5 17 6 14.5 6 12C6.5 5 12 2.5 12 2.5Z" fill="#ffffff" />
            <circle cx="12" cy="9.5" r="2.2" fill="#0284c7" />
            <path d="M7.5 14L4 16.5L5.5 19.5L8.5 17.5" fill="#ffffff" fillOpacity="0.85" />
            <path d="M16.5 14L20 16.5L18.5 19.5L15.5 17.5" fill="#ffffff" fillOpacity="0.85" />
            <path d="M10.5 16L12 21.5L13.5 16" fill="#fcd34d" />
        </svg>
    );
};

const tenureLabel = (y) => `${y} Year${y > 1 ? 's' : ''}`;
const storageLabel = (mb) =>
    mb >= 1024 && mb % 1024 === 0 ? `${mb / 1024} GB` : `${mb} MB`;

const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

const hexToRgba = (hex, alpha) => {
    if (!hex) return `rgba(37, 99, 235, ${alpha})`;
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const Billing = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { school, fetchSchool, tc } = useSchoolStore();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);
    const [showSubdomainPopup, setShowSubdomainPopup] = useState(false);

    const proceedToDashboard = () => {
        navigate('/admin/dashboard');
        window.location.reload();
    };

    useEffect(() => {
        fetchSchool?.();
        getActivePlansApi()
            .then((res) => setPlans(res.data || []))
            .catch(() => toast.error('Failed to load plans'))
            .finally(() => setLoading(false));
    }, []);

    const recommendedIndex = plans.length > 1 ? Math.floor(plans.length / 2) : -1;

    const planEndDate = school?.plan_end_date ? new Date(school.plan_end_date) : null;
    const isExpired = !!planEndDate && planEndDate < new Date();
    const isRenewal = !!school?.plan_id && isExpired;
    const isProactiveManage = !!school?.plan_id && !isExpired;

    const currentPlan = plans.find((p) => p.id === school?.plan_id);
    const currentPlanName = currentPlan?.name || school?.plan_name || null;

    const formattedEndDate = planEndDate
        ? planEndDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
        : null;

    const daysRemaining = planEndDate
        ? Math.max(0, Math.ceil((new Date(planEndDate).setHours(23, 59, 59, 999) - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const handlePay = async (plan, theme) => {
        if (payingId) return;
        setPayingId(plan.id);
        try {
            const scriptOk = await loadRazorpayScript();
            if (!scriptOk) {
                toast.error('Failed to load payment gateway — check your connection');
                setPayingId(null);
                return;
            }

            const orderRes = await createBillingOrderApi(plan.id);
            const order = orderRes.data;

            const rzp = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: 'Web Builder Pro',
                description: `${plan.name} · ${tenureLabel(plan.tenure_years)} · ${storageLabel(plan.storage_mb)}`,
                prefill: { name: user?.name, email: user?.email },
                theme: { color: theme?.primary || '#2563eb' },
                handler: async (response) => {
                    try {
                        await verifyBillingPaymentApi(response);
                        toast.success('Payment successful — your plan is now active!');
                        const existing = await getMySubdomainRequestApi().catch(() => null);
                        if (existing?.data) {
                            proceedToDashboard();
                        } else {
                            setShowSubdomainPopup(true);
                        }
                    } catch (e) {
                        toast.error(e.response?.data?.message || 'Payment verification failed');
                    } finally {
                        setPayingId(null);
                    }
                },
                modal: { ondismiss: () => setPayingId(null) },
            });
            rzp.on('payment.failed', () => {
                toast.error('Payment failed — please try again');
                setPayingId(null);
            });
            rzp.open();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to start payment');
            setPayingId(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '65vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '42px', height: '42px', border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'billingSpin 0.9s linear infinite', margin: '0 auto 14px' }}></div>
                    <p style={{ color: '#64748b', fontSize: '13.5px', fontWeight: 500 }}>Loading subscription plans...</p>
                </div>
                <style>{`@keyframes billingSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <style>{`
                @keyframes billingSpin { to { transform: rotate(360deg); } }
                
                @keyframes billCardFadeIn {
                    from { opacity: 0; transform: translateY(26px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes billOrbFloat1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-30px, 22px) scale(1.12); }
                }

                @keyframes billOrbFloat2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(25px, -20px) scale(1.1); }
                }

                @keyframes billPulseDot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.35); opacity: 0.75; }
                }

                @keyframes billBadgeShine {
                    0% { background-position: -200% center; }
                    50%, 100% { background-position: 200% center; }
                }

                .bill-hero-title {
                    font-family: 'Playfair Display', Georgia, serif;
                    color: #ffffff;
                }

                /* ── Card animations and hover states ── */
                .bill-plan-card {
                    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.3s ease;
                    animation: billCardFadeIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                .bill-plan-card:hover {
                    transform: translateY(-8px);
                }
                .bill-plan-card:hover .bill-monogram-tile {
                    transform: scale(1.08) rotate(4deg);
                }

                /* ── Button hover light sweep ── */
                .bill-btn-sweep {
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.18s ease, box-shadow 0.22s ease, opacity 0.2s ease, filter 0.2s ease;
                }
                .bill-btn-sweep::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -70%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                    transform: skewX(-20deg);
                    transition: left 0.65s ease;
                    pointer-events: none;
                }
                .bill-btn-sweep:not(:disabled):hover {
                    transform: translateY(-2px);
                    filter: brightness(1.05);
                }
                .bill-btn-sweep:not(:disabled):hover::after {
                    left: 140%;
                }
                .bill-btn-sweep:not(:disabled):active {
                    transform: scale(0.98);
                }

                /* ── Recommended badge sweep ── */
                .bill-badge-shine {
                    background-size: 200% auto;
                    animation: billBadgeShine 6s ease-in-out infinite;
                }

                /* ── Feature item micro-interaction ── */
                .bill-feature-item {
                    transition: transform 0.18s ease, color 0.18s ease;
                }
                .bill-feature-item:hover {
                    transform: translateX(3px);
                }
                .bill-feature-item:hover .bill-feature-icon {
                    transform: scale(1.12);
                }

                /* ── Pro Plan Gold Light Spreading Animation ── */
                @keyframes goldLightPulse {
                    0%, 100% {
                        box-shadow: 
                            0 0 0 1px rgba(245, 158, 11, 0.45),
                            0 12px 30px rgba(217, 119, 6, 0.16),
                            0 0 25px rgba(251, 191, 36, 0.20);
                    }
                    50% {
                        box-shadow: 
                            0 0 0 2.5px rgba(251, 191, 36, 0.8),
                            0 24px 50px rgba(217, 119, 6, 0.28),
                            0 0 60px rgba(245, 158, 11, 0.45);
                    }
                }

                @keyframes goldLightSpreadingHalo {
                    0% {
                        transform: scale(0.94);
                        opacity: 0.35;
                    }
                    50% {
                        transform: scale(1.15);
                        opacity: 0.85;
                    }
                    100% {
                        transform: scale(0.94);
                        opacity: 0.35;
                    }
                }

                @keyframes goldShimmerRaySweep {
                    0% {
                        left: -120%;
                    }
                    30%, 100% {
                        left: 220%;
                    }
                }

                .bill-plan-card-pro-gold {
                    position: relative;
                    border-color: rgba(245, 158, 11, 0.55) !important;
                    animation: billCardFadeIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) both, goldLightPulse 3.8s ease-in-out infinite !important;
                }
                .bill-plan-card-pro-gold:hover {
                    box-shadow: 0 32px 70px rgba(217, 119, 6, 0.35), 0 0 50px rgba(251, 191, 36, 0.35) !important;
                    border-color: #f59e0b !important;
                }

                /* Light spreading halo behind the card */
                .bill-pro-light-halo {
                    position: absolute;
                    inset: -14px;
                    border-radius: 36px;
                    background: radial-gradient(circle at 50% 25%, rgba(251, 191, 36, 0.45) 0%, rgba(245, 158, 11, 0.22) 40%, transparent 72%);
                    z-index: 0;
                    pointer-events: none;
                    animation: goldLightSpreadingHalo 3.5s ease-in-out infinite;
                    filter: blur(14px);
                }

                /* Diagonal shimmering light ray sweeping across the Pro card */
                .bill-pro-light-sweep {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: -120%;
                    width: 60%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), rgba(251, 191, 36, 0.35), transparent);
                    transform: skewX(-20deg);
                    pointer-events: none;
                    z-index: 2;
                    animation: goldShimmerRaySweep 5.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }

                @media (max-width: 680px) {
                    .bill-hero-validity {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }
                }
            `}</style>

            <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0f172a', maxWidth: '1020px', margin: '0 auto', paddingBottom: '3rem' }}>

                {/* ── Hero Banner with dynamic ambient orbs ── */}
                <div style={{
                    position: 'relative', overflow: 'hidden',
                    background: `linear-gradient(135deg, ${tc?.primary || '#1e3a5f'} 0%, ${tc?.secondary || '#2563eb'} 100%)`,
                    borderRadius: '24px', padding: '2.5rem 2.2rem 2.2rem', marginBottom: '2.5rem', color: '#fff',
                    boxShadow: `0 20px 48px -12px ${hexToRgba(tc?.primary || '#2563eb', 0.28)}, 0 4px 16px rgba(0,0,0,0.06)`,
                }}>
                    {/* Background Grid Pattern */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                        backgroundSize: '22px 22px', pointerEvents: 'none',
                    }} />

                    {/* Floating Glow Orbs */}
                    <div style={{
                        position: 'absolute', width: '380px', height: '380px', borderRadius: '50%',
                        background: `radial-gradient(circle, ${hexToRgba(tc?.secondary || '#ffffff', 0.32)} 0%, transparent 68%)`,
                        top: '-160px', right: '-80px', animation: 'billOrbFloat1 13s ease-in-out infinite alternate',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', width: '320px', height: '320px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, transparent 70%)',
                        bottom: '-120px', left: '20%', animation: 'billOrbFloat2 15s ease-in-out infinite alternate',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '999px', marginBottom: '14px', backdropFilter: 'blur(8px)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 6px #ffffff' }}></span>
                            <span style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff' }}>
                                {isRenewal ? 'Plan expired' : isProactiveManage ? 'Manage your subscription' : 'Activate your school website'}
                            </span>
                        </div>

                        <h1 className="bill-hero-title" style={{ fontSize: 'clamp(28px, 3.6vw, 38px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '10px', lineHeight: 1.15, color: '#ffffff' }}>
                            {isRenewal ? 'Renew your school plan' : isProactiveManage ? 'Extend or upgrade your plan' : 'Select a hosting plan'}
                        </h1>
                        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.92)', lineHeight: 1.65, maxWidth: '580px', margin: 0, fontWeight: 400 }}>
                            {isRenewal
                                ? `${school?.name ? `${school.name}'s ` : 'Your '}plan has ended — renew to keep your public school website live, secure, and editable.`
                                : isProactiveManage
                                    ? `${school?.name ? `${school.name}'s ` : 'Your '}plan is active — renew early or switch to a higher tier any time. Your remaining days are automatically added.`
                                    : `${school?.name ? `${school.name}'s ` : 'Your '}account is approved — pick a plan to take your school website live today.`}
                        </p>

                        {/* Existing Plan Validity Glass Card */}
                        {planEndDate && (
                            <div className="bill-hero-validity" style={{
                                marginTop: '22px',
                                display: 'inline-flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: '14px 20px',
                                padding: '14px 20px',
                                borderRadius: '16px',
                                background: isExpired ? 'rgba(239, 68, 68, 0.28)' : 'rgba(255, 255, 255, 0.16)',
                                border: `1px solid ${isExpired ? 'rgba(248, 113, 113, 0.5)' : 'rgba(255, 255, 255, 0.3)'}`,
                                backdropFilter: 'blur(14px)',
                                WebkitBackdropFilter: 'blur(14px)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: isExpired ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.18)',
                                    border: `1px solid ${isExpired ? 'rgba(254, 202, 202, 0.4)' : 'rgba(255, 255, 255, 0.3)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <div style={{
                                        fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                                        color: isExpired ? '#fca5a5' : 'rgba(255, 255, 255, 0.78)',
                                    }}>
                                        {isExpired ? 'Plan Expired On' : 'Existing Plan Validity'}
                                    </div>
                                    <div style={{ fontSize: '15.5px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span>{formattedEndDate}</span>
                                        {currentPlanName && (
                                            <span style={{
                                                fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
                                                background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.28)',
                                                color: '#fff', letterSpacing: '0.02em',
                                            }}>
                                                {currentPlanName}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!isExpired && daysRemaining !== null && (
                                    <div style={{
                                        fontSize: '12.5px', fontWeight: 700, padding: '6px 14px', borderRadius: '999px',
                                        background: daysRemaining <= 7 ? 'rgba(245, 158, 11, 0.32)' : 'rgba(34, 197, 94, 0.28)',
                                        border: `1px solid ${daysRemaining <= 7 ? 'rgba(253, 230, 138, 0.55)' : 'rgba(187, 247, 208, 0.55)'}`,
                                        color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
                                    }}>
                                        <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: daysRemaining <= 7 ? '#fde047' : '#4ade80',
                                            display: 'inline-block',
                                            animation: 'billPulseDot 2s infinite ease-in-out',
                                        }} />
                                        {daysRemaining === 0 ? 'Expires today' : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Plans Display Grid ── */}
                {plans.length === 0 ? (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '3.5rem 2rem', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No subscription plans are available at this moment — please contact support.
                    </div>
                ) : (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: plans.length === 2 ? 'repeat(auto-fit, minmax(320px, 1fr))' : 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '24px', alignItems: 'stretch',
                            marginBottom: '2.5rem',
                            maxWidth: plans.length === 2 ? '860px' : '100%',
                            margin: '0 auto 2.5rem',
                        }}>
                            {plans.map((plan, idx) => {
                                const isPro = plan.name?.toLowerCase().includes('pro') || idx === 1;
                                const theme = getPlanTheme(idx, plan);
                                const featured = idx === recommendedIndex || isPro;
                                const busy = payingId === plan.id;
                                const disabled = payingId != null;
                                const isCurrent = plan.id === school?.plan_id;

                                return (
                                    <div key={plan.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                        {/* Spreading Golden Halo for Pro Plan */}
                                        {isPro && <div className="bill-pro-light-halo" />}

                                        <div
                                            className={`bill-plan-card ${isPro ? 'bill-plan-card-pro-gold' : ''}`}
                                            style={{
                                                position: 'relative',
                                                zIndex: 1,
                                                background: '#ffffff',
                                                borderRadius: '24px',
                                                padding: featured ? '36px 28px 30px' : '32px 28px 30px',
                                                border: `2px solid ${isPro ? 'rgba(245, 158, 11, 0.55)' : featured ? theme.primary : theme.border}`,
                                                boxShadow: isPro
                                                    ? '0 20px 48px rgba(217, 119, 6, 0.22), 0 0 28px rgba(251, 191, 36, 0.18)'
                                                    : featured
                                                        ? `0 20px 45px ${theme.shadow}`
                                                        : '0 4px 20px rgba(15, 23, 42, 0.05)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                flex: 1,
                                                animationDelay: `${idx * 0.12}s`,
                                                overflow: 'hidden',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = isPro
                                                    ? '0 32px 70px rgba(217, 119, 6, 0.35), 0 0 50px rgba(251, 191, 36, 0.35)'
                                                    : theme.hoverShadow;
                                                e.currentTarget.style.borderColor = isPro ? '#f59e0b' : theme.primary;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = isPro
                                                    ? '0 20px 48px rgba(217, 119, 6, 0.22), 0 0 28px rgba(251, 191, 36, 0.18)'
                                                    : featured ? `0 20px 45px ${theme.shadow}` : '0 4px 20px rgba(15, 23, 42, 0.05)';
                                                e.currentTarget.style.borderColor = isPro ? 'rgba(245, 158, 11, 0.55)' : featured ? theme.primary : theme.border;
                                            }}
                                        >
                                            {/* Diagonal light spreading ray sweep on Pro card */}
                                            {isPro && <div className="bill-pro-light-sweep" />}

                                            {/* Subtle colored top gradient tint */}
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, height: '140px',
                                                background: theme.topGradient, pointerEvents: 'none',
                                            }} />

                                            {/* Featured / Recommended Pill */}
                                            {featured && (
                                                <div
                                                    className="bill-badge-shine"
                                                    style={{
                                                        position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                                                        background: isPro
                                                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #b45309 100%)'
                                                            : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                                                        color: '#ffffff', fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.12em',
                                                        textTransform: 'uppercase', padding: '6px 18px', borderRadius: '0 0 14px 14px',
                                                        whiteSpace: 'nowrap', boxShadow: isPro ? '0 8px 20px rgba(217, 119, 6, 0.4)' : `0 8px 20px ${theme.shadow}`,
                                                        display: 'flex', alignItems: 'center', gap: '5px',
                                                        zIndex: 3,
                                                    }}
                                                >
                                                    <span>★</span>
                                                    <span>RECOMMENDED</span>
                                                </div>
                                            )}

                                            {/* Header Row: 3D Tile + Badges */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', marginTop: featured ? '6px' : '0', position: 'relative', zIndex: 1 }}>
                                                {/* 3D beveled icon tile in plan's distinct color */}
                                                <div
                                                    className="bill-monogram-tile"
                                                    style={{
                                                        width: '50px', height: '50px', borderRadius: '14px',
                                                        background: theme.tileGradient,
                                                        boxShadow: theme.tileShadow,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                                    }}
                                                >
                                                    {renderPlanLogo(plan, idx)}
                                                </div>

                                            {isCurrent && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    padding: '5px 12px',
                                                    borderRadius: '999px',
                                                    background: isExpired ? '#fef2f2' : '#f0fdf4',
                                                    color: isExpired ? '#dc2626' : '#16a34a',
                                                    border: `1px solid ${isExpired ? '#fecaca' : '#bbf7d0'}`,
                                                    letterSpacing: '0.04em',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isExpired ? '#ef4444' : '#22c55e' }}></span>
                                                    {isExpired ? 'Previous Plan' : 'Current Plan'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Plan Name & Storage */}
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.3px' }}>
                                                {plan.name}
                                            </h3>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 9px', borderRadius: '6px', background: theme.badgeBg, border: `1px solid ${theme.badgeBorder}`, marginBottom: '18px' }}>
                                                <span style={{ fontSize: '11.5px', fontWeight: 700, color: theme.badgeText }}>
                                                    {tenureLabel(plan.tenure_years)} · {storageLabel(plan.storage_mb)} storage
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price Box */}
                                        <div style={{ marginBottom: '22px', position: 'relative', zIndex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                                                <span style={{
                                                    fontFamily: "'Playfair Display', serif",
                                                    fontSize: '38px',
                                                    fontWeight: 800,
                                                    color: '#0f172a',
                                                    letterSpacing: '-0.03em',
                                                    lineHeight: 1,
                                                }}>
                                                    ₹{Number(plan.price).toLocaleString('en-IN')}
                                                </span>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                                                    / {plan.tenure_years} yr
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                                                One-time payment · {tenureLabel(plan.tenure_years)} full cloud hosting
                                            </p>
                                        </div>

                                        {/* Action Button styled in plan's distinct color */}
                                        <button
                                            onClick={() => handlePay(plan, theme)}
                                            disabled={disabled}
                                            className="bill-btn-sweep"
                                            style={{
                                                width: '100%',
                                                padding: '14px 18px',
                                                borderRadius: '14px',
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                marginBottom: '24px',
                                                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                                                cursor: disabled ? 'not-allowed' : 'pointer',
                                                border: 'none',
                                                background: busy ? '#94a3b8' : theme.buttonGradient,
                                                color: '#ffffff',
                                                boxShadow: !busy ? theme.buttonShadow : 'none',
                                                opacity: disabled && !busy ? 0.6 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                position: 'relative',
                                                zIndex: 1,
                                            }}
                                        >
                                            {busy ? (
                                                <>
                                                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'billingSpin 0.8s linear infinite' }} />
                                                    <span>Processing…</span>
                                                </>
                                            ) : isCurrent ? (
                                                isExpired ? 'Renew this plan' : 'Extend this plan'
                                            ) : (
                                                isProactiveManage ? 'Upgrade to this plan' : 'Select this plan'
                                            )}
                                        </button>

                                        {/* Divider */}
                                        <div style={{ height: '1px', background: '#f1f5f9', marginBottom: '20px' }} />

                                        {/* Feature Checklist */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '12px' }}>
                                                What's included:
                                            </p>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                                {[
                                                    `${storageLabel(plan.storage_mb)} high-speed media storage`,
                                                    'All public & admin website modules included',
                                                    'Custom school branding, colors & typography',
                                                    'Free .wbpro.in subdomain included',
                                                    ...(plan.features || []),
                                                ].map((feature, fIdx) => (
                                                    <li
                                                        key={fIdx}
                                                        className="bill-feature-item"
                                                        style={{
                                                            fontSize: '13px',
                                                            color: '#334155',
                                                            display: 'flex',
                                                            gap: '10px',
                                                            alignItems: 'flex-start',
                                                            lineHeight: 1.45,
                                                        }}
                                                    >
                                                        <span
                                                            className="bill-feature-icon"
                                                            style={{
                                                                flexShrink: 0,
                                                                width: '19px',
                                                                height: '19px',
                                                                borderRadius: '50%',
                                                                background: theme.checkBg,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                marginTop: '1px',
                                                                transition: 'transform 0.18s ease',
                                                            }}
                                                        >
                                                            <svg width="10" height="10" fill="none" stroke={theme.checkColor} strokeWidth="3" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </span>
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {plan.description && (
                                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '18px', lineHeight: 1.55, borderTop: '1px dashed #e2e8f0', paddingTop: '14px' }}>
                                                    {plan.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        </div>

                        {/* Security and Trust Footer */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '18px',
                            flexWrap: 'wrap',
                            padding: '16px 20px',
                            background: '#f8fafc',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            maxWidth: plans.length === 2 ? '860px' : '100%',
                            margin: '0 auto',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>
                                <svg width="15" height="15" fill="none" stroke="#059669" strokeWidth="2.2" viewBox="0 0 24 24">
                                    <rect x="4" y="11" width="16" height="10" rx="2" />
                                    <path d="M8 11V7a4 4 0 018 0v4" />
                                </svg>
                                <span>256-Bit SSL Encrypted Razorpay Gateway</span>
                            </div>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569', fontWeight: 500 }}>
                                <svg width="15" height="15" fill="none" stroke="#2563eb" strokeWidth="2.2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Instant Website Activation</span>
                            </div>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569', fontWeight: 500 }}>
                                <svg width="15" height="15" fill="none" stroke="#64748b" strokeWidth="2.2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>Official GST Invoice & Email Receipt</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Post-payment subdomain popup ── */}
            {showSubdomainPopup && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: '#fff', maxWidth: '440px', width: '100%', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,23,42,0.35)', animation: 'billCardFadeIn 0.35s ease' }}>
                        <div style={{ padding: '1.75rem 1.75rem 1.25rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,#0284c7,#2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 8px 18px rgba(37,99,235,0.3)' }}>
                                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                            </div>
                            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', fontFamily: "'Playfair Display', serif" }}>
                                Claim your free wbpro.in subdomain
                            </h3>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px', lineHeight: 1.6 }}>
                                Choose a custom subdomain for {school?.name ? `${school.name}'s` : 'your'} website — our team will configure it and email you when live.
                            </p>
                            <SubdomainRequestForm
                                tc={{ primary: '#2563eb', secondary: '#1e40af' }}
                                onSuccess={proceedToDashboard}
                            />
                        </div>
                        <div style={{ padding: '0 1.75rem 1.5rem' }}>
                            <button onClick={proceedToDashboard}
                                style={{ width: '100%', padding: '10px', background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.15s ease' }}
                                onMouseEnter={(e) => e.target.style.color = '#475569'}
                                onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                            >
                                Skip for now — I'll do this later from Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Billing;
