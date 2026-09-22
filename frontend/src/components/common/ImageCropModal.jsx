import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { SHIELD_PATH_D } from '../../constants/shieldShape';

// aspect = width/height ratio for the crop box, e.g. 16/9 for banners, 1 for square.
// Pass aspect={null} to allow free-form cropping (no fixed ratio).
// accent/accentLight = confirm-button gradient colors, so callers can match their own theme
// (e.g. Super Admin's indigo/violet vs. School Admin's default pink).
// outputFormat = 'image/jpeg' (default, smaller files) or 'image/png' — use png for logos/anything
// with transparency, since exporting a transparent PNG as JPEG flattens the alpha to black.
// maskShape = 'shield' overlays a dimmed shield-outline preview on top of the (still
// rectangular) crop selection, so the admin can see exactly what the final shield-framed
// photo will show before uploading — used for the Home Page highlight photos.
const ImageCropModal = ({ imageSrc, aspect = 16 / 9, onCancel, onCropComplete, accent = '#8b2252', accentLight = '#c9687e', confirmTextColor = '#fff', outputFormat = 'image/jpeg', maskShape }) => {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const imgRef = useRef(null);

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        if (aspect) {
            const newCrop = centerCrop(
                makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
                width,
                height
            );
            setCrop(newCrop);
        } else {
            setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
        }
    };

    const getCroppedFile = async () => {
        const image = imgRef.current;
        if (!image || !completedCrop) return null;

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const ext = outputFormat === 'image/png' ? 'png' : 'jpg';
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) { resolve(null); return; }
                const file = new File([blob], `cropped-image.${ext}`, { type: outputFormat });
                resolve(file);
            }, outputFormat, 0.92);
        });
    };

    const handleConfirm = async () => {
        const file = await getCroppedFile();
        if (file) onCropComplete(file);
    };

    // Rendered via a portal straight to document.body — if this were left in normal
    // DOM flow, an ancestor with a persisted CSS `transform` (e.g. a card's entrance
    // animation using `animation: ... both`, whose final keyframe leaves `transform`
    // non-`none`) would create a new containing block for this `position: fixed`
    // overlay, making it center on that ancestor's box instead of the viewport —
    // which is exactly why the modal used to open off-screen, requiring a scroll up.
    return createPortal((
        <div style={{
            position: 'fixed', inset: 0, zIndex: 5000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
        }}>
            <div style={{
                background: '#ffffff', borderRadius: '20px', overflow: 'hidden',
                maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
            }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Crop Image</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>Drag to select the area you want to use</p>
                    </div>
                    <button onClick={onCancel}
                        style={{ width: '32px', height: '32px', background: '#f8fafc', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                {/* Crop area */}
                <div style={{ padding: '1.5rem', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', flex: 1 }}>
                    {maskShape === 'shield' && (
                        <style>{`.ReactCrop__selection-addon { position: absolute; inset: 0; }`}</style>
                    )}
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                        renderSelectionAddon={maskShape === 'shield' ? () => (
                            <svg viewBox="0 0 1 1" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                                <path fillRule="evenodd" d={`M0,0 H1 V1 H0 Z ${SHIELD_PATH_D}`} fill="rgba(0,0,0,0.55)" />
                                <path d={SHIELD_PATH_D} fill="none" stroke="#ffffff" strokeWidth="0.012" />
                            </svg>
                        ) : undefined}
                    >
                        <img ref={imgRef} src={imageSrc} crossOrigin="anonymous" onLoad={onImageLoad} alt="Crop preview" style={{ maxHeight: '60vh', display: 'block' }} />
                    </ReactCrop>
                </div>
                {maskShape === 'shield' && (
                    <p style={{ padding: '0 1.75rem 1rem', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                        The dimmed area outside the shield outline won't be visible in the final frame — keep the important part of the photo inside it.
                    </p>
                )}

                {/* Footer */}
                <div style={{ padding: '1.25rem 1.75rem', borderTop: '0.5px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onCancel}
                        style={{ padding: '10px 20px', background: '#f8fafc', color: '#64748b', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button onClick={handleConfirm}
                        style={{ padding: '10px 24px', background: `linear-gradient(135deg,${accent},${accentLight})`, color: confirmTextColor, border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 14px ${accent}4d`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        Use This Crop
                    </button>
                </div>
            </div>
        </div>
    ), document.body);
};

export default ImageCropModal;