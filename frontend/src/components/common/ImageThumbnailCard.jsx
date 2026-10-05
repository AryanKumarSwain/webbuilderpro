import React from 'react';

export const CropIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
        <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
    </svg>
);

export const loadCropSrc = async (url) => {
    if (!url) return null;
    try {
        const res = await fetch(url, { mode: 'cors' });
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch (e) {
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}t=${Date.now()}`;
    }
};

/**
 * Standardized Image Thumbnail Card with Recrop, Delete, Index badge, and Reorder (Move Left / Right) controls.
 */
const ImageThumbnailCard = ({
    url,
    index,
    total = 1,
    onRecrop,
    onRemove,
    onMove,
    aspectRatio = '1',
    badge,
    children,
    style = {},
    showRecrop = true,
    showRemove = true,
    showReorder = true,
    imgStyle = {},
}) => {
    return (
        <div
            style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                aspectRatio,
                border: '1px solid #e2e8f0',
                background: '#0f172a',
                boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                ...style,
            }}
        >
            <img
                src={url}
                alt=""
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    ...imgStyle,
                }}
            />

            {/* Top Controls: Recrop & Delete */}
            <div
                style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    right: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 2,
                }}
            >
                {showRecrop && onRecrop ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRecrop(index, url);
                        }}
                        title="Recrop this image"
                        style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                            color: '#ffffff',
                            border: '1px solid rgba(255,255,255,0.25)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.95)';
                            e.currentTarget.style.transform = 'scale(1.03)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <CropIcon size={11} color="#ffffff" />
                        <span>Recrop</span>
                    </button>
                ) : <span />}

                {showRemove && onRemove ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(index);
                        }}
                        title="Delete image"
                        style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.85)',
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.transform = 'scale(1.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.85)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        ✕
                    </button>
                ) : null}
            </div>

            {/* Custom middle overlays (e.g. orientation pills, status badges) */}
            {children}

            {/* Bottom Bar: Badge + Reorder Left / Right */}
            {(index !== undefined || badge !== undefined || (showReorder && onMove && total > 1)) && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '4px 8px',
                        background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 70%, transparent 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        zIndex: 2,
                    }}
                >
                    <span
                        style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: 'rgba(255,255,255,0.22)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                        }}
                    >
                        {badge !== undefined ? badge : (index !== undefined ? `#${index + 1}` : '')}
                    </span>

                    {showReorder && onMove && total > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                                type="button"
                                disabled={index === 0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMove(index, -1);
                                }}
                                title="Move Left"
                                style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '4px',
                                    background: index === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                                    color: index === 0 ? 'rgba(255,255,255,0.35)' : '#ffffff',
                                    border: 'none',
                                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (index !== 0) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    if (index !== 0) e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                                }}
                            >
                                ◀
                            </button>
                            <button
                                type="button"
                                disabled={index === total - 1}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMove(index, 1);
                                }}
                                title="Move Right"
                                style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '4px',
                                    background: index === total - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                                    color: index === total - 1 ? 'rgba(255,255,255,0.35)' : '#ffffff',
                                    border: 'none',
                                    cursor: index === total - 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (index !== total - 1) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    if (index !== total - 1) e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                                }}
                            >
                                ▶
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageThumbnailCard;
