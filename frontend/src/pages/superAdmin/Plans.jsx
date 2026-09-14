import { useEffect, useState } from 'react';
import { getAllPlansApi, createPlanApi, updatePlanApi, deletePlanApi } from '../../api/plans.api';
import toast from 'react-hot-toast';

// ── Storage helpers (DB stores MB; UI lets you pick MB or GB) ──
const storageLabel = (mb) =>
    mb >= 1024 && mb % 1024 === 0 ? `${mb / 1024} GB` : `${mb} MB`;

const mbToForm = (mb) =>
    mb && mb >= 1024 && mb % 1024 === 0
        ? { storageValue: String(mb / 1024), storageUnit: 'GB' }
        : { storageValue: mb ? String(mb) : '', storageUnit: 'MB' };

const formToMb = (value, unit) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return NaN;
    return unit === 'GB' ? Math.round(n * 1024) : Math.round(n);
};

const EMPTY_FORM = {
    name: '',
    tenureYears: '1',
    storageValue: '',
    storageUnit: 'MB',
    price: '',
    description: '',
    featuresText: '',
    sortOrder: '0',
    isActive: true,
};

const Plans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null); // null = creating
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { fetchPlans(); }, []);

    const fetchPlans = async () => {
        try {
            const res = await getAllPlansApi();
            setPlans(res.data || []);
        } catch (e) {
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEdit = (plan) => {
        setEditingId(plan.id);
        setForm({
            name: plan.name || '',
            tenureYears: String(plan.tenure_years ?? '1'),
            ...mbToForm(plan.storage_mb),
            price: String(plan.price ?? ''),
            description: plan.description || '',
            featuresText: (plan.features || []).join('\n'),
            sortOrder: String(plan.sort_order ?? '0'),
            isActive: plan.is_active ? true : false,
        });
        setModalOpen(true);
    };

    const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSave = async () => {
        const storageMb = formToMb(form.storageValue, form.storageUnit);
        if (!form.name.trim()) return toast.error('Plan name is required');
        if (!Number.isFinite(Number(form.tenureYears)) || Number(form.tenureYears) < 1)
            return toast.error('Tenure must be at least 1 year');
        if (!Number.isFinite(storageMb) || storageMb < 1)
            return toast.error('Enter a valid storage size');
        if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0)
            return toast.error('Enter a valid price');

        const payload = {
            name: form.name.trim(),
            tenureYears: Number(form.tenureYears),
            storageMb,
            price: Number(form.price),
            description: form.description.trim(),
            features: form.featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
            sortOrder: Number(form.sortOrder) || 0,
            isActive: form.isActive ? 1 : 0,
        };

        setSaving(true);
        try {
            if (editingId) {
                await updatePlanApi(editingId, payload);
                toast.success('Plan updated');
            } else {
                await createPlanApi(payload);
                toast.success('Plan created');
            }
            setModalOpen(false);
            fetchPlans();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to save plan');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (plan) => {
        try {
            await updatePlanApi(plan.id, { isActive: plan.is_active ? 0 : 1 });
            toast.success(plan.is_active ? 'Plan deactivated' : 'Plan activated');
            fetchPlans();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to update plan');
        }
    };

    const handleDeleteConfirmed = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deletePlanApi(deleteTarget.id);
            toast.success('Plan deleted');
            setDeleteTarget(null);
            fetchPlans();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to delete plan');
        } finally {
            setDeleting(false);
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

    const inputStyle = {
        width: '100%', padding: '9px 11px', border: '1px solid #e5e9f0', borderRadius: '9px',
        fontSize: '13px', outline: 'none', color: '#0f172a', boxSizing: 'border-box', background: '#fff',
    };
    const labelStyle = { fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '5px', display: 'block' };

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 640px) {
                    .plans-modal-overlay { padding: 1rem !important; }
                }
            `}</style>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>Plans &amp; Pricing</h1>
                    <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
                        Design the plans schools choose from — name, tenure, storage, price and what each includes.
                    </p>
                </div>
                <button onClick={openCreate}
                    style={{ padding: '11px 20px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(79,110,247,0.28)' }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Add Plan
                </button>
            </div>

            {/* ── Plan cards ── */}
            {plans.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #eef1f6', borderRadius: '14px', padding: '3.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a', marginBottom: '6px' }}>No plans yet</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Create your first plan for schools to choose from.</p>
                    <button onClick={openCreate}
                        style={{ padding: '10px 24px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        Add Plan
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                    {plans.map((plan) => (
                        <div key={plan.id} style={{
                            background: '#fff', border: '1px solid #eef1f6', borderRadius: '16px', padding: '20px',
                            boxShadow: '0 2px 10px rgba(15,23,42,0.03)', opacity: plan.is_active ? 1 : 0.72,
                            display: 'flex', flexDirection: 'column',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.name || '(unnamed)'}</p>
                                    <p style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                                        {plan.tenure_years} year{plan.tenure_years > 1 ? 's' : ''} · {storageLabel(plan.storage_mb)}
                                    </p>
                                </div>
                                <span style={{
                                    fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: 600, flexShrink: 0,
                                    background: plan.is_active ? '#f0fdf4' : '#fef2f2', color: plan.is_active ? '#15803d' : '#b91c1c',
                                    border: `1px solid ${plan.is_active ? '#bbf7d0' : '#fecaca'}`,
                                }}>
                                    {plan.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <p style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                                ₹{Number(plan.price).toLocaleString('en-IN')}
                                <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}> / {plan.tenure_years}yr</span>
                            </p>

                            {plan.description && (
                                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', lineHeight: 1.5 }}>{plan.description}</p>
                            )}

                            {plan.features?.length > 0 && (
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {plan.features.map((f, i) => (
                                        <li key={i} style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                                            <svg width="13" height="13" fill="none" stroke="#22c55e" strokeWidth="3" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '2px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                <button onClick={() => openEdit(plan)}
                                    style={{ flex: 1, padding: '8px', background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                    Edit
                                </button>
                                <button onClick={() => handleToggleActive(plan)}
                                    style={{ padding: '8px 10px', background: '#f8fafc', color: '#475569', border: '1px solid #eef1f6', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                    {plan.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => setDeleteTarget(plan)} title="Delete plan"
                                    style={{ padding: '8px 10px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Create / Edit modal ── */}
            {modalOpen && (
                <div className="plans-modal-overlay" onClick={() => !saving && setModalOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ background: '#fff', maxWidth: '480px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,23,42,0.35)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem 1.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{editingId ? 'Edit plan' : 'New plan'}</h3>
                        </div>

                        <div style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Plan name</label>
                                <input style={inputStyle} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Enter plan name (e.g. Starter, Premium)" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Tenure (years)</label>
                                    <input style={inputStyle} type="number" min="1" value={form.tenureYears} onChange={(e) => setField('tenureYears', e.target.value)} placeholder="Enter years" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Price (₹)</label>
                                    <input style={inputStyle} type="number" min="0" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="Enter total price" />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Storage</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input style={{ ...inputStyle, flex: 1 }} type="number" min="1" value={form.storageValue} onChange={(e) => setField('storageValue', e.target.value)} placeholder="Enter amount" />
                                    <select style={{ ...inputStyle, width: '90px' }} value={form.storageUnit} onChange={(e) => setField('storageUnit', e.target.value)}>
                                        <option value="MB">MB</option>
                                        <option value="GB">GB</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Short description <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(optional)</span></label>
                                <input style={inputStyle} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Enter a one-line summary" />
                            </div>

                            <div>
                                <label style={labelStyle}>Features <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(one per line)</span></label>
                                <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical', fontFamily: 'inherit' }}
                                    value={form.featuresText} onChange={(e) => setField('featuresText', e.target.value)}
                                    placeholder={'Enter one feature per line\nAll website modules\nEmail support\nFree updates'} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'end' }}>
                                <div>
                                    <label style={labelStyle}>Display order</label>
                                    <input style={inputStyle} type="number" value={form.sortOrder} onChange={(e) => setField('sortOrder', e.target.value)} placeholder="0" />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', fontWeight: 600, paddingBottom: '9px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                                    Active (visible to schools)
                                </label>
                            </div>
                        </div>

                        <div style={{ padding: '1rem 1.75rem 1.5rem', display: 'flex', gap: '10px', borderTop: '1px solid #f1f5f9' }}>
                            <button onClick={() => setModalOpen(false)} disabled={saving}
                                style={{ flex: 1, padding: '11px', background: '#f8fafc', color: '#475569', border: '1px solid #eef1f6', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                style={{ flex: 1, padding: '11px', background: saving ? '#94a3b8' : '#4f6ef7', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete confirm ── */}
            {deleteTarget && (
                <div className="plans-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ background: '#fff', maxWidth: '400px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(15,23,42,0.35)', textAlign: 'center' }}>
                        <div style={{ padding: '2.25rem 2rem 1.5rem' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>Delete this plan?</h3>
                            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6 }}>
                                <strong style={{ color: '#0f172a' }}>{deleteTarget.name}</strong> will be removed permanently. Schools already on this plan block deletion — deactivate it instead if it's in use.
                            </p>
                        </div>
                        <div style={{ padding: '1.25rem 1.75rem 1.75rem', display: 'flex', gap: '10px' }}>
                            <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                                style={{ flex: 1, padding: '11px', background: '#f8fafc', color: '#475569', border: '1px solid #eef1f6', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteConfirmed} disabled={deleting}
                                style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', fontSize: '13.5px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                                {deleting ? 'Deleting...' : 'Delete Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plans;
