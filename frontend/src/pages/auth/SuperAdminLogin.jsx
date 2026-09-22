import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginApi } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/webbuilder-removebg-preview.png';

const SuperAdminLogin = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await loginApi(formData.email, formData.password, 'super_admin');
            setAuth(res.data.user, 'super_admin', res.data.accessToken);
            toast.success('Welcome back!');
            navigate('/super-admin/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
                .sa-input {
                    width: 100%;
                    border: none;
                    border-bottom: 1.5px solid #e2e2e2;
                    background: transparent;
                    padding: 10px 28px 10px 2px;
                    font-size: 15px;
                    color: #2a2a2a;
                    outline: none;
                    font-family: 'Inter', sans-serif;
                    box-sizing: border-box;
                    transition: border-color 0.25s;
                }
                .sa-input::placeholder { color: #767676; }
                .sa-input:focus { border-bottom-color: #8C6A3F; }
                .sa-btn { transition: all 0.2s; }
                .sa-btn:not(:disabled):hover {
                    transform: translateY(-1px);
                    box-shadow: 0 10px 26px rgba(140,106,63,0.4) !important;
                }
                .sa-forgot { transition: color 0.2s; }
                .sa-forgot:hover { color: #8C6A3F !important; }
                @media (max-width: 480px) {
                    .sa-content { padding-top: 2rem !important; padding-inline: 1.25rem !important; }
                    .sa-mountain { height: 34vh !important; }
                }
            `}</style>

            <div style={{
                width: '100vw', minHeight: '100vh',
                position: 'relative', overflowX: 'hidden', overflowY: 'auto',
                background: '#FBEEC9',
                display: 'flex', flexDirection: 'column',
                fontFamily: "'Inter', sans-serif",
            }}>
                {/* Mountain art — bottom of viewport */}
                <svg viewBox="0 0 1440 500" preserveAspectRatio="none" className="sa-mountain"
                    style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '46vh', zIndex: 0 }}>
                    <defs>
                        <filter id="saGrain">
                            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise" />
                            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0" />
                        </filter>
                    </defs>
                    <rect width="100%" height="100%" fill="#F0DFB4" />
                    <polygon points="0,500 0,260 180,140 360,230 560,110 760,220 980,120 1200,240 1440,150 1440,500" fill="#C9A876" />
                    <polygon points="0,500 0,360 240,280 480,350 720,260 960,340 1200,270 1440,330 1440,500" fill="#DDC89D" />
                    <polygon points="0,500 0,420 300,390 620,430 900,400 1200,440 1440,410 1440,500" fill="#8C6A3F" />
                    <rect width="100%" height="100%" filter="url(#saGrain)" />
                </svg>

                {/* White fade — blends art into the white page */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                    background: 'linear-gradient(180deg, #FBEEC9 0%, #FBEEC9 38%, rgba(251,238,201,0.9) 50%, rgba(251,238,201,0.45) 64%, rgba(251,238,201,0) 80%)'
                }}></div>

                {/* Content */}
                <div className="sa-content" style={{
                    position: 'relative', zIndex: 2,
                    width: '100%', maxWidth: '380px',
                    margin: '0 auto', padding: 'clamp(3rem, 10vh, 6rem) 1.5rem 0',
                    textAlign: 'center',
                }}>
                    {/* Logo */}
                    <img src={logo} alt="Web Builder Pro Logo"
                        style={{ width: 'clamp(150px, 20vh, 210px)', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto 6px' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
                        <span style={{ width: '14px', height: '2px', background: '#8C6A3F' }}></span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#8C6A3F', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
                            Super Admin Portal
                        </span>
                        <span style={{ width: '14px', height: '2px', background: '#8C6A3F' }}></span>
                    </div>

                    <p style={{ fontSize: '13.5px', color: '#8a8a8a', lineHeight: 1.6, marginBottom: '28px' }}>
                        Please enter your registered email and password<br />correctly to access the management panel.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px', textAlign: 'left' }}>

                        {/* Email */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                                Email Address
                            </label>
                            <input type="email" name="email" value={formData.email}
                                onChange={handleChange} placeholder="Enter your email"
                                required className="sa-input" />
                        </div>

                        {/* Password */}
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} name="password"
                                    value={formData.password} onChange={handleChange}
                                    placeholder="Enter your password" required className="sa-input" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#b8b8b8', display: 'flex', padding: 0 }}>
                                    {showPassword ? (
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                    ) : (
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading} className="sa-btn"
                            style={{
                                width: '100%', padding: '15px', marginTop: '10px',
                                background: loading ? '#F0DFB4' : 'linear-gradient(135deg, #C9A876, #8C6A3F)',
                                color: '#ffffff', border: 'none', borderRadius: '10px',
                                fontSize: '14px', fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: '0 6px 20px rgba(140,106,63,0.35)'
                            }}>
                            {loading ? (
                                <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Signing in...</>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <Link to="/super-admin/forgot-password" className="sa-forgot" style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: '#9a9a9a', marginTop: '22px', textDecoration: 'none' }}>
                        Forgot your password?
                    </Link>
                </div>

                {/* Footer */}
                <p style={{
                    position: 'relative', zIndex: 2, textAlign: 'center',
                    fontSize: '11px', color: 'rgba(255,255,255,0.75)',
                    letterSpacing: '0.05em', marginTop: 'auto', marginBottom: '20px'
                }}>
                    Web Builder Pro · Authorized personnel only
                </p>
            </div>
        </>
    );
};

export default SuperAdminLogin;
