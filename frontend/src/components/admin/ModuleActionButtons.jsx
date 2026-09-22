// Shared Save / Publish / Unpublish button group for module admin pages —
// matches the premium button treatment introduced on the Home Page admin
// (frontend/src/pages/admin/modules/HomePage.jsx). Renders only the button
// row; the status badge (Published/Draft) stays inline per-page since its
// markup was already consistent everywhere.

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const SaveIcon = ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8M7 3v5h8" /></svg>
);

const RocketIcon = ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
);

const EyeOffIcon = ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.8 21.8 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.77 21.77 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22" /></svg>
);

const Spinner = () => (
    <svg style={{ animation: 'mabSpin 1s linear infinite', width: '13px', height: '13px' }} viewBox="0 0 24 24" fill="none">
        <circle style={{ opacity: 0.3 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
);

const DEFAULT_TC = {
    primary: '#1e3a8a',
    secondary: '#3b82f6',
    dark: '#0f172a',
};

const ModuleActionButtons = ({ tc, saving, publishing, isPublished, isDirty, onSave, onSaveDraft, onPublish, onUnpublish }) => {
    const safeTc = {
        primary: tc?.primary || DEFAULT_TC.primary,
        secondary: tc?.secondary || DEFAULT_TC.secondary,
        dark: tc?.dark || DEFAULT_TC.dark,
    };
    const handleSaveClick = onSave || onSaveDraft;

    return (
        <div className="mab-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <style>{`
                @keyframes mabSpin { to { transform: rotate(360deg); } }
                .mab-btn { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; position: relative; overflow: hidden; letter-spacing: 0.01em; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, filter 0.25s ease; }
                .mab-btn:disabled { cursor: not-allowed; opacity: 0.65; }
                .mab-btn:active:not(:disabled) { transform: translateY(0) scale(0.96) !important; }
                .mab-btn-icon { display: inline-flex; transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1); }
                .mab-btn:hover:not(:disabled) .mab-btn-icon { transform: scale(1.15) rotate(-6deg); }
                .mab-btn-publish:hover:not(:disabled) .mab-btn-icon { transform: translate(2px,-2px) scale(1.12) rotate(0deg); }
                .mab-btn-unpublish:hover:not(:disabled) .mab-btn-icon { transform: scale(1.12) rotate(0deg); }
                .mab-btn-save:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(0.96); box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 10px 22px rgba(0,0,0,0.28) !important; }
                .mab-btn-save.is-dirty:hover:not(:disabled) { filter: brightness(1.06); box-shadow: 0 2px 4px rgba(120,70,0,0.3), 0 12px 28px rgba(234,179,8,0.5) !important; }
                @keyframes mabDirtyPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(66,32,6,0.5); } 50% { box-shadow: 0 0 0 4px rgba(66,32,6,0); } }
                .mab-btn-dot { animation: mabDirtyPulse 1.6s ease-out infinite; }
                .mab-btn-unpublish:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 2px 4px rgba(127,29,29,0.35), 0 12px 28px rgba(220,38,38,0.5) !important; }
                .mab-btn-publish::after { content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent); transform: skewX(-20deg); transition: left 0.65s ease; pointer-events: none; }
                .mab-btn-publish:hover:not(:disabled) { transform: translateY(-2px) scale(1.02); filter: brightness(1.08); box-shadow: 0 2px 4px ${hexToRgba(safeTc.dark, 0.3)}, 0 14px 32px ${hexToRgba(safeTc.primary, 0.6)} !important; }
                .mab-btn-publish:hover:not(:disabled)::after { left: 130%; }
            `}</style>

            <button onClick={handleSaveClick} disabled={saving}
                className={`mab-btn mab-btn-save${isDirty ? ' is-dirty' : ''}`}
                style={{
                    padding: '10px 20px', borderRadius: '12px', fontSize: '12.5px', fontWeight: isDirty ? 700 : 600,
                    background: isDirty ? 'linear-gradient(160deg,#fcd34d,#eab308 60%,#ca8a04)' : 'linear-gradient(160deg,#ffffff,#e8edf4)',
                    color: isDirty ? '#422006' : '#1e293b',
                    border: 'none',
                    boxShadow: isDirty
                        ? 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px rgba(120,70,0,0.25), 0 6px 16px rgba(234,179,8,0.4)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.08), 0 6px 14px rgba(0,0,0,0.16)',
                }}>
                {saving ? <Spinner /> : <span className="mab-btn-icon"><SaveIcon size={13} color={isDirty ? '#422006' : '#1e293b'} /></span>}
                {saving ? 'Saving...' : 'Save'}
                {isDirty && !saving && <span className="mab-btn-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#422006' }} />}
            </button>

            {isPublished ? (
                <button onClick={onUnpublish} className="mab-btn mab-btn-unpublish"
                    style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 700, background: 'linear-gradient(160deg,#f87171,#dc2626 65%,#b91c1c)', color: '#ffffff', border: 'none', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 4px rgba(127,29,29,0.3), 0 6px 16px rgba(220,38,38,0.4)' }}>
                    <span className="mab-btn-icon"><EyeOffIcon size={13} color="#ffffff" /></span>
                    Unpublish
                </button>
            ) : (
                <button onClick={onPublish} disabled={publishing} className="mab-btn mab-btn-publish"
                    style={{ padding: '10px 24px', borderRadius: '12px', background: `linear-gradient(160deg,${safeTc.secondary},${safeTc.primary} 65%,${safeTc.dark})`, color: '#fff', border: 'none', fontSize: '12.5px', fontWeight: 700, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px ${hexToRgba(safeTc.dark, 0.3)}, 0 8px 20px ${hexToRgba(safeTc.primary, 0.5)}` }}>
                    {publishing ? <><Spinner />Publishing...</> : <><span className="mab-btn-icon"><RocketIcon size={13} color="#fff" /></span>Publish</>}
                </button>
            )}
        </div>
    );
};

export default ModuleActionButtons;
