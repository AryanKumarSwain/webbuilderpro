import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getActivePlansApi } from '../../api/plans.api';
import { createBillingOrderApi, verifyBillingPaymentApi } from '../../api/billing.api';
import { getMySubdomainRequestApi } from '../../api/subdomainRequest.api';
import SubdomainRequestForm from '../../components/admin/SubdomainRequestForm';
import useAuthStore from '../../store/authStore';
import useSchoolStore from '../../store/schoolStore';

// ── Landing-page palette (frontend/src/pages/LandingPage.jsx) — this page is
// deliberately themed to match the public marketing site, not the school's
// admin theme colours. ──
const BLUE = '#4169E1';
const BLUE_DARK = '#2541A8';
const BLUE_LIGHT = '#EDF1FD';
const TEXT_DARK = '#20242C';
const TEXT_MUTED = '#5B6270';

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

const Billing = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { school, fetchSchool } = useSchoolStore();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);
    const [showSubdomainPopup, setShowSubdomainPopup] = useState(false);

    // Same "force-refresh school/plan state" reload the payment success
    // handler always did — now also the exit point for the subdomain popup
    // (both "Skip for now" and a successful request submission land here).
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

    // The middle plan (by display order) is flagged "Recommended". Reorder via
    // the Super Admin Plans page (sort_order) to move the badge. Suppressed when
    // there's only one plan.
    const recommendedIndex = plans.length > 1 ? Math.floor(plans.length / 2) : -1;

    // AdminLayout force-redirects here only when hasActivePlan is false (never had a
    // plan, or it lapsed) — but a school can also land here on its own, from the new
    // Settings -> Plan & Billing "Extend / Upgrade Plan" link, while their plan is
    // still active. Three distinct states drive the copy below: never had a plan,
    // had one and it lapsed, or has one and is renewing/upgrading early.
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

    const handlePay = async (plan) => {
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
                theme: { color: BLUE },
                handler: async (response) => {
                    try {
                        await verifyBillingPaymentApi(response);
                        toast.success('Payment successful — your plan is now active!');
                        // Only prompt for a free wbpro.in subdomain if this school has
                        // never asked for one before (a renewal payment, or a second
                        // payment after already requesting/getting one, skips straight
                        // to the dashboard like before).
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: `3px solid ${BLUE}`, borderRadius: '50%', animation: 'billingSpin 1s linear infinite' }}></div>
                <style>{`@keyframes billingSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <style>{`
                @keyframes billingSpin { to { transform: rotate(360deg); } }
                @keyframes billPopIn { from { opacity: 0; transform: translateY(22px) scale(0.92); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes billShimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
                @keyframes billOrbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-22px,16px) scale(1.08); } }

                .bill-shimmer {
                    background: linear-gradient(90deg, #ffffff, ${BLUE_LIGHT}, #ffffff);
                    background-size: 200% auto; -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent; animation: billShimmer 8s linear infinite;
                }

                /* ── 3D plan card — a resting isometric tilt that flattens and lifts on hover,
                     mirroring .lp-3d-card on the landing page. ── */
                .bill-3d-card {
                    transform: perspective(1100px) rotateX(4deg);
                    transform-style: preserve-3d;
                    transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.45s ease, border-color 0.3s ease;
                    animation: billPopIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both;
                }
                .bill-3d-card:hover {
                    transform: perspective(1100px) rotateX(0deg) translateY(-12px);
                    box-shadow: 0 34px 64px rgba(37,65,168,0.28);
                    border-color: ${BLUE}66;
                }
                .bill-3d-card--featured { transform: perspective(1100px) rotateX(4deg) translateY(-10px); }
                .bill-3d-card--featured:hover { transform: perspective(1100px) rotateX(0deg) translateY(-20px); }

                .bill-3d-tile {
                    transform: perspective(700px) rotateX(16deg) rotateY(-18deg);
                    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
                }
                .bill-3d-card:hover .bill-3d-tile { transform: perspective(700px) rotateX(0deg) rotateY(0deg) scale(1.08); }

                .bill-cta { position: relative; overflow: hidden; transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease; }
                .bill-cta::after {
                    content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
                    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent);
                    transform: skewX(-20deg); transition: left 0.6s ease; pointer-events: none;
                }
                .bill-cta:not(:disabled):hover { transform: translateY(-2px); }
                .bill-cta:not(:disabled):hover::after { left: 130%; }
                .bill-cta:not(:disabled):active { transform: scale(0.98); }
                .bill-cta-outline:not(:disabled):hover { background: ${BLUE} !important; color: #fff !important; border-color: ${BLUE} !important; }

                @media (max-width: 760px) {
                    .bill-3d-card, .bill-3d-card--featured,
                    .bill-3d-card:hover, .bill-3d-card--featured:hover { transform: none !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: TEXT_DARK, maxWidth: '1060px', margin: '0 auto' }}>

                {/* Hero — landing-page blue gradient with dot-grid + glow orb */}
                <div style={{
                    position: 'relative', overflow: 'hidden',
                    background: `linear-gradient(160deg, ${BLUE_DARK} 0%, ${BLUE} 55%, ${BLUE_DARK} 100%)`,
                    borderRadius: '22px', padding: '2.4rem 2rem 2.1rem', marginBottom: '2.75rem', color: '#fff',
                }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 70%)', top: '-150px', right: '-90px', animation: 'billOrbDrift 11s ease-in-out infinite', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative' }}>
                        <span style={{ display: 'inline-block', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '5px 12px', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: '999px', marginBottom: '14px' }}>
                            {isRenewal ? 'Plan expired' : isProactiveManage ? 'Manage your plan' : 'Activate your website'}
                        </span>
                        <h1 className="bill-shimmer" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.4vw, 36px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px' }}>
                            {isRenewal ? 'Renew your plan' : isProactiveManage ? 'Extend or upgrade your plan' : 'Choose your plan'}
                        </h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, maxWidth: '540px', margin: 0 }}>
                            {isRenewal
                                ? `${school?.name ? `${school.name}'s ` : 'Your '}plan has ended — renew to keep your school website live and editable.`
                                : isProactiveManage
                                    ? `${school?.name ? `${school.name}'s ` : 'Your '}plan is active — renew early or switch to a bigger plan any time. Your remaining days are never lost.`
                                    : `${school?.name ? `${school.name}'s ` : 'Your '}account is approved — pick a plan to take your school website live.`}
                        </p>

                        {/* Existing Plan Validity Banner */}
                        {planEndDate && (
                            <div style={{
                                marginTop: '18px',
                                display: 'inline-flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: '12px 16px',
                                padding: '12px 18px',
                                borderRadius: '14px',
                                background: isExpired
                                    ? 'rgba(239, 68, 68, 0.22)'
                                    : 'rgba(255, 255, 255, 0.14)',
                                border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.45)' : 'rgba(255, 255, 255, 0.28)'}`,
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: isExpired ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.2)',
                                    border: `1px solid ${isExpired ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.35)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{
                                        fontSize: '10.5px',
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        color: isExpired ? '#fca5a5' : 'rgba(255, 255, 255, 0.78)',
                                    }}>
                                        {isExpired ? 'Plan Expired On' : 'Existing Plan Validity'}
                                    </div>
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        flexWrap: 'wrap',
                                    }}>
                                        <span>{formattedEndDate}</span>
                                        {currentPlanName && (
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: 'rgba(255, 255, 255, 0.2)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                color: '#fff',
                                            }}>
                                                {currentPlanName}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!isExpired && daysRemaining !== null && (
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        padding: '5px 12px',
                                        borderRadius: '999px',
                                        background: daysRemaining <= 7 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(34, 197, 94, 0.32)',
                                        border: `1px solid ${daysRemaining <= 7 ? 'rgba(253, 230, 138, 0.6)' : 'rgba(187, 247, 208, 0.6)'}`,
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        <span style={{
                                            width: '7px', height: '7px', borderRadius: '50%',
                                            background: daysRemaining <= 7 ? '#fde047' : '#4ade80',
                                            display: 'inline-block',
                                            boxShadow: daysRemaining <= 7 ? '0 0 6px #fde047' : '0 0 6px #4ade80',
                                        }} />
                                        {daysRemaining === 0
                                            ? 'Expires today'
                                            : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {plans.length === 0 ? (
                    <div style={{ background: '#fff', border: '1px solid #eef1f6', borderRadius: '18px', padding: '3rem', textAlign: 'center', color: TEXT_MUTED, fontSize: '13.5px' }}>
                        No plans are available right now — please contact Web Builder Pro.
                    </div>
                ) : (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(258px, 1fr))',
                            gap: '22px', alignItems: 'start',
                            marginBottom: '1.75rem', padding: '18px 4px 8px',
                        }}>
                            {plans.map((plan, idx) => {
                                const featured = idx === recommendedIndex;
                                const busy = payingId === plan.id;
                                const disabled = payingId != null;
                                return (
                                    <div key={plan.id}
                                        className={`bill-3d-card${featured ? ' bill-3d-card--featured' : ''}`}
                                        style={{
                                            position: 'relative', background: '#fff',
                                            borderRadius: '20px',
                                            padding: featured ? '32px 24px 26px' : '26px 24px',
                                            border: featured ? `2px solid ${BLUE}` : '1px solid #eef1f6',
                                            boxShadow: featured
                                                ? `0 26px 58px ${BLUE}33`
                                                : '0 4px 18px rgba(15,23,42,0.05)',
                                            display: 'flex', flexDirection: 'column',
                                            animationDelay: `${idx * 0.07}s`,
                                        }}>

                                        {featured && (
                                            <div style={{
                                                position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                                                background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
                                                color: '#fff', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em',
                                                textTransform: 'uppercase', padding: '6px 14px', borderRadius: '999px',
                                                whiteSpace: 'nowrap', boxShadow: `0 8px 18px ${BLUE}55`,
                                            }}>
                                                ★ Recommended
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            {/* 3D beveled monogram tile */}
                                            <div className="bill-3d-tile" style={{
                                                width: '46px', height: '46px', borderRadius: '13px',
                                                background: `linear-gradient(145deg, ${BLUE}, ${BLUE_DARK})`,
                                                boxShadow: `inset 0 2px 2px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.28), 0 12px 22px ${BLUE}50`,
                                                color: '#fff', fontWeight: 800, fontSize: '19px', fontFamily: "'Playfair Display', serif",
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {plan.name?.trim()?.[0]?.toUpperCase() || 'P'}
                                            </div>

                                            {plan.id === school?.plan_id && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    background: isExpired ? '#fef2f2' : '#f0fdf4',
                                                    color: isExpired ? '#dc2626' : '#16a34a',
                                                    border: `1px solid ${isExpired ? '#fecaca' : '#bbf7d0'}`,
                                                    letterSpacing: '0.02em',
                                                }}>
                                                    {isExpired ? 'Previous Plan' : 'Current Plan'}
                                                </span>
                                            )}
                                        </div>

                                        <p style={{ fontSize: '16.5px', fontWeight: 700, color: TEXT_DARK, marginBottom: '2px' }}>{plan.name}</p>
                                        <p style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '16px' }}>
                                            {tenureLabel(plan.tenure_years)} · {storageLabel(plan.storage_mb)} storage
                                        </p>

                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '3px' }}>
                                            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '34px', fontWeight: 800, color: TEXT_DARK, letterSpacing: '-0.02em' }}>
                                                ₹{Number(plan.price).toLocaleString('en-IN')}
                                            </span>
                                            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#94a3b8' }}>
                                                / {plan.tenure_years} yr
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '18px' }}>
                                            One-time · {tenureLabel(plan.tenure_years)} of hosting
                                        </p>

                                        <button
                                            onClick={() => handlePay(plan)}
                                            disabled={disabled}
                                            className={`bill-cta${featured ? '' : ' bill-cta-outline'}`}
                                            style={{
                                                width: '100%', padding: '13px', borderRadius: '13px',
                                                fontSize: '13.5px', fontWeight: 700, marginBottom: '20px',
                                                fontFamily: "'Inter', system-ui, sans-serif",
                                                cursor: disabled ? 'not-allowed' : 'pointer',
                                                border: featured ? 'none' : `1.5px solid ${BLUE}66`,
                                                background: featured
                                                    ? (busy ? '#94a3b8' : `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`)
                                                    : (busy ? '#f1f5f9' : '#fff'),
                                                color: featured ? '#fff' : (busy ? '#94a3b8' : BLUE),
                                                boxShadow: featured && !busy ? `0 14px 28px ${BLUE}44` : 'none',
                                                opacity: disabled && !busy ? 0.55 : 1,
                                            }}>
                                            {busy
                                                ? 'Processing…'
                                                : plan.id === school?.plan_id
                                                    ? (isExpired ? 'Renew this plan' : 'Extend this plan')
                                                    : (isProactiveManage ? 'Upgrade to this plan' : 'Get this plan')}
                                        </button>

                                        <div style={{ height: '1px', background: '#eef1f6', marginBottom: '16px' }} />

                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                `${storageLabel(plan.storage_mb)} media storage`,
                                                'All website modules included',
                                                ...(plan.features || []),
                                            ].map((f, i) => (
                                                <li key={i} style={{ fontSize: '12.5px', color: '#475569', display: 'flex', gap: '9px', alignItems: 'flex-start', lineHeight: 1.45 }}>
                                                    <span style={{
                                                        flexShrink: 0, width: '17px', height: '17px', borderRadius: '50%',
                                                        background: BLUE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
                                                    }}>
                                                        <svg width="9" height="9" fill="none" stroke={BLUE} strokeWidth="3.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    </span>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>

                                        {plan.description && (
                                            <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '16px', lineHeight: 1.5, borderTop: '1px dashed #eef1f6', paddingTop: '12px' }}>
                                                {plan.description}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                            Secure checkout powered by Razorpay · you'll get an email receipt
                        </p>
                    </>
                )}
            </div>

            {/* ── Post-payment subdomain popup — only shown once, right after a
                 school's first successful payment (see the handler above). ── */}
            {showSubdomainPopup && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: '#fff', maxWidth: '420px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,23,42,0.35)' }}>
                        <div style={{ padding: '1.75rem 1.75rem 1.25rem' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: TEXT_DARK, marginBottom: '6px', fontFamily: "'Playfair Display', serif" }}>
                                Get a free wbpro.in subdomain
                            </h3>
                            <p style={{ fontSize: '13px', color: TEXT_MUTED, marginBottom: '18px', lineHeight: 1.6 }}>
                                Pick a subdomain for {school?.name ? `${school.name}'s` : 'your'} website — we'll set it up and email you once it's live, usually within 24 hours.
                            </p>
                            <SubdomainRequestForm
                                tc={{ primary: BLUE, secondary: BLUE_DARK }}
                                onSuccess={proceedToDashboard}
                            />
                        </div>
                        <div style={{ padding: '0 1.75rem 1.5rem' }}>
                            <button onClick={proceedToDashboard}
                                style={{ width: '100%', padding: '10px', background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
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
