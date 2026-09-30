// ============================================================================
// TCInformation.jsx — Admin panel (Transfer Certificates)
// Location: frontend/src/pages/admin/modules/TCInformation.jsx
// Module key: 'tc'
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import {
    getModuleContentApi,
    saveModuleContentApi,
    togglePublishApi,
    uploadPdfApi,
} from '../../../api/content.api';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import useSchoolStore from '../../../store/schoolStore';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const MODULE_KEY = 'tc';

const uid = (prefix) =>
    `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// ---------------------------------------------------------------------------
// Small shared styles
// ---------------------------------------------------------------------------
const card = {
    background: '#fff',
    border: '0.5px solid #f1f5f9',
    borderRadius: 16,
    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
    padding: 24,
    marginBottom: 24,
};
const label = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 };
const input = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e9f0',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    background: '#f8fafc',
    boxSizing: 'border-box',
    transition: 'border 0.2s, box-shadow 0.2s, background 0.2s',
};
const btnPrimary = {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
};
const btnGhost = {
    background: '#fff',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
};
const th = {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
};
const td = {
    padding: '10px 12px',
    fontSize: 13.5,
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
};

const EMPTY_ADD_FORM = { tcNo: '', studentName: '', pdfUrl: '' };

// ============================================================================
// Component
// ============================================================================
const TCInformation = () => {
    const { tc, bc } = useSchoolStore();
    const [heading, setHeading] = useState('Download Transfer Certificate');
    const [headingItalic, setHeadingItalic] = useState(false);
    const [headingColor, setHeadingColor] = useState('');
    const [headingFont, setHeadingFont] = useState('');
    const [description, setDescription] = useState('');
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [isPublished, setIsPublished] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }

    const [showNewSession, setShowNewSession] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');

    const [search, setSearch] = useState('');
    const [addOneOpen, setAddOneOpen] = useState(false);
    const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [savedSnapshot, setSavedSnapshot] = useState(null);

    const activeSession = useMemo(
        () => sessions.find((s) => s.id === activeSessionId) || null,
        [sessions, activeSessionId]
    );

    const flash = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 3500);
    };

    // ------------------------------------------------------------------
    // Load
    // ------------------------------------------------------------------
    useEffect(() => {
        (async () => {
            try {
                const res = await getModuleContentApi(MODULE_KEY);
                const data = res?.data?.data || res?.data;
                let snapshotObj = { heading: 'Download Transfer Certificate', headingItalic: false, headingColor: '', headingFont: '', description: '', sessions: [] };
                if (data?.content) {
                    const c = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
                    setHeading(c.heading || 'Download Transfer Certificate');
                    setHeadingItalic(!!c.headingItalic);
                    setHeadingColor(c.headingColor || '');
                    setHeadingFont(c.headingFont || '');
                    setDescription(c.description || '');
                    const sess = Array.isArray(c.sessions) ? c.sessions : [];
                    const normalizedSessions = sess.map((s) => ({ id: s.id, name: s.name, records: s.records || [] }));
                    setSessions(normalizedSessions);
                    if (sess.length) setActiveSessionId(sess[0].id);
                    snapshotObj = {
                        heading: c.heading || 'Download Transfer Certificate',
                        headingItalic: !!c.headingItalic,
                        headingColor: c.headingColor || '',
                        headingFont: c.headingFont || '',
                        description: c.description || '',
                        sessions: normalizedSessions,
                    };
                }
                if (data?.has_draft_changes && data?.published_content) {
                    setSavedSnapshot(JSON.stringify(data.published_content));
                } else {
                    setSavedSnapshot(JSON.stringify(snapshotObj));
                }
                setIsPublished(!!(data?.is_published));
            } catch (e) {
                console.error('TC load failed', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ------------------------------------------------------------------
    // Save / Publish
    // ------------------------------------------------------------------
    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            const payload = { heading, headingItalic, headingColor, headingFont, description, sessions };
            await saveModuleContentApi(MODULE_KEY, payload, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(payload));
            if (publish) {
                setIsPublished(true);
                flash('ok', 'Module published — live on public site.');
            } else {
                flash('ok', 'Draft saved successfully.');
            }
        } catch (e) {
            console.error(e);
            flash('err', 'Action failed. Please try again.');
        } finally {
            setSaving(false);
            setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            await togglePublishApi(MODULE_KEY, 0);
            setIsPublished(false);
            flash('ok', 'Module unpublished.');
        } catch (e) {
            console.error(e);
            flash('err', 'Failed to unpublish.');
        }
    };

    // ------------------------------------------------------------------
    // Sessions
    // ------------------------------------------------------------------
    const addSession = () => {
        const name = newSessionName.trim();
        if (!name) return;
        const s = { id: uid('sess'), name, records: [] };
        setSessions((prev) => [...prev, s]);
        setActiveSessionId(s.id);
        setNewSessionName('');
        setShowNewSession(false);
        setSearch('');
    };

    const deleteSession = (id) => {
        const s = sessions.find((x) => x.id === id);
        if (!window.confirm(`Delete session "${s?.name}" and its ${s?.records?.length || 0} records?`)) return;
        setSessions((prev) => {
            const next = prev.filter((x) => x.id !== id);
            if (activeSessionId === id) setActiveSessionId(next[0]?.id || null);
            return next;
        });
    };

    const updateActiveSession = (updater) => {
        setSessions((prev) => prev.map((s) => (s.id === activeSessionId ? updater(s) : s)));
    };

    // ------------------------------------------------------------------
    // Records — added one at a time: TC No, Student Name, and the student's
    // signed TC as a PDF uploaded from the admin's device.
    // ------------------------------------------------------------------
    const filteredRecords = useMemo(() => {
        const list = activeSession?.records || [];
        const q = search.trim().toLowerCase();
        if (!q) return list;
        return list.filter(
            (r) =>
                (r.tcNo || '').toLowerCase().includes(q) ||
                (r.studentName || '').toLowerCase().includes(q)
        );
    }, [activeSession, search]);

    const deleteRecord = (id) => {
        updateActiveSession((s) => ({ ...s, records: (s.records || []).filter((r) => r.id !== id) }));
    };

    const uploadAddFormPdf = async (file) => {
        setUploadingPdf(true);
        try {
            const res = await uploadPdfApi(file);
            setAddForm((p) => ({ ...p, pdfUrl: res.data.url }));
            toast.success('PDF uploaded!');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload PDF');
        } finally {
            setUploadingPdf(false);
        }
    };

    const submitAddOne = () => {
        if (!addForm.tcNo.trim() || !addForm.studentName.trim()) {
            flash('err', 'TC No and Student Name are required.');
            return;
        }
        if (!addForm.pdfUrl) {
            flash('err', 'Please upload the TC PDF for this student.');
            return;
        }
        updateActiveSession((s) => ({
            ...s,
            records: [...(s.records || []), { id: uid('tc'), ...addForm }],
        }));
        setAddForm(EMPTY_ADD_FORM);
        setAddOneOpen(false);
        flash('ok', 'Record added. Don\'t forget to Save.');
    };

    const content = useMemo(
        () => ({ heading, headingItalic, headingColor, headingFont, description, sessions }),
        [heading, headingItalic, headingColor, headingFont, description, sessions]
    );
    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    if (loading) {
        return (
            <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading TC module…</div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .tc-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .tc-hero-orb { animation: drift1 9s ease-in-out infinite; }
                .tc-page input:focus, .tc-page textarea:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                @media (max-width: 640px) {
                    .tc-hero { padding: 18px 16px !important; margin: 12px 0 !important; border-radius: 16px !important; }
                    .tc-hero-inner { gap: 10px !important; }
                    .tc-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .tc-hero-title { font-size: 18px !important; }
                    .tc-hero-desc { font-size: 11px !important; margin-top: 4px !important; }
                    .tc-status-badge { font-size: 9.5px !important; padding: 3px 9px !important; }
                    .tc-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                }
            `}</style>
            <div className="tc-page" style={{ background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 60px' }}>
            {/* Hero Header */}
            <div className="tc-hero" style={{
                background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.secondary || tc.dark} 100%)`,
                borderRadius: '24px',
                padding: '2.25rem 2.75rem',
                margin: '24px 0 1.75rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 16px 40px ${hexToRgba(tc.primary, 0.28)}`
            }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', width: '380px', height: '380px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.secondary || tc.primary, 0.28)} 0%, transparent 70%)`, top: '-140px', right: '-80px', pointerEvents: 'none', filter: 'blur(30px)' }}></div>
                <div style={{ position: 'absolute', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', bottom: '-80px', left: '15%', pointerEvents: 'none', filter: 'blur(20px)' }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.22)', marginBottom: '12px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></div>
                                <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / TC Portal</span>
                            </div>
                            <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Transfer Certificates (TC)</h1>
                            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                                Issue session-wise TC records with signed PDFs — parents and students can search and verify directly from your public portal.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: isPublished ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.12)', border: `1.5px solid ${isPublished ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.25)'}`, borderRadius: '999px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#4ade80' : '#facc15' }}></div>
                                    <span style={{ fontSize: '11px', color: isPublished ? '#bbf7d0' : '#ffffff', fontWeight: 700, letterSpacing: '0.03em' }}>
                                        {isPublished ? 'Live on Website' : 'Draft (Unpublished)'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Standardized Whiter Frosted Glass Panel */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.13) 100%)',
                            border: '1.5px solid rgba(255,255,255,0.42)',
                            borderRadius: '16px',
                            padding: '0.75rem 1.1rem',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.18), inset 0 1px 1.5px rgba(255,255,255,0.5)',
                            width: '230px',
                            minWidth: '230px',
                            maxWidth: '230px',
                            flexShrink: 0,
                            boxSizing: 'border-box'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.18)' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.22)',
                                    border: '1px solid rgba(255,255,255,0.38)',
                                    color: '#ffffff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Issued TCs</p>
                                    <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${sessions?.reduce((acc, s) => acc + (s.records?.length || 0), 0) || 0} Records`}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '5px 0' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.22)',
                                    border: '1px solid rgba(255,255,255,0.38)',
                                    color: '#ffffff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Search Portal</p>
                                    <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Public Verification On</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Bottom Actions */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.16)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                                {isDirty ? '⚠️ You have unsaved changes in this module' : '✓ All changes are currently up to date'}
                            </span>
                        </div>
                        <ModuleActionButtons
                            tc={tc}
                            moduleKey={MODULE_KEY}
                            content={content}
                            saving={saving}
                            publishing={publishing}
                            isPublished={isPublished}
                            isDirty={isDirty}
                            onPublish={() => handleSave(true)}
                            onUnpublish={handleUnpublish}
                        />
                    </div>
                </div>
            </div>

            {msg && (
                <div
                    style={{
                        marginBottom: 20,
                        padding: '12px 16px',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2',
                        color: msg.type === 'ok' ? '#15803d' : '#b91c1c',
                        border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}`,
                    }}
                >
                    {msg.text}
                </div>
            )}

            {/* ============ Page content ============ */}
            <div style={card}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Page Content</h2>
                <div style={{ marginBottom: 18 }}>
                    <label style={label}>Heading</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input style={{ ...input, fontStyle: headingItalic ? 'italic' : 'normal' }} value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="Download Transfer Certificate" />
                        <ItalicToggle active={headingItalic} onToggle={() => setHeadingItalic(v => !v)} />
                    </div>
                    <HeadingStyleField color={headingColor} onColorChange={setHeadingColor} font={headingFont} onFontChange={setHeadingFont} />
                </div>
                <div>
                    <label style={label}>Description</label>
                    <RichTextEditor value={description} onChange={setDescription} />
                </div>
            </div>

            {/* ============ Session dropdown ============ */}
            <div style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: activeSession ? 22 : 0, flexWrap: 'wrap' }}>
                    {/* Dropdown */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Academic Session
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={activeSessionId || ''}
                                onChange={(e) => {
                                    setActiveSessionId(e.target.value);
                                    setSearch('');
                                    setAddOneOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    appearance: 'none',
                                    padding: '10px 40px 10px 14px',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    border: '1.5px solid #e2e8f0',
                                    borderRadius: 10,
                                    background: '#fff',
                                    color: '#0f172a',
                                    cursor: 'pointer',
                                    outline: 'none',
                                }}
                            >
                                {sessions.length === 0 && <option value="">No sessions yet</option>}
                                {sessions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.records?.length || 0} records)
                                    </option>
                                ))}
                            </select>
                            {/* Chevron icon */}
                            <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                    </div>

                    {/* Delete active session */}
                    {activeSession && (
                        <button
                            onClick={() => deleteSession(activeSessionId)}
                            style={{ ...btnGhost, color: '#dc2626', borderColor: '#fecaca', padding: '10px 14px', whiteSpace: 'nowrap' }}
                        >
                            🗑 Delete Session
                        </button>
                    )}

                    {/* New Session */}
                    {showNewSession ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                autoFocus
                                style={{ ...input, width: 140, padding: '10px 12px' }}
                                placeholder="Enter Session Name"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addSession()}
                            />
                            <button onClick={addSession} style={{ ...btnPrimary, padding: '10px 14px' }}>Add</button>
                            <button onClick={() => { setShowNewSession(false); setNewSessionName(''); }} style={{ ...btnGhost, padding: '10px 14px' }}>Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowNewSession(true)} style={{ ...btnGhost, borderStyle: 'dashed', padding: '10px 16px', whiteSpace: 'nowrap' }}>
                            + New Session
                        </button>
                    )}
                </div>

                {!activeSession && sessions.length === 0 && (
                    <p style={{ marginTop: 16, fontSize: 14, color: '#64748b' }}>
                        No sessions yet. Create a session (e.g. "2024-25") to start adding TC records.
                    </p>
                )}

                {activeSession && (
                    <>
                        {/* Session info bar */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 16px', marginBottom: 20, fontSize: 13.5 }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>Session: {activeSession.name}</span>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <span style={{ color: '#475569' }}>{activeSession.records?.length || 0} records</span>
                        </div>

                        {/* Records toolbar */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <input
                                style={{ ...input, maxWidth: 320 }}
                                placeholder="Search by TC No or Student Name…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button onClick={() => setAddOneOpen((o) => !o)} style={btnGhost}>
                                {addOneOpen ? 'Close form' : '+ Add One'}
                            </button>
                        </div>

                        {/* Add-one inline form */}
                        {addOneOpen && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, marginBottom: 18 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                    <input
                                        style={input}
                                        placeholder="TC No *"
                                        value={addForm.tcNo}
                                        onChange={(e) => setAddForm((p) => ({ ...p, tcNo: e.target.value }))}
                                    />
                                    <input
                                        style={input}
                                        placeholder="Student Name *"
                                        value={addForm.studentName}
                                        onChange={(e) => setAddForm((p) => ({ ...p, studentName: e.target.value }))}
                                    />
                                </div>
                                <div style={{ marginTop: 14 }}>
                                    <label style={label}>TC PDF *</label>
                                    {addForm.pdfUrl ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
                                            <a href={addForm.pdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13.5, fontWeight: 600, color: tc.primary }}>
                                                📄 View uploaded PDF
                                            </a>
                                            <button onClick={() => setAddForm((p) => ({ ...p, pdfUrl: '' }))} style={{ ...btnGhost, padding: '4px 10px', fontSize: 12.5, color: '#dc2626', borderColor: '#fecaca' }}>
                                                Remove PDF
                                            </button>
                                        </div>
                                    ) : (
                                        <label style={{ ...btnGhost, display: 'inline-block' }}>
                                            {uploadingPdf ? 'Uploading…' : 'Choose PDF file'}
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                style={{ display: 'none' }}
                                                disabled={uploadingPdf}
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    e.target.value = '';
                                                    if (f) uploadAddFormPdf(f);
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                                <button onClick={submitAddOne} style={{ ...btnPrimary, marginTop: 14 }}>Add Record</button>
                            </div>
                        )}

                        {/* Records table */}
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        {['TC No', 'Student Name', 'PDF', ''].map((h, i) => (
                                            <th key={i} style={th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 26 }}>
                                                {search ? 'No records match your search.' : 'No records in this session yet — use "+ Add One".'}
                                            </td>
                                        </tr>
                                    )}
                                    {filteredRecords.map((r) => (
                                        <tr key={r.id}>
                                            <td style={{ ...td, fontWeight: 700 }}>{r.tcNo || '—'}</td>
                                            <td style={td}>{r.studentName || '—'}</td>
                                            <td style={td}>
                                                {r.pdfUrl ? (
                                                    <a href={r.pdfUrl} target="_blank" rel="noreferrer" style={{ color: tc.primary, fontWeight: 600 }}>View PDF</a>
                                                ) : '—'}
                                            </td>
                                            <td style={td}>
                                                <button
                                                    onClick={() => deleteRecord(r.id)}
                                                    style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            </div>
            </div>
        </>
    );
};

export default TCInformation;
