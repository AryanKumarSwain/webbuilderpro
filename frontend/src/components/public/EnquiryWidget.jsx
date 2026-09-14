import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { submitEnquiryApi } from "../../api/enquiry.api";
import { uploadPublicResumeApi } from "../../api/content.api";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import AdmissionEnquiryForm from "./AdmissionEnquiryForm";
import { sanitizePhoneDigits, isValidPhone } from "../../utils/phone";
import toast from "react-hot-toast";

const inputStyleBase = {
    width: '100%', padding: '11px 14px 11px 36px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
    fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
    background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif", transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
};
const labelStyle = { display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '7px', letterSpacing: '0.01em' };
const Required = () => <span style={{ color: '#dc2626' }}> *</span>;
const errorInputStyle = { borderColor: '#dc2626' };
const fieldErrorStyle = { color: '#dc2626', fontSize: '11px', fontWeight: 500, marginTop: '4px' };
const FieldError = ({ show }) => show ? <p style={fieldErrorStyle}>Please fill in this field</p> : null;

const WIcon = ({ children }) => (
    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'flex' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </span>
);
const IconPerson = <WIcon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></WIcon>;
const IconBriefcase = <WIcon><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></WIcon>;
const IconPhone = <WIcon><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" /></WIcon>;
const IconMail = <WIcon><path d="M22 6l-10 7L2 6" /><path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2z" /></WIcon>;

// ── Shared modal chrome (plain white header + heading + close + success view),
// matching the reference "ENQUIRE FORM" design. ──
const ModalShell = ({ open, onClose, bc, title, submitted, successTitle, successMessage, onResetAndClose, children }) => {
    if (!open) return null;
    return (
        <div onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 6000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            }}>
            <div onClick={e => e.stopPropagation()} className="enq-modal-scroll"
                style={{
                    background: bc.card, borderRadius: '14px', width: '100%', maxWidth: '460px',
                    maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 70px rgba(0,0,0,0.32)',
                    animation: 'enqModalIn 0.28s cubic-bezier(0.16,1,0.3,1)', fontFamily: "'Inter', system-ui, sans-serif",
                    position: 'relative',
                }}>
                <button onClick={onClose} className="enq-widget-close"
                    style={{ position: 'absolute', top: '14px', right: '16px', width: '28px', height: '28px', border: 'none', background: '#f1f5f9', borderRadius: '8px', color: '#475569', fontSize: '18px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s ease' }}>
                    ×
                </button>

                <div style={{ padding: '24px 26px 22px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.01em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '16px' }}>
                        {title}
                    </h2>

                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                            <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 1.25rem' }}>
                                <div className="enq-success-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #22c55e' }}></div>
                                <div className="enq-success-badge" style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 26px rgba(34,197,94,0.35)' }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path className="enq-success-check" d="M4 12.5l5 5L20 6.5" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>{successTitle}</h3>
                            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                                {successMessage}
                            </p>
                            <button onClick={onResetAndClose} className="enq-success-close"
                                style={{ padding: '10px 22px', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', color: '#1e293b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                Close
                            </button>
                        </div>
                    ) : children}
                </div>
            </div>
        </div>
    );
};

// ── Admission Enquiry modal — opens only on floating tab click or the
// "Admission Enquiry" CTA elsewhere on the site (via the 'open-admission-enquiry'
// window event, see SchoolWebsite.jsx). No auto-popup on load — the site should
// only ever show the form when the visitor explicitly asks for it.
// Renders the same shared <AdmissionEnquiryForm/> used on the Admission
// Procedure page, so the fields are always identical no matter where a visitor
// fills the form. ──
const AdmissionEnquiryModal = ({ school, tc, bc }) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener('open-admission-enquiry', handler);
        return () => window.removeEventListener('open-admission-enquiry', handler);
    }, []);

    if (!isModuleEnabled(school, 'admission')) return null;

    return (
        <ModalShell open={open} onClose={() => setOpen(false)} tc={tc} bc={bc} title="Enquire Form" submitted={false}>
            <AdmissionEnquiryForm school={school} tc={tc} dense />
        </ModalShell>
    );
};

const emptyCareerForm = { name: '', position: '', phone: '', email: '', message: '' };

// ── Career Enquiry modal — opens only from its own floating tab (or the
// 'open-career-enquiry' window event) — deliberately no auto-popup on load,
// unlike Admission, since two auto-popups on the same visit would be annoying. ──
const CareerEnquiryModal = ({ school, tc, bc }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyCareerForm);
    const [errors, setErrors] = useState({});
    const [resumeUrl, setResumeUrl] = useState('');
    const [uploadingResume, setUploadingResume] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener('open-career-enquiry', handler);
        return () => window.removeEventListener('open-career-enquiry', handler);
    }, []);

    if (!isModuleEnabled(school, 'career')) return null;

    const update = (field, value) => {
        const v = field === 'phone' ? sanitizePhoneDigits(value) : value;
        setForm(prev => ({ ...prev, [field]: v }));
        if (v.trim()) setErrors(prev => ({ ...prev, [field]: false }));
    };
    const resetAndClose = () => { setSubmitted(false); setForm(emptyCareerForm); setErrors({}); setResumeUrl(''); setOpen(false); };

    const handleResumeUpload = async (file) => {
        setUploadingResume(true);
        try {
            const res = await uploadPublicResumeApi(school.id, file);
            setResumeUrl(res.data.url);
            toast.success('Resume uploaded');
        } catch (e) {
            toast.error('Failed to upload resume');
        } finally {
            setUploadingResume(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = true;
        if (!isValidPhone(form.phone)) newErrors.phone = true;
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error(!form.phone.trim() ? 'Please fill in all required fields' : 'Phone number must be exactly 10 digits');
            return;
        }
        setSubmitting(true);
        try {
            await submitEnquiryApi(school.id, {
                type: 'career',
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                message: form.message.trim() || undefined,
                extra: { position: form.position.trim(), resumeUrl },
            });
            setSubmitted(true);
        } catch (e) {
            toast.error('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell open={open} onClose={() => setOpen(false)} tc={tc} bc={bc}
            title="Career Form"
            submitted={submitted} successTitle="Application Submitted!"
            successMessage="Thank you for your interest. Our team will review your application and get in touch if there's a fit."
            onResetAndClose={resetAndClose}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="enq-2col enq-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', animationDelay: '0s' }}>
                    <div>
                        <label style={labelStyle}>Full Name<Required /></label>
                        <div style={{ position: 'relative' }}>
                            {IconPerson}
                            <input className="enq-widget-input" type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Enter your full name" style={{ ...inputStyleBase, ...(errors.name ? errorInputStyle : {}) }} required />
                        </div>
                        <FieldError show={errors.name} />
                    </div>
                    <div>
                        <label style={labelStyle}>Position Applied For</label>
                        <div style={{ position: 'relative' }}>
                            {IconBriefcase}
                            <input className="enq-widget-input" type="text" value={form.position} onChange={e => update('position', e.target.value)} placeholder="e.g. Primary Teacher" style={inputStyleBase} />
                        </div>
                    </div>
                </div>

                <div className="enq-2col enq-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', animationDelay: '0.05s' }}>
                    <div>
                        <label style={labelStyle}>Phone Number<Required /></label>
                        <div style={{ position: 'relative' }}>
                            {IconPhone}
                            <input className="enq-widget-input" type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="Enter phone number" style={{ ...inputStyleBase, ...(errors.phone ? errorInputStyle : {}) }} required />
                        </div>
                        <FieldError show={errors.phone} />
                    </div>
                    <div>
                        <label style={labelStyle}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            {IconMail}
                            <input className="enq-widget-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="Enter email address" style={inputStyleBase} />
                        </div>
                    </div>
                </div>

                <div className="enq-field" style={{ animationDelay: '0.1s' }}>
                    <label style={labelStyle}>Resume (PDF, optional)</label>
                    <label className="enq-resume-drop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', border: `1.5px dashed ${resumeUrl ? '#86efac' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, color: resumeUrl ? '#15803d' : '#64748b', background: resumeUrl ? '#f0fdf4' : '#f8fafc', textAlign: 'center', transition: 'border-color 0.2s ease, background 0.2s ease' }}>
                        {uploadingResume ? (
                            <svg className="enq-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.3 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" /></svg>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                        )}
                        {uploadingResume ? 'Uploading...' : resumeUrl ? 'Resume uploaded — click to change' : 'Click to upload your resume'}
                        <input type="file" accept="application/pdf" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleResumeUpload(f); }} />
                    </label>
                </div>

                <div className="enq-field" style={{ animationDelay: '0.15s' }}>
                    <label style={labelStyle}>Message</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8', pointerEvents: 'none', display: 'flex' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                        </span>
                        <textarea className="enq-widget-input" value={form.message} onChange={e => update('message', e.target.value)} placeholder="Tell us a bit about your experience..." rows={2} style={{ ...inputStyleBase, resize: 'vertical', fontFamily: 'inherit', paddingTop: '11px' }} />
                    </div>
                </div>

                <button type="submit" disabled={submitting} className="enq-widget-submit enq-field"
                    style={{
                        marginTop: '2px', padding: '12px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff',
                        border: 'none', borderRadius: '8px', fontSize: '14.5px', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: `0 8px 22px ${tc.primary}38`, animationDelay: '0.2s',
                    }}>
                    {submitting && (
                        <svg className="enq-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.3 }} cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3.5" /><path d="M22 12a10 10 0 00-10-10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" /></svg>
                    )}
                    {submitting ? 'Submitting...' : 'Send Message'}
                </button>
            </form>
        </ModalShell>
    );
};

// ── Site-wide enquiry widget — floating "Enquire Now" / "Career Enquiry" tabs
// (always visible on every public school page) plus their modal forms. Mounted
// once in App.jsx alongside <Routes>, so it derives the school from the URL
// itself (there is no shared public layout route to hang this off yet) rather
// than every public page having to import/render it individually. Replaces the
// old dedicated /school/:slug/admission-enquiry and /career-enquiry pages —
// see CLAUDE.md Modules section.
//
// `customSlug` — on a connected custom domain (e.g. mcs.wbpro.in) the real
// browser path is clean (no /school/:slug prefix by design, see
// CustomDomainRoutes in App.jsx), so the regex below never matches and this
// widget rendered nothing at all there — no floating tabs, no way to submit
// an enquiry. RootRouter already resolves the slug for a custom domain via
// resolveSchoolByDomainApi and passes it through as this prop; the regex stays
// as the fallback for the normal /school/:slug/* platform path. ──
const EnquiryWidget = ({ customSlug } = {}) => {
    const location = useLocation();
    const match = location.pathname.match(/^\/school\/([^/]+)/);
    const slug = customSlug || (match ? match[1] : null);

    const [school, setSchool] = useState(null);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        getPublicSchoolApi(slug).then(res => { if (!cancelled) setSchool(res.data); }).catch(() => { if (!cancelled) setSchool(null); });
        return () => { cancelled = true; };
    }, [slug]);

    if (!school) return null;

    const tc = getThemeColors(school.theme);
    const bc = getBaseColors(school.base_theme);
    const admissionOn = isModuleEnabled(school, 'admission');
    const careerOn = isModuleEnabled(school, 'career');

    // ── Floating right-edge tabs — built as a list rather than two hardcoded
    // buttons so a third (or more) tab spaces itself evenly automatically. ──
    const floatingTabs = [
        admissionOn && { key: 'admission', label: 'Enquire Now', onClick: () => window.dispatchEvent(new Event('open-admission-enquiry')) },
        careerOn && { key: 'career', label: 'Career Enquiry', onClick: () => window.dispatchEvent(new Event('open-career-enquiry')) },
        school.prospectus_url && { key: 'prospectus', label: 'Prospectus', href: school.prospectus_url },
        school.school_app_url && { key: 'schoolApp', label: school.school_app_label || 'Get Our App', href: school.school_app_url },
    ].filter(Boolean);

    const tabTopPercent = (index, total) => {
        if (total <= 1) return 50;
        if (total === 2) return index === 0 ? 40 : 60;
        if (total === 3) return [26, 50, 74][index];
        if (total === 4) return [20, 40, 60, 80][index];
        return 20 + (index * 60) / (total - 1);
    };

    return (
        <>
            <style>{`
                .enq-widget-tab:hover { filter: brightness(1.08); transform: translateY(-50%) translateX(-2px); }
                .enq-widget-close:hover { background: #e2e8f0 !important; }
                .enq-widget-input:focus { border-color: ${tc.primary} !important; background: #ffffff !important; box-shadow: 0 0 0 3.5px ${tc.primary}1a; }
                .enq-widget-submit { transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease; }
                .enq-widget-submit:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 12px 28px ${tc.primary}45; }
                .enq-widget-submit:active:not(:disabled) { transform: translateY(0); }
                .enq-resume-drop:hover { border-color: ${tc.primary} !important; }
                .enq-success-close { transition: transform 0.18s ease, border-color 0.18s ease; }
                .enq-success-close:hover { transform: translateY(-1px); border-color: ${tc.primary}; }
                .enq-modal-scroll { scrollbar-width: none; -ms-overflow-style: none; }
                .enq-modal-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
                @keyframes enqModalIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes enqFieldIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .enq-field { animation: enqFieldIn 0.45s cubic-bezier(0.16,1,0.3,1) both; }
                .enq-success-badge { animation: enqCheckPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
                .enq-success-ring { animation: enqRingPulse 1s ease-out 0.1s both; }
                .enq-success-check { stroke-dasharray: 28; stroke-dashoffset: 28; animation: enqCheckDraw 0.35s ease-out 0.4s forwards; }
                @keyframes enqCheckPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                @keyframes enqRingPulse { 0% { transform: scale(0.75); opacity: 0.8; } 100% { transform: scale(1.7); opacity: 0; } }
                @keyframes enqCheckDraw { to { stroke-dashoffset: 0; } }
                @keyframes enqSpin { to { transform: rotate(360deg); } }
                .enq-spin { animation: enqSpin 0.7s linear infinite; }
                @media (max-width: 420px) {
                    .enq-2col { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Floating tabs — fixed to the right edge on every page. Vertical
                (top-to-bottom) text in a rounded tab, matching the reference design. */}
            {floatingTabs.map((t, i) => {
                const tabStyle = {
                    position: 'fixed', right: 0, top: `${tabTopPercent(i, floatingTabs.length)}%`, transform: 'translateY(-50%)', zIndex: 5000,
                    background: tc.primary, color: '#ffffff',
                    border: 'none', borderRadius: '10px 0 0 10px', padding: '13px 8px',
                    fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.28)', fontFamily: "'Inter', system-ui, sans-serif",
                    transition: 'filter 0.2s ease', writingMode: 'vertical-rl', textOrientation: 'mixed',
                    textDecoration: 'none', display: 'inline-block',
                };
                return t.href ? (
                    <a key={t.key} href={t.href} target="_blank" rel="noopener noreferrer" className="enq-widget-tab" style={tabStyle}>
                        {t.label}
                    </a>
                ) : (
                    <button key={t.key} className="enq-widget-tab" onClick={t.onClick} style={tabStyle}>
                        {t.label}
                    </button>
                );
            })}

            <AdmissionEnquiryModal school={school} tc={tc} bc={bc} />
            <CareerEnquiryModal school={school} tc={tc} bc={bc} />
        </>
    );
};

export default EnquiryWidget;
