import { useState } from 'react';
import toast from 'react-hot-toast';
import { uploadContentImageApi } from '../../api/content.api';
import useSchoolStore from '../../store/schoolStore';
import { normalizeImages, getImageUrl, getImageOrientation } from '../../utils/imageOrientation';
import { moveItem } from '../../utils/reorder';
import ImageSizeHint from './ImageSizeHint';
import ImageCropModal from '../common/ImageCropModal';
import { CropIcon, loadCropSrc } from '../common/ImageThumbnailCard';

const LandscapeIcon = () => (
    <svg width="13" height="10" viewBox="0 0 16 12" fill="none">
        <rect x="0.75" y="0.75" width="14.5" height="10.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const PortraitIcon = () => (
    <svg width="10" height="13" viewBox="0 0 12 16" fill="none">
        <rect x="0.75" y="0.75" width="10.5" height="14.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

// ── Gallery-style multi-image editor used anywhere a module lets an admin attach a small
// photo set — Announcements' `images` and Events' highlight `images`. Includes Recrop and Reorder. ──
const OrientedImagesEditor = ({ images, onChange, max = 5 }) => {
    const { tc } = useSchoolStore();
    const [uploading, setUploading] = useState(false);
    const [cropSrc, setCropSrc] = useState(null);
    const [imageQueue, setImageQueue] = useState([]);
    const [recropIndex, setRecropIndex] = useState(null);
    const items = normalizeImages(images);

    const handleFilesSelected = (e) => {
        const room = max - items.length;
        const files = Array.from(e.target.files || []).slice(0, room);
        e.target.value = '';
        if (files.length === 0) return;
        setRecropIndex(null);
        setImageQueue(files.slice(1));
        setCropSrc(URL.createObjectURL(files[0]));
    };

    const handleRecrop = async (idx, img) => {
        const url = getImageUrl(img);
        setRecropIndex(idx);
        const src = await loadCropSrc(url);
        setCropSrc(src);
    };

    const handleMove = (idx, direction) => {
        const updated = moveItem(items, idx, direction);
        onChange(updated);
    };

    const onCropConfirmed = async (croppedFile) => {
        setCropSrc(null);
        setUploading(true);
        try {
            const res = await uploadContentImageApi(croppedFile);
            if (recropIndex !== null) {
                const next = items.map((it, i) => i === recropIndex ? { ...it, url: res.data.url } : it);
                onChange(next);
                setRecropIndex(null);
                toast.success('Image updated!');
            } else {
                onChange([...items, { url: res.data.url, orientation: 'horizontal' }]);
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploading(false);
            if (recropIndex === null && imageQueue.length > 0) {
                const [next, ...rest] = imageQueue;
                setImageQueue(rest);
                setCropSrc(URL.createObjectURL(next));
            }
        }
    };

    const removeAt = (idx) => onChange(items.filter((_, i) => i !== idx));
    const setOrientation = (idx, orientation) => onChange(items.map((it, i) => i === idx ? { ...it, orientation } : it));

    return (
        <>
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {items.map((img, i) => {
                    const orientation = getImageOrientation(img);
                    const url = getImageUrl(img);
                    return (
                        <div key={i} className="oi-thumb" style={{
                            position: 'relative', width: '136px', height: '136px', borderRadius: '12px', overflow: 'hidden',
                            border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.08)', background: '#0f172a',
                        }}>
                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

                            {/* Top Controls: Recrop & Delete */}
                            <div style={{
                                position: 'absolute', top: '6px', left: '6px', right: '6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2,
                            }}>
                                <button
                                    type="button"
                                    onClick={() => handleRecrop(i, img)}
                                    title="Recrop this image"
                                    style={{
                                        padding: '3px 7px', borderRadius: '5px',
                                        background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                                        color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)',
                                        cursor: 'pointer', fontSize: '10.5px', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                                    }}
                                >
                                    <CropIcon size={11} color="#ffffff" />
                                    <span>Recrop</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => removeAt(i)}
                                    title="Delete image"
                                    style={{
                                        width: '22px', height: '22px', borderRadius: '50%',
                                        background: 'rgba(239, 68, 68, 0.85)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                                        color: '#ffffff', border: 'none',
                                        cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Floating orientation pill */}
                            <div className="oi-orient-pill" style={{
                                position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                                display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 3px',
                                background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                                borderRadius: '999px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', zIndex: 2,
                            }}>
                                <button type="button" onClick={() => setOrientation(i, 'horizontal')} title="Horizontal photo" className="oi-orient-btn"
                                    style={{
                                        width: '24px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '999px', border: 'none', cursor: 'pointer',
                                        background: orientation === 'horizontal' ? '#ffffff' : 'transparent',
                                        color: orientation === 'horizontal' ? tc.primary : 'rgba(255,255,255,0.85)',
                                    }}>
                                    <LandscapeIcon />
                                </button>
                                <button type="button" onClick={() => setOrientation(i, 'vertical')} title="Vertical photo" className="oi-orient-btn"
                                    style={{
                                        width: '24px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '999px', border: 'none', cursor: 'pointer',
                                        background: orientation === 'vertical' ? '#ffffff' : 'transparent',
                                        color: orientation === 'vertical' ? tc.primary : 'rgba(255,255,255,0.85)',
                                    }}>
                                    <PortraitIcon />
                                </button>
                            </div>

                            {/* Bottom Bar: Badge + Reorder Left / Right */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                padding: '4px 6px',
                                background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 70%, transparent 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                zIndex: 2,
                            }}>
                                <span style={{
                                    fontSize: '10px', fontWeight: 700, color: '#ffffff',
                                    background: 'rgba(255,255,255,0.22)', padding: '1px 5px', borderRadius: '4px',
                                }}>
                                    #{i + 1}
                                </span>

                                {items.length > 1 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <button
                                            type="button"
                                            disabled={i === 0}
                                            onClick={() => handleMove(i, -1)}
                                            title="Move Left"
                                            style={{
                                                width: '20px', height: '20px', borderRadius: '4px',
                                                background: i === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                                                color: i === 0 ? 'rgba(255,255,255,0.35)' : '#ffffff',
                                                border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '8.5px', fontWeight: 800,
                                            }}
                                        >
                                            ◀
                                        </button>
                                        <button
                                            type="button"
                                            disabled={i === items.length - 1}
                                            onClick={() => handleMove(i, 1)}
                                            title="Move Right"
                                            style={{
                                                width: '20px', height: '20px', borderRadius: '4px',
                                                background: i === items.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                                                color: i === items.length - 1 ? 'rgba(255,255,255,0.35)' : '#ffffff',
                                                border: 'none', cursor: i === items.length - 1 ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '8.5px', fontWeight: 800,
                                            }}
                                        >
                                            ▶
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {items.length < max && (
                    <label style={{ width: '136px', height: '136px', borderRadius: '12px', border: `1.5px dashed ${tc.primary}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', color: tc.primary, fontWeight: 700, textAlign: 'center', background: `${tc.primary}06`, transition: 'background 0.2s ease, border-color 0.2s ease' }}>
                        {uploading ? 'Uploading...' : '+ Add Photo'}
                        <input type="file" accept="image/*" multiple={max > 1} style={{ display: 'none' }}
                            onChange={handleFilesSelected} />
                    </label>
                )}
            </div>
            <ImageSizeHint>
                {items.length}/{max} photo{max > 1 ? 's' : ''}. You can recrop and reorder any photo at any time.
                Use the Horizontal/Vertical toggle on the photo to mark its orientation so it displays uncropped on the site.
                Best results: horizontal photos ≈ 1600×900px (16:9 landscape), vertical photos ≈ 1200×1600px (3:4 portrait).
            </ImageSizeHint>
            <style>{`
                .oi-thumb { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
                .oi-thumb:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(15,23,42,0.16); border-color: #cbd5e1; }
                .oi-orient-btn { transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease; }
                .oi-orient-btn:hover { transform: scale(1.08); }
                .oi-orient-pill { transition: box-shadow 0.2s ease; }
                .oi-thumb:hover .oi-orient-pill { box-shadow: 0 4px 14px rgba(0,0,0,0.35); }
            `}</style>
        </div>
        {cropSrc && (
            <ImageCropModal
                imageSrc={cropSrc}
                aspect={null}
                onCancel={() => { setCropSrc(null); setImageQueue([]); setRecropIndex(null); }}
                onCropComplete={onCropConfirmed}
            />
        )}
        </>
    );
};

export default OrientedImagesEditor;
