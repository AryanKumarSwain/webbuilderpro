import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { loginApi, getGoogleAuthUrl } from "../../api/auth.api";
import useAuthStore from "../../store/authStore";
import logo from '../../assets/webbuilder-removebg-preview.png';

const BLUE = '#4169E1';
const BLUE_DARK = '#2541A8';
const GREY = '#3B3B3B';
const TEXT_MUTED = '#5B6270';
const TEXT_DARK = '#20242C';

// ── Left-panel carousel — one slide per module, auto-advancing every 3s with a 3D
// flip-in (see .login-slide-3d). Accent cycles through the brand's blue palette. ──
const SLIDES = [
  {
    title: 'Class-wise Fee Management', desc: 'Transparent fee tables for every class, updated in seconds.', accent: BLUE,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  },
  {
    title: 'Showcase Campus Life', desc: 'Photo albums, videos, and sports events — all in one place.', accent: '#6C8EEF',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    title: 'Keep Everyone Updated', desc: 'Announcements and an academic calendar parents actually check.', accent: BLUE_DARK,
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    title: 'Capture Every Enquiry', desc: 'Public admission & career forms that land straight in your inbox.', accent: '#7C93E8',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />,
  },
  {
    title: 'Celebrate Your Legacy', desc: 'Showcase alumni success stories and every award you\'ve earned.', accent: '#5B78D8',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />,
  },
];

const STATS = [
  { value: '21+', label: 'Modules' },
  { value: '100%', label: 'Secure' },
  { value: '24/7', label: 'Access' },
];

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      toast.error(decodeURIComponent(err));
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(i => (i + 1) % SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi(formData.email, formData.password, "admin");
      setAuth(res.data.user, "admin", res.data.accessToken);
      toast.success("Login successful!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          border: none !important;
          text-align: left !important;
          display: block !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-input:focus {
          border-color: ${BLUE} !important;
          box-shadow: 0 0 0 3px rgba(65,105,225,0.12);
        }
        .login-field-icon { transition: color 0.25s ease; }
        .login-field:focus-within .login-field-icon { color: ${BLUE} !important; }

        .login-submit-btn { position: relative; overflow: hidden; }
        .login-submit-btn::after {
          content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent);
          transform: skewX(-20deg); transition: left 0.65s ease; pointer-events: none;
        }
        .login-submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(65,105,225,0.25), 0 12px 28px rgba(65,105,225,0.42) !important;
        }
        .login-submit-btn:not(:disabled):hover::after { left: 130%; }
        .login-submit-btn:not(:disabled):active { transform: scale(0.97); }

        .login-google-btn { transition: all 0.2s ease; }
        .login-google-btn:hover {
          background: #f8faff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
          transform: translateY(-1px);
        }
        .login-google-btn:active { transform: scale(0.98); }

        @keyframes loginOrbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(14px,-12px) scale(1.07); } }
        @keyframes loginFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loginShimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        @keyframes loginFloatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes loginGlowPulse { 0%,100% { opacity: 0.4; transform: translate(-50%,-50%) scale(1); } 50% { opacity: 0.65; transform: translate(-50%,-50%) scale(1.08); } }
        @keyframes loginSlideTile3D { 0% { opacity: 0; transform: perspective(900px) rotateY(50deg) rotateX(8deg) scale(0.8); } 100% { opacity: 1; transform: perspective(900px) rotateY(0deg) rotateX(0deg) scale(1); } }
        @keyframes loginSlideText3D { 0% { opacity: 0; transform: translateY(14px) rotateX(20deg); } 100% { opacity: 1; transform: translateY(0) rotateX(0deg); } }

        .login-anim-1 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .login-anim-2 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .login-anim-3 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
        .login-anim-4 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
        .login-anim-5 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both; }
        .login-anim-6 { animation: loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.6s both; }

        .login-float { animation: loginFloatY 5s ease-in-out infinite; }
        .login-glow-pulse { animation: loginGlowPulse 4s ease-in-out infinite; }
        .login-slide-3d { animation: loginSlideTile3D 0.75s cubic-bezier(0.16,1,0.3,1) both; transform-style: preserve-3d; }
        .login-slide-text-3d { animation: loginSlideText3D 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both; transform-style: preserve-3d; }

        .login-shimmer-text {
          background: linear-gradient(90deg, #ffffff, #cddaff, #ffffff);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: loginShimmer 7s linear infinite;
        }
        .login-shimmer-text-dark {
          background: linear-gradient(90deg, ${TEXT_DARK}, ${BLUE}, ${TEXT_DARK});
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: loginShimmer 7s linear infinite;
        }

        /* ── Mobile-only decorative layer + floating glass card ── */
        .login-mobile-blob { display: none; }
        .login-divider { display: block; }

        @media (max-width: 860px) {
          .login-shell { grid-template-columns: 1fr !important; height: auto !important; min-height: 100vh !important; overflow: visible !important; }
          .login-left-panel { display: none !important; }
          .login-divider { display: none !important; }
          .login-right-panel {
            padding: 3rem 1.1rem 2.5rem !important;
            overflow-y: visible !important;
            overflow-x: hidden !important;
            position: relative;
            background: linear-gradient(160deg, ${BLUE_DARK} 0%, ${BLUE} 55%, ${BLUE_DARK} 100%) !important;
            min-height: 100vh !important;
          }

          .login-mobile-blob { display: block; position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
          .login-blob-1 { width: 220px; height: 220px; background: rgba(255,255,255,0.16); top: -70px; right: -60px; animation: loginOrbDrift 8s ease-in-out infinite; }
          .login-blob-2 { width: 170px; height: 170px; background: rgba(20,26,46,0.3); bottom: 40px; left: -60px; animation: loginOrbDrift 10s ease-in-out infinite reverse; }
          .login-blob-3 { width: 90px; height: 90px; background: rgba(255,255,255,0.14); top: 44%; left: -35px; animation: loginOrbDrift 7s ease-in-out infinite; }

          .login-mobile-card {
            position: relative; z-index: 1;
            width: 100%; max-width: 420px; margin: 0 auto;
            background: rgba(255,255,255,0.96);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.7);
            box-shadow: 0 24px 60px rgba(37,65,168,0.28), 0 2px 14px rgba(0,0,0,0.05);
            padding: 2.25rem 1.5rem 1.75rem;
          }

          .login-right-logo { width: clamp(220px, 32vh, 320px) !important; height: auto !important; margin: 0 auto 0.75rem !important; display: block !important; }
          .login-mobile-heading { text-align: center !important; }
          .login-mobile-sub { text-align: center !important; }
          .login-mobile-footer { text-align: center !important; }
        }
        @media (max-width: 400px) {
          .login-right-panel { padding-inline: 0.85rem !important; }
          .login-mobile-card { padding: 1.85rem 1.1rem 1.5rem !important; }
        }
      `}</style>

      <div className="login-shell" style={{
        display: "grid",
        gridTemplateColumns: "60fr 40fr",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        {/* ── Left Panel 60% — hidden on mobile, right panel already carries its own logo ── */}
        <div className="login-left-panel" style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          background: `radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(160deg, ${BLUE_DARK} 0%, ${BLUE} 55%, ${BLUE_DARK} 100%)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingBlock: "clamp(1rem, 4vh, 3rem)",
          paddingInline: "3rem",
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}>
          {/* Orbs — drifting continuously for a premium sense of motion */}
          <div style={{ position: "absolute", width: "320px", height: "320px", borderRadius: "50%", background: "rgba(255,255,255,0.14)", top: "-100px", left: "-80px", animation: "loginOrbDrift 11s ease-in-out infinite" }}></div>
          <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(20,26,46,0.3)", top: "40%", right: "-60px", animation: "loginOrbDrift 9s ease-in-out infinite reverse" }}></div>
          <div style={{ position: "absolute", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", bottom: "60px", left: "20px", animation: "loginOrbDrift 13s ease-in-out infinite" }}></div>

          {/* Brand — top left */}
          <div className="login-anim-1" style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative", zIndex: 1 }}>
            <img
              src={logo}
              alt="Logo"
              style={{ height: 'clamp(84px, 14vh, 168px)', objectFit: 'contain' }}
            />
          </div>

          {/* Module carousel — auto-advances every 3s, 3D flip-in per slide (key={slideIndex}
               remounts the slide so the CSS animation re-triggers on every change). ── */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", perspective: "1200px" }}>
            <div key={slideIndex} className="login-slide-3d" style={{ position: "relative", width: "clamp(190px, 26vh, 300px)", height: "clamp(190px, 26vh, 300px)", margin: "0 auto clamp(0.5rem, 1.4vh, 1.25rem)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="login-glow-pulse" style={{ position: "absolute", top: "50%", left: "50%", width: "78%", height: "78%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 72%)", filter: "blur(6px)", pointerEvents: "none" }}></div>
              {/* Layered "card stack" — three fanned tiles give real depth instead of a single
                   flat square, and the fan direction alternates per slide for variety. ── */}
              <div className="login-float" style={{ position: "relative", width: "clamp(150px, 20vh, 210px)", height: "clamp(150px, 20vh, 210px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                  position: "absolute", width: "68%", height: "68%", borderRadius: "26px",
                  background: `linear-gradient(145deg, ${SLIDES[slideIndex].accent}, ${BLUE_DARK})`, opacity: 0.35,
                  transform: `rotate(${slideIndex % 2 === 0 ? -20 : 20}deg) translateY(8px)`,
                  boxShadow: "0 10px 22px rgba(0,0,0,0.15)",
                }}></div>
                <div style={{
                  position: "absolute", width: "77%", height: "77%", borderRadius: "28px",
                  background: `linear-gradient(145deg, ${SLIDES[slideIndex].accent}, ${BLUE_DARK})`, opacity: 0.65,
                  transform: `rotate(${slideIndex % 2 === 0 ? 11 : -11}deg) translateY(3px)`,
                  boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
                }}></div>
                <div style={{
                  position: "relative", width: "86%", height: "86%", borderRadius: "30px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(145deg, ${SLIDES[slideIndex].accent}, ${BLUE_DARK})`,
                  boxShadow: `inset 0 3px 4px rgba(255,255,255,0.4), inset 0 -6px 12px rgba(0,0,0,0.25), 0 26px 46px rgba(0,0,0,0.3)`,
                }}>
                  <svg width="30%" height="30%" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5">{SLIDES[slideIndex].icon}</svg>
                </div>
              </div>
            </div>

            <div key={`text-${slideIndex}`} className="login-slide-text-3d">
              <h2 className="login-shimmer-text" style={{ fontWeight: 800, fontSize: "clamp(26px, 4.2vh, 42px)", marginBottom: "clamp(8px, 1.4vh, 14px)", lineHeight: 1.25, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.01em" }}>
                {SLIDES[slideIndex].title}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "clamp(15px, 2vh, 18px)", lineHeight: 1.6, maxWidth: "420px", margin: "0 auto", fontWeight: 400 }}>
                {SLIDES[slideIndex].desc}
              </p>
            </div>

            {/* Dot indicators */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "clamp(0.9rem, 2vh, 1.5rem)" }}>
              {SLIDES.map((s, i) => (
                <button key={i} onClick={() => setSlideIndex(i)} aria-label={`Slide ${i + 1}`}
                  style={{ width: i === slideIndex ? "22px" : "7px", height: "7px", borderRadius: "999px", border: "none", cursor: "pointer", background: i === slideIndex ? "#ffffff" : "rgba(255,255,255,0.35)", transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)", padding: 0 }} />
              ))}
            </div>
          </div>

          {/* Trust stats + footer */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="login-anim-6" style={{ display: "flex", justifyContent: "center", gap: "clamp(1.5rem, 4vw, 3rem)", marginBottom: "clamp(0.75rem, 2vh, 1.5rem)" }}>
              {STATS.map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px, 2.8vh, 28px)", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "4px" }}>{s.label}</p>
                </div>
              ))}
            </div>
            <p className="login-anim-6" style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
              © 2026 Web Builder Pro
            </p>
          </div>
        </div>

        {/* ── Right Panel 40% ── */}
        <div className="login-right-panel" style={{
          background: "#ffffff",
          backgroundImage: "radial-gradient(rgba(65,105,225,0.035) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingBlock: "clamp(1rem, 4vh, 3rem)",
          paddingInline: "3.5rem",
          overflowY: "auto",
          minHeight: 0,
          position: "relative",
        }}>

          {/* Gradient divider between panels — desktop only */}
          <div className="login-divider" style={{ position: "absolute", left: 0, top: "10%", bottom: "10%", width: "1px", background: `linear-gradient(180deg, transparent, ${BLUE}4d, transparent)` }}></div>

          {/* ── Mobile-only decorative blobs, floating behind the card ── */}
          <div className="login-mobile-blob login-blob-1"></div>
          <div className="login-mobile-blob login-blob-2"></div>
          <div className="login-mobile-blob login-blob-3"></div>

          <div className="login-mobile-card">

          {/* Back to landing page */}
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: TEXT_MUTED,
              fontSize: "12.5px",
              fontWeight: 600,
              textDecoration: "none",
              marginBottom: "clamp(0.4rem, 1vh, 0.75rem)",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = BLUE; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = TEXT_MUTED; }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to landing page
          </Link>

          {/* Logo — right panel top */}
          <img
            src={logo}
            alt="Web Builder Pro Logo"
            className="login-right-logo login-anim-1"
            style={{
    width: 'clamp(170px, 24vh, 320px)',
    height: 'clamp(85px, 12vh, 160px)',
    objectFit: 'contain',
    marginBottom: 'clamp(0.25rem, 1vh, 0.5rem)',
    marginLeft: '-24px'
}}
          />

          <h1 className="login-mobile-heading login-anim-2 login-shimmer-text-dark" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(28px, 4.4vh, 46px)",
            fontWeight: 800,
            marginBottom: "clamp(4px, 1vh, 8px)",
            lineHeight: 1.15,
          }}>
            Login to your Account
          </h1>
          <p className="login-mobile-sub login-anim-2" style={{ color: TEXT_MUTED, fontSize: "clamp(12px, 1.4vh, 14px)", marginBottom: "clamp(1rem, 2.5vh, 2rem)", lineHeight: 1.4 }}>
            Your school, your rules — step inside<br />and take control.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "clamp(0.75rem, 1.8vh, 1.25rem)" }}>

            {/* Email */}
            <div className="login-anim-3">
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "7px" }}>
                Email
              </label>
              <div className="login-field" style={{ position: "relative" }}>
                <svg className="login-field-icon" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#b7c0d6" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="Enter email" required className="login-input"
                  style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "12px", border: "1.5px solid #e5e9f5", background: "#ffffff", color: TEXT_DARK, fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-anim-4">
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "7px" }}>
                Password
              </label>
              <div className="login-field" style={{ position: "relative" }}>
                <svg className="login-field-icon" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "#b7c0d6" }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"} name="password" value={formData.password}
                  onChange={handleChange} placeholder="Enter your password" required className="login-input"
                  style={{ width: "100%", padding: "12px 42px 12px 42px", borderRadius: "12px", border: "1.5px solid #e5e9f5", background: "#ffffff", color: TEXT_DARK, fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#b7c0d6", display: "flex", alignItems: "center" }}>
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
              <Link to="/forgot-password" style={{ display: "block", textAlign: "right", fontSize: "12px", fontWeight: 600, color: BLUE, textDecoration: "none", marginTop: "8px" }}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <div className="login-anim-5">
              <button type="submit" disabled={loading} className="login-submit-btn"
                style={{ width: "100%", padding: "clamp(10px, 1.6vh, 14px)", background: loading ? "#a9b8ea" : `linear-gradient(150deg, ${BLUE}, ${BLUE_DARK} 65%, ${GREY})`, color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(65,105,225,0.3)", transition: "all 0.2s" }}>
                {loading ? (
                  <>
                    <svg style={{ animation: "spin 1s linear infinite", width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="login-anim-5" style={{
            display: 'flex',
            alignItems: 'center',
            marginBlock: 'clamp(0.9rem, 2vh, 1.4rem)',
            gap: '12px',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e9f5' }} />
            <span style={{ fontSize: '11px', color: '#9aa3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e5e9f5' }} />
          </div>

          {/* Google Sign In Button */}
          <div className="login-anim-5">
            <button
              type="button"
              onClick={() => { window.location.href = getGoogleAuthUrl('admin'); }}
              className="login-google-btn"
              style={{
                width: '100%',
                padding: 'clamp(10px, 1.4vh, 13px)',
                background: '#ffffff',
                color: TEXT_DARK,
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="login-anim-6" style={{ textAlign: "center", color: "#9aa3b8", fontSize: "12.5px", marginTop: "clamp(0.9rem, 3vh, 1.75rem)" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
          </p>

          <p className="login-mobile-footer login-anim-6" style={{ textAlign: "center", color: "#9aa3b8", fontSize: "12px", marginTop: "clamp(0.6rem, 2vh, 1rem)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure login · Web Builder Pro
          </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
