import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { submitSignupApi } from "../../api/signup.api";
import logo from '../../assets/webbuilder-removebg-preview.png';
import signupHeroImg from '../../assets/signupImage.png';

const BLUE = '#4169E1';
const BLUE_DARK = '#2541A8';
const NAVY = '#0b1330';
const TEXT_MUTED = '#8b93a7';
const TEXT_DARK = '#171a23';

const inputStyle = {
  width: "100%", padding: "14px 18px", borderRadius: "13px", border: "1.5px solid transparent",
  background: "#f4f5f9", color: TEXT_DARK, fontSize: "14px", outline: "none", boxSizing: "border-box",
  transition: "all 0.2s", fontFamily: "'Inter', system-ui, sans-serif",
};

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ schoolName: "", adminName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Phone is optional, but when filled it must be exactly 10 digits — strip
  // anything non-numeric as the user types rather than validating after the fact.
  const handlePhoneChange = (e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phone && formData.phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await submitSignupApi(formData);
      setSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
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
        html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes signupOrbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(18px,-16px) scale(1.08); } }
        @keyframes signupSwirlSpin { to { transform: rotate(360deg); } }
        @keyframes signupFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes signupCardIn { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes signupCheckPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes signupRingPulse { 0% { transform: scale(0.75); opacity: 0.8; } 100% { transform: scale(1.7); opacity: 0; } }
        @keyframes signupCheckDraw { to { stroke-dashoffset: 0; } }

        .signup-input:focus { border-color: ${BLUE} !important; background: #ffffff !important; box-shadow: 0 0 0 3px rgba(65,105,225,0.12); }

        .signup-submit-btn { position: relative; overflow: hidden; }
        .signup-submit-btn::after {
          content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-20deg); transition: left 0.65s ease; pointer-events: none;
        }
        .signup-submit-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(65,105,225,0.4) !important; }
        .signup-submit-btn:not(:disabled):hover::after { left: 130%; }
        .signup-submit-btn:not(:disabled):active { transform: scale(0.98); }

        .signup-anim-1 { animation: signupFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .signup-anim-2 { animation: signupFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.12s both; }
        .signup-anim-3 { animation: signupFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .signup-anim-4 { animation: signupFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.24s both; }
        .signup-anim-5 { animation: signupFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .signup-anim-6 { animation: signupFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.36s both; }
        .signup-anim-7 { animation: signupFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.42s both; }

        .signup-card { animation: signupCardIn 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .signup-success-badge { animation: signupCheckPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .signup-success-ring { animation: signupRingPulse 1s ease-out 0.1s both; }
        .signup-success-check { stroke-dasharray: 28; stroke-dashoffset: 28; animation: signupCheckDraw 0.35s ease-out 0.4s forwards; }

        .signup-swirl-layer { animation: signupSwirlSpin 34s linear infinite; }
        .signup-swirl-layer-rev { animation: signupSwirlSpin 26s linear infinite reverse; }

        /* Mobile-only logo shown inside the form panel once the image panel is dropped. */
        .signup-mobile-logo { display: none; }

        /* ── Mobile: drop the photo panel entirely and show a clean single-column
             form (desktop split-card layout above 860px is untouched). ── */
        @media (max-width: 860px) {
          .signup-outer { padding: 0 !important; align-items: stretch !important; }
          .signup-card { border-radius: 0 !important; min-height: 100vh !important; grid-template-columns: 1fr !important; box-shadow: none !important; }
          .signup-left-panel { display: none !important; }
          .signup-right-panel { border-radius: 0 !important; padding: 2.5rem 1.5rem 3rem !important; justify-content: flex-start !important; flex: 1 !important; }
          .signup-mobile-logo { display: block !important; }
          /* 16px keeps iOS Safari from zooming in on focus */
          .signup-input { font-size: 16px !important; }
        }
        @media (max-width: 520px) {
          .signup-field-row { grid-template-columns: 1fr !important; }
          .signup-right-panel { padding-inline: 1.2rem !important; }
        }
      `}</style>

      <div className="signup-outer" style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: `radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px) 0 0 / 26px 26px, linear-gradient(160deg, ${NAVY} 0%, #111a3d 55%, ${NAVY} 100%)`,
        fontFamily: "'Inter', system-ui, sans-serif", padding: "2.5rem 1.5rem", boxSizing: "border-box",
      }}>

        <div className="signup-card" style={{
          position: "relative", width: "100%", maxWidth: "980px",
          display: "grid", gridTemplateColumns: "44fr 56fr",
          borderRadius: "30px", overflow: "hidden",
          boxShadow: "0 40px 90px rgba(0,0,0,0.45), 0 4px 20px rgba(0,0,0,0.2)",
          background: "#ffffff",
        }}>

          {/* ── Left panel — school campus photo (signupImage.png), with a dark gradient
               scrim for text legibility, peeking out slightly beyond the white panel via a
               negative margin for the "layered card" effect. ── */}
          <div className="signup-left-panel" style={{
            position: "relative", overflow: "hidden",
            backgroundImage: `linear-gradient(180deg, rgba(11,19,48,0.55) 0%, rgba(11,19,48,0.35) 45%, rgba(6,10,28,0.92) 100%), url(${signupHeroImg})`,
            backgroundSize: "cover", backgroundPosition: "center",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            padding: "2.25rem 2rem", margin: "-14px 0 -14px -14px", borderRadius: "34px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)", zIndex: 2,
          }}>
            <img src={logo} alt="Web Builder Pro" className="signup-anim-1" style={{ position: "relative", zIndex: 1, height: "clamp(46px, 6vh, 60px)", objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.92, alignSelf: "flex-start" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <h1 className="signup-left-heading signup-anim-2" style={{ fontFamily: "'Playfair Display', serif", color: "#ffffff", fontSize: "clamp(30px, 3.6vw, 42px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.01em", marginBottom: "14px" }}>
                Bring Your<br />School Online
              </h1>
              <p className="signup-anim-3 signup-left-desc" style={{ color: "rgba(255,255,255,0.68)", fontSize: "15px", lineHeight: 1.6, maxWidth: "300px" }}>
                Sign up and get a public website, admin panel, and dashboard — approved and ready to launch.
              </p>
            </div>

            <p className="signup-anim-4 signup-left-copy" style={{ position: "relative", zIndex: 1, color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
              © 2026 Web Builder Pro
            </p>
          </div>

          {/* ── Right panel — the actual form ── */}
          <div className="signup-right-panel" style={{
            position: "relative", zIndex: 1, background: "#ffffff",
            padding: "2.75rem 3rem 2.5rem", display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <img src={logo} alt="Web Builder Pro" className="signup-mobile-logo signup-anim-1"
              style={{ height: "150px", objectFit: "contain", margin: "0 auto 1.75rem", display: "none" }} />
            {submitted ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ position: "relative", width: "72px", height: "72px", margin: "0 auto 1.25rem" }}>
                  <div className="signup-success-ring" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid #22c55e" }}></div>
                  <div className="signup-success-badge" style={{ position: "relative", width: "72px", height: "72px", borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 26px rgba(34,197,94,0.35)" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path className="signup-success-check" d="M4 12.5l5 5L20 6.5" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 800, color: TEXT_DARK, marginBottom: "10px" }}>Request submitted!</h2>
                <p style={{ color: TEXT_MUTED, fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                  We've emailed you a confirmation. Our team will review your request and approve your account shortly — you'll get another email the moment that happens, with a link to log in and choose your plan.
                </p>
                <button onClick={() => navigate('/login')} style={{ padding: "12px 28px", background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff", border: "none", borderRadius: "13px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <h1 className="signup-anim-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px, 3vw, 32px)", fontWeight: 800, color: TEXT_DARK, textAlign: "center", marginBottom: "6px" }}>
                  Sign Up
                </h1>
                <p className="signup-anim-1" style={{ textAlign: "center", color: TEXT_MUTED, fontSize: "13px", marginBottom: "1.75rem" }}>
                  Tell us about your school to get started
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input className="signup-anim-2 signup-input" type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} placeholder="Enter school name" required style={inputStyle} />
                  <input className="signup-anim-3 signup-input" type="text" name="adminName" value={formData.adminName} onChange={handleChange} placeholder="Enter your full name" required style={inputStyle} />
                  <div className="signup-anim-4 signup-field-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <input className="signup-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" required style={inputStyle} />
                    <input className="signup-input" type="tel" name="phone" value={formData.phone} onChange={handlePhoneChange} placeholder="Enter phone number" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" title="Enter a 10-digit phone number" style={inputStyle} />
                  </div>
                  <div className="signup-anim-5" style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"} name="password" value={formData.password}
                      onChange={handleChange} placeholder="Create a password (min. 8 characters)" required minLength={8}
                      className="signup-input" style={{ ...inputStyle, paddingRight: "44px" }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9aa3b8", display: "flex", alignItems: "center" }}>
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

                  <button type="submit" disabled={loading} className="signup-anim-6 signup-submit-btn"
                    style={{ width: "100%", padding: "15px", background: loading ? "#a9b8ea" : `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff", border: "none", borderRadius: "13px", fontSize: "14.5px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px", boxShadow: "0 10px 26px rgba(65,105,225,0.32)", transition: "all 0.2s" }}>
                    {loading ? (
                      <>
                        <svg style={{ animation: "spin 1s linear infinite", width: "17px", height: "17px" }} viewBox="0 0 24 24" fill="none">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Get Started
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </>
                    )}
                  </button>
                </form>

                <p className="signup-anim-7" style={{ textAlign: "center", color: "#9aa3b8", fontSize: "12.5px", marginTop: "1.5rem" }}>
                  Already have an account? <Link to="/login" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>Log in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
