import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPasswordApi } from '../../api/auth.api';
import logo from '../../assets/webbuilder-removebg-preview.png';

const THEMES = {
    admin: {
        accent: '#4169E1',
        accentDark: '#2541A8',
        loginPath: '/login',
        portalLabel: 'School Admin Portal',
    },
    super_admin: {
        accent: '#8C6A3F',
        accentDark: '#6b4f2c',
        loginPath: '/super-admin/login',
        portalLabel: 'Super Admin Portal',
    },
};

const ForgotPassword = ({ role = 'admin' }) => {
    const theme = THEMES[role] || THEMES.admin;
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPasswordApi(email, role);
            setSent(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
            <style>{`
                html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fpOrbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(18px,-16px) scale(1.08); } }
                @keyframes fpCardIn { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .fp-input:focus { border-color: ${theme.accent} !important; box-shadow: 0 0 0 3px ${theme.accent}22; }
                .fp-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 10px 26px ${theme.accent}44 !important; }
                .fp-back { transition: color 0.2s; }
                .fp-back:hover { color: ${theme.accent} !important; }
                .fp-orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(2px); animation: fpOrbDrift 9s ease-in-out infinite; }
            `}</style>

            <div style={{
                width: '100vw', minHeight: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
                background: `radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px) 0 0 / 26px 26px, linear-gradient(160deg, ${theme.accentDark} 0%, ${theme.accent} 55%, ${theme.accentDark} 100%)`,
                fontFamily: "'Inter', sans-serif",
                padding: '1.5rem',
                boxSizing: 'border-box',
            }}>
                {/* Floating 3D orbs behind the card — same drift treatment as Login/Signup */}
                <div className="fp-orb" style={{ width: '260px', height: '260px', background: 'rgba(255,255,255,0.14)', top: '-90px', left: '-70px', animationDelay: '0s' }}></div>
                <div className="fp-orb" style={{ width: '200px', height: '200px', background: 'rgba(0,0,0,0.15)', bottom: '-60px', right: '-50px', animationDelay: '1.5s', animationDirection: 'reverse' }}></div>
                <div className="fp-orb" style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', top: '55%', right: '8%', animationDelay: '0.7s' }}></div>

                <div style={{
                    position: 'relative', zIndex: 1,
                    width: '100%', maxWidth: '400px',
                    background: '#fff', borderRadius: '20px',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 4px 20px rgba(0,0,0,0.15)',
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    animation: 'fpCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
                }}>
                    <img src={logo} alt="Web Builder Pro" style={{ width: '160px', height: 'auto', margin: '0 auto 8px', display: 'block' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                        <span style={{ width: '14px', height: '2px', background: theme.accent }}></span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: theme.accent, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                            {theme.portalLabel}
                        </span>
                        <span style={{ width: '14px', height: '2px', background: theme.accent }}></span>
                    </div>

                    {sent ? (
                        <>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `${theme.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                                <svg width="26" height="26" fill="none" stroke={theme.accent} strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 700, color: '#20242C', marginBottom: '10px' }}>
                                Check your email
                            </h1>
                            <p style={{ color: '#6b7280', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '24px' }}>
                                If an account exists for <strong>{email}</strong>, we've sent a password reset link. It's valid for 30 minutes.
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: '#20242C', marginBottom: '8px' }}>
                                Forgot Password?
                            </h1>
                            <p style={{ color: '#6b7280', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '26px' }}>
                                Enter your registered email and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>
                                    Email Address
                                </label>
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email" required className="fp-input"
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e5e9f5', background: '#fff', color: '#20242C', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '20px', transition: 'all 0.2s' }}
                                />
                                <button type="submit" disabled={loading} className="fp-btn"
                                    style={{
                                        width: '100%', padding: '13px', border: 'none', borderRadius: '12px',
                                        background: loading ? '#c9c9c9' : `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
                                        color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
                                        boxShadow: `0 6px 20px ${theme.accent}33`,
                                    }}>
                                    {loading ? (
                                        <>
                                            <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                                                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Sending...
                                        </>
                                    ) : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    )}

                    <Link to={theme.loginPath} className="fp-back" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9a9a9a', textDecoration: 'none', marginTop: '22px' }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Login
                    </Link>
                </div>
            </div>
        </>
    );
};

export default ForgotPassword;
