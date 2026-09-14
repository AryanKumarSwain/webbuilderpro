import { useEffect, useState } from 'react';
import { getPendingSubdomainRequestsApi, fulfillSubdomainRequestApi, rejectSubdomainRequestApi } from '../../api/subdomainRequest.api';
import toast from 'react-hot-toast';

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const SubdomainRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fulfillTarget, setFulfillTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [processing, setProcessing] = useState(false);

    const fetchRequests = async () => {
        try {
            const res = await getPendingSubdomainRequestsApi();
            setRequests(res.data || []);
        } catch {
            toast.error('Failed to load subdomain requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleFulfillConfirmed = async () => {
        if (!fulfillTarget) return;
        setProcessing(true);
        try {
            await fulfillSubdomainRequestApi(fulfillTarget.id);
            toast.success('Marked live — the school has been emailed');
            setFulfillTarget(null);
            fetchRequests();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to mark live');
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectConfirmed = async () => {
        if (!rejectTarget) return;
        setProcessing(true);
        try {
            await rejectSubdomainRequestApi(rejectTarget.id);
            toast.success('Request rejected — the school has been notified');
            setRejectTarget(null);
            fetchRequests();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to reject request');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e0e7ff', borderTop: '3px solid #4f6ef7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .sdr-modal-overlay { padding: 2rem; }
                @media (max-width: 640px) { .sdr-modal-overlay { padding: 1rem !important; } }
            `}</style>

            {/* ── Header ── */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>Subdomain Requests</h1>
                <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
                    Schools waiting for their free wbpro.in subdomain — do the GoDaddy CNAME + Vercel domain setup, then mark it live.
                </p>
            </div>

            {requests.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #eef1f6', borderRadius: '14px', padding: '3.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a', marginBottom: '6px' }}>No pending requests</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>New subdomain requests from schools will show up here.</p>
                </div>
            ) : (
                <div style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ minWidth: '720px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.6fr 1fr 1fr', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #eef1f6' }}>
                                {['School', 'Requested Subdomain', 'Requested On', 'Actions'].map(h => (
                                    <span key={h} style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{h}</span>
                                ))}
                            </div>
                            {requests.map((r, i) => (
                                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.6fr 1fr 1fr', padding: '16px 20px', borderBottom: i < requests.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{r.school_name}</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{r.admin_email || '—'}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#4338ca', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '4px 10px', fontFamily: 'monospace' }}>
                                            {r.requested_label}.wbpro.in
                                        </span>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#64748b' }}>{formatDate(r.created_at)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        <button onClick={() => setFulfillTarget(r)}
                                            style={{ padding: '5px 10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                            Mark Live
                                        </button>
                                        <button onClick={() => setRejectTarget(r)}
                                            style={{ padding: '5px 10px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Mark Live confirm ── */}
            {fulfillTarget && (
                <div className="sdr-modal-overlay" onClick={() => !processing && setFulfillTarget(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ background: '#fff', maxWidth: '420px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,23,42,0.35)', textAlign: 'center' }}>
                        <div style={{ padding: '2.25rem 2rem 1.5rem' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>Mark this subdomain live?</h3>
                            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6 }}>
                                Only confirm once <strong style={{ color: '#0f172a' }}>{fulfillTarget.requested_label}.wbpro.in</strong> is actually pointed at Vercel (GoDaddy CNAME + Vercel domain added) — this immediately makes <strong style={{ color: '#0f172a' }}>{fulfillTarget.school_name}</strong>'s site live there and emails them.
                            </p>
                        </div>
                        <div style={{ padding: '1.25rem 1.75rem 1.75rem', display: 'flex', gap: '10px' }}>
                            <button onClick={() => setFulfillTarget(null)} disabled={processing}
                                style={{ flex: 1, padding: '11px', background: '#f8fafc', color: '#475569', border: '1px solid #eef1f6', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleFulfillConfirmed} disabled={processing}
                                style={{ flex: 1, padding: '11px', borderRadius: '10px', background: processing ? '#94a3b8' : 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer' }}>
                                {processing ? 'Marking...' : 'Mark Live'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject confirm ── */}
            {rejectTarget && (
                <div className="sdr-modal-overlay" onClick={() => !processing && setRejectTarget(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ background: '#fff', maxWidth: '400px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,23,42,0.35)', textAlign: 'center' }}>
                        <div style={{ padding: '2.25rem 2rem 1.5rem' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>Reject this request?</h3>
                            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6 }}>
                                <strong style={{ color: '#0f172a' }}>{rejectTarget.school_name}</strong>'s request for <strong style={{ color: '#0f172a' }}>{rejectTarget.requested_label}.wbpro.in</strong> will be declined — they'll be emailed to try a different subdomain from Settings.
                            </p>
                        </div>
                        <div style={{ padding: '1.25rem 1.75rem 1.75rem', display: 'flex', gap: '10px' }}>
                            <button onClick={() => setRejectTarget(null)} disabled={processing}
                                style={{ flex: 1, padding: '11px', background: '#f8fafc', color: '#475569', border: '1px solid #eef1f6', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleRejectConfirmed} disabled={processing}
                                style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}>
                                {processing ? 'Rejecting...' : 'Reject Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubdomainRequests;
