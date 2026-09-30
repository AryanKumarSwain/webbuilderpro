import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getStorageUsageApi, recalculateStorageApi } from '../../api/school.api';
import { getModuleByKey } from '../../config/moduleRegistry';
import useSchoolStore from '../../store/schoolStore';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const formatBytes = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
};

const BREAKDOWN_COLORS = ['#4169E1', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#65a30d'];

// Eases a number from 0 → target once `active` flips true (used for the readout).
const useCountUp = (target, active, ms = 650) => {
    const [val, setVal] = useState(0);
    const raf = useRef(0);
    useEffect(() => {
        if (!active) return;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min(1, (now - start) / ms);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(target * eased);
            if (t < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, active, ms]);
    return val;
};

const StorageUsageBar = () => {
    const { tc } = useSchoolStore();
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        getStorageUsageApi()
            .then((res) => setUsage(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Kick the bar-fill + count-up one frame after the data lands.
    useEffect(() => {
        if (!usage) return;
        const id = requestAnimationFrame(() => setAnimate(true));
        return () => cancelAnimationFrame(id);
    }, [usage]);

    const handleRecalculate = async (e) => {
        e.stopPropagation();
        if (recalculating) return;
        setRecalculating(true);
        try {
            const res = await recalculateStorageApi();
            setAnimate(false);
            setUsage(res.data);
            const removed = res.data?.removed || 0;
            toast.success(removed > 0
                ? `Storage recalculated — freed ${removed} unused file${removed > 1 ? 's' : ''}`
                : 'Storage recalculated — nothing to clear');
        } catch {
            toast.error('Could not recalculate storage');
        } finally {
            setRecalculating(false);
        }
    };

    const usedMb = useCountUp((usage?.usedBytes || 0) / (1024 * 1024), animate);

    if (loading || !usage || usage.limitBytes === 0) return null;

    const primary = tc?.primary || '#4169E1';
    const secondary = tc?.secondary || '#2541A8';
    const isNearLimit = usage.percent >= 85;
    const accent = isNearLimit ? '#dc2626' : primary;
    const shownPercent = animate ? usage.percent : 0;
    const hasBreakdown = usage.breakdown.length > 0;

    return (
        <div style={{
            background: 'linear-gradient(145deg, #ffffff 65%, rgba(14, 165, 233, 0.04) 100%)',
            border: `1.5px solid ${isNearLimit ? hexToRgba('#dc2626', 0.4) : 'rgba(226, 232, 240, 0.85)'}`,
            borderRadius: '16px',
            padding: '1.3rem 1.45rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isNearLimit
                ? `0 0 0 3px ${hexToRgba('#dc2626', 0.08)}, 0 4px 20px rgba(220,38,38,0.08)`
                : '0 2px 6px rgba(15,23,42,0.03), 0 10px 24px -8px rgba(15,23,42,0.04)',
            marginBottom: '1.5rem',
            animation: 'subCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
        }}>
            {/* Top gradient accent line */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: isNearLimit
                    ? 'linear-gradient(90deg, #dc2626, #f97316)'
                    : 'linear-gradient(90deg, #0ea5e9, #6366f1)',
            }} />

            <style>{`
                @keyframes subCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes subSpin { to { transform: rotate(360deg); } }
                @keyframes subShimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
                @keyframes subRowIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
                .sub-recalc { transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.12s ease; }
                .sub-recalc:not(:disabled):hover { transform: translateY(-1px); }
                .sub-recalc:not(:disabled):active { transform: scale(0.97); }
            `}</style>

            {/* Header row */}
            <div onClick={() => hasBreakdown && setExpanded(v => !v)} role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' && hasBreakdown) setExpanded(v => !v); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', cursor: hasBreakdown ? 'pointer' : 'default', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                        width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                        background: isNearLimit ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                        color: '#ffffff',
                        boxShadow: isNearLimit ? '0 4px 12px rgba(220,38,38,0.3)' : '0 4px 12px rgba(14,165,233,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
                        </svg>
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: isNearLimit ? '#dc2626' : '#0284c7' }}>Storage</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button type="button" onClick={handleRecalculate} disabled={recalculating} className="sub-recalc"
                        title="Reclaim space from files you've deleted"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700,
                            color: recalculating ? '#94a3b8' : accent,
                            background: recalculating ? '#f8fafc' : hexToRgba(accent, 0.07),
                            border: `1px solid ${recalculating ? '#e5e7eb' : hexToRgba(accent, 0.22)}`,
                            borderRadius: '8px', padding: '5px 10px', cursor: recalculating ? 'default' : 'pointer',
                        }}>
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"
                            style={{ animation: recalculating ? 'subSpin 0.8s linear infinite' : 'none' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 9A8 8 0 006 5.3L4 7m0 8a8 8 0 0014 3.7l2-1.7" />
                        </svg>
                        {recalculating ? 'Recalculating' : 'Recalculate'}
                    </button>
                    {hasBreakdown && (
                        <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="2.4" viewBox="0 0 24 24"
                            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Readout */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        {usedMb < 1 && usage.usedBytes > 0 ? formatBytes(usage.usedBytes) : `${usedMb.toFixed(usedMb >= 10 ? 0 : 1)} MB`}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>/ {formatBytes(usage.limitBytes)}</span>
                </div>
                <span style={{
                    fontSize: '12px', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                    color: accent, background: hexToRgba(accent, 0.1),
                    padding: '3px 9px', borderRadius: '999px',
                }}>{usage.percent}%</span>
            </div>

            {/* Track */}
            <div style={{
                position: 'relative', height: '13px', borderRadius: '999px',
                background: '#f1f5f9', boxShadow: 'inset 0 1px 3px rgba(15,23,42,0.08)',
                overflow: 'hidden', marginBottom: expanded && hasBreakdown ? '18px' : 0,
            }}>
                {/* Fill — stacked module segments when we have a breakdown, else a single gradient */}
                <div style={{
                    position: 'absolute', inset: 0, width: `${shownPercent}%`,
                    display: 'flex', borderRadius: '999px', overflow: 'hidden',
                    transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)',
                    background: hasBreakdown ? 'transparent' : `linear-gradient(90deg, ${isNearLimit ? '#f59e0b' : primary}, ${isNearLimit ? '#dc2626' : secondary})`,
                }}>
                    {hasBreakdown && usage.breakdown.map((row, i) => (
                        <div key={row.moduleKey} style={{
                            width: `${row.percent}%`,
                            background: isNearLimit
                                ? `linear-gradient(90deg, ${hexToRgba('#f59e0b', 0.9)}, ${hexToRgba('#dc2626', 0.9)})`
                                : BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length],
                            boxShadow: i > 0 ? 'inset 1px 0 0 rgba(255,255,255,0.55)' : 'none',
                        }} />
                    ))}
                    {/* moving sheen */}
                    <div style={{
                        position: 'absolute', top: 0, bottom: 0, width: '35%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                        animation: 'subShimmer 2.4s ease-in-out 0.9s infinite',
                    }} />
                </div>

                {/* 85% limit marker */}
                <div style={{
                    position: 'absolute', top: '-2px', bottom: '-2px', left: '85%', width: '2px',
                    background: hexToRgba('#dc2626', 0.55), borderRadius: '2px',
                }} title="85% — approaching your plan limit" />
            </div>

            {/* Per-module breakdown */}
            {expanded && hasBreakdown && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                    {usage.breakdown.map((row, i) => {
                        const mod = getModuleByKey(row.moduleKey);
                        const label = mod?.label || (row.moduleKey === 'other' ? 'General / School Assets' : row.moduleKey);
                        const color = isNearLimit ? '#dc2626' : BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length];
                        return (
                            <div key={row.moduleKey} style={{ animation: `subRowIn 0.35s ease ${i * 0.04}s both` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '5px' }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: color, flexShrink: 0 }} />
                                    <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                                    <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatBytes(row.bytes)} · {row.percent}%</span>
                                </div>
                                <div style={{ height: '5px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden', marginLeft: '16px' }}>
                                    <div style={{
                                        height: '100%', width: animate ? `${row.percent}%` : 0, borderRadius: '999px', background: color,
                                        transition: `width 0.8s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.05}s`,
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StorageUsageBar;
