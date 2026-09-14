import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSchoolsApi, updateSchoolStatusApi, deleteSchoolApi, approveSchoolApi, rejectSchoolApi, assignPlanApi } from '../../api/superAdmin.api';
import { getActivePlansApi } from '../../api/plans.api';
import toast from 'react-hot-toast';

const ManageSchools = () => {
    const navigate = useNavigate();
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [planTarget, setPlanTarget] = useState(null);
    const [plans, setPlans] = useState([]);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => { fetchSchools(); }, []);

    const fetchSchools = async () => {
        try {
            const res = await getAllSchoolsApi();
            setSchools(res.data || []);
        } catch (e) {
            toast.error('Failed to load schools');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (uuid, newStatus) => {
        try {
            await updateSchoolStatusApi(uuid, newStatus);
            toast.success(`School ${newStatus} successfully`);
            fetchSchools();
        } catch (e) {
            toast.error('Failed to update status');
        }
    };

    const handleApprove = async (uuid) => {
        try {
            await approveSchoolApi(uuid);
            toast.success('School approved — they can now log in and pick a plan');
            fetchSchools();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async (uuid) => {
        try {
            await rejectSchoolApi(uuid);
            toast.success('School rejected');
            fetchSchools();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to reject');
        }
    };

    const openAssignPlan = async (school) => {
        setPlanTarget(school);
        try {
            const res = await getActivePlansApi();
            setPlans(res.data || []);
        } catch (e) {
            toast.error('Failed to load plans');
        }
    };

    const handleAssignPlan = async (planId) => {
        if (!planTarget) return;
        setAssigning(true);
        try {
            await assignPlanApi(planTarget.uuid, planId);
            toast.success('Plan assigned');
            setPlanTarget(null);
            fetchSchools();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to assign plan');
        } finally {
            setAssigning(false);
        }
    };

    const handleDeleteConfirmed = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteSchoolApi(deleteTarget.uuid);
            toast.success('School deleted permanently');
            setDeleteTarget(null);
            fetchSchools();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to delete school');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = schools.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || s.status === filter;
        return matchSearch && matchFilter;
    });

    const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

    const statusConfig = {
        active: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
        pending: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b' },
        suspended: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
    };

    const filterOptions = [
        { value: 'all', label: 'All Schools', count: schools.length },
        { value: 'active', label: 'Active', count: schools.filter(s => s.status === 'active').length },
        { value: 'pending', label: 'Pending', count: schools.filter(s => s.status === 'pending').length },
        { value: 'suspended', label: 'Suspended', count: schools.filter(s => s.status === 'suspended').length },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e0e7ff', borderTop: '3px solid #4f6ef7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 14px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading schools...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .ms-section { animation: fadeInUp 0.35s ease forwards; opacity: 0; }
                .ms-section:nth-child(1) { animation-delay: 0.05s; }
                .ms-section:nth-child(2) { animation-delay: 0.1s; }
                .ms-section:nth-child(3) { animation-delay: 0.15s; }
                .school-row { transition: background 0.15s; }
                .school-row:hover { background: #f8fafc !important; }
                .action-btn { transition: all 0.15s; }
                .action-btn:hover { transform: translateY(-1px); }
                .create-btn:hover { background: #3c55d6 !important; }
                @media (max-width: 900px) {
                    .ms-stats { grid-template-columns: repeat(2,1fr) !important; }
                }
                @media (max-width: 640px) {
                    .ms-modal-overlay { padding: 1rem !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* ── Header ── */}
                <div className="ms-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                            Manage Schools
                        </h1>
                        <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
                            {schools.length} schools registered on the platform
                        </p>
                    </div>
                    <button className="create-btn" onClick={() => navigate('/super-admin/schools/create')}
                        style={{ padding: '11px 20px', background: '#4f6ef7', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(79,110,247,0.28)', transition: 'background 0.15s' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                        New School
                    </button>
                </div>

                {/* ── Stat Strip ── */}
                <div className="ms-section ms-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'Total', value: schools.length, color: '#4f6ef7', bg: '#eef2ff' },
                        { label: 'Active', value: schools.filter(s => s.status === 'active').length, color: '#16a34a', bg: '#f0fdf4' },
                        { label: 'Pending', value: schools.filter(s => s.status === 'pending').length, color: '#d97706', bg: '#fffbeb' },
                        { label: 'Suspended', value: schools.filter(s => s.status === 'suspended').length, color: '#dc2626', bg: '#fef2f2' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '14px', padding: '16px 18px', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>
                            <p style={{ fontSize: '21px', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: '4px' }}>{s.value}</p>
                            <p style={{ fontSize: '11.5px', color: '#94a3b8' }}>{s.label} Schools</p>
                        </div>
                    ))}
                </div>

                {/* ── Filters ── */}
                <div className="ms-section" style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" placeholder="Search by name or email..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px 10px 38px', border: '1px solid #eef1f6', borderRadius: '10px', fontSize: '13px', outline: 'none', color: '#0f172a', boxSizing: 'border-box', background: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }} />
                    </div>

                    {/* Filter tabs */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {filterOptions.map(f => (
                            <button key={f.value} onClick={() => setFilter(f.value)}
                                style={{
                                    padding: '8px 16px', borderRadius: '10px', border: filter === f.value ? '1.5px solid #4f6ef7' : '1px solid #eef1f6',
                                    fontSize: '12px', cursor: 'pointer', fontWeight: filter === f.value ? 600 : 400,
                                    background: filter === f.value ? '#4f6ef7' : '#ffffff',
                                    color: filter === f.value ? '#ffffff' : '#64748b',
                                    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
                                    boxShadow: filter === f.value ? '0 4px 12px rgba(79,110,247,0.28)' : 'none'
                                }}>
                                {f.label}
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: filter === f.value ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: filter === f.value ? '#ffffff' : '#94a3b8', fontWeight: 600 }}>
                                    {f.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Table — horizontally scrollable below the 6-column layout's natural width,
                    rather than squishing every cell down to illegibility on a phone ── */}
                <div className="ms-section" style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(15,23,42,0.03)' }}>

                    {/* Empty */}
                    {filtered.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <div style={{ width: '56px', height: '56px', background: '#eef2ff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <svg width="24" height="24" fill="none" stroke="#4f6ef7" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                            </div>
                            <p style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a', marginBottom: '6px' }}>
                                {search ? 'No schools match your search' : 'No schools yet'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
                                {search ? 'Try a different search term' : 'Create your first school to get started'}
                            </p>
                            {!search && (
                                <button onClick={() => navigate('/super-admin/schools/create')}
                                    style={{ padding: '10px 24px', background: '#4f6ef7', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                                    Create School
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <div style={{ minWidth: '880px' }}>
                                {/* Header */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1.3fr 0.9fr 1fr 0.8fr 1.9fr', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #eef1f6' }}>
                                    {['School', 'Admin', 'Location', 'Plan', 'Status', 'Actions'].map(h => (
                                        <span key={h} style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{h}</span>
                                    ))}
                                </div>
                                {filtered.map((school, i) => {
                            const sc = statusConfig[school.status] || statusConfig.pending;
                            return (
                                <div key={school.id} className="school-row"
                                    style={{ display: 'grid', gridTemplateColumns: '2.1fr 1.3fr 0.9fr 1fr 0.8fr 1.9fr', padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>

                                    {/* School */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {school.logo_url ? (
                                            <img src={school.logo_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #eef1f6' }} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#6d8bff,#4f6ef7)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(79,110,247,0.28)' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{getInitials(school.name)}</span>
                                            </div>
                                        )}
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{school.name}</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>{school.email}</p>
                                        </div>
                                    </div>

                                    {/* Admin */}
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', marginBottom: '2px' }}>{school.admin_name || '—'}</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{school.admin_email || 'No admin yet'}</p>
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '1px' }}>{school.city || '—'}</p>
                                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{school.state || '—'}</p>
                                    </div>

                                    {/* Plan */}
                                    <div>
                                        {school.plan_tenure_years ? (
                                            <>
                                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>{school.plan_name || `${school.plan_tenure_years}yr plan`}</p>
                                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>{school.plan_tenure_years}yr · {school.plan_storage_mb >= 1024 && school.plan_storage_mb % 1024 === 0 ? `${school.plan_storage_mb / 1024}GB` : `${school.plan_storage_mb}MB`}</p>
                                            </>
                                        ) : (
                                            <p style={{ fontSize: '11.5px', color: '#cbd5e1' }}>No plan</p>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.dot }}></div>
                                            {school.status}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {school.status === 'pending' ? (
                                            <>
                                                <button className="action-btn"
                                                    onClick={() => handleApprove(school.uuid)}
                                                    style={{ padding: '5px 10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                                    Approve
                                                </button>
                                                <button className="action-btn"
                                                    onClick={() => handleReject(school.uuid)}
                                                    style={{ padding: '5px 10px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {school.status !== 'active' && (
                                                    <button className="action-btn"
                                                        onClick={() => handleStatusChange(school.uuid, 'active')}
                                                        style={{ padding: '5px 10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                                        Activate
                                                    </button>
                                                )}
                                                {school.status !== 'suspended' && (
                                                    <button className="action-btn"
                                                        onClick={() => handleStatusChange(school.uuid, 'suspended')}
                                                        style={{ padding: '5px 10px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                                        Suspend
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <button className="action-btn"
                                            onClick={() => openAssignPlan(school)}
                                            style={{ padding: '5px 10px', background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                            {school.plan_tenure_years ? 'Change Plan' : 'Assign Plan'}
                                        </button>
                                        <button className="action-btn"
                                            onClick={() => setDeleteTarget(school)}
                                            style={{ padding: '5px 10px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {filtered.length > 0 && (
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', textAlign: 'right' }}>
                        Showing <strong style={{ color: '#4f6ef7' }}>{filtered.length}</strong> of {schools.length} schools
                    </p>
                )}
            </div>

            {/* ── Delete Confirmation Modal ── */}
            {deleteTarget && (
                <div className="ms-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div onClick={e => e.stopPropagation()}
                        style={{ background: '#ffffff', maxWidth: '400px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,23,42,0.35)', textAlign: 'center' }}>

                        <div style={{ padding: '2.25rem 2rem 1.5rem' }}>
                            <div style={{
                                width: '56px', height: '56px', margin: '0 auto 18px', borderRadius: '16px',
                                background: 'linear-gradient(135deg,#fef2f2,#fee2e2)', border: '1px solid #fecaca',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <svg width="24" height="24" fill="none" stroke="#b91c1c" strokeWidth="1.8" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9.5 4h5a1 1 0 011 1v2h-7V5a1 1 0 011-1z" />
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.3px' }}>
                                Delete this school?
                            </h3>
                            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, maxWidth: '320px', margin: '0 auto' }}>
                                <strong style={{ color: '#0f172a', fontWeight: 600 }}>{deleteTarget.name}</strong> and its admin account, along with all website content, will be permanently removed. This action cannot be undone.
                            </p>
                        </div>

                        <div style={{ padding: '1.25rem 1.75rem 1.75rem', display: 'flex', gap: '10px' }}>
                            <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                                style={{ flex: 1, padding: '11px', background: '#f8fafc', color: '#475569', border: '1px solid #eef1f6', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirmed} disabled={deleting}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                                    color: '#ffffff', border: 'none', fontSize: '13.5px', fontWeight: 600,
                                    cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1,
                                    boxShadow: '0 4px 14px rgba(185,28,28,0.3)',
                                }}>
                                {deleting ? 'Deleting...' : 'Delete School'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Plan Modal ── */}
            {planTarget && (
                <div className="ms-modal-overlay" onClick={() => !assigning && setPlanTarget(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div onClick={e => e.stopPropagation()}
                        style={{ background: '#ffffff', maxWidth: '440px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,23,42,0.35)' }}>
                        <div style={{ padding: '1.75rem 1.75rem 1.25rem' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Assign a plan</h3>
                            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
                                For <strong style={{ color: '#334155' }}>{planTarget.name}</strong> — sets storage limit and plan dates immediately, no payment involved.
                            </p>
                            {plans.length === 0 ? (
                                <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>Loading plans...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                                    {plans.map(p => (
                                        <button key={p.id} disabled={assigning} onClick={() => handleAssignPlan(p.id)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '12px 14px', border: '1px solid #eef1f6', borderRadius: '10px', background: '#f8fafc', cursor: assigning ? 'not-allowed' : 'pointer', textAlign: 'left' }}>
                                            <span style={{ minWidth: 0 }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'block' }}>{p.name || `${p.tenure_years}yr plan`}</span>
                                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                    {p.tenure_years} Year{p.tenure_years > 1 ? 's' : ''} · {p.storage_mb >= 1024 && p.storage_mb % 1024 === 0 ? `${p.storage_mb / 1024}GB` : `${p.storage_mb}MB`}
                                                </span>
                                            </span>
                                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#4f6ef7', flexShrink: 0 }}>₹{Number(p.price).toLocaleString('en-IN')}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '0 1.75rem 1.5rem' }}>
                            <button onClick={() => setPlanTarget(null)} disabled={assigning}
                                style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#475569', border: '1px solid #eef1f6', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ManageSchools;
