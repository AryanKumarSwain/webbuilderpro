import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPasswordApi } from '../../api/auth.api';
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

const ForgotPassword = ({ role = 'admin' }) => {
  const theme = THEMES[role] || THEMES.admin;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordApi(email.trim(), role);
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
        @keyframes fpOrb1 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(45px, 35px) scale(1.12); }
          66% { transform: translate(-30px, 50px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes fpOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, -35px) scale(1.15); }
          66% { transform: translate(35px, -45px) scale(0.92); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes accountGradientFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes fpCardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .fp-card-wrap {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 440px;
          border-radius: 30px;
          padding: 3px;
          overflow: hidden;
          box-sizing: border-box;
          box-shadow: 0 25px 70px -15px rgba(37, 99, 235, 0.22), 0 0 25px rgba(56, 189, 248, 0.35);
          animation: fpCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .fp-card-wrap::before {
          content: '';
          position: absolute;
          top: -60%;
          left: -60%;
          width: 220%;
          height: 220%;
          background: conic-gradient(
            from 0deg,
            #38bdf8 0%,
            #8b5cf6 25%,
            #ec4899 50%,
            #f97316 75%,
            #38bdf8 100%
          );
          animation: borderSpin 4s linear infinite;
          z-index: 0;
        }

        .fp-gradient-text {
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

        .fp-input {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fp-input:focus {
          border-color: #3b82f6 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
        }

        .fp-submit-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fp-submit-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-20deg);
          transition: left 0.65s ease;
          pointer-events: none;
        }
        .fp-submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -4px rgba(225, 82, 65, 0.48), 0 4px 12px rgba(249, 115, 22, 0.32) !important;
        }
        .fp-submit-btn:not(:disabled):hover::after { left: 130%; }
        .fp-submit-btn:not(:disabled):active { transform: scale(0.98); }

        .fp-back-link {
          transition: color 0.15s ease;
        }
        .fp-back-link:hover {
          color: #e15241 !important;
        }

        @media (max-width: 480px) {
          .fp-outer { padding: 1rem 0.85rem !important; }
          .fp-card-wrap { border-radius: 24px !important; }
          .fp-card { padding: 2rem 1.4rem !important; border-radius: 21px !important; }
        }
      `}</style>

      {/* ── Outer Screen with Light Aurora Mesh matching Login & Signup ── */}
      <div className="fp-outer" style={{
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
        <div style={{ position: 'absolute', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.30) 0%, transparent 70%)', top: '-70px', right: '-50px', animation: 'fpOrb1 9s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(30px)' }}></div>
        <div style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)', bottom: '-50px', left: '-50px', animation: 'fpOrb2 10s ease-in-out infinite', pointerEvents: 'none', filter: 'blur(30px)' }}></div>

        {/* ── Card Wrapped in 360° Neon Flowing Border ── */}
        <div className="fp-card-wrap">
          <div className="fp-card" style={{
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

            {sent ? (
              <>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
                  border: '1.5px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#2563eb',
                  boxShadow: '0 8px 20px rgba(37, 99, 235, 0.15)',
                }}>
                  <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                  Check your <span className="fp-gradient-text">Email</span>
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, marginBottom: '22px' }}>
                  If an account exists for <strong style={{ color: '#0f172a' }}>{email}</strong>, we've sent a password reset link valid for 30 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#e15241',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    marginBottom: '10px',
                  }}
                >
                  ← Try a different email
                </button>
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
                  Forgot <span className="fp-gradient-text">Password?</span>
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.55, marginBottom: '22px' }}>
                  Enter your registered email and we'll send you a link to reset your password.
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
                      Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      required
                      autoFocus
                      className="fp-input"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
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
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="fp-submit-btn"
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
                        Sending Link...
                      </>
                    ) : (
                      <>
                        Send Reset Link
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
                className="fp-back-link"
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

export default ForgotPassword;
