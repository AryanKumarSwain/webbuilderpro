import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { submitSignupApi, verifySignupOtpApi, resendSignupOtpApi } from "../../api/signup.api";
import { completeGoogleSignupApi, getGoogleAuthUrl } from "../../api/auth.api";
import useAuthStore from "../../store/authStore";
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
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({ schoolName: "", adminName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form"); // 'form' | 'otp'
  const [schoolUuid, setSchoolUuid] = useState(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const googleSignupToken = searchParams.get("google_signup_token");
  const googleEmail = searchParams.get("email") || "";
  const googleName = searchParams.get("name") || "";
  const googlePic = searchParams.get("picture") || "";

  const [googleSchoolName, setGoogleSchoolName] = useState("");
  const [googlePhone, setGooglePhone] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Phone is optional, but when filled it must be exactly 10 digits — strip
  // anything non-numeric as the user types rather than validating after the fact.
  const handlePhoneChange = (e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) });

  const handleOtpChange = (e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));

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
      const res = await submitSignupApi(formData);
      setSchoolUuid(res.data.uuid);
      setStep("otp");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const res = await verifySignupOtpApi(schoolUuid, otp);
      setAuth(res.data.user, "admin", res.data.accessToken);
      toast.success("Email verified!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await resendSignupOtpApi(schoolUuid);
      toast.success("A new code has been sent");
      setResendCooldown(30);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignupComplete = async (e) => {
    e.preventDefault();
    if (!googleSchoolName.trim()) {
      toast.error("Please enter your school name");
      return;
    }
    if (googlePhone && googlePhone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    setGoogleLoading(true);
    try {
      const res = await completeGoogleSignupApi({
        googleSignupToken,
        schoolName: googleSchoolName.trim(),
        phone: googlePhone || undefined,
      });
      setAuth(res.data.user, "admin", res.data.accessToken);
      toast.success("Welcome to Web Builder Pro!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setGoogleLoading(false);
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

        .signup-google-btn { transition: all 0.2s ease; }
        .signup-google-btn:hover {
          background: #f8faff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.08) !important;
          transform: translateY(-1px);
        }
        .signup-google-btn:active { transform: scale(0.98); }

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
            {step === "otp" ? (
              <>
                <h1 className="signup-anim-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px, 3vw, 32px)", fontWeight: 800, color: TEXT_DARK, textAlign: "center", marginBottom: "6px" }}>
                  Verify Your Email
                </h1>
                <p className="signup-anim-1" style={{ textAlign: "center", color: TEXT_MUTED, fontSize: "13px", marginBottom: "1.75rem", lineHeight: 1.6 }}>
                  We've sent a 6-digit code to <strong style={{ color: TEXT_DARK }}>{formData.email}</strong>
                </p>

                <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    className="signup-anim-2 signup-input" type="text" inputMode="numeric" value={otp}
                    onChange={handleOtpChange} placeholder="123456" maxLength={6} autoFocus required
                    style={{ ...inputStyle, textAlign: "center", fontSize: "28px", fontWeight: 700, letterSpacing: "10px", padding: "16px 10px" }}
                  />

                  <button type="submit" disabled={verifying} className="signup-anim-3 signup-submit-btn"
                    style={{ width: "100%", padding: "15px", background: verifying ? "#a9b8ea" : `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff", border: "none", borderRadius: "13px", fontSize: "14.5px", fontWeight: 700, cursor: verifying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px", boxShadow: "0 10px 26px rgba(65,105,225,0.32)", transition: "all 0.2s" }}>
                    {verifying ? (
                      <>
                        <svg style={{ animation: "spin 1s linear infinite", width: "17px", height: "17px" }} viewBox="0 0 24 24" fill="none">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Verifying...
                      </>
                    ) : "Verify & Continue"}
                  </button>
                </form>

                <p className="signup-anim-4" style={{ textAlign: "center", color: "#9aa3b8", fontSize: "12.5px", marginTop: "1.5rem" }}>
                  Didn't get the code?{" "}
                  <button type="button" onClick={handleResendOtp} disabled={resending || resendCooldown > 0}
                    style={{ background: "none", border: "none", padding: 0, color: BLUE, fontWeight: 600, fontSize: "12.5px", cursor: resending || resendCooldown > 0 ? "not-allowed" : "pointer", textDecoration: "underline" }}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? "Sending..." : "Resend code"}
                  </button>
                </p>
                <p className="signup-anim-4" style={{ textAlign: "center", marginTop: "6px" }}>
                  <button type="button" onClick={() => setStep("form")}
                    style={{ background: "none", border: "none", padding: 0, color: "#9aa3b8", fontSize: "12.5px", cursor: "pointer", textDecoration: "underline" }}>
                    ← Use a different email
                  </button>
                </p>
              </>
            ) : googleSignupToken ? (
              <>
                <h1 className="signup-anim-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 2.8vw, 30px)", fontWeight: 800, color: TEXT_DARK, textAlign: "center", marginBottom: "6px" }}>
                  Complete School Setup
                </h1>
                <p className="signup-anim-1" style={{ textAlign: "center", color: TEXT_MUTED, fontSize: "13px", marginBottom: "1.25rem" }}>
                  Almost ready! Enter your school details to finish registration
                </p>

                {/* Google Connected User Card */}
                <div className="signup-anim-2" style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px",
                  background: "#f4f7ff", border: "1.5px solid #d9e2ff", borderRadius: "14px",
                  marginBottom: "1.25rem",
                }}>
                  {googlePic ? (
                    <img src={googlePic} alt={googleName} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: BLUE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "16px" }}>
                      {(googleName || googleEmail || "G").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: TEXT_DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {googleName || "Google User"}
                    </div>
                    <div style={{ fontSize: "12px", color: TEXT_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {googleEmail}
                    </div>
                  </div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    background: "#e6f8ee", color: "#15803d", fontSize: "11px", fontWeight: 700,
                    padding: "4px 8px", borderRadius: "20px", whiteSpace: "nowrap"
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </div>
                </div>

                <form onSubmit={handleGoogleSignupComplete} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      School Name *
                    </label>
                    <input
                      className="signup-anim-3 signup-input"
                      type="text"
                      value={googleSchoolName}
                      onChange={(e) => setGoogleSchoolName(e.target.value)}
                      placeholder="e.g. St. Xavier's International School"
                      required
                      autoFocus
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                      Phone Number (Optional)
                    </label>
                    <input
                      className="signup-anim-4 signup-input"
                      type="tel"
                      value={googlePhone}
                      onChange={(e) => setGooglePhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="Enter a 10-digit phone number"
                      style={inputStyle}
                    />
                  </div>

                  <button type="submit" disabled={googleLoading} className="signup-anim-5 signup-submit-btn"
                    style={{ width: "100%", padding: "15px", background: googleLoading ? "#a9b8ea" : `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, color: "#fff", border: "none", borderRadius: "13px", fontSize: "14.5px", fontWeight: 700, cursor: googleLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px", boxShadow: "0 10px 26px rgba(65,105,225,0.32)", transition: "all 0.2s" }}>
                    {googleLoading ? (
                      <>
                        <svg style={{ animation: "spin 1s linear infinite", width: "17px", height: "17px" }} viewBox="0 0 24 24" fill="none">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Launching School Portal...
                      </>
                    ) : (
                      <>
                        Launch School Website
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </>
                    )}
                  </button>
                </form>

                <p className="signup-anim-6" style={{ textAlign: "center", marginTop: "1rem" }}>
                  <button type="button" onClick={() => navigate("/signup", { replace: true })}
                    style={{ background: "none", border: "none", padding: 0, color: "#9aa3b8", fontSize: "12.5px", cursor: "pointer", textDecoration: "underline" }}>
                    ← Use a different account
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 className="signup-anim-1" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px, 3vw, 32px)", fontWeight: 800, color: TEXT_DARK, textAlign: "center", marginBottom: "6px" }}>
                  Sign Up
                </h1>
                <p className="signup-anim-1" style={{ textAlign: "center", color: TEXT_MUTED, fontSize: "13px", marginBottom: "1.25rem" }}>
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

                {/* Divider */}
                <div className="signup-anim-6" style={{
                  display: "flex",
                  alignItems: "center",
                  marginBlock: "1.25rem",
                  gap: "12px",
                }}>
                  <div style={{ flex: 1, height: "1px", background: "#edf2f7" }} />
                  <span style={{ fontSize: "11px", color: "#9aa3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    or continue with
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "#edf2f7" }} />
                </div>

                {/* Google Sign Up Button */}
                <div className="signup-anim-6">
                  <button
                    type="button"
                    onClick={() => { window.location.href = getGoogleAuthUrl('admin'); }}
                    className="signup-google-btn"
                    style={{
                      width: "100%",
                      padding: "13px 18px",
                      background: "#ffffff",
                      color: TEXT_DARK,
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "13px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Sign up with Google
                  </button>
                </div>

                <p className="signup-anim-7" style={{ textAlign: "center", color: "#9aa3b8", fontSize: "12.5px", marginTop: "1.25rem" }}>
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
