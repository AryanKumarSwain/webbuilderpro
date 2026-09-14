import { useState } from 'react';
import toast from 'react-hot-toast';
import { requestSubdomainApi } from '../../api/subdomainRequest.api';

// ── Shared subdomain-request form — label input + live ".wbpro.in" preview,
// client-side validation mirroring the backend's LABEL_REGEX, and the
// "already taken" 409 surfaced as an inline error. Used both in the
// post-payment popup (Billing.jsx) and the Settings "Free Subdomain" card,
// so validation/copy/behavior stays in one place. ──
const LABEL_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

const SubdomainRequestForm = ({ tc, onSuccess, submitLabel = 'Request Subdomain' }) => {
    const [label, setLabel] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const primary = tc?.primary || '#4169E1';
    const secondary = tc?.secondary || '#2541A8';

    const handleChange = (e) => {
        setLabel(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = label.trim();
        if (!LABEL_REGEX.test(trimmed)) {
            setError('3-63 characters — lowercase letters, numbers and hyphens only');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await requestSubdomainApi(trimmed);
            toast.success("Request submitted — we'll email you within 24 hours");
            onSuccess?.(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
                display: 'flex', alignItems: 'center', overflow: 'hidden',
                border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '10px', background: '#f8fafc',
            }}>
                <input
                    type="text" value={label} onChange={handleChange}
                    placeholder="yourschool" maxLength={63} autoFocus
                    style={{ flex: 1, minWidth: 0, padding: '11px 12px', border: 'none', background: 'transparent', fontSize: '13.5px', color: '#0f172a', outline: 'none' }}
                />
                <span style={{ padding: '0 12px', fontSize: '13px', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>.wbpro.in</span>
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={submitting || !label.trim()}
                style={{
                    padding: '11px', borderRadius: '10px', border: 'none',
                    background: submitting || !label.trim() ? '#cbd5e1' : `linear-gradient(135deg, ${primary}, ${secondary})`,
                    color: '#fff', fontSize: '13.5px', fontWeight: 700,
                    cursor: submitting || !label.trim() ? 'not-allowed' : 'pointer',
                }}>
                {submitting ? 'Submitting...' : submitLabel}
            </button>
        </form>
    );
};

export default SubdomainRequestForm;
