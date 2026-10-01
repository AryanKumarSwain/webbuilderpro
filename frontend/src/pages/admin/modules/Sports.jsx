import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi, uploadPdfApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import ScrollTabs from '../../../components/admin/ScrollTabs';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ImageCropModal from '../../../components/common/ImageCropModal';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import ReorderButtons from '../../../components/common/ReorderButtons';
import ImageSizeHint from '../../../components/admin/ImageSizeHint';
import useSchoolStore from '../../../store/schoolStore';
import { moveItem } from '../../../utils/reorder';
import toast from 'react-hot-toast';
import { COLLAGE_LAYOUTS, SHAPE_LABELS, DEFAULT_COLLAGE_LAYOUT } from '../../../utils/sportsCollage';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const PAGES = [
    { key: 'sportsAt', label: 'Sports at School' },
    { key: 'sportsOffered', label: 'Sports Offered' },
    { key: 'sportingEvents', label: 'Sporting Events' },
    { key: 'clubsActivities', label: 'Clubs & Activities' },
    { key: 'awards', label: 'Sports Awards & Achievements' },
];

const defaultPageData = { heading: '', description: '', images: [] };

const MAX_SPORT_EVENT_IMAGES = 5;

// Each collage layout (4/5/7 photos) keeps its own independent slot of photos —
// switching layouts must never show one layout's photos inside another's slots.
const emptyCollageImages = () => ({ 4: [], 5: [], 7: [] });

// Old saves stored a single flat `images` array shared across whichever layout
// was active at the time — migrate that into the new per-layout shape the first
// time this content is loaded, instead of dropping it.
const migrateSportsAt = (data) => {
    const layout = data.collageLayout || DEFAULT_COLLAGE_LAYOUT;
    if (data.collageImages) {
        return { heading: '', description: '', ...data, collageLayout: layout, collageImages: { ...emptyCollageImages(), ...data.collageImages } };
    }
    const collageImages = emptyCollageImages();
    if (Array.isArray(data.images)) collageImages[layout] = data.images;
    return { heading: '', description: '', ...data, collageLayout: layout, collageImages };
};

const defaultContent = {
    sportsAt: { heading: '', description: '', collageLayout: DEFAULT_COLLAGE_LAYOUT, collageImages: emptyCollageImages() },
    sportsOffered: { heading: '', description: '', offeredSports: [] },
    sportingEvents: { heading: '', description: '', events: [] },
    clubsActivities: { heading: '', description: '', clubs: [] },
    awards: { heading: '', description: '', images: [], certifications: [], proud: [], yearlyAwards: [] },
};

const Sports = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [activePage, setActivePage] = useState('sportsAt');
    const [uploading, setUploading] = useState({});
    const [cropTarget, setCropTarget] = useState(null); // { mode: 'grid'|'sport'|'event'|'cert', field?, id?, src }
    const [imageQueue, setImageQueue] = useState([]); // remaining files still waiting to be cropped, for whichever target is active

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('sports');
            if (res.data) {
                const merged = { ...defaultContent };
                Object.keys(res.data.content || {}).forEach(k => {
                    if (k === 'sportingEvents') merged[k] = { ...defaultContent.sportingEvents, ...res.data.content[k] };
                    else if (k === 'sportsOffered') merged[k] = { ...defaultContent.sportsOffered, ...res.data.content[k] };
                    else if (k === 'awards') merged[k] = { ...defaultContent.awards, ...res.data.content[k] };
                    else if (k === 'clubsActivities') merged[k] = { ...defaultContent.clubsActivities, ...res.data.content[k] };
                    else if (k === 'sportsAt') merged[k] = migrateSportsAt(res.data.content[k]);
                    else merged[k] = { ...defaultPageData, ...res.data.content[k] };
                });
                setContent(merged);
                setSavedSnapshot(res.data.has_draft_changes ? JSON.stringify(res.data.published_content || defaultContent) : JSON.stringify(merged));
                setIsPublished(res.data.is_published === 1);
            }
        } catch (e) {
            console.log('No content yet');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('sports', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Sports page published! 🎉');
            }
            else toast.success('Saved!');
        } catch (e) {
            toast.error('Failed to save');
        } finally {
            setSaving(false); setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            await togglePublishApi('sports', 0);
            setIsPublished(false);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => {
        setContent(prev => ({ ...prev, [activePage]: { ...prev[activePage], [field]: value } }));
    };

    // Each file is cropped one at a time (freeform, adjustable from every side) before
    // upload. Once confirmed, the next queued file automatically opens in the crop modal.
    // Sport/Event image carousels are capped at MAX_SPORT_EVENT_IMAGES each.
    const startCropQueue = (files, target) => {
        if (files.length === 0) return;
        if (target.mode === 'sport' || target.mode === 'event' || target.mode === 'club') {
            const listKey = target.mode === 'sport' ? 'offeredSports' : target.mode === 'event' ? 'events' : 'clubs';
            const list = content[activePage][listKey] || [];
            const item = list.find(x => x.id === target.id);
            const current = item?.images || [];
            const room = MAX_SPORT_EVENT_IMAGES - current.length;
            if (room <= 0) {
                toast.error(`Maximum ${MAX_SPORT_EVENT_IMAGES} images allowed`);
                return;
            }
            const toQueue = files.slice(0, room);
            if (files.length > toQueue.length) {
                toast.error(`Only ${room} more image(s) can be added (max ${MAX_SPORT_EVENT_IMAGES})`);
            }
            setImageQueue(toQueue.slice(1));
            setCropTarget({ ...target, src: URL.createObjectURL(toQueue[0]) });
            return;
        }
        if (target.mode === 'grid' && target.max != null) {
            const current = content[activePage][target.field] || [];
            const room = target.max - current.length;
            if (room <= 0) {
                toast.error(`Maximum ${target.max} images allowed`);
                return;
            }
            const toQueue = files.slice(0, room);
            if (files.length > toQueue.length) {
                toast.error(`Only ${room} more image(s) can be added (max ${target.max})`);
            }
            setImageQueue(toQueue.slice(1));
            setCropTarget({ ...target, src: URL.createObjectURL(toQueue[0]) });
            return;
        }
        setImageQueue(files.slice(1));
        setCropTarget({ ...target, src: URL.createObjectURL(files[0]) });
    };

    const onCropConfirmed = async (croppedFile) => {
        const target = cropTarget;
        setCropTarget(null);
        const key = target.mode === 'grid' ? target.field
            : target.mode === 'collageSlot' ? `collage-${target.idx}`
            : target.mode === 'collageExtra' ? 'collage-extra'
            : target.mode === 'sport' ? `sport-${target.id}`
            : target.mode === 'event' ? `event-${target.id}`
            : target.mode === 'club' ? `club-${target.id}`
            : target.mode === 'proud' ? `proud-${target.id}`
            : `cert-${target.id}`;
        setUploading(prev => ({ ...prev, [key]: true }));
        try {
            const res = await uploadContentImageApi(croppedFile);
            if (target.mode === 'grid') {
                const current = content[activePage][target.field] || [];
                updateField(target.field, [...current, res.data.url]);
            } else if (target.mode === 'collageSlot') {
                const layout = content.sportsAt.collageLayout || DEFAULT_COLLAGE_LAYOUT;
                const collageImages = content.sportsAt.collageImages || emptyCollageImages();
                const current = [...(collageImages[layout] || [])];
                while (current.length <= target.idx) current.push('');
                current[target.idx] = res.data.url;
                updateField('collageImages', { ...collageImages, [layout]: current });
            } else if (target.mode === 'collageExtra') {
                const layout = content.sportsAt.collageLayout || DEFAULT_COLLAGE_LAYOUT;
                const collageImages = content.sportsAt.collageImages || emptyCollageImages();
                const current = [...(collageImages[layout] || [])];
                updateField('collageImages', { ...collageImages, [layout]: [...current, res.data.url] });
            } else if (target.mode === 'sport') {
                const list = content[activePage].offeredSports || [];
                const i = list.findIndex(s => s.id === target.id);
                if (i !== -1) {
                    const updated = [...list];
                    updated[i] = { ...updated[i], images: [...(updated[i].images || []), res.data.url] };
                    updateField('offeredSports', updated);
                }
            } else if (target.mode === 'event') {
                const list = content[activePage].events || [];
                const i = list.findIndex(e => e.id === target.id);
                if (i !== -1) {
                    const updated = [...list];
                    updated[i] = { ...updated[i], images: [...(updated[i].images || []), res.data.url] };
                    updateField('events', updated);
                }
            } else if (target.mode === 'club') {
                const list = content[activePage].clubs || [];
                const i = list.findIndex(c => c.id === target.id);
                if (i !== -1) {
                    const updated = [...list];
                    updated[i] = { ...updated[i], images: [...(updated[i].images || []), res.data.url] };
                    updateField('clubs', updated);
                }
            } else if (target.mode === 'cert') {
                const list = content[activePage].certifications || [];
                const i = list.findIndex(c => c.id === target.id);
                if (i !== -1) {
                    const updated = [...list];
                    updated[i] = { ...updated[i], image: res.data.url };
                    updateField('certifications', updated);
                }
            } else if (target.mode === 'proud') {
                const list = content[activePage].proud || [];
                const i = list.findIndex(s => s.id === target.id);
                if (i !== -1) {
                    const updated = [...list];
                    updated[i] = { ...updated[i], photo: res.data.url };
                    updateField('proud', updated);
                }
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload');
        } finally {
            setUploading(prev => ({ ...prev, [key]: false }));
            if (target.mode !== 'cert' && imageQueue.length > 0) {
                const [next, ...rest] = imageQueue;
                setImageQueue(rest);
                setCropTarget({ ...target, src: URL.createObjectURL(next) });
            }
        }
    };

    const removeImage = (idx, field = 'images') => {
        const current = content[activePage][field] || [];
        updateField(field, current.filter((_, i) => i !== idx));
    };

    // Collage slots are addressed by fixed position (slot 3's photo must stay slot 3's
    // photo) so clearing one blanks it in place instead of shifting the others up.
    const clearCollageSlot = (idx) => {
        const layout = content.sportsAt.collageLayout || DEFAULT_COLLAGE_LAYOUT;
        const collageImages = content.sportsAt.collageImages || emptyCollageImages();
        const current = [...(collageImages[layout] || [])];
        if (idx < current.length) current[idx] = '';
        updateField('collageImages', { ...collageImages, [layout]: current });
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px', border: '1px solid #e5e9f0',
        borderRadius: '10px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s, background 0.2s',
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    const ImageGrid = ({ field = 'images', label = 'Images', max = null }) => {
        const count = (content[activePage][field] || []).length;
        const atLimit = max != null && count >= max;
        return (
            <div>
                <label style={labelStyle}>{label}{max != null ? ` — ${count} / ${max}` : ''}</label>
                <div className="sports-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '1.25rem' }}>
                    {(content[activePage][field] || []).map((img, i) => (
                        <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1' }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button onClick={() => removeImage(i, field)}
                                style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                    ))}
                </div>
                {atLimit ? (
                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '0.75rem' }}>
                        Maximum {max} images added — remove one to add another.
                    </p>
                ) : (
                    <div onClick={() => document.getElementById(`grid-${field}`).click()}
                        style={{ border: '1.5px dashed #e2e8f0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                        {uploading[field] ? <p style={{ fontSize: '13px', color: '#64748b' }}>Uploading...</p> : (
                            <>
                                <p style={{ fontSize: '13px', color: '#64748b' }}>+ Click to add images (multiple allowed)</p>
                                <p style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>You'll get a crop tool for each image (freely adjustable from every side) before it's added. JPG, PNG, WEBP · Max 1MB each{max != null ? ` · Up to ${max} images` : ''}.</p>
                            </>
                        )}
                    </div>
                )}
                <input id={`grid-${field}`} type="file" accept="image/*" multiple
                    onChange={e => { const files = Array.from(e.target.files); e.target.value = ''; if (files.length > 0) startCropQueue(files, { mode: 'grid', field, max }); }}
                    style={{ display: 'none' }} />
            </div>
        );
    };

    // ── Sports at School collage builder — lets the admin pick the 4/5/7-photo
    // layout and upload straight into a specific slot, so they always know whether
    // that slot renders vertical (tall) or horizontal (wide) before cropping. ──
    const CollageBuilder = () => {
        const layout = content.sportsAt.collageLayout || DEFAULT_COLLAGE_LAYOUT;
        const collageImages = content.sportsAt.collageImages || emptyCollageImages();
        const images = collageImages[layout] || [];
        const layoutDef = COLLAGE_LAYOUTS[layout];
        const slots = layoutDef.slots;
        const extraImages = images.slice(slots.length);

        const removeExtraImage = (extraIdx) => {
            const current = [...images];
            current.splice(slots.length + extraIdx, 1);
            updateField('collageImages', { ...collageImages, [layout]: current });
        };

        return (
            <div>
                <label style={labelStyle}>Collage Layout</label>
                <p style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '10px' }}>
                    Pick how many photos make up the collage, then click a slot to upload the photo for that exact spot. Every slot below is sized exactly like it renders on the live Sports page, so what you see here is what visitors will see — no surprise re-cropping. JPG, PNG, WEBP.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {Object.keys(COLLAGE_LAYOUTS).map(n => (
                        <button key={n} onClick={() => updateField('collageLayout', n)}
                            style={{ padding: '8px 18px', borderRadius: '8px', border: layout === n ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0', background: layout === n ? tc.light : '#ffffff', color: layout === n ? tc.primary : '#64748b', fontSize: '12.5px', fontWeight: layout === n ? 600 : 500, cursor: 'pointer' }}>
                            {n} Photos
                        </button>
                    ))}
                </div>

                {/* maxWidth matches the public Sports page's collage container (1140px) so each
                    slot's column width — and therefore its rendered aspect ratio — lines up with
                    how it will actually look live, not just its row-height in isolation. */}
                {layoutDef.scattered ? (
                    <div className="sports-scattered-collage" style={{ position: 'relative', width: '100%', maxWidth: '520px', aspectRatio: layoutDef.aspectRatio, marginBottom: '1.25rem' }}>
                        {slots.map((slot, i) => {
                            const url = images[i];
                            const uploadKey = `collage-${i}`;
                            return (
                                <div key={i}
                                    onClick={() => document.getElementById(`collage-slot-${i}`).click()}
                                    className="sports-scattered-frame"
                                    style={{ position: 'absolute', ...slot.box, transform: `rotate(${slot.rotate}deg)`, zIndex: slot.z, border: '10px solid #1a1a1a', borderRadius: '3px', overflow: 'hidden', boxShadow: '0 12px 28px rgba(0,0,0,0.28)', background: url ? '#000' : '#fafafa', cursor: 'pointer', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
                                    {uploading[uploadKey] ? (
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        </div>
                                    ) : url ? (
                                        <>
                                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            <div style={{ position: 'absolute', top: '6px', left: '6px', padding: '2px 8px', background: 'rgba(0,0,0,0.55)', borderRadius: '6px', fontSize: '10px', color: '#fff', fontWeight: 600 }}>{SHAPE_LABELS[slot.shape]}</div>
                                            <button onClick={e => { e.stopPropagation(); clearCollageSlot(i); }}
                                                style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                        </>
                                    ) : (
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px', textAlign: 'center' }}>
                                            <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>{SHAPE_LABELS[slot.shape]}</span>
                                            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>+ Upload</span>
                                        </div>
                                    )}
                                    <input id={`collage-slot-${i}`} type="file" accept="image/*" onClick={e => e.stopPropagation()}
                                        onChange={e => {
                                            const f = e.target.files[0];
                                            e.target.value = '';
                                            if (f) startCropQueue([f], { mode: 'collageSlot', idx: i, aspect: null });
                                        }}
                                        style={{ display: 'none' }} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="sports-collage-grid" style={{ maxWidth: '1140px', display: 'grid', gridTemplateColumns: `repeat(${layoutDef.cols},1fr)`, gridTemplateRows: `repeat(${layoutDef.rows},${layoutDef.rowHeight}px)`, gap: '14px', marginBottom: '1.25rem' }}>
                        {slots.map((slot, i) => {
                            const url = images[i];
                            const uploadKey = `collage-${i}`;
                            return (
                                <div key={i}
                                    onClick={() => document.getElementById(`collage-slot-${i}`).click()}
                                    style={{ gridColumn: slot.gridColumn, gridRow: slot.gridRow, position: 'relative', borderRadius: '3px', overflow: 'hidden', border: '10px solid #1a1a1a', boxShadow: url ? '0 8px 20px rgba(0,0,0,0.22)' : 'none', background: url ? '#000' : '#fafafa', cursor: 'pointer' }}>
                                    {uploading[uploadKey] ? (
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        </div>
                                    ) : url ? (
                                        <>
                                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            <div style={{ position: 'absolute', top: '6px', left: '6px', padding: '2px 8px', background: 'rgba(0,0,0,0.55)', borderRadius: '6px', fontSize: '10px', color: '#fff', fontWeight: 600 }}>{SHAPE_LABELS[slot.shape]}</div>
                                            <button onClick={e => { e.stopPropagation(); clearCollageSlot(i); }}
                                                style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                        </>
                                    ) : (
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px', textAlign: 'center' }}>
                                            <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>{SHAPE_LABELS[slot.shape]}</span>
                                            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>+ Upload</span>
                                        </div>
                                    )}
                                    <input id={`collage-slot-${i}`} type="file" accept="image/*" onClick={e => e.stopPropagation()}
                                        onChange={e => {
                                            const f = e.target.files[0];
                                            e.target.value = '';
                                            if (f) startCropQueue([f], { mode: 'collageSlot', idx: i, aspect: null });
                                        }}
                                        style={{ display: 'none' }} />
                                </div>
                            );
                        })}
                    </div>
                )}

                <ImageSizeHint>
                    You'll get a crop tool for each photo (freely adjustable from every side) before it's added.
                    {layout === '4' && ' Frames are portrait/landscape shaped (not square) — see the preview above for each slot\'s exact shape.'}
                    {layout === '5' && ' Tall slots ≈ 2:3 portrait, the wide slot ≈ 8:3 landscape, landscape slots ≈ 4:3.'}
                    {layout === '7' && ' The extra-tall slot ≈ 9:20 portrait, tall slots ≈ 2:3 portrait, the wide slot ≈ 8:3 landscape, landscape slots ≈ 4:3.'}
                    {' '}Upload photos with enough resolution to fill their slot without stretching (roughly 1000px+ on the longer side).
                </ImageSizeHint>

                {/* Extra/overflow photos only apply to the full 7-photo layout — the 4 and 5
                    layouts are meant to stay a clean, fixed-size collage with nothing extra. */}
                {layout === '7' && (
                    <>
                        <label style={labelStyle}>Extra Photos (optional)</label>
                        <p style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '10px' }}>Shown in a plain row below the collage — freely cropped, no fixed shape. JPG, PNG, WEBP · Max 1MB each.</p>
                        <div className="sports-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '1.25rem' }}>
                            {extraImages.map((img, i) => (
                                <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1' }}>
                                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button onClick={() => removeExtraImage(i)}
                                        style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                </div>
                            ))}
                        </div>
                        <div onClick={() => document.getElementById('collage-extra-input').click()}
                            style={{ border: '1.5px dashed #e2e8f0', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                            {uploading['collage-extra'] ? <p style={{ fontSize: '13px', color: '#64748b' }}>Uploading...</p> : <p style={{ fontSize: '13px', color: '#64748b' }}>+ Click to add extra images (multiple allowed)</p>}
                        </div>
                        <input id="collage-extra-input" type="file" accept="image/*" multiple
                            onChange={e => { const files = Array.from(e.target.files); e.target.value = ''; if (files.length > 0) startCropQueue(files, { mode: 'collageExtra' }); }}
                            style={{ display: 'none' }} />
                    </>
                )}
            </div>
        );
    };

    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const pageData = content[activePage];

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .sports-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 560px) {
                    .sports-award-row { grid-template-columns: 1fr !important; }
                }
                .sports-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .sports-add-btn { transition: all 0.2s ease; }
                .sports-add-btn:hover { border-color: ${tc.primary} !important; background: ${tc.light} !important; transform: translateY(-1px); }
                .sports-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .sports-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @media (max-width: 640px) {
                    /* ── Hero header — compact, same treatment as the other module pages ── */
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .sports-hero-inner { gap: 12px !important; }
                    .sports-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .sports-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .sports-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .sports-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .sports-status-badge { padding: 4px 9px !important; }
                    .sports-status-badge span { font-size: 9.5px !important; }
                    .sports-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }

                    /* ── Page tabs — horizontal swipeable strip ── */
                    .sports-tabs { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; scrollbar-width: none !important; padding-bottom: 2px !important; }
                    .sports-tabs::-webkit-scrollbar { display: none !important; }
                    .sports-tabs button { flex-shrink: 0 !important; padding: 8px 14px !important; font-size: 12px !important; white-space: nowrap !important; }

                    /* ── Every 3-or-4-per-row image/card grid (Photo Carousel, Extra Photos,
                       event/sport image sets, Certifications, Making Us Proud) — 2-per-row ── */
                    .sports-grid-2col { grid-template-columns: repeat(2, 1fr) !important; }

                    /* ── Collage slot builder — the fancy asymmetric magazine layout (tall/wide/
                       landscape slots with fixed row heights) only makes sense at desktop widths;
                       on mobile it collapses to a plain uniform 2-per-row square grid, still
                       labeled with the intended shape so the admin knows how to crop each photo ── */
                    .sports-collage-grid { grid-template-columns: repeat(2, 1fr) !important; grid-template-rows: none !important; gap: 8px !important; }
                    .sports-collage-grid > div { grid-column: auto !important; grid-row: auto !important; aspect-ratio: 1 !important; }

                    /* ── 4-photo scattered/overlapping collage — the rotated, overlapping black
                       frames only work at desktop widths; on mobile it collapses to a plain,
                       non-overlapping 2×2 grid so nothing gets clipped or hard to tap. ── */
                    .sports-scattered-collage { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; aspect-ratio: auto !important; gap: 8px !important; max-width: 100% !important; }
                    .sports-scattered-frame { position: static !important; transform: none !important; aspect-ratio: 1 !important; border-width: 6px !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
        <div className="dash-hero" style={{
            background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.secondary || tc.dark} 100%)`,
            borderRadius: '24px',
            padding: '2.25rem 2.75rem',
            marginBottom: '1.75rem',
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
                            <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / Pages / Sports</span>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Sports & Athletics</h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                            Manage school sports coaching, athletics meets, championship trophies, and outdoor courts.
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
                    <div className="dash-hero-stats-panel" style={{
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Sports Disciplines</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.sportsList?.length || 0} Sports Offered`}</p>
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Athletics Wing</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'Championship Training'}</p>
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
                        moduleKey="sports"
                        subPath={activePage ? `/sports/${activePage}` : '/sports'}
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

                {/* Page Tabs */}
                <ScrollTabs colors={tc} style={{ marginBottom: '1.5rem' }}>
                    {PAGES.map(p => (
                        <button key={p.key} onClick={() => setActivePage(p.key)}
                            style={{ padding: '10px 18px', borderRadius: '10px', border: activePage === p.key ? `1.5px solid ${tc.primary}` : '0.5px solid #e2e8f0', fontSize: '13px', cursor: 'pointer', background: activePage === p.key ? tc.light : '#ffffff', color: activePage === p.key ? tc.primary : '#64748b', fontWeight: activePage === p.key ? 600 : 400 }}>
                            {p.label}
                        </button>
                    ))}
                </ScrollTabs>

                {/* ── Sports at School (simple page) ── */}
                {activePage === 'sportsAt' && (
                    <div className="sports-section" style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="sports-input" type="text" value={pageData.heading} onChange={e => updateField('heading', e.target.value)}
                                    placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: pageData.headingItalic ? 'italic' : 'normal' }} />
                                <ItalicToggle active={!!pageData.headingItalic} onToggle={() => updateField('headingItalic', !pageData.headingItalic)} />
                            </div>
                            <HeadingStyleField
                                color={pageData.headingColor} onColorChange={val => updateField('headingColor', val)}
                                font={pageData.headingFont} onFontChange={val => updateField('headingFont', val)}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <RichTextEditor value={pageData.description} onChange={val => updateField('description', val)}
                                placeholder="Describe this..." minHeight="150px"
                                maxWidth="1170px" fontSize="15px" fontFamily="'Inter', system-ui, sans-serif" />
                        </div>
                        <CollageBuilder />
                    </div>
                )}

                {/* ── Sports Offered — same list pattern as Sporting Events ── */}
                {activePage === 'sportsOffered' && (
                    <div className="sports-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <div>
                                <label style={labelStyle}>Heading</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input className="sports-input" type="text" value={pageData.heading} onChange={e => updateField('heading', e.target.value)}
                                        placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: pageData.headingItalic ? 'italic' : 'normal' }} />
                                    <ItalicToggle active={!!pageData.headingItalic} onToggle={() => updateField('headingItalic', !pageData.headingItalic)} />
                                </div>
                                <HeadingStyleField
                                    color={pageData.headingColor} onColorChange={val => updateField('headingColor', val)}
                                    font={pageData.headingFont} onFontChange={val => updateField('headingFont', val)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <RichTextEditor value={pageData.description} onChange={val => updateField('description', val)}
                                    placeholder="Overview of the sports offered at our school..." minHeight="120px"
                                    maxWidth="1170px" fontSize="15px" fontFamily="'Inter', system-ui, sans-serif" />
                            </div>
                        </div>

                        <button type="button" className="sports-add-btn" onClick={() => updateField('offeredSports', [{ id: `sport-${Date.now()}`, heading: '', description: '', images: [] }, ...(pageData.offeredSports || [])])}
                            style={{ padding: '13px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                            + Add Sport
                        </button>

                        {/* Offered sports list */}
                        {(pageData.offeredSports || []).map((sp, idx) => (
                            <SportItemCard key={sp.id} sport={sp} index={idx} length={(pageData.offeredSports || []).length}
                                onMove={(i, dir) => updateField('offeredSports', moveItem(pageData.offeredSports, i, dir))}
                                onUpdate={(field, val) => {
                                    const updated = [...pageData.offeredSports];
                                    updated[idx] = { ...updated[idx], [field]: val };
                                    updateField('offeredSports', updated);
                                }}
                                onRemove={() => updateField('offeredSports', pageData.offeredSports.filter((_, i) => i !== idx))}
                                onAddImages={(files) => startCropQueue(files, { mode: 'sport', id: sp.id })}
                                onRemoveImage={(imgIdx) => {
                                    const updated = [...pageData.offeredSports];
                                    updated[idx] = { ...updated[idx], images: updated[idx].images.filter((_, i) => i !== imgIdx) };
                                    updateField('offeredSports', updated);
                                }}
                                uploading={uploading[`sport-${sp.id}`]}
                            />
                        ))}
                    </div>
                )}

                {/* ── Clubs & Activities — same list pattern as Sports Offered ── */}
                {activePage === 'clubsActivities' && (
                    <div className="sports-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <div>
                                <label style={labelStyle}>Heading</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input className="sports-input" type="text" value={pageData.heading} onChange={e => updateField('heading', e.target.value)}
                                        placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: pageData.headingItalic ? 'italic' : 'normal' }} />
                                    <ItalicToggle active={!!pageData.headingItalic} onToggle={() => updateField('headingItalic', !pageData.headingItalic)} />
                                </div>
                                <HeadingStyleField
                                    color={pageData.headingColor} onColorChange={val => updateField('headingColor', val)}
                                    font={pageData.headingFont} onFontChange={val => updateField('headingFont', val)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <RichTextEditor value={pageData.description} onChange={val => updateField('description', val)}
                                    placeholder="Overview of clubs and activities offered at our school..." minHeight="120px"
                                    maxWidth="1170px" fontSize="15px" fontFamily="'Inter', system-ui, sans-serif" />
                            </div>
                        </div>

                        <button type="button" className="sports-add-btn" onClick={() => updateField('clubs', [{ id: `club-${Date.now()}`, heading: '', description: '', images: [] }, ...(pageData.clubs || [])])}
                            style={{ padding: '13px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                            + Add Club / Activity
                        </button>

                        {/* Clubs list */}
                        {(pageData.clubs || []).map((cl, idx) => (
                            <ClubCard key={cl.id} club={cl} index={idx} length={(pageData.clubs || []).length}
                                onMove={(i, dir) => updateField('clubs', moveItem(pageData.clubs, i, dir))}
                                onUpdate={(field, val) => {
                                    const updated = [...pageData.clubs];
                                    updated[idx] = { ...updated[idx], [field]: val };
                                    updateField('clubs', updated);
                                }}
                                onRemove={() => updateField('clubs', pageData.clubs.filter((_, i) => i !== idx))}
                                onAddImages={(files) => startCropQueue(files, { mode: 'club', id: cl.id })}
                                onRemoveImage={(imgIdx) => {
                                    const updated = [...pageData.clubs];
                                    updated[idx] = { ...updated[idx], images: updated[idx].images.filter((_, i) => i !== imgIdx) };
                                    updateField('clubs', updated);
                                }}
                                uploading={uploading[`club-${cl.id}`]}
                            />
                        ))}
                    </div>
                )}

                {/* ── Sporting Events ── */}
                {activePage === 'sportingEvents' && (
                    <div className="sports-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <div>
                                <label style={labelStyle}>Heading</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input className="sports-input" type="text" value={pageData.heading} onChange={e => updateField('heading', e.target.value)}
                                        placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: pageData.headingItalic ? 'italic' : 'normal' }} />
                                    <ItalicToggle active={!!pageData.headingItalic} onToggle={() => updateField('headingItalic', !pageData.headingItalic)} />
                                </div>
                                <HeadingStyleField
                                    color={pageData.headingColor} onColorChange={val => updateField('headingColor', val)}
                                    font={pageData.headingFont} onFontChange={val => updateField('headingFont', val)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <RichTextEditor value={pageData.description} onChange={val => updateField('description', val)}
                                    placeholder="Overview of events organized throughout the year..." minHeight="120px"
                                    maxWidth="1170px" fontSize="15px" fontFamily="'Inter', system-ui, sans-serif" />
                            </div>
                        </div>

                        <button type="button" className="sports-add-btn" onClick={() => updateField('events', [{ id: `ev-${Date.now()}`, heading: '', description: '', images: [] }, ...(pageData.events || [])])}
                            style={{ padding: '13px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                            + Add Sporting Event
                        </button>

                        {/* Events list */}
                        {(pageData.events || []).map((ev, idx) => (
                            <EventCard key={ev.id} event={ev} index={idx} length={(pageData.events || []).length}
                                onMove={(i, dir) => updateField('events', moveItem(pageData.events, i, dir))}
                                onUpdate={(field, val) => {
                                    const updated = [...pageData.events];
                                    updated[idx] = { ...updated[idx], [field]: val };
                                    updateField('events', updated);
                                }}
                                onRemove={() => updateField('events', pageData.events.filter((_, i) => i !== idx))}
                                onAddImages={(files) => startCropQueue(files, { mode: 'event', id: ev.id })}
                                onRemoveImage={(imgIdx) => {
                                    const updated = [...pageData.events];
                                    updated[idx] = { ...updated[idx], images: updated[idx].images.filter((_, i) => i !== imgIdx) };
                                    updateField('events', updated);
                                }}
                                uploading={uploading[`event-${ev.id}`]}
                            />
                        ))}
                    </div>
                )}

                {/* ── Awards & Achievements ── */}
                {activePage === 'awards' && (
                    <div className="sports-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <div>
                                <label style={labelStyle}>Heading</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input className="sports-input" type="text" value={pageData.heading} onChange={e => updateField('heading', e.target.value)}
                                        placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: pageData.headingItalic ? 'italic' : 'normal' }} />
                                    <ItalicToggle active={!!pageData.headingItalic} onToggle={() => updateField('headingItalic', !pageData.headingItalic)} />
                                </div>
                                <HeadingStyleField
                                    color={pageData.headingColor} onColorChange={val => updateField('headingColor', val)}
                                    font={pageData.headingFont} onFontChange={val => updateField('headingFont', val)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <RichTextEditor value={pageData.description} onChange={val => updateField('description', val)}
                                    placeholder="Overview of our sports achievements..." minHeight="120px"
                                    maxWidth="1170px" fontSize="15px" fontFamily="'Inter', system-ui, sans-serif" />
                            </div>
                            <ImageGrid field="images" label="Photo Carousel Images" max={8} />
                        </div>

                        {/* Certifications */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Certifications</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>Upload certificate images with basic info — shown in a grid. Landscape (4:3) works best · JPG, PNG, WEBP · Max 1MB each.</p>
                            <button type="button" className="sports-add-btn" onClick={() => updateField('certifications', [{ id: `cert-${Date.now()}`, image: '', title: '', info: '' }, ...(pageData.certifications || [])])}
                                style={{ width: '100%', padding: '13px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer', marginBottom: '1rem' }}>
                                + Add Certification
                            </button>
                            <div className="sports-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                                {(pageData.certifications || []).map((cert, i) => (
                                    <CertCard key={cert.id} cert={cert} index={i} length={(pageData.certifications || []).length}
                                        onMove={(idx, dir) => updateField('certifications', moveItem(pageData.certifications, idx, dir))}
                                        onUpdate={(field, val) => {
                                            const updated = [...pageData.certifications];
                                            updated[i] = { ...updated[i], [field]: val };
                                            updateField('certifications', updated);
                                        }}
                                        onRemove={() => updateField('certifications', pageData.certifications.filter((_, idx) => idx !== i))}
                                        onUpload={(file) => startCropQueue([file], { mode: 'cert', id: cert.id })}
                                        uploading={uploading[`cert-${cert.id}`]}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Making Us Proud */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Making Us Proud</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>Student photos with achievement details. Square photo works best · JPG, PNG, WEBP · Max 1MB each.</p>
                            <button type="button" className="sports-add-btn" onClick={() => updateField('proud', [{ id: `proud-${Date.now()}`, photo: '', name: '', achievement: '' }, ...(pageData.proud || [])])}
                                style={{ width: '100%', padding: '13px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer', marginBottom: '1rem' }}>
                                + Add Student
                            </button>
                            <div className="sports-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                                {(pageData.proud || []).map((stu, i) => (
                                    <ProudCard key={stu.id} student={stu} index={i} length={(pageData.proud || []).length}
                                        onMove={(idx, dir) => updateField('proud', moveItem(pageData.proud, idx, dir))}
                                        onUpdate={(field, val) => {
                                            const updated = [...pageData.proud];
                                            updated[i] = { ...updated[i], [field]: val };
                                            updateField('proud', updated);
                                        }}
                                        onRemove={() => updateField('proud', pageData.proud.filter((_, idx) => idx !== i))}
                                        onAddImage={(file) => startCropQueue([file], { mode: 'proud', id: stu.id })}
                                        uploading={uploading[`proud-${stu.id}`]}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Yearly Award PDFs */}
                        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Yearly Award PDFs</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>Add a year and upload the award winners PDF — shown in sidebar, opens PDF on click</p>
                            <button type="button" className="sports-add-btn" onClick={() => updateField('yearlyAwards', [...(pageData.yearlyAwards || []), { id: `yr-${Date.now()}`, year: '', pdfUrl: '' }])}
                                style={{ width: '100%', padding: '13px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer', marginBottom: '1rem' }}>
                                + Add Year
                            </button>
                            {(pageData.yearlyAwards || []).map((yr, i) => (
                                <YearlyAwardRow key={yr.id} yearItem={yr}
                                    onUpdate={(field, val) => {
                                        const updated = [...pageData.yearlyAwards];
                                        updated[i] = { ...updated[i], [field]: val };
                                        updateField('yearlyAwards', updated);
                                    }}
                                    onRemove={() => updateField('yearlyAwards', pageData.yearlyAwards.filter((_, idx) => idx !== i))}
                                    uploading={uploading[`pdf-${yr.id}`]}
                                    onUploadStart={() => setUploading(prev => ({ ...prev, [`pdf-${yr.id}`]: true }))}
                                    onUploadEnd={() => setUploading(prev => ({ ...prev, [`pdf-${yr.id}`]: false }))}
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {cropTarget && (
                <ImageCropModal
                    imageSrc={cropTarget.src}
                    aspect={cropTarget.aspect ?? null}
                    onCancel={() => { setCropTarget(null); setImageQueue([]); }}
                    onCropComplete={onCropConfirmed}
                />
            )}
        </>
    );
};

// ── Event Card Component (used for Sporting Events) ──
const EventCard = ({ event, index, length, onMove, onUpdate, onRemove, onAddImages, onRemoveImage, uploading }) => {
    const { tc } = useSchoolStore();
    const inputStyle = { width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: tc.primary }}>Event #{index + 1}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ReorderButtons index={index} length={length} onMove={onMove} vertical={false} />
                    <button onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <label style={labelStyle}>Event Heading</label>
                    <input className="sports-input" type="text" value={event.heading} onChange={e => onUpdate('heading', e.target.value)} placeholder="Enter Event Heading" style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>Description</label>
                    <RichTextEditor value={event.description} onChange={val => onUpdate('description', val)} placeholder="Describe this event..." minHeight="80px"
                        maxWidth="734px" fontSize="14.5px" fontFamily="'Inter', system-ui, sans-serif" />
                </div>
                <div>
                    <label style={labelStyle}>Event Images (carousel) — {(event.images || []).length} / {MAX_SPORT_EVENT_IMAGES}</label>
                    <p style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '8px' }}>Square photos work best · JPG, PNG, WEBP · Max 1MB each · Up to {MAX_SPORT_EVENT_IMAGES} images.</p>
                    <div className="sports-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '10px' }}>
                        {(event.images || []).map((img, i) => (
                            <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1' }}>
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => onRemoveImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '12px' }}>×</button>
                            </div>
                        ))}
                    </div>
                    {(event.images || []).length >= MAX_SPORT_EVENT_IMAGES ? (
                        <p style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', padding: '0.6rem' }}>
                            Maximum {MAX_SPORT_EVENT_IMAGES} images added — remove one to add another.
                        </p>
                    ) : (
                        <div className="sports-add-btn" onClick={() => document.getElementById(`ev-img-${event.id}`).click()}
                            style={{ border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', padding: '1rem', textAlign: 'center', cursor: 'pointer', background: '#ffffff' }}>
                            {uploading ? <p style={{ fontSize: '12px', color: '#64748b' }}>Uploading...</p> : <p style={{ fontSize: '13px', fontWeight: 600, color: tc.primary }}>+ Add images</p>}
                        </div>
                    )}
                    <input id={`ev-img-${event.id}`} type="file" accept="image/*" multiple
                        onChange={e => { const files = Array.from(e.target.files); if (files.length > 0) onAddImages(files); }}
                        style={{ display: 'none' }} />
                </div>
            </div>
        </div>
    );
};

// ── Sport Item Card Component (used for Sports Offered) — identical pattern to EventCard, relabeled ──
const SportItemCard = ({ sport, index, length, onMove, onUpdate, onRemove, onAddImages, onRemoveImage, uploading }) => {
    const { tc } = useSchoolStore();
    const inputStyle = { width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: tc.primary }}>Sport #{index + 1}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ReorderButtons index={index} length={length} onMove={onMove} vertical={false} />
                    <button onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <label style={labelStyle}>Sport Name</label>
                    <input className="sports-input" type="text" value={sport.heading} onChange={e => onUpdate('heading', e.target.value)} placeholder="Enter Heading" style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>Description</label>
                    <RichTextEditor value={sport.description} onChange={val => onUpdate('description', val)} placeholder="Describe this sport, facilities, coaching, achievements..." minHeight="80px"
                        maxWidth="734px" fontSize="14.5px" fontFamily="'Inter', system-ui, sans-serif" />
                </div>
                <div>
                    <label style={labelStyle}>Sport Images (carousel) — {(sport.images || []).length} / {MAX_SPORT_EVENT_IMAGES}</label>
                    <p style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '8px' }}>Square photos work best · JPG, PNG, WEBP · Max 1MB each · Up to {MAX_SPORT_EVENT_IMAGES} images.</p>
                    <div className="sports-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '10px' }}>
                        {(sport.images || []).map((img, i) => (
                            <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1' }}>
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => onRemoveImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '12px' }}>×</button>
                            </div>
                        ))}
                    </div>
                    {(sport.images || []).length >= MAX_SPORT_EVENT_IMAGES ? (
                        <p style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', padding: '0.6rem' }}>
                            Maximum {MAX_SPORT_EVENT_IMAGES} images added — remove one to add another.
                        </p>
                    ) : (
                        <div className="sports-add-btn" onClick={() => document.getElementById(`sport-img-${sport.id}`).click()}
                            style={{ border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', padding: '1rem', textAlign: 'center', cursor: 'pointer', background: '#ffffff' }}>
                            {uploading ? <p style={{ fontSize: '12px', color: '#64748b' }}>Uploading...</p> : <p style={{ fontSize: '13px', fontWeight: 600, color: tc.primary }}>+ Add images</p>}
                        </div>
                    )}
                    <input id={`sport-img-${sport.id}`} type="file" accept="image/*" multiple
                        onChange={e => { const files = Array.from(e.target.files); if (files.length > 0) onAddImages(files); }}
                        style={{ display: 'none' }} />
                </div>
            </div>
        </div>
    );
};

// ── Club Card Component (used for Clubs & Activities) — identical pattern to SportItemCard/EventCard, relabeled ──
const ClubCard = ({ club, index, length, onMove, onUpdate, onRemove, onAddImages, onRemoveImage, uploading }) => {
    const { tc } = useSchoolStore();
    const inputStyle = { width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: tc.primary }}>Club / Activity #{index + 1}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ReorderButtons index={index} length={length} onMove={onMove} vertical={false} />
                    <button onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <label style={labelStyle}>Club / Activity Name</label>
                    <input className="sports-input" type="text" value={club.heading} onChange={e => onUpdate('heading', e.target.value)} placeholder="Enter Heading" style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>Description</label>
                    <RichTextEditor value={club.description} onChange={val => onUpdate('description', val)} placeholder="Describe this club or activity, its purpose, schedule, achievements..." minHeight="80px"
                        maxWidth="734px" fontSize="14.5px" fontFamily="'Inter', system-ui, sans-serif" />
                </div>
                <div>
                    <label style={labelStyle}>Images (carousel) — {(club.images || []).length} / {MAX_SPORT_EVENT_IMAGES}</label>
                    <p style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '8px' }}>Square photos work best · JPG, PNG, WEBP · Max 1MB each · Up to {MAX_SPORT_EVENT_IMAGES} images.</p>
                    <div className="sports-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '10px' }}>
                        {(club.images || []).map((img, i) => (
                            <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1' }}>
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => onRemoveImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '12px' }}>×</button>
                            </div>
                        ))}
                    </div>
                    {(club.images || []).length >= MAX_SPORT_EVENT_IMAGES ? (
                        <p style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', padding: '0.6rem' }}>
                            Maximum {MAX_SPORT_EVENT_IMAGES} images added — remove one to add another.
                        </p>
                    ) : (
                        <div className="sports-add-btn" onClick={() => document.getElementById(`club-img-${club.id}`).click()}
                            style={{ border: `1.5px dashed ${tc.primary}55`, borderRadius: '10px', padding: '1rem', textAlign: 'center', cursor: 'pointer', background: '#ffffff' }}>
                            {uploading ? <p style={{ fontSize: '12px', color: '#64748b' }}>Uploading...</p> : <p style={{ fontSize: '13px', fontWeight: 600, color: tc.primary }}>+ Add images</p>}
                        </div>
                    )}
                    <input id={`club-img-${club.id}`} type="file" accept="image/*" multiple
                        onChange={e => { const files = Array.from(e.target.files); if (files.length > 0) onAddImages(files); }}
                        style={{ display: 'none' }} />
                </div>
            </div>
        </div>
    );
};

// ── Certification Card ──
const CertCard = ({ cert, index, length, onMove, onUpdate, onRemove, onUpload, uploading }) => {
    const { tc } = useSchoolStore();
    const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #e5e9f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    return (
        <div style={{ border: '0.5px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
            <div onClick={() => document.getElementById(`cert-img-${cert.id}`).click()}
                style={{ height: '120px', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {uploading ? <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    : cert.image ? <img src={cert.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '12px', color: '#94a3b8' }}>📜 Upload</span>}
            </div>
            <input id={`cert-img-${cert.id}`} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) onUpload(f); }} style={{ display: 'none' }} />
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input type="text" value={cert.title} onChange={e => onUpdate('title', e.target.value)} placeholder="Title" style={inputStyle} />
                <input type="text" value={cert.info} onChange={e => onUpdate('info', e.target.value)} placeholder="Basic info" style={inputStyle} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ReorderButtons index={index} length={length} onMove={onMove} vertical={false} />
                    <button onClick={onRemove} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
            </div>
        </div>
    );
};

// ── Making Us Proud Card ──
// Photo upload routes through the parent's shared cropTarget/ImageCropModal flow
// (onAddImage) rather than rendering its own modal in-place — a modal rendered
// this deep inside `.sports-section` (which has a `transform`-based CSS
// animation, still applying `translateY(0)` via fill-mode: forwards even after
// it finishes) becomes a containing block for `position: fixed`, so a locally
// rendered modal opens pinned to that section's box instead of the viewport.
const ProudCard = ({ student, index, length, onMove, onUpdate, onRemove, onAddImage, uploading }) => {
    const { tc } = useSchoolStore();
    const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #e5e9f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    return (
        <div style={{ border: '0.5px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
            <div onClick={() => document.getElementById(`proud-img-${student.id}`).click()}
                style={{ height: '120px', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {uploading ? <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    : student.photo ? <img src={student.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '12px', color: '#94a3b8' }}>👤 Upload</span>}
            </div>
            <input id={`proud-img-${student.id}`} type="file" accept="image/*"
                onChange={e => {
                    const f = e.target.files[0];
                    e.target.value = '';
                    if (f) onAddImage(f);
                }}
                style={{ display: 'none' }} />
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input type="text" value={student.name} onChange={e => onUpdate('name', e.target.value)} placeholder="Student Name" style={inputStyle} />
                <input type="text" value={student.achievement} onChange={e => onUpdate('achievement', e.target.value)} placeholder="Achievement" style={inputStyle} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ReorderButtons index={index} length={length} onMove={onMove} vertical={false} />
                    <button onClick={onRemove} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
            </div>
        </div>
    );
};

// ── Yearly Award PDF Row ──
const YearlyAwardRow = ({ yearItem, onUpdate, onRemove, uploading, onUploadStart, onUploadEnd }) => {
    const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };

    const handlePdfUpload = async (file) => {
        onUploadStart();
        try {
            const res = await uploadPdfApi(file);
            onUpdate('pdfUrl', res.data.url);
            toast.success('PDF uploaded!');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload PDF');
        } finally {
            onUploadEnd();
        }
    };

    return (
        <div className="sports-award-row" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 100px', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #f8fafc' }}>
            <input className="sports-input" type="text" value={yearItem.year} onChange={e => onUpdate('year', e.target.value)} placeholder="Enter Year" style={inputStyle} />
            <div>
                <div onClick={() => document.getElementById(`pdf-${yearItem.id}`).click()}
                    style={{ padding: '9px 12px', border: '1px dashed #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: yearItem.pdfUrl ? '#15803d' : '#64748b', background: yearItem.pdfUrl ? '#f0fdf4' : '#fafafa', textAlign: 'center' }}>
                    {uploading ? 'Uploading...' : yearItem.pdfUrl ? '✓ PDF uploaded — click to change' : '📄 Click to upload PDF'}
                </div>
                <input id={`pdf-${yearItem.id}`} type="file" accept="application/pdf" onChange={e => { const f = e.target.files[0]; if (f) handlePdfUpload(f); }} style={{ display: 'none' }} />
                {yearItem.pdfUrl && !uploading && (
                    <button type="button" onClick={() => onUpdate('pdfUrl', '')}
                        style={{ marginTop: '4px', fontSize: '11px', fontWeight: 600, color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                        Remove PDF
                    </button>
                )}
            </div>
            <button onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '9px' }}>Remove</button>
        </div>
    );
};

export default Sports;