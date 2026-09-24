import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { loginApi, getGoogleAuthUrl } from "../../api/auth.api";
import useAuthStore from "../../store/authStore";
import logo from '../../assets/webbuilder-removebg-preview.png';

// ── Left-panel carousel — vibrant colorful modules from the Landing Page palette ──
const SLIDES = [
  {
    tag: 'Finance & Accounts',
    tagBg: '#ecfdf5',
    tagColor: '#059669',
    tagBorder: '#a7f3d0',
    title: 'Class-wise Fee Management',
    desc: 'Transparent fee tables, online collections & instant receipts in seconds.',
    accent: '#10b981',
    gradient: ['#10b981', '#047857'],
    glow: 'rgba(16, 185, 129, 0.42)',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
  },
  {
    tag: 'Media & Campus Life',
    tagBg: '#fff7ed',
    tagColor: '#ea580c',
    tagBorder: '#fed7aa',
    title: 'Showcase Campus Life',
    desc: 'Photo albums, sports events & video galleries — celebrate student energy.',
    accent: '#f97316',
    gradient: ['#f97316', '#ea580c'],
    glow: 'rgba(249, 115, 22, 0.42)',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
  {
    tag: 'Notices & Circulars',
    tagBg: '#f0f9ff',
    tagColor: '#0284c7',
    tagBorder: '#bae6fd',
    title: 'Keep Everyone Updated',
    desc: 'Instant announcements and an academic calendar parents actually check.',
    accent: '#0284c7',
    gradient: ['#38bdf8', '#0284c7'],
    glow: 'rgba(2, 132, 199, 0.42)',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
  {
    tag: 'Admissions & Inquiries',
    tagBg: '#fff1f2',
    tagColor: '#e11d48',
    tagBorder: '#fecdd3',
    title: 'Capture Every Enquiry',
    desc: 'Public admission & career enquiry forms that land straight in your inbox.',
    accent: '#f43f5e',
    gradient: ['#fb7185', '#e11d48'],
    glow: 'rgba(244, 63, 94, 0.42)',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    ),
  },
  {
    tag: 'Legacy & Alumni',
    tagBg: '#f5f3ff',
    tagColor: '#7c3aed',
    tagBorder: '#ddd6fe',
    title: 'Celebrate Your Legacy',
    desc: 'Showcase alumni success stories and every academic trophy you\'ve earned.',
    accent: '#8b5cf6',
    gradient: ['#8b5cf6', '#6d28d9'],
    glow: 'rgba(139, 92, 246, 0.42)',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    ),
  },
];

const STATS = [
  { value: '25+', label: 'Modules', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { value: '100%', label: 'Secure', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  { value: '24/7', label: 'Cloud Access', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
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
    }, 3200);
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

  const activeSlide = SLIDES[slideIndex];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
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

        .login-input {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
          background: #ffffff !important;
        }
        .login-field-icon { transition: color 0.2s ease; }
        .login-field:focus-within .login-field-icon { color: #2563eb !important; }

        .login-submit-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-submit-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-20deg);
          transition: left 0.65s ease;
          pointer-events: none;
        }
        .login-submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -4px rgba(225, 82, 65, 0.5), 0 4px 12px rgba(249, 115, 22, 0.35) !important;
        }
        .login-submit-btn:not(:disabled):hover::after { left: 130%; }
        .login-submit-btn:not(:disabled):active { transform: scale(0.98); }

        .login-google-btn { transition: all 0.2s ease; }
        .login-google-btn:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 6px 18px rgba(0,0,0,0.06) !important;
          transform: translateY(-1px);
        }
        .login-google-btn:active { transform: scale(0.98); }

        @keyframes loginDividerMove {
          0% { background-position: 0% 0%; }
          100% { background-position: 0% 200%; }
        }
        @keyframes auroraBgShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes loginOrb1 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(65px, 50px) scale(1.15); }
          66% { transform: translate(-35px, 80px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes loginOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-70px, -50px) scale(1.18); }
          66% { transform: translate(45px, -70px) scale(0.92); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes loginOrb3 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(70px, -60px) scale(1.16); }
          66% { transform: translate(-50px, 45px) scale(0.94); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes loginOrb4 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-55px, 60px) scale(1.2); }
          66% { transform: translate(60px, -45px) scale(0.88); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes loginOrb5 {
          0% { transform: translate(0, 0) scale(0.95); }
          50% { transform: translate(50px, 70px) scale(1.22); }
          100% { transform: translate(0, 0) scale(0.95); }
        }

        @keyframes accountGradientFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .login-account-text {
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

        .login-divider {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(
            180deg,
            #38bdf8 0%,
            #8b5cf6 25%,
            #ec4899 50%,
            #f97316 75%,
            #38bdf8 100%
          );
          background-size: 100% 200%;
          animation: loginDividerMove 3.5s linear infinite;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.45), 0 0 18px rgba(236, 72, 153, 0.35);
          display: block;
          z-index: 10;
        }

        @keyframes loginFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes loginFloatSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes loginFloatReverse { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes loginGlowPulse { 0%, 100% { opacity: 0.45; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.12); } }
        @keyframes loginSlideTile3D { 0% { opacity: 0; transform: perspective(900px) rotateY(35deg) rotateX(10deg) scale(0.86); } 100% { opacity: 1; transform: perspective(900px) rotateY(0deg) rotateX(0deg) scale(1); } }
        @keyframes loginSlideText3D { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

        .login-anim-1 { animation: loginFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
        .login-anim-2 { animation: loginFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
        .login-anim-3 { animation: loginFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both; }
        .login-anim-4 { animation: loginFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both; }
        .login-anim-5 { animation: loginFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both; }
        .login-anim-6 { animation: loginFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both; }

        .login-float-slow { animation: loginFloatSlow 5s ease-in-out infinite; }
        .login-float-rev { animation: loginFloatReverse 6s ease-in-out infinite; }
        .login-glow-pulse { animation: loginGlowPulse 3.5s ease-in-out infinite; }
        .login-slide-3d { animation: loginSlideTile3D 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; transform-style: preserve-3d; }
        .login-slide-text-3d { animation: loginSlideText3D 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both; transform-style: preserve-3d; }

        .login-chip-hover {
          transition: all 0.25s ease;
        }
        .login-chip-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(0,0,0,0.08) !important;
        }

        /* ── Mobile Responsive Rules ── */
        .login-mobile-blob { display: none; }
        .login-divider { display: block; }

        @media (max-width: 768px) {
          .login-shell { grid-template-columns: 1fr !important; height: auto !important; min-height: 100vh !important; overflow: visible !important; }
          .login-left-panel { display: none !important; }
          .login-divider { display: none !important; }
          .login-right-panel {
            padding: 2.25rem 1.25rem 2rem !important;
            overflow-y: visible !important;
            overflow-x: hidden !important;
            position: relative;
            background: linear-gradient(155deg, #f8fafc 0%, #eff6ff 45%, #fff7ed 100%) !important;
            min-height: 100vh !important;
          }

          .login-mobile-blob { display: block; position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
          .login-blob-1 { width: 240px; height: 240px; background: radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 70%); top: -60px; right: -50px; animation: loginOrb1 8s ease-in-out infinite; }
          .login-blob-2 { width: 200px; height: 200px; background: radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%); bottom: 40px; left: -60px; animation: loginOrb2 10s ease-in-out infinite; }

          .login-mobile-card {
            position: relative; z-index: 1;
            width: 100%; max-width: 440px; margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 20px 50px -10px rgba(37, 99, 235, 0.15), 0 4px 16px rgba(0,0,0,0.04);
            padding: 2rem 1.6rem 1.6rem;
          }

          .login-right-logo { width: auto !important; height: 62px !important; margin: 0 auto 0.6rem !important; display: block !important; }
          .login-mobile-heading { text-align: center !important; }
          .login-mobile-sub { text-align: center !important; }
          .login-mobile-footer { text-align: center !important; }
        }
        @media (max-width: 420px) {
          .login-right-panel { padding-inline: 0.85rem !important; }
          .login-mobile-card { padding: 1.75rem 1.15rem 1.35rem !important; }
        }
      `}</style>

      <div className="login-shell" style={{
        display: "grid",
        gridTemplateColumns: "56fr 44fr",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        {/* ── Left Panel (Showcase) — Vibrant Aurora Mesh with continuously moving colors ── */}
        <div className="login-left-panel" style={{
          background: `
            radial-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px) 0 0 / 24px 24px,
            linear-gradient(135deg, #e0f2fe 0%, #ffffff 25%, #fff7ed 50%, #f3e8ff 75%, #ecfdf5 100%)
          `,
          backgroundSize: "260% 260%",
          animation: "auroraBgShift 12s ease-in-out infinite",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingBlock: "clamp(1.5rem, 3.5vh, 2.75rem)",
          paddingInline: "clamp(2rem, 4vw, 3.75rem)",
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}>
          {/* Dynamic Floating Colorful Glowing Orbs — Continuously moving across the background */}
          <div style={{ position: "absolute", width: "480px", height: "480px", borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.36) 0%, transparent 68%)", top: "-110px", right: "-70px", animation: "loginOrb1 8s ease-in-out infinite", pointerEvents: "none", filter: "blur(25px)" }}></div>
          <div style={{ position: "absolute", width: "440px", height: "440px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.30) 0%, transparent 68%)", bottom: "-60px", left: "-60px", animation: "loginOrb2 9s ease-in-out infinite", pointerEvents: "none", filter: "blur(25px)" }}></div>
          <div style={{ position: "absolute", width: "360px", height: "360px", borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.28) 0%, transparent 70%)", top: "35%", left: "12%", animation: "loginOrb3 8.5s ease-in-out infinite", pointerEvents: "none", filter: "blur(22px)" }}></div>
          <div style={{ position: "absolute", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.26) 0%, transparent 68%)", bottom: "12%", right: "8%", animation: "loginOrb4 10s ease-in-out infinite", pointerEvents: "none", filter: "blur(22px)" }}></div>
          <div style={{ position: "absolute", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.22) 0%, transparent 68%)", top: "15%", left: "40%", animation: "loginOrb5 7.5s ease-in-out infinite", pointerEvents: "none", filter: "blur(20px)" }}></div>

          {/* Top Brand & School Cloud Badge */}
          <div className="login-anim-1" style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <img
              src={logo}
              alt="Web Builder Pro"
              style={{ height: "48px", width: "auto", objectFit: "contain", display: "block", cursor: "pointer" }}
              onClick={() => navigate('/')}
            />
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.95)",
              boxShadow: "0 4px 16px rgba(37, 99, 235, 0.08)",
              backdropFilter: "blur(12px)",
              fontSize: "12px",
              fontWeight: 700,
              color: "#1e3a8a"
            }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", animation: "pulseDot 2s infinite" }}></span>
              Live School Platform
            </div>
          </div>

          {/* Center Showcase Showcase Area with Floating Feature Chips */}
          <div style={{ position: "relative", zIndex: 1, perspective: "1200px", marginBlock: "auto", width: "100%", maxWidth: "470px", marginInline: "auto" }}>
            
            {/* Top-Right Floating Pill Badge */}
            <div className="login-float-slow" style={{
              position: "absolute",
              top: "-20px",
              right: "-18px",
              zIndex: 3,
              background: "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid #a7f3d0",
              boxShadow: "0 12px 28px -6px rgba(16, 185, 129, 0.28)",
              padding: "7px 15px",
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#065f46"
            }}>
              <span style={{ fontSize: "14px" }}>⚡</span>
              25+ Smart Modules
            </div>

            {/* Bottom-Left Floating Pill Badge */}
            <div className="login-float-rev" style={{
              position: "absolute",
              bottom: "-18px",
              left: "-18px",
              zIndex: 3,
              background: "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid #fed7aa",
              boxShadow: "0 12px 28px -6px rgba(249, 115, 22, 0.28)",
              padding: "7px 15px",
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#9a3412"
            }}>
              <span style={{ fontSize: "14px" }}>★</span>
              CBSE & State Board Ready
            </div>

            {/* Frosted Glass Carousel Card */}
            <div style={{
              background: "rgba(255, 255, 255, 0.88)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius: "28px",
              border: "2px solid rgba(255, 255, 255, 0.95)",
              boxShadow: `0 24px 50px -12px ${activeSlide.glow}, 0 8px 24px -4px rgba(15, 23, 42, 0.06)`,
              padding: "clamp(1.6rem, 3.4vh, 2.4rem) clamp(1.4rem, 3.2vw, 2.2rem)",
              textAlign: "center",
              position: "relative",
              transition: "box-shadow 0.4s ease"
            }}>

              {/* Category Pill Tag with Active Slide Colors */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "999px", background: activeSlide.tagBg, border: `1.5px solid ${activeSlide.tagBorder}`, color: activeSlide.tagColor, fontSize: "12px", fontWeight: 700, marginBottom: "clamp(0.75rem, 1.8vh, 1.25rem)" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activeSlide.accent }}></span>
                {activeSlide.tag}
              </div>

              {/* 3D Tile Stack with Active Slide Icon */}
              <div key={slideIndex} className="login-slide-3d" style={{ position: "relative", width: "clamp(100px, 14vh, 135px)", height: "clamp(100px, 14vh, 135px)", margin: "0 auto clamp(0.5rem, 1.2vh, 0.9rem)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="login-glow-pulse" style={{ position: "absolute", top: "50%", left: "50%", width: "90%", height: "90%", borderRadius: "50%", background: `radial-gradient(circle, ${activeSlide.glow} 0%, transparent 72%)`, filter: "blur(12px)", pointerEvents: "none" }}></div>
                
                <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{
                    position: "absolute", width: "68%", height: "68%", borderRadius: "22px",
                    background: `${activeSlide.accent}20`,
                    border: `1.5px solid ${activeSlide.accent}40`,
                    transform: `rotate(${slideIndex % 2 === 0 ? -14 : 14}deg) translateY(5px)`,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                  }}></div>
                  <div style={{
                    position: "absolute", width: "78%", height: "78%", borderRadius: "24px",
                    background: `${activeSlide.accent}30`,
                    border: `1.5px solid ${activeSlide.accent}55`,
                    transform: `rotate(${slideIndex % 2 === 0 ? 7 : -7}deg) translateY(2px)`,
                    boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
                  }}></div>
                  <div style={{
                    position: "relative", width: "88%", height: "88%", borderRadius: "26px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `linear-gradient(135deg, ${activeSlide.gradient[0]} 0%, ${activeSlide.gradient[1]} 100%)`,
                    boxShadow: `inset 0 2px 4px rgba(255,255,255,0.45), 0 16px 32px ${activeSlide.glow}`,
                    border: "1.5px solid rgba(255,255,255,0.5)"
                  }}>
                    <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.1">{activeSlide.icon}</svg>
                  </div>
                </div>
              </div>

              {/* Dynamic Slide Title & Description */}
              <div key={`text-${slideIndex}`} className="login-slide-text-3d">
                <h2 style={{
                  fontWeight: 800,
                  fontSize: "clamp(20px, 2.9vh, 25px)",
                  marginBottom: "8px",
                  lineHeight: 1.25,
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  color: "#0f172a",
                  letterSpacing: "-0.4px"
                }}>
                  {activeSlide.title}
                </h2>
                <p style={{ color: "#475569", fontSize: "clamp(13px, 1.55vh, 14.5px)", lineHeight: 1.55, maxWidth: "340px", margin: "0 auto", fontWeight: 400 }}>
                  {activeSlide.desc}
                </p>
              </div>

              {/* Dot Indicators with Active Gradient Pill */}
              <div style={{ display: "flex", justifyContent: "center", gap: "7px", marginTop: "clamp(0.85rem, 1.6vh, 1.25rem)" }}>
                {SLIDES.map((s, i) => (
                  <button key={i} onClick={() => setSlideIndex(i)} aria-label={`Slide ${i + 1}`}
                    style={{
                      width: i === slideIndex ? "28px" : "7px",
                      height: "7px",
                      borderRadius: "999px",
                      border: "none",
                      cursor: "pointer",
                      background: i === slideIndex ? `linear-gradient(90deg, ${s.gradient[0]}, ${s.gradient[1]})` : "#cbd5e1",
                      transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                      padding: 0
                    }} />
                ))}
              </div>
            </div>
          </div>

          {/* Trust stats + footer pill badges */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="login-anim-6" style={{
              display: "flex",
              justifyContent: "center",
              gap: "clamp(0.6rem, 1.5vw, 1rem)",
              marginBottom: "clamp(0.4rem, 1.2vh, 0.75rem)",
              flexWrap: "wrap",
            }}>
              {STATS.map((s) => (
                <div key={s.label} className="login-chip-hover" style={{
                  background: s.bg,
                  border: `1.5px solid ${s.border}`,
                  padding: "6px 16px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "clamp(16px, 2.2vh, 19px)",
                    fontWeight: 800,
                    color: s.color,
                    lineHeight: 1
                  }}>
                    {s.value}
                  </span>
                  <span style={{ fontSize: "11px", color: "#475569", fontWeight: 700, letterSpacing: "0.02em" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="login-anim-6" style={{ textAlign: "center", color: "#64748b", fontSize: "12px", fontWeight: 500 }}>
              &copy; 2026 Web Builder Pro · Complete School Management Suite
            </p>
          </div>
        </div>

        {/* ── Right Panel 44% (Login Form) — Light & Colorful ── */}
        <div className="login-right-panel" style={{
          background: `
            radial-gradient(circle at 95% 6%, rgba(225, 82, 65, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 5% 95%, rgba(37, 99, 235, 0.07) 0%, transparent 45%),
            #ffffff
          `,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingBlock: "clamp(1rem, 2.8vh, 2.25rem)",
          paddingInline: "clamp(1.75rem, 4.5vw, 3.75rem)",
          overflowY: "auto",
          minHeight: 0,
          position: "relative",
          borderLeft: "1px solid #e5e9f2"
        }}>

          {/* Animated flowing gradient divider between panels — desktop only */}
          <div className="login-divider"></div>

          {/* ── Mobile-only decorative blobs ── */}
          <div className="login-mobile-blob login-blob-1"></div>
          <div className="login-mobile-blob login-blob-2"></div>

          <div className="login-mobile-card">

          {/* Top navigation row: Back link + Portal pill */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "clamp(0.4rem, 1.2vh, 0.85rem)" }}>
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#64748b",
                fontSize: "12px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#e15241"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to website
            </Link>

            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 10px",
              borderRadius: "999px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontSize: "11px",
              fontWeight: 700
            }}>
              School Admin
            </span>
          </div>

          {/* Logo — right panel */}
          <div style={{ marginBottom: "clamp(0.4rem, 1.1vh, 0.8rem)", display: "flex", justifyContent: "center" }}>
            <img
              src={logo}
              alt="Web Builder Pro"
              className="login-right-logo login-anim-1"
              style={{
                height: "68px",
                width: "auto",
                objectFit: "contain",
                display: "block",
                margin: "0 auto"
              }}
            />
          </div>

          {/* Heading with restored signature gradient matching user screenshot */}
          <h1 className="login-mobile-heading login-anim-2" style={{
            fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
            fontSize: "clamp(22px, 3.2vh, 28px)",
            fontWeight: 800,
            marginBottom: "4px",
            lineHeight: 1.2,
            color: "#0f172a",
            letterSpacing: "-0.5px"
          }}>
            Login to your{" "}
            <span className="login-account-text">
              Account
            </span>
          </h1>
          <p className="login-mobile-sub login-anim-2" style={{ color: "#64748b", fontSize: "13px", marginBottom: "clamp(0.75rem, 1.6vh, 1.2rem)", lineHeight: 1.45 }}>
            Your school, your rules — step inside and manage effortlessly.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "clamp(0.6rem, 1.3vh, 0.95rem)" }}>

            {/* Email */}
            <div className="login-anim-3">
              <label style={{ display: "block", fontSize: "10.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "5px" }}>
                Admin Email
              </label>
              <div className="login-field" style={{ position: "relative" }}>
                <svg className="login-field-icon" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94a3b8" }} fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="admin@school.com" required className="login-input"
                  style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: "11px", border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", fontSize: "13.5px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-anim-4">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ fontSize: "11.5px", fontWeight: 700, color: "#e15241", textDecoration: "none", transition: "color 0.15s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#c2410c"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#e15241"; }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="login-field" style={{ position: "relative" }}>
                <svg className="login-field-icon" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94a3b8" }} fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"} name="password" value={formData.password}
                  onChange={handleChange} placeholder="••••••••" required className="login-input"
                  style={{ width: "100%", padding: "10px 38px 10px 38px", borderRadius: "11px", border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", fontSize: "13.5px", outline: "none", boxSizing: "border-box" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#94a3b8", display: "flex", alignItems: "center" }}>
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button — Vibrant Coral to Sunset Orange gradient matching Landing Page CTA */}
            <div className="login-anim-5">
              <button type="submit" disabled={loading} className="login-submit-btn"
                style={{
                  width: "100%", padding: "11.5px",
                  background: loading ? "#fdba74" : "linear-gradient(135deg, #e15241 0%, #f97316 55%, #ea580c 100%)",
                  color: "#ffffff", border: "none", borderRadius: "11px",
                  fontSize: "14.5px", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  marginTop: "4px",
                  boxShadow: "0 8px 24px -2px rgba(225, 82, 65, 0.45)",
                }}>
                {loading ? (
                  <>
                    <svg style={{ animation: "spin 1s linear infinite", width: "17px", height: "17px" }} viewBox="0 0 24 24" fill="none">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Login to Dashboard</span>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="login-anim-5" style={{
            display: 'flex',
            alignItems: 'center',
            marginBlock: 'clamp(0.65rem, 1.4vh, 0.95rem)',
            gap: '10px',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Google Sign In Button */}
          <div className="login-anim-5">
            <button
              type="button"
              onClick={() => { window.location.href = getGoogleAuthUrl('admin'); }}
              className="login-google-btn"
              style={{
                width: '100%',
                padding: '10px',
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #e2e8f0',
                borderRadius: '11px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '9px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Sign up prompt */}
          <p className="login-anim-6" style={{ textAlign: "center", color: "#64748b", fontSize: "12.5px", marginTop: "clamp(0.65rem, 1.5vh, 1rem)", marginBottom: 0 }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "#e15241", fontWeight: 700, textDecoration: "none", transition: "color 0.15s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#c2410c"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#e15241"; }}
            >
              Sign up free
            </Link>
          </p>

          {/* Trust badge */}
          <div className="login-mobile-footer login-anim-6" style={{
            textAlign: "center",
            marginTop: "clamp(0.45rem, 1.1vh, 0.75rem)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            color: "#64748b",
            fontSize: "11px",
            fontWeight: 600,
          }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              background: "#ecfdf5",
              color: "#10b981",
              border: "1px solid #a7f3d0",
              fontSize: "10px"
            }}>
              ✓
            </span>
            <span>256-Bit SSL Encrypted · Instant School Access</span>
          </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
