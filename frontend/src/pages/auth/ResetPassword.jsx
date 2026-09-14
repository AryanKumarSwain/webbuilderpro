import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPasswordApi } from '../../api/auth.api';
import logo from '../../assets/webbuilder-removebg-preview.png';

const THEMES = {
    admin: { accent: '#4169E1', accentDark: '#2541A8', loginPath: '/login', portalLabel: 'School Admin Portal' },
    super_admin: { accent: '#8C6A3F', accentDark: '#6b4f2c', loginPath: '/super-admin/login', portalLabel: 'Super Admin Portal' },
};

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const role = searchParams.get('role') === 'super_admin' ? 'super_admin' : 'admin';
    const theme = THEMES[role];

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Missing or invalid reset link');
            return;
        }
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await resetPasswordApi(token, role, password);
            setDone(true);
            toast.success('Password reset successful!');
            setTimeout(() => navigate(theme.loginPath), 2500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Reset failed');
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
                html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow-x: hidden !important; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes rpOrbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(18px,-16px) scale(1.08); } }
                @keyframes rpCardIn { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .rp-input:focus { border-color: ${theme.accent} !important; box-shadow: 0 0 0 3px ${theme.accent}22; }
                .rp-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 10px 26px ${theme.accent}44 !important; }
                .rp-orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(2px); animation: rpOrbDrift 9s ease-in-out infinite; }
                @media (max-width: 480px) {
                    .rp-outer { padding: 1rem !important; }
                    .rp-card { padding: 2rem 1.5rem !important; }
                }
            `}</style>

            <div className="rp-outer" style={{
                width: '100%', minHeight: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
                background: `radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px) 0 0 / 26px 26px, linear-gradient(160deg, ${theme.accentDark} 0%, ${theme.accent} 55%, ${theme.accentDark} 100%)`,
                fontFamily: "'Inter', sans-serif",
                padding: '1.5rem',
                boxSizing: 'border-box',
            }}>
                {/* Floating 3D orbs behind the card — same treatment as Login/Signup/Forgot Password */}
                <div className="rp-orb" style={{ width: '260px', height: '260px', background: 'rgba(255,255,255,0.14)', top: '-90px', left: '-70px' }}></div>
                <div className="rp-orb" style={{ width: '200px', height: '200px', background: 'rgba(0,0,0,0.15)', bottom: '-60px', right: '-50px', animationDelay: '1.5s', animationDirection: 'reverse' }}></div>
                <div className="rp-orb" style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', top: '55%', right: '8%', animationDelay: '0.7s' }}></div>

                <div className="rp-card" style={{
                    position: 'relative', zIndex: 1,
                    width: '100%', maxWidth: '400px',
                    background: '#fff', borderRadius: '20px',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 4px 20px rgba(0,0,0,0.15)',
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    animation: 'rpCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
                }}>
                    <img src={logo} alt="Web Builder Pro" style={{ width: '160px', height: 'auto', margin: '0 auto 8px', display: 'block' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                        <span style={{ width: '14px', height: '2px', background: theme.accent }}></span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: theme.accent, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                            {theme.portalLabel}
                        </span>
                        <span style={{ width: '14px', height: '2px', background: theme.accent }}></span>
                    </div>

                    {!token ? (
                        <>
                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 700, color: '#20242C', marginBottom: '10px' }}>
                                Invalid Reset Link
                            </h1>
                            <p style={{ color: '#6b7280', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '10px' }}>
                                This password reset link is missing or malformed. Please request a new one.
                            </p>
                        </>
                    ) : done ? (
                        <>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `${theme.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                                <svg width="26" height="26" fill="none" stroke={theme.accent} strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 700, color: '#20242C', marginBottom: '10px' }}>
                                Password Reset!
                            </h1>
                            <p style={{ color: '#6b7280', fontSize: '13.5px', lineHeight: 1.6 }}>
                                Redirecting you to login...
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 700, color: '#20242C', marginBottom: '8px' }}>
                                Set New Password
                            </h1>
                            <p style={{ color: '#6b7280', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '26px' }}>
                                Choose a new password for your account.
                            </p>

                            <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>
                                        New Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter new password (min. 8 characters)" required minLength={8} className="rp-input"
                                            style={{ width: '100%', padding: '12px 42px 12px 14px', borderRadius: '12px', border: '1.5px solid #e5e9f5', background: '#fff', color: '#20242C', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#b7c0d6', display: 'flex', alignItems: 'center' }}>
                                            {showPassword ? (
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>
                                        Confirm Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter new password" required minLength={8} className="rp-input"
                                            style={{ width: '100%', padding: '12px 42px 12px 14px', borderRadius: '12px', border: '1.5px solid #e5e9f5', background: '#fff', color: '#20242C', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#b7c0d6', display: 'flex', alignItems: 'center' }}>
                                            {showConfirmPassword ? (
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="rp-btn"
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
                                            Resetting...
                                        </>
                                    ) : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}

                    <Link to={theme.loginPath} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9a9a9a', textDecoration: 'none', marginTop: '22px' }}>
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

export default ResetPassword;
