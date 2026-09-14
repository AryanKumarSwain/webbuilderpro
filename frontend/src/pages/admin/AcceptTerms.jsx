import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acceptTermsApi } from '../../api/school.api';
import toast from 'react-hot-toast';

// Deliberately theme-neutral — unlike every other admin screen, this one does
// NOT use useSchoolStore's tc (school brand color). A legal/consent screen
// looking "on-brand" is beside the point, and several themes (e.g. default,
// red, burgundy) resolve to a maroon/red primary that read as an alarming
// "red theme" here. Fixed slate palette instead, consistent across all schools.
const ACCENT = '#1e293b';
const ACCENT_DARK = '#0f172a';
const BORDER = '#e2e8f0';
const TEXT_MUTED = '#64748b';

const AGREEMENT_TEXT_EN = "I confirm that I am authorised by the School to manage this website and that all content uploaded or published through this account is the responsibility of the School. I agree not to upload or publish unlawful, obscene, offensive, defamatory, discriminatory, misleading, copyrighted without permission, or otherwise inappropriate content.";

const AGREEMENT_TEXT_HI = "मैं पुष्टि करता/करती हूं कि मुझे इस वेबसाइट के प्रबंधन के लिए स्कूल द्वारा अधिकृत किया गया है और इस अकाउंट के माध्यम से अपलोड या प्रकाशित की गई सभी सामग्री की जिम्मेदारी स्कूल की है। मैं सहमत हूं कि मैं कोई भी गैरकानूनी, अश्लील, आपत्तिजनक, मानहानिकारक, भेदभावपूर्ण, भ्रामक, बिना अनुमति के कॉपीराइट सामग्री, या अन्यथा अनुचित सामग्री अपलोड या प्रकाशित नहीं करूंगा/करूंगी।";

const AcceptTerms = () => {
    const navigate = useNavigate();
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState('en');

    const handleContinue = async () => {
        if (!checked) {
            toast.error('Please tick the checkbox to continue');
            return;
        }
        setLoading(true);
        try {
            await acceptTermsApi();
            toast.success('Thank you for confirming');
            navigate('/admin/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save your confirmation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @media (max-width: 640px) {
                    .accept-terms-outer { padding: 0.75rem !important; }
                    .accept-terms-card { padding: 1.5rem !important; }
                }
            `}</style>
        <div className="accept-terms-outer" style={{
            minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '2rem', fontFamily: 'system-ui, sans-serif',
        }}>
            <div className="accept-terms-card" style={{
                width: '100%', maxWidth: '580px', background: '#ffffff', border: `1px solid ${BORDER}`,
                borderRadius: '16px', boxShadow: '0 4px 24px rgba(15,23,42,0.06)', padding: '2.5rem',
            }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Required before you continue
                </p>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                    Content Responsibility Agreement
                </h1>
                <p style={{ fontSize: '13px', color: TEXT_MUTED, marginBottom: '1.75rem', lineHeight: 1.6 }}>
                    Please read and accept the agreement below to access your admin panel.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                    <button
                        type="button"
                        onClick={() => setLang(l => (l === 'en' ? 'hi' : 'en'))}
                        style={{
                            padding: '5px 12px', borderRadius: '999px', border: `1px solid ${BORDER}`,
                            background: '#f8fafc', color: ACCENT, fontSize: '12px', fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        {lang === 'en' ? 'हिंदी' : 'English'}
                    </button>
                </div>

                <div style={{
                    background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: '10px',
                    padding: '1.1rem 1.25rem', fontSize: '13px', color: '#334155', lineHeight: 1.75, marginBottom: '1.25rem',
                }}>
                    {lang === 'en' ? AGREEMENT_TEXT_EN : AGREEMENT_TEXT_HI}
                </div>

                <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                    padding: '12px 14px', borderRadius: '10px',
                    background: checked ? '#f1f5f9' : 'transparent',
                    border: `1px solid ${checked ? '#cbd5e1' : BORDER}`,
                    marginBottom: '1.5rem', transition: 'all 0.15s',
                }}>
                    <input
                        type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
                        style={{ marginTop: '2px', width: '16px', height: '16px', cursor: 'pointer', accentColor: ACCENT, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        I have read and agree to the above.
                    </span>
                </label>

                <button
                    onClick={handleContinue} disabled={!checked || loading}
                    style={{
                        width: '100%', padding: '13px', borderRadius: '8px', border: 'none',
                        fontSize: '14px', fontWeight: 700, color: '#ffffff',
                        background: !checked ? '#cbd5e1' : `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
                        cursor: !checked || loading ? 'not-allowed' : 'pointer',
                        boxShadow: checked ? '0 6px 18px rgba(15,23,42,0.25)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                >
                    {loading ? 'Saving...' : 'I Agree & Continue'}
                </button>
            </div>
        </div>
        </>
    );
};

export default AcceptTerms;
