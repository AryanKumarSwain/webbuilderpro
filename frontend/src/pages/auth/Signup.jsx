import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { submitSignupApi, verifySignupOtpApi, resendSignupOtpApi } from "../../api/signup.api";
import { completeGoogleSignupApi, getGoogleAuthUrl } from "../../api/auth.api";
import useAuthStore from "../../store/authStore";
import logo from '../../assets/webbuilder-removebg-preview.png';
import signupHeroImg from '../../assets/signupImage.png';

const inputStyle = {
  width: "100%",
  padding: "10.5px 14px",
  borderRadius: "12px",
  border: "1.5px solid #e2e8f0",
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: "13.5px",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  fontFamily: "'Inter', system-ui, sans-serif",
};

const labelStyle = {
  display: "block",
  fontSize: "10.5px",
  fontWeight: 700,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "4px",
};

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "#e2e8f0", percent: 0 };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) score += 1;

  if (score === 1) return { score: 1, label: "Weak", color: "#ef4444", percent: 25 };
  if (score === 2) return { score: 2, label: "Fair", color: "#f59e0b", percent: 50 };
  if (score === 3) return { score: 3, label: "Good", color: "#3b82f6", percent: 75 };
  if (score === 4) return { score: 4, label: "Strong", color: "#10b981", percent: 100 };
  return { score: 0, label: "Weak", color: "#ef4444", percent: 15 };
};

const Signup = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    schoolName: "",
    adminName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form"); // 'form' | 'otp'
  const [schoolUuid, setSchoolUuid] = useState(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const googleSignupToken = searchParams.get("google_signup_token");
  const googleEmail = searchParams.get("email") || "";
  const googleName = searchParams.get("name") || "";
  const googlePic = searchParams.get("picture") || "";

  const [googleSchoolName, setGoogleSchoolName] = useState("");
  const [googlePhone, setGooglePhone] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const pwdStrength = getPasswordStrength(formData.password);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePhoneChange = (e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) });

  const handleOtpChange = (e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.schoolName.trim()) {
      toast.error("School name is required");
      return;
    }
    if (!formData.adminName.trim()) {
      toast.error("Admin / Principal name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!formData.phone || formData.phone.length !== 10) {
      toast.error("Phone number is mandatory and must be exactly 10 digits");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(formData.password);
    const hasDigit = /\d/.test(formData.password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password);
    if (!hasLetter || !hasDigit || !hasSpecial) {
      toast.error("Password must be alphanumeric with at least 1 special character");
      return;
    }
    if (!formData.confirmPassword) {
      toast.error("Please confirm your password");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await submitSignupApi({
        schoolName: formData.schoolName.trim(),
        adminName: formData.adminName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });
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
    if (!googlePhone || googlePhone.length !== 10) {
      toast.error("Phone number is mandatory and must be exactly 10 digits");
      return;
    }
    setGoogleLoading(true);
    try {
      const res = await completeGoogleSignupApi({
        googleSignupToken,
        schoolName: googleSchoolName.trim(),
        phone: googlePhone.trim(),
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
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
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
        @keyframes auroraBgShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes signupOrb1 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, 40px) scale(1.12); }
          66% { transform: translate(-30px, 60px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes signupOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-60px, -40px) scale(1.15); }
          66% { transform: translate(40px, -50px) scale(0.92); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes accountGradientFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes signupFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes signupCardIn { from { opacity: 0; transform: translateY(22px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

        .signup-input {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .signup-input:focus {
          border-color: #3b82f6 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
        }

        .signup-submit-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .signup-submit-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-20deg);
          transition: left 0.65s ease;
          pointer-events: none;
        }
        .signup-submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -4px rgba(225, 82, 65, 0.48), 0 4px 12px rgba(249, 115, 22, 0.32) !important;
        }
        .signup-submit-btn:not(:disabled):hover::after { left: 130%; }
        .signup-submit-btn:not(:disabled):active { transform: scale(0.98); }

        .signup-google-btn { transition: all 0.2s ease; }
        .signup-google-btn:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 6px 18px rgba(0,0,0,0.06) !important;
          transform: translateY(-1px);
        }
        .signup-google-btn:active { transform: scale(0.98); }

        @keyframes borderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .signup-card-wrap {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 980px;
          border-radius: 33px;
          padding: 3px;
          overflow: hidden;
          box-sizing: border-box;
          box-shadow: 0 25px 70px -15px rgba(37, 99, 235, 0.22), 0 0 25px rgba(56, 189, 248, 0.35);
        }

        .signup-card-wrap::before {
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

        .signup-gradient-heading {
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

        .signup-anim-1 { animation: signupFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
        .signup-anim-2 { animation: signupFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both; }
        .signup-anim-3 { animation: signupFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both; }
        .signup-anim-4 { animation: signupFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.24s both; }
        .signup-anim-5 { animation: signupFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.30s both; }
        .signup-anim-6 { animation: signupFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.36s both; }
        .signup-anim-7 { animation: signupFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.42s both; }

        .signup-card { animation: signupCardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }

        /* Mobile adjustments keeping original split structure */
        @media (max-width: 860px) {
          .signup-outer { padding: 1.25rem 0.85rem !important; }
          .signup-card-wrap { border-radius: 26px !important; }
          .signup-card { grid-template-columns: 1fr !important; border-radius: 23px !important; }
          .signup-left-panel { display: none !important; }
          .signup-right-panel { padding: 2rem 1.4rem 2rem !important; }
        }
        @media (max-width: 520px) {
          .signup-field-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Outer Screen with Light, Vibrant Aurora Mesh matching Login & Landing ── */}
      <div className="signup-outer" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `
          radial-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px) 0 0 / 24px 24px,
          linear-gradient(135deg, #e0f2fe 0%, #ffffff 28%, #fff7ed 55%, #f3e8ff 80%, #ecfdf5 100%)
        `,
        backgroundSize: "240% 240%",
        animation: "auroraBgShift 14s ease-in-out infinite",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "2rem 1.25rem",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Ambient background glowing orbs */}
        <div style={{ position: "absolute", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.30) 0%, transparent 70%)", top: "-80px", right: "-60px", animation: "signupOrb1 9s ease-in-out infinite", pointerEvents: "none", filter: "blur(30px)" }}></div>
        <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)", bottom: "-60px", left: "-60px", animation: "signupOrb2 10s ease-in-out infinite", pointerEvents: "none", filter: "blur(30px)" }}></div>

        {/* ── Card Wrapped with 360° Rotating Gradient Neon Border ── */}
        <div className="signup-card-wrap">
          <div className="signup-card" style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            display: "grid",
            gridTemplateColumns: "44fr 56fr",
            borderRadius: "30px",
            overflow: "hidden",
            background: "#ffffff",
          }}>

            {/* ── Left Panel (Clean full-bleed, NO inner divider border) ── */}
            <div className="signup-left-panel" style={{
              position: "relative",
              overflow: "hidden",
              backgroundImage: `linear-gradient(180deg, rgba(29, 78, 216, 0.84) 0%, rgba(37, 99, 235, 0.68) 45%, rgba(15, 23, 42, 0.92) 100%), url(${signupHeroImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "2.25rem 2rem",
              boxSizing: "border-box",
            }}>
              {/* Top Brand Logo & Live Pill */}
              <div className="signup-anim-1" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <img
                  src={logo}
                  alt="Web Builder Pro"
                  style={{
                    height: "clamp(44px, 5.5vh, 54px)",
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)",
                    opacity: 0.95,
                    cursor: "pointer"
                  }}
                  onClick={() => navigate('/')}
                />
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 11px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.18)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  backdropFilter: "blur(10px)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#ffffff"
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", animation: "pulseDot 2s infinite" }}></span>
                  Live School SaaS
                </div>
              </div>

              {/* Central Typography Showcase */}
              <div style={{ position: "relative", zIndex: 1, marginBlock: "auto", paddingBlock: "1.5rem" }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  color: "#fef08a",
                  fontSize: "11px",
                  fontWeight: 700,
                  marginBottom: "12px",
                  backdropFilter: "blur(8px)"
                }}>
                  <span>⚡</span> 25+ Smart Modules Ready
                </div>
                <h1 className="signup-anim-2" style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  color: "#ffffff",
                  fontSize: "clamp(28px, 3.4vw, 38px)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.5px",
                  marginBottom: "12px"
                }}>
                  Bring Your<br />School Online
                </h1>
                <p className="signup-anim-3" style={{
                  color: "rgba(255, 255, 255, 0.85)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  maxWidth: "310px",
                  fontWeight: 400
                }}>
                  Sign up and get a public website, admin panel, and dashboard — approved and ready to launch.
                </p>
              </div>

              {/* Bottom Trust & Copyright */}
              <div className="signup-anim-4" style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "8px", background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)" }}>
                    ✓ 100% Cloud Secure
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "8px", background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)" }}>
                    ✓ CBSE / ICSE Ready
                  </span>
                </div>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "11.5px", margin: 0 }}>
                  &copy; 2026 Web Builder Pro · All Rights Reserved
                </p>
              </div>
            </div>

          {/* ── Right Panel (Original Clean Form with Centered Large Logo & Modern Theme) ── */}
          <div className="signup-right-panel" style={{
            position: "relative",
            zIndex: 1,
            background: "#ffffff",
            padding: "2rem 2.5rem 1.85rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>

            {/* Back to landing page & School registration pill */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
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
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to landing page
              </Link>

              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "999px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "11px",
                fontWeight: 700
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }}></span>
                Registration
              </span>
            </div>

            {/* Centered Large Logo */}
            <div style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "center" }}>
              <img
                src={logo}
                alt="Web Builder Pro"
                className="signup-anim-1"
                style={{
                  height: "64px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto"
                }}
              />
            </div>

            {/* Step: OTP Verification */}
            {step === "otp" ? (
              <div className="signup-anim-1" style={{ textAlign: "center" }}>
                <div style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)",
                  border: "1.5px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  color: "#2563eb",
                  boxShadow: "0 8px 18px rgba(37, 99, 235, 0.14)"
                }}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <h1 style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: "clamp(22px, 2.8vw, 26px)",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: "4px"
                }}>
                  Verify Your Email
                </h1>
                <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "1.4rem", lineHeight: 1.5 }}>
                  We've sent a 6-digit confirmation code to <strong style={{ color: "#0f172a" }}>{formData.email}</strong>
                </p>

                <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    required
                    className="signup-input"
                    style={{
                      ...inputStyle,
                      textAlign: "center",
                      fontSize: "26px",
                      fontWeight: 800,
                      letterSpacing: "10px",
                      padding: "14px 10px",
                      background: "#ffffff",
                    }}
                  />

                  <button
                    type="submit"
                    disabled={verifying}
                    className="signup-submit-btn"
                    style={{
                      width: "100%",
                      padding: "13px",
                      background: verifying
                        ? "#fdba74"
                        : "linear-gradient(135deg, #e15241 0%, #f97316 55%, #ea580c 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "13px",
                      fontSize: "14.5px",
                      fontWeight: 700,
                      cursor: verifying ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 8px 22px -2px rgba(225, 82, 65, 0.42)",
                      transition: "all 0.2s"
                    }}
                  >
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

                <p style={{ textAlign: "center", color: "#64748b", fontSize: "12.5px", marginTop: "1.3rem" }}>
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending || resendCooldown > 0}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#e15241",
                      fontWeight: 700,
                      fontSize: "12.5px",
                      cursor: resending || resendCooldown > 0 ? "not-allowed" : "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? "Sending..." : "Resend code"}
                  </button>
                </p>
                <p style={{ textAlign: "center", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    style={{ background: "none", border: "none", padding: 0, color: "#94a3b8", fontSize: "12.5px", cursor: "pointer", textDecoration: "underline" }}
                  >
                    ← Use a different email
                  </button>
                </p>
              </div>

            ) : googleSignupToken ? (
              /* Step: Google Signup Completion */
              <div className="signup-anim-1">
                <h1 style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: "clamp(22px, 2.8vw, 26px)",
                  fontWeight: 800,
                  color: "#0f172a",
                  textAlign: "center",
                  marginBottom: "4px"
                }}>
                  Complete <span className="signup-gradient-heading">School Setup</span>
                </h1>
                <p style={{ textAlign: "center", color: "#64748b", fontSize: "13px", marginBottom: "1.1rem" }}>
                  Almost ready! Enter your school details to finish registration
                </p>

                {/* Google Connected User Card */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  background: "#f0f9ff",
                  border: "1.5px solid #bae6fd",
                  borderRadius: "14px",
                  marginBottom: "1.1rem",
                }}>
                  {googlePic ? (
                    <img src={googlePic} alt={googleName} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px" }}>
                      {(googleName || googleEmail || "G").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {googleName || "Google User"}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {googleEmail}
                    </div>
                  </div>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#ecfdf5",
                    color: "#059669",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "20px",
                    whiteSpace: "nowrap",
                    border: "1px solid #a7f3d0"
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </div>
                </div>

                <form onSubmit={handleGoogleSignupComplete} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={labelStyle}>
                      School Name <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      className="signup-input"
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
                    <label style={labelStyle}>
                      Phone Number <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      className="signup-input"
                      type="tel"
                      value={googlePhone}
                      onChange={(e) => setGooglePhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Enter phone number"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="Enter a 10-digit phone number"
                      required
                      style={inputStyle}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="signup-submit-btn"
                    style={{
                      width: "100%",
                      padding: "13px",
                      background: googleLoading
                        ? "#fdba74"
                        : "linear-gradient(135deg, #e15241 0%, #f97316 55%, #ea580c 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "13px",
                      fontSize: "14.5px",
                      fontWeight: 700,
                      cursor: googleLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "6px",
                      boxShadow: "0 8px 22px -2px rgba(225, 82, 65, 0.42)",
                      transition: "all 0.2s"
                    }}
                  >
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
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => navigate("/signup", { replace: true })}
                    style={{ background: "none", border: "none", padding: 0, color: "#94a3b8", fontSize: "12.5px", cursor: "pointer", textDecoration: "underline" }}
                  >
                    ← Use a different account
                  </button>
                </p>
              </div>

            ) : (
              /* Step: Main Signup Form (Same layout as original) */
              <>
                <h1 className="signup-anim-1" style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: "clamp(24px, 3vw, 28px)",
                  fontWeight: 800,
                  color: "#0f172a",
                  textAlign: "center",
                  marginBottom: "4px",
                  letterSpacing: "-0.4px"
                }}>
                  Sign <span className="signup-gradient-heading">Up</span>
                </h1>
                <p className="signup-anim-1" style={{ textAlign: "center", color: "#64748b", fontSize: "13px", marginBottom: "1.1rem" }}>
                  Tell us about your school to get started
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "9px" }}>

                  {/* School Name */}
                  <div className="signup-anim-2">
                    <label style={labelStyle}>
                      School Name <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      className="signup-input"
                      type="text"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleChange}
                      placeholder="Enter school name"
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Admin / Principal Name */}
                  <div className="signup-anim-3">
                    <label style={labelStyle}>
                      Admin / Principal Name <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      className="signup-input"
                      type="text"
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleChange}
                      placeholder="Enter admin/principal name"
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="signup-anim-4 signup-field-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>
                        Email <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        className="signup-input"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>
                        Phone Number <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        className="signup-input"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="Enter phone number"
                        inputMode="numeric"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        title="Enter a 10-digit phone number"
                        required
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="signup-anim-5 signup-field-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>
                        Password <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create password"
                          required
                          minLength={8}
                          className="signup-input"
                          style={{ ...inputStyle, paddingRight: "36px" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#94a3b8", display: "flex", alignItems: "center" }}
                        >
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

                    <div>
                      <label style={labelStyle}>
                        Confirm Password <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Re-enter password"
                          required
                          minLength={8}
                          className="signup-input"
                          style={{
                            ...inputStyle,
                            paddingRight: "36px",
                            border: formData.confirmPassword && formData.password !== formData.confirmPassword ? "1.5px solid #f87171" : "1.5px solid #e2e8f0",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#94a3b8", display: "flex", alignItems: "center" }}
                        >
                          {showConfirmPassword ? (
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
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="signup-anim-5" style={{ background: "#f8fafc", borderRadius: "10px", padding: "7px 12px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>Password strength</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: pwdStrength.color }}>{pwdStrength.label}</span>
                      </div>
                      <div style={{ height: "4px", width: "100%", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pwdStrength.percent}%`, background: pwdStrength.color, transition: "width 0.3s ease, background 0.3s ease" }} />
                      </div>
                      <p style={{ fontSize: "10.5px", color: "#64748b", marginTop: "4px", marginBottom: 0, lineHeight: 1.3 }}>
                        Must be at least 8 characters, alphanumeric with at least 1 special character (!@#$%^&*...).
                      </p>
                    </div>
                  )}

                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 500 }}>
                      Passwords do not match
                    </span>
                  )}

                  {/* Submit Button with Sunset-Orange/Coral Gradient */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="signup-anim-6 signup-submit-btn"
                    style={{
                      width: "100%",
                      padding: "13px",
                      background: loading
                        ? "#fdba74"
                        : "linear-gradient(135deg, #e15241 0%, #f97316 55%, #ea580c 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "13px",
                      fontSize: "14.5px",
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "4px",
                      boxShadow: "0 8px 24px -2px rgba(225, 82, 65, 0.42), 0 3px 8px rgba(249, 115, 22, 0.25)",
                      transition: "all 0.2s"
                    }}
                  >
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
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="signup-anim-6" style={{
                  display: "flex",
                  alignItems: "center",
                  marginBlock: "0.85rem",
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
                      padding: "11px 18px",
                      background: "#ffffff",
                      color: "#0f172a",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "13px",
                      fontSize: "13.5px",
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

                {/* Login link */}
                <p className="signup-anim-7" style={{ textAlign: "center", color: "#64748b", fontSize: "12.5px", marginTop: "0.85rem" }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "#e15241", fontWeight: 700, textDecoration: "none" }}>
                    Log in
                  </Link>
                </p>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Signup;
