import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi, uploadVideoFileApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ImageCropModal from '../../../components/common/ImageCropModal';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import OrientedImagesEditor from '../../../components/admin/OrientedImagesEditor';
import ImageSizeHint from '../../../components/admin/ImageSizeHint';
import ReorderButtons from '../../../components/common/ReorderButtons';
import useSchoolStore from '../../../store/schoolStore';
import { moveItem } from '../../../utils/reorder';
import { assertVideoSizeOk, MAX_VIDEO_SIZE_MB } from '../../../utils/fileValidation';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const TAG_OPTIONS = ['Cultural', 'Sports', 'Academic', 'Workshop', 'Competition', 'Celebration'];

const VideoLabelIcon = ({ color, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="5.5" width="14" height="13" rx="2" />
        <path d="M16.5 10l5-3v10l-5-3" />
    </svg>
);

const HighlightLabelIcon = ({ color, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6z" />
    </svg>
);

const defaultContent = { heading: '', description: '', events: [] };

const Events = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [uploading, setUploading] = useState({});

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('events');
            if (res.data) {
                const merged = { ...defaultContent, ...res.data.content };
                setContent(merged);
                setSavedSnapshot(JSON.stringify(merged));
                setIsPublished(res.data.is_published === 1);
            }
        } catch (e) {
            console.log('No content yet');
        } finally {
            setLoading(false);
        }
    };

    const fetchPublishedFlag = async () => {
        const res = await getModuleContentApi('events');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('events', content, publish ? 1 : isPublished ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('events', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('Events published! 🎉');
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
            let current = await fetchPublishedFlag();
            if (current) {
                await togglePublishApi('events', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => setContent(prev => ({ ...prev, [field]: value }));

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

    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes cardIn { from { opacity: 0; transform: translateY(16px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .events-section { animation: fadeInUp 0.35s ease forwards; }
                @media (max-width: 600px) {
                    .events-image-grid { grid-template-columns: 1fr !important; }
                }
                .events-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .event-card { animation: cardIn 0.4s cubic-bezier(0.16,1,0.3,1) both; transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease; }
                .event-card:hover { box-shadow: 0 10px 28px rgba(15,23,42,0.08); border-color: #e5e9f0; transform: translateY(-2px); }
                .events-addbtn { transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; }
                .events-addbtn:hover { transform: translateY(-1px); background: ${hexToRgba(tc.primary, 0.05)}; box-shadow: 0 4px 14px ${hexToRgba(tc.primary, 0.14)}; }
                .events-btn { transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
                .events-btn:hover { transform: translateY(-1px); }
                .events-remove { transition: transform 0.18s ease, background 0.18s ease; }
                .events-remove:hover { transform: scale(1.08); background: #fee2e2; }
                .event-image-drop { transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease; }
                .event-image-drop:hover { border-color: ${tc.primary}88; transform: translateY(-1px); }
                .events-highlight:hover { box-shadow: 0 8px 22px rgba(15,23,42,0.08); }
                @media (max-width: 480px) {
                    .events-date-grid { grid-template-columns: 1fr 1fr !important; }
                    .events-date-grid > div:last-child { grid-column: 1 / -1; }
                }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .events-hero-inner { gap: 12px !important; }
                    .events-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .events-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .events-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .events-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .events-status-badge { padding: 4px 9px !important; }
                    .events-status-badge span { font-size: 9.5px !important; }
                    .events-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="events-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="events-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div>
                                <p className="events-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Dynamic / Events</p>
                                <h1 className="events-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Events &amp; Activities</h1>
                                <p className="events-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                    List school events, functions and activities. Upcoming vs past is worked out automatically from the date — no manual sorting needed.
                                </p>
                            </div>
                            <div className="events-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{isPublished ? 'Published' : 'Draft'}</span>
                            </div>
                        </div>
                        <div className="events-hero-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <ModuleActionButtons
                                tc={tc}
                                saving={saving}
                                publishing={publishing}
                                isPublished={isPublished}
                                isDirty={isDirty}
                                onSave={() => handleSave(false)}
                                onPublish={() => handleSave(true)}
                                onUnpublish={handleUnpublish}
                            />
                        </div>
                    </div>
                </div>

                <div className="events-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Top section — description RTE now fills the card's full width instead of
                        being capped at 818px, which used to leave dead space on both sides. */}
                    <div style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="events-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
                                    placeholder="Enter Heading" style={{ ...inputStyle, fontStyle: content.headingItalic ? 'italic' : 'normal' }} />
                                <ItalicToggle active={!!content.headingItalic} onToggle={() => updateField('headingItalic', !content.headingItalic)} />
                            </div>
                            <HeadingStyleField
                                color={content.headingColor} onColorChange={val => updateField('headingColor', val)}
                                font={content.headingFont} onFontChange={val => updateField('headingFont', val)}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <RichTextEditor value={content.description} onChange={val => updateField('description', val)}
                                placeholder="A short note about school events and activities..." minHeight="120px"
                                fontSize="15px" />
                        </div>
                    </div>

                    {/* Add Event */}
                    <div style={{ display: 'flex' }}>
                        <button className="events-addbtn" onClick={() => updateField('events', [{
                            id: `evt-${Date.now()}`, title: '', date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), venue: '', tag: 'Cultural', body: '', image: '', videos: [], highlights: []
                        }, ...content.events])}
                            style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                            + Add Event
                        </button>
                    </div>

                    {/* Event list */}
                    {content.events.length === 0 && (
                        <div style={{ background: '#ffffff', border: '1px dashed #e2e8f0', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>No events yet — click "+ Add Event" to list one.</p>
                        </div>
                    )}
                    {content.events.map((ev, idx) => (
                        <EventCard key={ev.id} event={ev} delay={Math.min(idx * 0.05, 0.3)}
                            onUpdate={(field, val) => {
                                const updated = [...content.events];
                                updated[idx] = { ...updated[idx], [field]: val };
                                updateField('events', updated);
                            }}
                            onRemove={() => updateField('events', content.events.filter((_, i) => i !== idx))}
                            onUploadImage={async (file) => {
                                setUploading(prev => ({ ...prev, [ev.id]: true }));
                                try {
                                    const res = await uploadContentImageApi(file);
                                    const updated = [...content.events];
                                    updated[idx] = { ...updated[idx], image: res.data.url };
                                    updateField('events', updated);
                                } catch (e) { toast.error(e?.response?.data?.message || 'Failed to upload'); }
                                finally { setUploading(prev => ({ ...prev, [ev.id]: false })); }
                            }}
                            uploading={uploading[ev.id]}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

// ── Video slot editor — used for both event-level videos and highlight-level videos ──
// Each slot: { id, sourceType: 'upload' | 'link', videoUrl, linkUrl, title, thumbnail }
const VideoSlotsEditor = ({ videos, onChange, max = 3 }) => {
    const { tc } = useSchoolStore();
    const [uploadingId, setUploadingId] = useState(null);
    const [uploadingThumbId, setUploadingThumbId] = useState(null);
    const [thumbCropTarget, setThumbCropTarget] = useState(null); // { videoId, src }

    const addSlot = () => {
        if (videos.length >= max) return;
        onChange([...videos, { id: `vid-${Date.now()}`, sourceType: 'upload', videoUrl: '', linkUrl: '', title: '', thumbnail: '' }]);
    };
    const updateSlot = (id, field, val) => onChange(videos.map(v => v.id === id ? { ...v, [field]: val } : v));
    const removeSlot = (id) => onChange(videos.filter(v => v.id !== id));
    const moveSlot = (idx, dir) => onChange(moveItem(videos, idx, dir));

    const handleFile = async (id, file) => {
        try { assertVideoSizeOk(file); } catch (e) { return; }
        setUploadingId(id);
        try {
            const res = await uploadVideoFileApi(file);
            updateSlot(id, 'videoUrl', res.data.url);
        } catch (e) { toast.error(e?.response?.data?.message || 'Failed to upload video'); }
        finally { setUploadingId(null); }
    };

    const handleThumbCropped = async (croppedFile) => {
        const videoId = thumbCropTarget.videoId;
        setThumbCropTarget(null);
        setUploadingThumbId(videoId);
        try {
            const res = await uploadContentImageApi(croppedFile);
            updateSlot(videoId, 'thumbnail', res.data.url);
        } catch (e) { toast.error(e?.response?.data?.message || 'Failed to upload thumbnail'); }
        finally { setUploadingThumbId(null); }
    };

    const slotInputStyle = { width: '100%', padding: '8px 11px', border: '1px solid #e5e9f0', borderRadius: '8px', fontSize: '12.5px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' };
    const toggleBtn = (active) => ({ padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: active ? tc.primary : '#eef1f6', color: active ? '#fff' : '#64748b' });

    return (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {videos.map((v, idx) => (
                <div key={v.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                    {/* Reorder */}
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22px' }}>
                        <ReorderButtons index={idx} length={videos.length} onMove={moveSlot} />
                    </div>
                    {/* Thumbnail preview / upload */}
                    <label style={{
                        flexShrink: 0, display: 'block', width: '108px', height: '72px', borderRadius: '10px', overflow: 'hidden',
                        border: v.thumbnail ? '1px solid #e5e9f0' : '1.5px dashed #cbd5e1', background: v.thumbnail ? 'transparent' : '#fafbfc',
                        cursor: 'pointer', position: 'relative',
                    }}>
                        {v.thumbnail ? (
                            <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8', textAlign: 'center', padding: '4px', lineHeight: 1.3 }}>
                                {uploadingThumbId === v.id ? 'Uploading...' : 'Thumbnail'}
                            </div>
                        )}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) setThumbCropTarget({ videoId: v.id, src: URL.createObjectURL(f) }); }} />
                    </label>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button type="button" onClick={() => updateSlot(v.id, 'sourceType', 'upload')} style={toggleBtn(v.sourceType === 'upload')}>Upload</button>
                            <button type="button" onClick={() => updateSlot(v.id, 'sourceType', 'link')} style={toggleBtn(v.sourceType === 'link')}>Link</button>
                        </div>
                        {v.sourceType === 'link' ? (
                            <input type="text" value={v.linkUrl || ''} onChange={e => updateSlot(v.id, 'linkUrl', e.target.value)}
                                placeholder="Paste a YouTube or any video URL" style={slotInputStyle} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ padding: '7px 12px', background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '7px', fontSize: '11.5px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                                    {uploadingId === v.id ? 'Uploading...' : v.videoUrl ? 'Replace video' : 'Upload video'}
                                    <input type="file" accept="video/*" style={{ display: 'none' }}
                                        onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) handleFile(v.id, f); }} />
                                </label>
                                {v.videoUrl && <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Uploaded</span>}
                                {!v.videoUrl && <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Max {MAX_VIDEO_SIZE_MB}MB</span>}
                            </div>
                        )}
                        <input type="text" value={v.title || ''} onChange={e => updateSlot(v.id, 'title', e.target.value)}
                            placeholder="Video title (optional)" style={slotInputStyle} />
                    </div>
                    <button type="button" onClick={() => removeSlot(v.id)}
                        style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '13px', width: '26px', height: '26px', flexShrink: 0 }}>×</button>
                </div>
            ))}
            {videos.length < max && (
                <button type="button" onClick={addSlot}
                    style={{ alignSelf: 'flex-start', padding: '7px 14px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                    + Add Video ({videos.length}/{max})
                </button>
            )}
        </div>
        {thumbCropTarget && (
            <ImageCropModal
                imageSrc={thumbCropTarget.src}
                aspect={null}
                onCancel={() => setThumbCropTarget(null)}
                onCropComplete={handleThumbCropped}
            />
        )}
        </>
    );
};

// ── Highlight card — a nested sub-card inside an event (its own heading, description, images, videos) ──
const HighlightCard = ({ highlight, index, onUpdate, onRemove }) => {
    const { tc } = useSchoolStore();
    const labelStyle = { display: 'block', fontSize: '10.5px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };
    const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #e5e9f0', borderRadius: '8px', fontSize: '12.5px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#ffffff' };

    return (
        <div className="events-highlight" style={{ position: 'relative', background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '14px', padding: '1.25rem 1.25rem 1.25rem 1.5rem', boxShadow: '0 2px 10px rgba(15,23,42,0.04)', transition: 'box-shadow 0.25s ease' }}>
            <div style={{ position: 'absolute', left: 0, top: '14px', bottom: '14px', width: '4px', borderRadius: '4px', background: `linear-gradient(180deg, ${tc.primary}, ${tc.secondary})` }}></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: tc.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Highlight {index + 1}</span>
                <button type="button" onClick={onRemove}
                    style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '12px', width: '24px', height: '24px' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <label style={labelStyle}>Heading</label>
                    <input type="text" value={highlight.heading} onChange={e => onUpdate('heading', e.target.value)}
                        placeholder="Enter Highlight Heading" style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>Description</label>
                    <RichTextEditor value={highlight.description} onChange={val => onUpdate('description', val)}
                        placeholder="Enter details for this highlight" minHeight="80px" fontSize="12.5px" />
                </div>
                <div>
                    <label style={labelStyle}>Images (max 5)</label>
                    <OrientedImagesEditor images={highlight.images || []} onChange={val => onUpdate('images', val)} max={5} />
                </div>
                <div>
                    <label style={labelStyle}>Videos (max 3)</label>
                    <VideoSlotsEditor videos={highlight.videos || []} onChange={val => onUpdate('videos', val)} max={3} />
                </div>
            </div>
        </div>
    );
};

// ── Event Card ──
const EventCard = ({ event, onUpdate, onRemove, onUploadImage, uploading, delay = 0 }) => {
    const { tc } = useSchoolStore();
    const [cropSrc, setCropSrc] = useState(null);
    const inputStyle = { width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    const highlights = event.highlights || [];

    return (
        <div className="event-card" style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', animationDelay: `${delay}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="events-remove" onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
            </div>

            {/* Title — full width, matching the Videos/Highlights panels below */}
            <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Title</label>
                <input className="events-input" type="text" value={event.title} onChange={e => onUpdate('title', e.target.value)} placeholder="Enter Event Title" style={inputStyle} />
            </div>

            <div className="events-image-grid" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1.5rem' }}>
                {/* Image upload (optional) */}
                <div>
                    <label style={labelStyle}>Image (optional)</label>
                    <div className="event-image-drop" onClick={() => document.getElementById(`evt-image-${event.id}`).click()}
                        style={{ height: '110px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {uploading ? (
                            <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        ) : event.image ? (
                            <img src={event.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>🖼️ Upload</span>
                        )}
                    </div>
                    <input id={`evt-image-${event.id}`} type="file" accept="image/*"
                        onChange={e => {
                            const f = e.target.files[0];
                            e.target.value = '';
                            if (f) setCropSrc(URL.createObjectURL(f));
                        }} style={{ display: 'none' }} />
                    <ImageSizeHint>Landscape works best here — crop to ≈ 1200×700px (16:9) in the next step.</ImageSizeHint>
                </div>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="events-date-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Date</label>
                            <input className="events-input" type="date" value={event.date} onChange={e => onUpdate('date', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Time</label>
                            <input className="events-input" type="time" value={event.time || ''} onChange={e => onUpdate('time', e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Tag</label>
                            <select className="events-input" value={event.tag} onChange={e => onUpdate('tag', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Venue (optional)</label>
                        <input className="events-input" type="text" value={event.venue || ''} onChange={e => onUpdate('venue', e.target.value)} placeholder="Enter Venue" style={inputStyle} />
                    </div>
                </div>
            </div>

            {/* Details — full width, matching the Videos/Highlights panels below */}
            <div style={{ marginTop: '1.25rem' }}>
                <label style={labelStyle}>Details</label>
                <RichTextEditor value={event.body} onChange={val => onUpdate('body', val)}
                    placeholder="Enter event details" minHeight="90px" fontSize="13px" />
            </div>

            {/* Event-level videos (max 3) */}
            <div style={{ marginTop: '1.5rem', padding: '1.25rem 1.25rem 1.4rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <VideoLabelIcon color={tc.primary} />
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Event Videos (max 3)</label>
                </div>
                <VideoSlotsEditor videos={event.videos || []} onChange={val => onUpdate('videos', val)} max={3} />
            </div>

            {/* Highlights — nested sub-cards */}
            <div style={{ marginTop: '1.25rem', padding: '1.25rem 1.25rem 1.4rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <HighlightLabelIcon color={tc.primary} />
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Highlights (nested sub-cards)</label>
                </div>
                <p style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.5 }}>
                    Break this event into individual stories — e.g. a "TED Talk" event can have one highlight per
                    speaker, each with its own heading, description, up to 5 images and 3 videos.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {highlights.map((h, hIdx) => (
                        <HighlightCard key={h.id} highlight={h} index={hIdx}
                            onUpdate={(field, val) => {
                                const updated = [...highlights];
                                updated[hIdx] = { ...updated[hIdx], [field]: val };
                                onUpdate('highlights', updated);
                            }}
                            onRemove={() => onUpdate('highlights', highlights.filter((_, i) => i !== hIdx))}
                        />
                    ))}
                    <button type="button"
                        onClick={() => onUpdate('highlights', [...highlights, { id: `hl-${Date.now()}`, heading: '', description: '', images: [], videos: [] }])}
                        style={{ alignSelf: 'flex-start', padding: '8px 16px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                        + Add Highlight
                    </button>
                </div>
            </div>

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={null}
                    onCancel={() => setCropSrc(null)}
                    onCropComplete={(croppedFile) => { setCropSrc(null); onUploadImage(croppedFile); }}
                />
            )}
        </div>
    );
};

export default Events;
