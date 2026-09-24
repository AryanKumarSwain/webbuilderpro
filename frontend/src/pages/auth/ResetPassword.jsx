import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPasswordApi } from '../../api/auth.api';
import logo from '../../assets/webbuilder-removebg-preview.png';

const THEMES = {
  admin: {
    accent: '#2563eb',
    accentDark: '#1d4ed8',
    loginPath: '/login',
    portalLabel: 'School Admin Portal',
    badgeBg: '#eff6ff',
    badgeBorder: '#bfdbfe',
    badgeColor: '#1d4ed8',
  },
  super_admin: {
    accent: '#ea580c',
    accentDark: '#c2410c',
    loginPath: '/super-admin/login',
    portalLabel: 'Super Admin Portal',
    badgeBg: '#fff7ed',
    badgeBorder: '#fed7aa',
    badgeColor: '#c2410c',
  },
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const role = searchParams.get('role') === 'super_admin' ? 'super_admin' : 'admin';
  const theme = THEMES[role] || THEMES.admin;

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
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          min-height: 100% !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes borderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes auroraBgShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes rpOrb1 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(45px, 35px) scale(1.12); }
          66% { transform: translate(-30px, 50px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes rpOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, -35px) scale(1.15); }
          66% { transform: translate(35px, -45px) scale(0.92); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes accountGradientFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes rpCardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .rp-card-wrap {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 440px;
          border-radius: 30px;
          padding: 3px;
          overflow: hidden;
          box-sizing: border-box;
          box-shadow: 0 25px 70px -15px rgba(37, 99, 235, 0.22), 0 0 25px rgba(56, 189, 248, 0.35);
          animation: rpCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .rp-card-wrap::before {
          content: '';
          position: absolute;
          top: -60%;
          left: -60%;
          width: 220%;
          height: 220%;
          background: conic-gradient(
            from 0deg,
            #38bdf8,
            #8b5cf6,
            #ec4899,
            #f97316,
            #38bdf8
          );
          animation: borderSpin 4s linear infinite;
          z-index: 0;
        }

        .rp-gradient-text {
          background: linear-gradient(
            90deg,
            #3b82f6 0%,
            #8b5cf6 25%,
            #ec4899 50%,
            #3b82f6 75%,
            #8b5cf6 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: accountGradientFlow 3.5s linear infinite;
          display: inline-block;
        }

        .rp-input {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rp-input:focus {
          border-color: #3b82f6 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
        }

        .rp-submit-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rp-submit-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-20deg);
          transition: left 0.65s ease;
          pointer-events: none;
        }
        .rp-submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -4px rgba(225, 82, 65, 0.48), 0 4px 12px rgba(249, 115, 22, 0.32) !important;
        }
        .rp-submit-btn:not(:disabled):hover::after { left: 130%; }
        .rp-submit-btn:not(:disabled):active { transform: scale(0.98); }

        .rp-back-link {
          transition: color 0.15s ease;
        }
        .rp-back-link:hover {
          color: #e15241 !important;
        }

        @media (max-width: 480px) {
          .rp-outer { padding: 1rem 0.85rem !important; }
          .rp-card-wrap { border-radius: 24px !important; }
          .rp-card { padding: 2rem 1.4rem !important; border-radius: 21px !important; }
        }
      `}</style>

      {/* ── Outer Screen with Light Aurora Mesh ── */}
      <div className="rp-outer" style={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: `
          radial-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px) 0 0 / 24px 24px,
          linear-gradient(135deg, #e0f2fe 0%, #ffffff 28%, #fff7ed 55%, #f3e8ff 80%, #ecfdf5 100%)
        `,
        backgroundSize: '240% 240%',
        animation: 'auroraBgShift 14s ease-in-out infinite',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: '1.5rem',
        boxSizing: 'border-box',
      }}>

        {/* Ambient Glowing Orbs */}
        <div style={{ position: 'absolute', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.30) 0%, transparent 70%)', top: '-70px', right: '-50px', animation: 'rpOrb1 9s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(30px)' }}></div>
        <div style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)', bottom: '-50px', left: '-50px', animation: 'rpOrb2 10s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(30px)' }}></div>

        {/* ── Card Wrapped in 360° Neon Flowing Border ── */}
        <div className="rp-card-wrap">
          <div className="rp-card" style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            background: '#ffffff',
            borderRadius: '27px',
            padding: '2.4rem 2rem 2.2rem',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}>
            {/* Centered Large Logo */}
            <img
              src={logo}
              alt="Web Builder Pro"
              style={{
                height: '62px',
                width: 'auto',
                margin: '0 auto 10px',
                display: 'block',
                objectFit: 'contain',
              }}
            />

            {/* Portal Badge Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 12px',
              borderRadius: '999px',
              background: theme.badgeBg,
              border: `1px solid ${theme.badgeBorder}`,
              color: theme.badgeColor,
              fontSize: '11px',
              fontWeight: 700,
              marginBottom: '18px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.accent }}></span>
              {theme.portalLabel}
            </div>

            {!token ? (
              <>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '20px',
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#ef4444',
                }}>
                  <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '8px',
                  letterSpacing: '-0.4px',
                }}>
                  Invalid <span style={{ color: '#ef4444' }}>Reset Link</span>
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.55, marginBottom: '22px' }}>
                  This password reset link is missing or has expired. Please request a new one.
                </p>
                <Link
                  to="/forgot-password"
                  style={{
                    display: 'inline-block',
                    padding: '11px 22px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #e15241 0%, #f97316 55%, #ea580c 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    textDecoration: 'none',
                    boxShadow: '0 8px 20px -2px rgba(225, 82, 65, 0.38)',
                  }}
                >
                  Request New Link
                </Link>
              </>
            ) : done ? (
              <>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  border: '1.5px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#059669',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)',
                }}>
                  <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: '23px',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '8px',
                  letterSpacing: '-0.4px',
                }}>
                  Password <span className="rp-gradient-text">Reset!</span>
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.55 }}>
                  Your password has been updated. Redirecting you to login...
                </p>
              </>
            ) : (
              <>
                <h1 style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '6px',
                  letterSpacing: '-0.4px',
                }}>
                  Set New <span className="rp-gradient-text">Password</span>
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.55, marginBottom: '22px' }}>
                  Choose a secure new password for your account.
                </p>

                <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '6px',
                    }}>
                      New Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        minLength={8}
                        className="rp-input"
                        style={{
                          width: '100%',
                          padding: '11px 40px 11px 14px',
                          borderRadius: '12px',
                          border: '1.5px solid #e2e8f0',
                          background: '#f8fafc',
                          color: '#0f172a',
                          fontSize: '13.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          fontFamily: "'Inter', system-ui, sans-serif",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                      >
                        {showPassword ? (
                          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '6px',
                    }}>
                      Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        minLength={8}
                        className="rp-input"
                        style={{
                          width: '100%',
                          padding: '11px 40px 11px 14px',
                          borderRadius: '12px',
                          border: confirmPassword && password !== confirmPassword ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                          background: '#f8fafc',
                          color: '#0f172a',
                          fontSize: '13.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          fontFamily: "'Inter', system-ui, sans-serif",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                      >
                        {showConfirmPassword ? (
                          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {confirmPassword && password !== confirmPassword && (
                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                      Passwords do not match
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="rp-submit-btn"
                    style={{
                      width: '100%',
                      padding: '13px',
                      border: 'none',
                      borderRadius: '13px',
                      background: loading
                        ? '#fdba74'
                        : 'linear-gradient(135deg, #e15241 0%, #f97316 55%, #ea580c 100%)',
                      color: '#ffffff',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '4px',
                      boxShadow: '0 8px 24px -2px rgba(225, 82, 65, 0.42), 0 3px 8px rgba(249, 115, 22, 0.25)',
                    }}
                  >
                    {loading ? (
                      <>
                        <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            <div style={{ marginTop: '20px' }}>
              <Link
                to={theme.loginPath}
                className="rp-back-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#64748b',
                  textDecoration: 'none',
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
