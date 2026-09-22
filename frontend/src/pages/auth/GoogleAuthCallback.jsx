import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const BLUE = '#4169E1';
const BLUE_DARK = '#2541A8';

const GoogleAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;

        const token = searchParams.get('token');
        const role = searchParams.get('role') || 'admin';
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
            toast.error(decodeURIComponent(error));
            navigate(role === 'super_admin' ? '/super-admin/login' : '/login', { replace: true });
            return;
        }

        if (token && userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam));
                setAuth(user, role, token);
                toast.success(`Welcome back, ${user.name || 'Admin'}!`);

                if (role === 'super_admin') {
                    navigate('/super-admin/dashboard', { replace: true });
                } else {
                    navigate('/admin/dashboard', { replace: true });
                }
            } catch (err) {
                console.error('Failed to parse Google user payload:', err);
                toast.error('Authentication session failed. Please log in again.');
                navigate('/login', { replace: true });
            }
        } else {
            toast.error('Authentication session was incomplete. Please try again.');
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate, setAuth]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0b1330 0%, #17234d 100%)',
            fontFamily: "'Inter', system-ui, sans-serif",
            color: '#ffffff',
            padding: '2rem'
        }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 0.8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
            `}</style>
            
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTopColor: BLUE,
                    animation: 'spin 0.9s linear infinite'
                }} />
                <div style={{
                    position: 'absolute',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                </div>
            </div>

            <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                marginBottom: '8px',
                textAlign: 'center'
            }}>
                Signing you in...
            </h2>
            <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.65)',
                textAlign: 'center',
                maxWidth: '320px',
                lineHeight: 1.5
            }}>
                Verifying your Google credentials and preparing your dashboard session.
            </p>
        </div>
    );
};

export default GoogleAuthCallback;
