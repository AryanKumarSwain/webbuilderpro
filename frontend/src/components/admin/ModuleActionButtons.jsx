// Shared Save / Publish / Unpublish button group for module admin pages.
// Unifies the flow into responsive buttons:
// - When published: shows "View Page" button that redirects to the live public page
// - If dirty (has uncommitted edits): "Save & Publish" (while background autosave protects draft)
// - If not dirty and published: "Unpublish"
// - If not dirty and draft: "Publish"
// Background autosave silently commits working drafts to `draft_content` in DB without page refresh.

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { saveModuleContentApi } from '../../api/content.api';
import useSchoolStore from '../../store/schoolStore';

const hexToRgba = (hex, alpha) => {
    const h = (hex || '#1e3a8a').replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const SaveIcon = ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8M7 3v5h8" /></svg>
);

const RocketIcon = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
);

const EyeOffIcon = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.8 21.8 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.77 21.77 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22" /></svg>
);

const EyeIcon = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const ExternalLinkIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2.2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const Spinner = ({ size = 13, color = 'currentColor' }) => (
    <svg style={{ animation: 'mabSpin 1s linear infinite', width: `${size}px`, height: `${size}px` }} viewBox="0 0 24 24" fill="none">
        <circle style={{ opacity: 0.3 }} cx="12" cy="12" r="10" stroke={color} strokeWidth="3.5" />
        <path d="M22 12a10 10 0 00-10-10" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
);

const DEFAULT_TC = {
    primary: '#1e3a8a',
    secondary: '#3b82f6',
    dark: '#0f172a',
};

// Maps admin module keys to their respective public website subpaths
const MODULE_PAGE_PATHS = {
    home: '',
    about: '/about',
    faculty: '/faculty',
    infrastructure: '/infrastructure',
    alumni: '/alumni',
    testimonials: '/testimonials',
    disclosure: '/public-disclosure',
    'public-disclosure': '/public-disclosure',
    courses: '/courses',
    fee: '/fee',
    results: '/results',
    tc: '/tc',
    achievements: '/achievements',
    admissionProcedure: '/admission-procedure',
    'admission-procedure': '/admission-procedure',
    bookList: '/book-list',
    'book-list': '/book-list',
    parentsCorner: '/parents-corner',
    'parents-corner': '/parents-corner',
    sports: '/sports',
    gallery: '/gallery/photo',
    'gallery-video': '/gallery/video',
    announcements: '/announcements',
    events: '/events',
    calendar: '/calendar',
    circulars: '/circulars',
    faqs: '/faqs',
};

const ModuleActionButtons = ({
    tc,
    content,
    moduleKey,
    slug,
    subPath,
    viewUrl,
    saving = false,
    publishing = false,
    isPublished = false,
    isDirty = false,
    onPublish,
    onUnpublish,
    onSave,
}) => {
    const safeTc = {
        primary: tc?.primary || DEFAULT_TC.primary,
        secondary: tc?.secondary || DEFAULT_TC.secondary,
        dark: tc?.dark || DEFAULT_TC.dark,
    };

    const { school, fetchSchool } = useSchoolStore();

    useEffect(() => {
        if (!school) {
            fetchSchool?.();
        }
    }, [school, fetchSchool]);

    const resolvedKey = moduleKey || (typeof window !== 'undefined' ? window.location.pathname.match(/\/admin\/module\/([^/]+)/)?.[1] : '') || '';
    const resolvedSlug = slug || school?.slug || '';

    const pagePath = subPath !== undefined
        ? subPath
        : (MODULE_PAGE_PATHS[resolvedKey] !== undefined
            ? MODULE_PAGE_PATHS[resolvedKey]
            : (resolvedKey && resolvedKey !== 'home' ? `/${resolvedKey}` : ''));

    const liveUrl = viewUrl || (resolvedSlug
        ? (school?.custom_domain
            ? `https://${school.custom_domain}${pagePath}`
            : `/school/${resolvedSlug}${pagePath}`)
        : '');

    const [autoSaving, setAutoSaving] = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);
    const contentRef = useRef(content);
    contentRef.current = content;

    // Debounced autosave whenever content changes & isDirty is true
    useEffect(() => {
        if (!isDirty || !content || !resolvedKey || publishing) return;

        setDraftSaved(false);
        const timer = setTimeout(async () => {
            setAutoSaving(true);
            try {
                await saveModuleContentApi(resolvedKey, contentRef.current, 0);
                setDraftSaved(true);
            } catch (err) {
                console.error('[autosave] draft failed:', err?.message);
            } finally {
                setAutoSaving(false);
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [content, isDirty, resolvedKey, publishing]);

    const isBusy = publishing || saving || autoSaving;

    return (
        <div className="mab-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <style>{`
                @keyframes mabSpin { to { transform: rotate(360deg); } }
                .mab-btn { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; position: relative; overflow: hidden; letter-spacing: 0.01em; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, filter 0.25s ease, background 0.2s ease; border: none; }
                .mab-btn:disabled { cursor: not-allowed; opacity: 0.65; }
                .mab-btn:active:not(:disabled) { transform: translateY(0) scale(0.96) !important; }
                .mab-btn-icon { display: inline-flex; transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1); }
                .mab-btn-save:hover:not(:disabled) { transform: translateY(-1.5px); filter: brightness(0.96); box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 8px 18px rgba(0,0,0,0.2) !important; }
                .mab-btn-save.is-dirty:hover:not(:disabled) { filter: brightness(1.06); box-shadow: 0 2px 4px rgba(120,70,0,0.3), 0 10px 22px rgba(234,179,8,0.5) !important; }
                .mab-btn-unpublish:hover:not(:disabled) .mab-btn-icon { transform: scale(1.12); }
                .mab-btn-unpublish:hover:not(:disabled) { transform: translateY(-1.5px); filter: brightness(1.08); box-shadow: 0 2px 4px rgba(127,29,29,0.35), 0 10px 22px rgba(220,38,38,0.45) !important; }
                .mab-btn-publish::after { content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent); transform: skewX(-20deg); transition: left 0.65s ease; pointer-events: none; }
                .mab-btn-publish:hover:not(:disabled) { transform: translateY(-1.5px) scale(1.02); filter: brightness(1.08); box-shadow: 0 2px 6px rgba(21,128,61,0.35), 0 12px 26px rgba(34,197,94,0.55) !important; }
                .mab-btn-publish:hover:not(:disabled)::after { left: 130%; }
                
                /* View Live Page CTA */
                .mab-btn-view {
                    text-decoration: none;
                    font-weight: 700;
                    color: ${safeTc.primary};
                    background: #ffffff;
                    border: 1px solid rgba(255, 255, 255, 0.95);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12), 0 6px 18px rgba(0, 0, 0, 0.14);
                }
                .mab-btn-view:hover {
                    background: #f8fafc !important;
                    transform: translateY(-1.5px) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18), 0 10px 24px rgba(0, 0, 0, 0.22) !important;
                    color: ${safeTc.primary} !important;
                }
                .mab-btn-view:active {
                    transform: translateY(0) scale(0.97) !important;
                }
                .mab-btn-view:hover .mab-ext-icon {
                    transform: translate(1.5px, -1.5px);
                }
                .mab-btn-view:hover .mab-eye-icon {
                    transform: scale(1.12);
                }

                @keyframes mabPulseGlow { 0%, 100% { box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(21,128,61,0.25), 0 8px 24px rgba(34,197,94,0.5); } 50% { box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 6px rgba(21,128,61,0.35), 0 12px 32px rgba(34,197,94,0.75); } }
                .mab-btn-dirty { animation: mabPulseGlow 2.5s ease-in-out infinite; }
                @media (max-width: 640px) {
                    .mab-actions { gap: 6px !important; }
                    .mab-btn { padding: 6px 12px !important; font-size: 11px !important; border-radius: 8px !important; gap: 5px !important; }
                    .mab-btn-icon svg { width: 11px !important; height: 11px !important; }
                    .mab-btn-view { padding: 6px 12px !important; font-size: 11px !important; border-radius: 8px !important; gap: 5px !important; }
                    .mab-btn-view svg { width: 11px !important; height: 11px !important; }
                    .mab-autosave-tag { display: none !important; }
                }
            `}</style>

            {/* Autosave status indicator */}
            {autoSaving || saving ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: '20px', fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>
                    <Spinner size={12} color="#94a3b8" />
                    <span>Autosaving draft...</span>
                </div>
            ) : isDirty ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', fontSize: '11.5px', color: '#fde68a', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
                    <span>Draft autosaved</span>
                </div>
            ) : null}

            {/* View Live Page CTA — shown whenever page is published */}
            {isPublished && (
                <a
                    href={liveUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                        if (!liveUrl || liveUrl === '#') {
                            e.preventDefault();
                            toast.error('School page link not ready yet, please refresh.');
                        }
                    }}
                    className="mab-btn mab-btn-view"
                    style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontSize: '12.5px',
                    }}
                    title="View live page on website (opens in a new tab)"
                >
                    <span className="mab-btn-icon mab-eye-icon">
                        <EyeIcon size={14} color={safeTc.primary} />
                    </span>
                    <span>View Page</span>
                    <span className="mab-btn-icon mab-ext-icon" style={{ opacity: 0.7, marginLeft: '-1px' }}>
                        <ExternalLinkIcon size={11} color={safeTc.primary} />
                    </span>
                </a>
            )}

            {/* Action Buttons: Save & Publish, Unpublish, or Publish */}
            {isDirty ? (
                <button
                    type="button"
                    onClick={onPublish}
                    disabled={isBusy}
                    className="mab-btn mab-btn-publish mab-btn-dirty"
                    style={{
                        padding: '10px 24px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 55%, #15803d 100%)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(21,128,61,0.25), 0 8px 24px rgba(34,197,94,0.5)',
                    }}
                >
                    {publishing ? (
                        <><Spinner size={13} color="#fff" /> Publishing...</>
                    ) : (
                        <><span className="mab-btn-icon"><RocketIcon size={14} color="#fff" /></span>Save & Publish</>
                    )}
                </button>
            ) : isPublished ? (
                <button
                    type="button"
                    onClick={onUnpublish}
                    disabled={isBusy}
                    className="mab-btn mab-btn-unpublish"
                    style={{
                        padding: '10px 22px',
                        borderRadius: '12px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        background: 'linear-gradient(160deg,#f87171,#dc2626 65%,#b91c1c)',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 4px rgba(127,29,29,0.3), 0 6px 16px rgba(220,38,38,0.4)',
                    }}
                >
                    <span className="mab-btn-icon"><EyeOffIcon size={14} color="#ffffff" /></span>
                    Unpublish
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onPublish}
                    disabled={isBusy}
                    className="mab-btn mab-btn-publish"
                    style={{
                        padding: '10px 24px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 55%, #15803d 100%)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(21,128,61,0.25), 0 8px 20px rgba(34,197,94,0.45)',
                    }}
                >
                    {publishing ? (
                        <><Spinner size={13} color="#fff" /> Publishing...</>
                    ) : (
                        <><span className="mab-btn-icon"><RocketIcon size={14} color="#fff" /></span>Publish</>
                    )}
                </button>
            )}
        </div>
    );
};

export default ModuleActionButtons;
