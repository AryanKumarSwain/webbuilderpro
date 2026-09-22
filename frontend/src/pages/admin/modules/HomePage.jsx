import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import { uploadHeroVideoApi, updateSchoolProfileApi } from '../../../api/school.api';
import toast from 'react-hot-toast';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ImageCropModal from '../../../components/common/ImageCropModal';
import ReorderButtons from '../../../components/common/ReorderButtons';
import ScrollTabs from '../../../components/admin/ScrollTabs';
import useSchoolStore from '../../../store/schoolStore';
import { FONT_OPTIONS, getFontFamily } from '../../../constants/fonts';
import { SHIELD_PATH_D, SHIELD_ASPECT } from '../../../constants/shieldShape';
import { moveItem } from '../../../utils/reorder';
import { getYoutubeEmbedUrl } from '../../../utils/youtube';
import { RTE_FONT_CSS, RTE_LIST_CSS } from '../../../constants/rteContentStyles';

const CAMPUS_IMAGES_MAX = 10;
const HERO_BANNERS_MAX = 5;

const VideoIcon = ({ size = 28, color = '#94a3b8' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);

const BannerIcon = ({ size = 28, color = '#94a3b8' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" /></svg>
);

const CropIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
        <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
    </svg>
);

const SaveIcon = ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8M7 3v5h8" /></svg>
);

const RocketIcon = ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
);

const EyeOffIcon = ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.8 21.8 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.77 21.77 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22" /></svg>
);

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = {
    tagline: '',
    subText: '',
    heroBgType: 'video', // 'video' | 'banner'
    heroBanners: [], // [{ id, url }]
    schoolNameColor: '',
    schoolNameFont: '',
    taglineColor: '',
    subTextColor: '',
    showAnnouncementTicker: true,
    introHeading: '',
    introHeadingColor: '',
    introHeadingFont: '',
    introHeadingItalic: true,
    introDescription: '',
    introImage1: '',
    introImage2: '',
    tourHeading: 'School Tour',
    tourYoutubeUrl: '',
    campusHeading: 'Campus Glimpses',
    campusHeadingColor: '',
    campusHeadingFont: '',
    campusSubtext: '',
    campusImages: [], // [{ id, url }]
    testimonialsHeading: 'What People Say About Us',
    testimonialsHeadingColor: '',
    testimonialsHeadingFont: '',
    testimonials: [], // [{ id, photo, name, type, role, rating, quote }]
};

const HOME_TABS = [
    { key: 'hero', label: 'Hero', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { key: 'highlight', label: 'Highlight', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> },
    { key: 'tour', label: 'School Tour', icon: <VideoIcon size={16} color="currentColor" /> },
    { key: 'campus', label: 'Campus Glimpses', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg> },
    { key: 'testimonials', label: 'Testimonials', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
];

// ── Small inline color-picker used for the hero text-color overrides ──
const ColorField = ({ label, hint, value, onChange, defaultColor }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>{label}</span>
        <label style={{ position: 'relative', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', background: value || defaultColor, flexShrink: 0 }}>
            <input type="color" value={value || defaultColor} onChange={e => onChange(e.target.value)}
                style={{ position: 'absolute', inset: 0, width: '150%', height: '150%', top: '-25%', left: '-25%', border: 'none', cursor: 'pointer', padding: 0 }} />
        </label>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{value ? value.toUpperCase() : 'Default'}</span>
        {value && (
            <button type="button" onClick={() => onChange('')}
                style={{ fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                Reset
            </button>
        )}
        {hint && <span style={{ fontSize: '10.5px', color: '#cbd5e1', width: '100%' }}>{hint}</span>}
    </div>
);

// ── Small inline font-family picker, paired next to ColorField for the same hero text ──
const FontField = ({ label, value, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>{label}</span>
        <select value={value || ''} onChange={e => onChange(e.target.value)}
            style={{ fontSize: '12px', padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#0f172a', background: '#ffffff', cursor: 'pointer', outline: 'none' }}>
            <option value="">Default</option>
            {FONT_OPTIONS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
    </div>
);

// ── Small inline italic toggle, paired next to FontField for headings that default to italic ──
const ItalicField = ({ label = 'Italic', checked, onChange }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', fontWeight: 600, color: '#64748b', cursor: 'pointer', width: 'fit-content' }}>
        <input type="checkbox" checked={checked !== false} onChange={e => onChange(e.target.checked)} style={{ cursor: 'pointer' }} />
        {label}
    </label>
);

// ── Single-photo upload tile (with preview + remove), used by the two Homepage
// Highlight photos — same visual language as the banner grid tiles below.
// `shield` clips the preview to the same shield shape used on the public page,
// so the admin sees a true preview of the final framed photo. ──
const SingleImageUploadBox = ({ label, url, inputId, onSelect, onRemove, uploading, tc, shield = false }) => (
    <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block' }}>{label}</label>
        <div onClick={() => document.getElementById(inputId).click()}
            style={{
                position: 'relative', width: shield ? '70%' : '100%', maxWidth: shield ? '180px' : undefined,
                aspectRatio: shield ? `${SHIELD_ASPECT}` : '16/9', margin: shield ? '0 auto' : 0,
                borderRadius: shield ? 0 : '8px', clipPath: shield ? 'url(#admin-shield-clip)' : 'none',
                overflow: 'hidden', border: shield ? 'none' : (url ? '0.5px solid #e2e8f0' : '1.5px dashed #e2e8f0'),
                cursor: uploading ? 'not-allowed' : 'pointer', background: url ? '#f8fafc' : '#fafafa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: shield && url ? '0 6px 18px rgba(0,0,0,0.14)' : 'none',
            }}>
            {url ? (
                <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : uploading ? (
                <svg style={{ animation: 'spin 1s linear infinite', width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke={tc.primary} strokeWidth="4" /><path style={{ opacity: 0.75 }} fill={tc.primary} d="M4 12a8 8 0 018-8v8z" /></svg>
            ) : (
                <div style={{ textAlign: 'center' }}>
                    <BannerIcon size={22} />
                    <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '6px' }}>Click to upload</p>
                </div>
            )}
            {url && (
                <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
                    style={{ position: 'absolute', top: shield ? '10%' : '6px', right: shield ? '10%' : '6px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                </button>
            )}
        </div>
        <input id={inputId} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={onSelect} style={{ display: 'none' }} />
    </div>
);

// ── Single testimonial entry card — photo, name/type, role, star rating, quote.
// Each card manages its own crop-modal session for its photo upload. ──
const TestimonialEntryCard = ({ tc, testimonial, index, length, onMove, onUpdate, onRemove, onUploadPhoto, uploading }) => {
    const [cropSrc, setCropSrc] = useState(null);
    const inputStyle = { width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ background: '#ffffff', border: '0.5px solid #f1f5f9', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11.5px', fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, flexShrink: 0 }}>{index + 1}</span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{testimonial.name || 'New Testimonial'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ReorderButtons index={index} length={length} onMove={onMove} vertical={false} />
                    <button onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem' }}>
                <div>
                    <label style={labelStyle}>Photo (optional)</label>
                    <div onClick={() => document.getElementById(`hp-test-photo-${testimonial.id}`).click()}
                        style={{ height: '140px', borderRadius: '12px', border: testimonial.photo ? '1px solid #e2e8f0' : '1.5px dashed #e2e8f0', background: testimonial.photo ? 'transparent' : '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {uploading ? (
                            <div style={{ width: '20px', height: '20px', border: '3px solid #f0c4c4', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        ) : testimonial.photo ? (
                            <img src={testimonial.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>👤 Upload</span>
                        )}
                    </div>
                    <input id={`hp-test-photo-${testimonial.id}`} type="file" accept="image/*"
                        onChange={e => {
                            const f = e.target.files[0];
                            e.target.value = '';
                            if (f) setCropSrc(URL.createObjectURL(f));
                        }} style={{ display: 'none' }} />
                    <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>Falls back to initials if left blank</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.7fr', gap: '12px' }}>
                        <div>
                            <label style={labelStyle}>Name</label>
                            <input type="text" value={testimonial.name} onChange={e => onUpdate('name', e.target.value)} placeholder="Enter Full Name" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Type</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {['parent', 'alumni', 'visitor'].map(type => (
                                    <button key={type} type="button" onClick={() => onUpdate('type', type)}
                                        style={{
                                            flex: 1, padding: '10px 6px', borderRadius: '10px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                                            border: `1px solid ${testimonial.type === type ? tc.primary : '#e5e9f0'}`,
                                            background: testimonial.type === type ? hexToRgba(tc.primary, 0.08) : '#f8fafc',
                                            color: testimonial.type === type ? tc.primary : '#64748b',
                                        }}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Role / Relation (optional)</label>
                        <input type="text" value={testimonial.role} onChange={e => onUpdate('role', e.target.value)}
                            placeholder="Enter Role (e.g. Parent of Grade 5 Student)" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Rating</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <svg key={star} onClick={() => onUpdate('rating', star)} style={{ cursor: 'pointer' }}
                                    width="22" height="22" viewBox="0 0 24 24"
                                    fill={star <= (testimonial.rating || 0) ? '#f59e0b' : 'none'}
                                    stroke={star <= (testimonial.rating || 0) ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5l2.9 6 6.6.7-4.9 4.6 1.2 6.5L12 16.9l-5.8 3.4 1.2-6.5-4.9-4.6 6.6-.7L12 2.5z" />
                                </svg>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Quote</label>
                        <RichTextEditor value={testimonial.quote} onChange={val => onUpdate('quote', val)}
                            placeholder="Enter Testimonial Quote" minHeight="90px" fontSize="13px" />
                    </div>
                </div>
            </div>

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={1}
                    onCancel={() => setCropSrc(null)}
                    onCropComplete={(croppedFile) => { setCropSrc(null); onUploadPhoto(croppedFile); }}
                />
            )}
        </div>
    );
};

const HomePage = () => {
    const { tc, bc, school, fetchSchool } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [videoTitle, setVideoTitle] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [removingVideo, setRemovingVideo] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [cropSrc, setCropSrc] = useState(null);
    const [cropTarget, setCropTarget] = useState('banner'); // 'banner' | 'recrop-banner' | 'intro1' | 'intro2' | 'campus' | 'recrop-campus'
    const [recropId, setRecropId] = useState(null);
    const [imageQueue, setImageQueue] = useState([]); // remaining files still waiting to be cropped
    const [activeTab, setActiveTab] = useState('hero');
    const [testimonialUploading, setTestimonialUploading] = useState({});

    useEffect(() => { fetchContent(); }, []);

    useEffect(() => {
        if (school) setVideoTitle(school.hero_video_title || '');
    }, [school]);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('home');
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

    const handleChange = (field, value) => {
        setContent(prev => ({ ...prev, [field]: value }));
    };

    const fetchPublishedFlag = async () => {
        const res = await getModuleContentApi('home');
        return !!res?.data?.is_published;
    };

    const handleSave = async (publish = false) => {
        publish ? setPublishing(true) : setSaving(true);
        try {
            await saveModuleContentApi('home', content, publish ? 1 : isPublished ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                // Save never touches is_published — flip it server-side only if not already live.
                let current = await fetchPublishedFlag();
                if (!current) {
                    await togglePublishApi('home', 1);
                    current = await fetchPublishedFlag();
                }
                setIsPublished(current);
                toast.success('Home page published!');
            } else {
                toast.success('Content saved!');
            }
        } catch (e) {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
            setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            let current = await fetchPublishedFlag();
            if (current) {
                await togglePublishApi('home', 0);
                current = await fetchPublishedFlag();
            }
            setIsPublished(current);
            toast.success('Unpublished');
        } catch (e) {
            toast.error('Failed to unpublish');
        }
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) { setVideoFile(file); setVideoPreview(URL.createObjectURL(file)); }
    };

    // Every image field (hero banners, the two intro highlight photos, campus glimpse
    // images) shares one crop flow — files are cropped one at a time (freeform, adjustable
    // from every side unless a fixed shape is enforced, see below); once confirmed, the next
    // queued file automatically opens in the crop modal. `cropTarget` says which field the
    // current crop session is feeding.
    const openImageCrop = (e, target) => {
        let files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length === 0) return;
        if (target === 'campus') {
            const remaining = Math.max(0, CAMPUS_IMAGES_MAX - content.campusImages.length);
            if (remaining === 0) { toast.error(`You can upload up to ${CAMPUS_IMAGES_MAX} photos in Campus Glimpses`); return; }
            if (files.length > remaining) {
                toast.error(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} can be added (max ${CAMPUS_IMAGES_MAX})`);
                files = files.slice(0, remaining);
            }
        } else if (target === 'banner') {
            const remaining = Math.max(0, HERO_BANNERS_MAX - content.heroBanners.length);
            if (remaining === 0) { toast.error(`You can upload up to ${HERO_BANNERS_MAX} banner images`); return; }
            if (files.length > remaining) {
                toast.error(`Only ${remaining} more banner${remaining === 1 ? '' : 's'} can be added (max ${HERO_BANNERS_MAX})`);
                files = files.slice(0, remaining);
            }
        }
        setCropTarget(target);
        setImageQueue(files.slice(1));
        setCropSrc(URL.createObjectURL(files[0]));
    };

    const onImageCropConfirmed = async (croppedFile) => {
        setCropSrc(null);
        setUploadingImage(true);
        try {
            const res = await uploadContentImageApi(croppedFile);
            if (cropTarget === 'recrop-banner') {
                setContent(prev => ({
                    ...prev,
                    heroBanners: prev.heroBanners.map(b => b.id === recropId ? { ...b, url: res.data.url } : b)
                }));
                setRecropId(null);
                toast.success('Banner updated!');
            } else if (cropTarget === 'banner') {
                setContent(prev => ({ ...prev, heroBanners: [...prev.heroBanners, { id: `banner-${Date.now()}`, url: res.data.url }] }));
            } else if (cropTarget === 'recrop-campus') {
                setContent(prev => ({
                    ...prev,
                    campusImages: prev.campusImages.map(img => img.id === recropId ? { ...img, url: res.data.url } : img)
                }));
                setRecropId(null);
                toast.success('Campus image updated!');
            } else if (cropTarget === 'campus') {
                setContent(prev => ({ ...prev, campusImages: [...prev.campusImages, { id: `campus-${Date.now()}`, url: res.data.url }] }));
            } else if (cropTarget === 'intro1') {
                setContent(prev => ({ ...prev, introImage1: res.data.url }));
            } else if (cropTarget === 'intro2') {
                setContent(prev => ({ ...prev, introImage2: res.data.url }));
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploadingImage(false);
            if (imageQueue.length > 0) {
                const [next, ...rest] = imageQueue;
                setImageQueue(rest);
                setCropSrc(URL.createObjectURL(next));
            }
        }
    };

    const moveBanner = (index, direction) => {
        const next = [...content.heroBanners];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= next.length) return;
        const temp = next[index];
        next[index] = next[targetIndex];
        next[targetIndex] = temp;
        handleChange('heroBanners', next);
    };

    const recropBanner = async (banner) => {
        setRecropId(banner.id);
        setCropTarget('recrop-banner');
        try {
            const res = await fetch(banner.url);
            const blob = await res.blob();
            setCropSrc(URL.createObjectURL(blob));
        } catch (e) {
            setCropSrc(banner.url);
        }
    };

    const removeBanner = (id) => {
        setContent(prev => ({ ...prev, heroBanners: prev.heroBanners.filter(b => b.id !== id) }));
    };

    const moveCampusImage = (index, direction) => {
        const next = [...content.campusImages];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= next.length) return;
        const temp = next[index];
        next[index] = next[targetIndex];
        next[targetIndex] = temp;
        handleChange('campusImages', next);
    };

    const recropCampusImage = async (img) => {
        setRecropId(img.id);
        setCropTarget('recrop-campus');
        try {
            const res = await fetch(img.url);
            const blob = await res.blob();
            setCropSrc(URL.createObjectURL(blob));
        } catch (e) {
            setCropSrc(img.url);
        }
    };

    const removeCampusImage = (id) => {
        setContent(prev => ({ ...prev, campusImages: prev.campusImages.filter(b => b.id !== id) }));
    };

    const addTestimonial = () => {
        handleChange('testimonials', [{
            id: `test-${Date.now()}`, photo: '', name: '', type: 'parent', role: '', rating: 5, quote: ''
        }, ...content.testimonials]);
    };

    const updateTestimonial = (idx, field, val) => {
        const updated = [...content.testimonials];
        updated[idx] = { ...updated[idx], [field]: val };
        handleChange('testimonials', updated);
    };

    const removeTestimonial = (idx) => {
        handleChange('testimonials', content.testimonials.filter((_, i) => i !== idx));
    };

    const uploadTestimonialPhoto = async (idx, testimonialId, file) => {
        setTestimonialUploading(prev => ({ ...prev, [testimonialId]: true }));
        try {
            const res = await uploadContentImageApi(file);
            updateTestimonial(idx, 'photo', res.data.url);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload photo');
        } finally {
            setTestimonialUploading(prev => ({ ...prev, [testimonialId]: false }));
        }
    };

    const handleVideoUpload = async () => {
        if (!videoFile) { toast.error('Please select a video file'); return; }
        setUploadingVideo(true);
        try {
            const formData = new FormData();
            formData.append('heroVideo', videoFile);
            formData.append('title', videoTitle);
            await uploadHeroVideoApi(formData);
            await fetchSchool();
            toast.success('Hero video uploaded successfully!');
            setVideoFile(null);
            setVideoPreview(null);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload video');
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleVideoRemove = async () => {
        setRemovingVideo(true);
        try {
            await updateSchoolProfileApi({ hero_video_url: null, hero_video_title: null });
            await fetchSchool();
            setVideoTitle('');
            setVideoFile(null);
            setVideoPreview(null);
            toast.success('Hero video removed');
        } catch (e) {
            toast.error('Failed to remove video');
        } finally {
            setRemovingVideo(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px', border: '1px solid #e5e9f0',
        borderRadius: '10px', fontSize: '13.5px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'system-ui, sans-serif',
        transition: 'border 0.2s, box-shadow 0.2s, background 0.2s'
    };

    const labelStyle = {
        display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
    };

    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: `3px solid ${tc.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .hp-section { animation: fadeInUp 0.35s ease forwards; }
                .hp-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .hp-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .hp-hero-orb { animation: drift1 9s ease-in-out infinite; }

                /* ── Save / Publish / Unpublish buttons ── */
                .hp-btn { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; position: relative; overflow: hidden; letter-spacing: 0.01em; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, filter 0.25s ease; }
                .hp-btn:disabled { cursor: not-allowed; opacity: 0.65; }
                .hp-btn:active:not(:disabled) { transform: translateY(0) scale(0.96) !important; }
                .hp-btn-icon { display: inline-flex; transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1); }
                .hp-btn:hover:not(:disabled) .hp-btn-icon { transform: scale(1.15) rotate(-6deg); }
                .hp-btn-publish:hover:not(:disabled) .hp-btn-icon { transform: translate(2px,-2px) scale(1.12) rotate(0deg); }
                .hp-btn-unpublish:hover:not(:disabled) .hp-btn-icon { transform: scale(1.12) rotate(0deg); }

                .hp-btn-save:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(0.96); box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 10px 22px rgba(0,0,0,0.28) !important; }
                .hp-btn-save.is-dirty:hover:not(:disabled) { filter: brightness(1.06); box-shadow: 0 2px 4px rgba(120,70,0,0.3), 0 12px 28px rgba(234,179,8,0.5) !important; }
                @keyframes hpDirtyPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(66,32,6,0.5); } 50% { box-shadow: 0 0 0 4px rgba(66,32,6,0); } }
                .hp-btn-dot { animation: hpDirtyPulse 1.6s ease-out infinite; }

                .hp-btn-unpublish:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 2px 4px rgba(127,29,29,0.35), 0 12px 28px rgba(220,38,38,0.5) !important; }

                .hp-btn-publish::after { content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent); transform: skewX(-20deg); transition: left 0.65s ease; pointer-events: none; }
                .hp-btn-publish:hover:not(:disabled) { transform: translateY(-2px) scale(1.02); filter: brightness(1.08); box-shadow: 0 2px 4px ${hexToRgba(tc.dark, 0.3)}, 0 14px 32px ${hexToRgba(tc.primary, 0.6)} !important; }
                .hp-btn-publish:hover:not(:disabled)::after { left: 130%; }
                @media (max-width: 700px) {
                    .hp-2col { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    /* ── Hero header — compact, same treatment as Dashboard/Settings/Contact Us ── */
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .hp-hero-inner { gap: 12px !important; }
                    .hp-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .hp-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .hp-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .hp-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .hp-status-badge { padding: 4px 9px !important; }
                    .hp-status-badge span { font-size: 9.5px !important; }
                    .hp-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                }
                .rte-content p { margin-bottom: 0.8em; }
                .rte-content p:last-child { margin-bottom: 0; }
                .rte-content strong { font-weight: 700; }
                .rte-content em { font-style: italic; }
                .rte-content u { text-decoration: underline; }
                .rte-content ul, .rte-content ol { padding-left: 1.5em; margin-bottom: 0.8em; }
                .rte-content .ql-size-small { font-size: 0.75em; }
                .rte-content .ql-size-large { font-size: 1.5em; }
                .rte-content .ql-size-huge { font-size: 2.5em; }
                ${RTE_FONT_CSS}
                ${RTE_LIST_CSS}
            `}</style>

            <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
                <defs>
                    <clipPath id="admin-shield-clip" clipPathUnits="objectBoundingBox">
                        <path d={SHIELD_PATH_D} />
                    </clipPath>
                </defs>
            </svg>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="hp-hero-orb" style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div className="hp-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="hp-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div className="hp-hero-item">
                                <p className="hp-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Home Page</p>
                                <h1 className="hp-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Home Page</h1>
                                <p className="hp-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '400px' }}>
                                    Manage your school's home page hero text.
                                </p>
                            </div>
                            <div className="hp-hero-item hp-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                                    {isPublished ? 'Published' : 'Draft'}
                                </span>
                            </div>
                        </div>
                        <div className="hp-hero-item hp-hero-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => handleSave(false)} disabled={saving}
                                className={`hp-btn hp-btn-save${isDirty ? ' is-dirty' : ''}`}
                                style={{
                                    padding: '10px 20px', borderRadius: '12px', fontSize: '12.5px', fontWeight: isDirty ? 700 : 600,
                                    background: isDirty ? 'linear-gradient(160deg,#fcd34d,#eab308 60%,#ca8a04)' : 'linear-gradient(160deg,#ffffff,#e8edf4)',
                                    color: isDirty ? '#422006' : '#1e293b',
                                    border: 'none',
                                    boxShadow: isDirty
                                        ? 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px rgba(120,70,0,0.25), 0 6px 16px rgba(234,179,8,0.4)'
                                        : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.08), 0 6px 14px rgba(0,0,0,0.16)',
                                }}>
                                {saving ? (
                                    <svg style={{ animation: 'spin 1s linear infinite', width: '13px', height: '13px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.3 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" /></svg>
                                ) : (
                                    <span className="hp-btn-icon"><SaveIcon size={13} color={isDirty ? '#422006' : '#1e293b'} /></span>
                                )}
                                {saving ? 'Saving...' : 'Save'}
                                {isDirty && !saving && <span className="hp-btn-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#422006' }} />}
                            </button>
                            {isPublished ? (
                                <button onClick={handleUnpublish} className="hp-btn hp-btn-unpublish"
                                    style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 700, background: 'linear-gradient(160deg,#f87171,#dc2626 65%,#b91c1c)', color: '#ffffff', border: 'none', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 4px rgba(127,29,29,0.3), 0 6px 16px rgba(220,38,38,0.4)' }}>
                                    <span className="hp-btn-icon"><EyeOffIcon size={13} color="#ffffff" /></span>
                                    Unpublish
                                </button>
                            ) : (
                                <button onClick={() => handleSave(true)} disabled={publishing} className="hp-btn hp-btn-publish"
                                    style={{ padding: '10px 24px', borderRadius: '12px', background: `linear-gradient(160deg,${tc.secondary},${tc.primary} 65%,${tc.dark})`, color: '#fff', border: 'none', fontSize: '12.5px', fontWeight: 700, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px ${hexToRgba(tc.dark, 0.3)}, 0 8px 20px ${hexToRgba(tc.primary, 0.5)}` }}>
                                    {publishing ? (
                                        <><svg style={{ animation: 'spin 1s linear infinite', width: '13px', height: '13px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.3 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" /></svg>Publishing...</>
                                    ) : (
                                        <><span className="hp-btn-icon"><RocketIcon size={13} color="#fff" /></span>Publish</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Section tabs ── */}
                <ScrollTabs colors={tc} style={{ marginBottom: '1.75rem' }}>
                    {HOME_TABS.map(t => (
                        <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                            style={{ padding: '10px 20px', borderRadius: '6px', border: activeTab === t.key ? `1.5px solid ${tc.primary}` : '1px solid #e2e8f0', fontSize: '13px', cursor: 'pointer', background: activeTab === t.key ? tc.light : '#ffffff', color: activeTab === t.key ? tc.primary : '#64748b', fontWeight: activeTab === t.key ? 600 : 400, display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.15s', boxShadow: activeTab === t.key ? `0 4px 12px ${hexToRgba(tc.primary, 0.15)}` : 'none' }}>
                            <span style={{ color: activeTab === t.key ? tc.primary : '#94a3b8' }}>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </ScrollTabs>

                {activeTab === 'hero' && <>
                {/* ── Hero Background ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15,52,96,0.3)' }}>
                            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Hero Background</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Video or rotating banner images behind the home page hero text</p>
                        </div>
                    </div>

                    {/* Type toggle */}
                    <div style={{ padding: '1.25rem 1.75rem 0' }}>
                        <div style={{ display: 'inline-flex', padding: '4px', background: '#f1f5f9', borderRadius: '8px', gap: '4px' }}>
                            <button onClick={() => handleChange('heroBgType', 'video')}
                                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', background: content.heroBgType === 'video' ? '#ffffff' : 'transparent', color: content.heroBgType === 'video' ? '#0f172a' : '#64748b', boxShadow: content.heroBgType === 'video' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <VideoIcon size={14} color={content.heroBgType === 'video' ? tc.primary : '#94a3b8'} /> Video
                            </button>
                            <button onClick={() => handleChange('heroBgType', 'banner')}
                                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', background: content.heroBgType === 'banner' ? '#ffffff' : 'transparent', color: content.heroBgType === 'banner' ? '#0f172a' : '#64748b', boxShadow: content.heroBgType === 'banner' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <BannerIcon size={14} color={content.heroBgType === 'banner' ? tc.primary : '#94a3b8'} /> Banner Slideshow
                            </button>
                        </div>
                    </div>

                    {content.heroBgType === 'video' ? (
                        <div className="hp-2col" style={{ padding: '1.75rem 2rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Video Title (optional)</label>
                                    <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Enter Video Title" style={inputStyle} />
                                </div>
                                <div onClick={() => document.getElementById('heroVideoInput').click()}
                                    style={{ border: '1.5px dashed #e2e8f0', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: videoFile ? '#f8fafc' : '#fafafa' }}>
                                    {videoFile ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', marginBottom: '2px' }}>{videoFile.name}</p>
                                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB · Click to change</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><VideoIcon /></div>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Click to upload hero video</p>
                                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>MP4, WEBM, MOV · Max 5MB</p>
                                        </>
                                    )}
                                </div>
                                <input id="heroVideoInput" type="file" accept="video/mp4,video/webm,video/mov" onChange={handleVideoChange} style={{ display: 'none' }} />
                                <button onClick={handleVideoUpload} disabled={uploadingVideo || !videoFile}
                                    style={{ padding: '11px', background: uploadingVideo || !videoFile ? hexToRgba(tc.primary, 0.3) : `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: uploadingVideo || !videoFile ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {uploadingVideo ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Uploading...</> : <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Upload Hero Video</>}
                                </button>
                            </div>

                            <div>
                                {videoPreview || school?.hero_video_url ? (
                                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '0.5px solid #e2e8f0', position: 'relative' }}>
                                        <video src={videoPreview || school.hero_video_url} autoPlay muted loop playsInline style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                                        {!videoPreview && (
                                            <>
                                                <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', background: 'rgba(34,197,94,0.9)', borderRadius: '20px', fontSize: '11px', color: '#fff', fontWeight: 600 }}>Live ✓</div>
                                                <button type="button" onClick={handleVideoRemove} disabled={removingVideo}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', width: '26px', height: '26px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '50%', cursor: removingVideo ? 'wait' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Remove hero video">×</button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ height: '200px', background: '#f8fafc', borderRadius: '8px', border: '1.5px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <VideoIcon size={32} />
                                        <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>No video uploaded yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '1.75rem 2rem 2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                                    Upload up to {HERO_BANNERS_MAX} images — they'll auto-rotate with a fade every 3 seconds behind the hero text. Wide images (16:9 or wider) work best. You'll get a crop tool for each image (freely adjustable from every side) before it's added. JPG, PNG, WEBP · Max 1MB each.
                                </p>
                                <span style={{ fontSize: '11px', color: content.heroBanners.length >= HERO_BANNERS_MAX ? '#dc2626' : '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{content.heroBanners.length} / {HERO_BANNERS_MAX}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
                                {content.heroBanners.map((b, i) => (
                                    <div key={b.id} style={{
                                        position: 'relative', borderRadius: '10px', overflow: 'hidden',
                                        border: '1px solid #e2e8f0', height: '110px',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)', background: '#0f172a'
                                    }}>
                                        <img src={b.url} alt={`Banner ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

                                        {/* Top Controls: Recrop & Delete */}
                                        <div style={{ position: 'absolute', top: '6px', left: '6px', right: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                                            <button
                                                type="button"
                                                onClick={() => recropBanner(b)}
                                                title="Recrop this banner"
                                                style={{
                                                    padding: '3px 8px', borderRadius: '5px',
                                                    background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
                                                    color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)',
                                                    cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                                                }}
                                            >
                                                <CropIcon size={11} color="#ffffff" />
                                                <span>Recrop</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => removeBanner(b.id)}
                                                title="Delete banner"
                                                style={{
                                                    width: '22px', height: '22px', borderRadius: '50%',
                                                    background: 'rgba(239, 68, 68, 0.85)', backdropFilter: 'blur(4px)',
                                                    color: '#ffffff', border: 'none',
                                                    cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Bottom Bar: Badge + Reorder Left / Right */}
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            padding: '4px 8px',
                                            background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 70%, transparent 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            zIndex: 2,
                                        }}>
                                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#ffffff', background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '4px' }}>
                                                #{i + 1}
                                            </span>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <button
                                                    type="button"
                                                    disabled={i === 0}
                                                    onClick={() => moveBanner(i, -1)}
                                                    title="Move Left"
                                                    style={{
                                                        width: '22px', height: '22px', borderRadius: '4px',
                                                        background: i === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                                                        color: i === 0 ? 'rgba(255,255,255,0.35)' : '#ffffff',
                                                        border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '9px', fontWeight: 800,
                                                    }}
                                                >
                                                    ◀
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={i === content.heroBanners.length - 1}
                                                    onClick={() => moveBanner(i, 1)}
                                                    title="Move Right"
                                                    style={{
                                                        width: '22px', height: '22px', borderRadius: '4px',
                                                        background: i === content.heroBanners.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                                                        color: i === content.heroBanners.length - 1 ? 'rgba(255,255,255,0.35)' : '#ffffff',
                                                        border: 'none', cursor: i === content.heroBanners.length - 1 ? 'not-allowed' : 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '9px', fontWeight: 800,
                                                    }}
                                                >
                                                    ▶
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {content.heroBanners.length < HERO_BANNERS_MAX && (
                                    <div onClick={() => document.getElementById('heroBannerInput').click()}
                                        style={{ height: '110px', border: '1.5px dashed #e2e8f0', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: (uploadingImage && cropTarget === 'banner') ? 'not-allowed' : 'pointer', background: '#fafafa' }}>
                                        {(uploadingImage && cropTarget === 'banner') ? (
                                            <svg style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke={tc.primary} strokeWidth="4"/><path style={{ opacity: 0.75 }} fill={tc.primary} d="M4 12a8 8 0 018-8v8z"/></svg>
                                        ) : (
                                            <>
                                                <BannerIcon size={20} />
                                                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Add Banner(s)</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <input id="heroBannerInput" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={e => openImageCrop(e, 'banner')} style={{ display: 'none' }} />
                            {content.heroBanners.length === 0 && (
                                <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '10px' }}>No banners uploaded yet — until you add at least one, the video (or theme gradient) will show instead.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Announcement Ticker ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}`, flexShrink: 0 }}>
                                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Latest Announcement Ticker</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>Small autoscrolling strip on the home page linking to your latest announcement</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => handleChange('showAnnouncementTicker', !content.showAnnouncementTicker)}
                            style={{ width: '42px', height: '23px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: content.showAnnouncementTicker ? tc.primary : '#e2e8f0', position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0 }}>
                            <span style={{ position: 'absolute', top: '2.5px', left: content.showAnnouncementTicker ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                        </button>
                    </div>
                </div>

                {/* ── Hero Section ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Hero Section</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Main headline and subtext shown on home page</p>
                        </div>
                    </div>
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>School Name (shown in hero)</label>
                            <input type="text" value={school?.name || ''} disabled
                                style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Edit the name itself in Settings — pick its hero display color and font here.</p>
                            <ColorField label="School Name Color" value={content.schoolNameColor} defaultColor="#ffffff"
                                hint="Leave blank to keep the animated gradient effect; pick a color for a solid override."
                                onChange={val => handleChange('schoolNameColor', val)} />
                            <FontField label="School Name Font" value={content.schoolNameFont} onChange={val => handleChange('schoolNameFont', val)} />
                        </div>
                        <div>
    <label style={labelStyle}>School Tagline *</label>
    <RichTextEditor value={content.tagline} onChange={val => handleChange('tagline', val)}
        placeholder="Enter School Tagline"
        minHeight="60px"
        maxWidth="1070px" fontSize="20px" fontFamily="'Inter', system-ui, sans-serif" />
    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>This is the big headline on your home page — e.g. "Empowering Young Minds Since 1998"</p>
    <ColorField label="Tagline Color" value={content.taglineColor} defaultColor={tc.secondary}
        onChange={val => handleChange('taglineColor', val)} />
    <FontField label="Tagline Font" value={content.taglineFont} onChange={val => handleChange('taglineFont', val)} />
</div>
                        <div>
    <label style={labelStyle}>Sub Text</label>
    <RichTextEditor value={content.subText} onChange={val => handleChange('subText', val)}
        placeholder="Enter Sub Text"
        minHeight="80px"
        maxWidth="1070px" fontSize="18px" fontFamily="'Inter', system-ui, sans-serif" />
    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Supporting text below the tagline</p>
    <ColorField label="Sub Text Color" value={content.subTextColor} defaultColor="#ffffff"
        hint="Default renders at partial opacity; a custom color renders at full opacity."
        onChange={val => handleChange('subTextColor', val)} />
    <FontField label="Sub Text Font" value={content.subTextFont} onChange={val => handleChange('subTextFont', val)} />
</div>
                    </div>
                </div>
                </>}

                {activeTab === 'highlight' && <>
                {/* ── Homepage Highlight ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginTop: '1.25rem' }}>
                    <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Homepage Highlight</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional section shown below the hero — two feature photos plus a heading and description</p>
                        </div>
                    </div>
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="hp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <SingleImageUploadBox label="Photo 1 (main)" inputId="introImage1Input" url={content.introImage1} shield
                                uploading={uploadingImage && cropTarget === 'intro1'} tc={tc}
                                onSelect={e => openImageCrop(e, 'intro1')} onRemove={() => handleChange('introImage1', '')} />
                            <SingleImageUploadBox label="Photo 2 (overlapping)" inputId="introImage2Input" url={content.introImage2} shield
                                uploading={uploadingImage && cropTarget === 'intro2'} tc={tc}
                                onSelect={e => openImageCrop(e, 'intro2')} onRemove={() => handleChange('introImage2', '')} />
                        </div>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '-10px' }}>Portrait-oriented photos work best — the crop tool shows the shield-shaped frame they'll appear in on the public page.</p>
                        <div>
                            <label style={labelStyle}>Section Heading</label>
                            <input type="text" value={content.introHeading} onChange={e => handleChange('introHeading', e.target.value)}
                                placeholder="Enter section heading" style={inputStyle} />
                            <ColorField label="Heading Color" value={content.introHeadingColor} defaultColor={tc.primary}
                                onChange={val => handleChange('introHeadingColor', val)} />
                            <FontField label="Heading Font" value={content.introHeadingFont} onChange={val => handleChange('introHeadingFont', val)} />
                            <ItalicField checked={content.introHeadingItalic} onChange={val => handleChange('introHeadingItalic', val)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <RichTextEditor value={content.introDescription} onChange={val => handleChange('introDescription', val)}
                                placeholder="Enter description" minHeight="100px" fontSize="14px" fontFamily="'Inter', system-ui, sans-serif" />
                        </div>
                    </div>
                </div>
                </>}

                {activeTab === 'tour' && <>
                {/* ── School Tour (YouTube video) ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginTop: '1.25rem' }}>
                    <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                            <VideoIcon size={18} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>School Tour</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional section shown between Highlight and Campus Glimpses — embeds a YouTube video (e.g. a campus walkthrough)</p>
                        </div>
                    </div>
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={labelStyle}>Section Heading</label>
                            <input type="text" value={content.tourHeading} onChange={e => handleChange('tourHeading', e.target.value)}
                                placeholder="Enter section heading" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>YouTube Video URL</label>
                            <input type="text" value={content.tourYoutubeUrl} onChange={e => handleChange('tourYoutubeUrl', e.target.value)}
                                placeholder="Enter YouTube video link (e.g. https://youtu.be/...)" style={inputStyle} />
                            {content.tourYoutubeUrl && !getYoutubeEmbedUrl(content.tourYoutubeUrl) && (
                                <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px' }}>This doesn't look like a valid YouTube link.</p>
                            )}
                        </div>
                        {getYoutubeEmbedUrl(content.tourYoutubeUrl) ? (
                            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '0.5px solid #e2e8f0', aspectRatio: '16/9', maxWidth: '480px' }}>
                                <iframe src={getYoutubeEmbedUrl(content.tourYoutubeUrl)} title="School Tour preview" style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                            </div>
                        ) : (
                            <p style={{ fontSize: '11px', color: '#cbd5e1' }}>No video linked yet — this section stays hidden on the public page until you add a valid YouTube URL.</p>
                        )}
                    </div>
                </div>
                </>}

                {activeTab === 'campus' && <>
                {/* ── Campus Glimpses ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginTop: '1.25rem' }}>
                    <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Campus Glimpses</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Optional photo grid shown below the highlight section — up to {CAMPUS_IMAGES_MAX} photos</p>
                        </div>
                    </div>
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={labelStyle}>Heading</label>
                            <input type="text" value={content.campusHeading} onChange={e => handleChange('campusHeading', e.target.value)}
                                placeholder="Enter heading" style={inputStyle} />
                            <ColorField label="Heading Color" value={content.campusHeadingColor} defaultColor={tc.primary}
                                onChange={val => handleChange('campusHeadingColor', val)} />
                            <FontField label="Heading Font" value={content.campusHeadingFont} onChange={val => handleChange('campusHeadingFont', val)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Subtext</label>
                            <textarea value={content.campusSubtext} onChange={e => handleChange('campusSubtext', e.target.value)}
                                placeholder="Enter a short description" rows={2}
                                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <label style={{ ...labelStyle, marginBottom: 0 }}>Photos</label>
                                <span style={{ fontSize: '11px', color: content.campusImages.length >= CAMPUS_IMAGES_MAX ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>{content.campusImages.length} / {CAMPUS_IMAGES_MAX}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
                                {content.campusImages.map((img, i) => (
                                    <div key={img.id} style={{
                                        position: 'relative', borderRadius: '10px', overflow: 'hidden',
                                        border: '1px solid #e2e8f0', height: '110px',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)', background: '#0f172a'
                                    }}>
                                        <img src={img.url} alt={`Campus ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

                                        {/* Top Controls: Recrop & Delete */}
                                        <div style={{ position: 'absolute', top: '6px', left: '6px', right: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                                            <button
                                                type="button"
                                                onClick={() => recropCampusImage(img)}
                                                title="Recrop this photo"
                                                style={{
                                                    padding: '3px 8px', borderRadius: '5px',
                                                    background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
                                                    color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)',
                                                    cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                                                }}
                                            >
                                                <CropIcon size={11} color="#ffffff" />
                                                <span>Recrop</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => removeCampusImage(img.id)}
                                                title="Delete photo"
                                                style={{
                                                    width: '22px', height: '22px', borderRadius: '50%',
                                                    background: 'rgba(239, 68, 68, 0.85)', backdropFilter: 'blur(4px)',
                                                    color: '#ffffff', border: 'none',
                                                    cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Bottom Bar: Badge + Reorder Left / Right */}
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            padding: '4px 8px',
                                            background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 70%, transparent 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            zIndex: 2,
                                        }}>
                                            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#ffffff', background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '4px' }}>
                                                #{i + 1}
                                            </span>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <button
                                                    type="button"
                                                    disabled={i === 0}
                                                    onClick={() => moveCampusImage(i, -1)}
                                                    title="Move Left"
                                                    style={{
                                                        width: '22px', height: '22px', borderRadius: '4px',
                                                        background: i === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                                                        color: i === 0 ? 'rgba(255,255,255,0.35)' : '#ffffff',
                                                        border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '9px', fontWeight: 800,
                                                    }}
                                                >
                                                    ◀
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={i === content.campusImages.length - 1}
                                                    onClick={() => moveCampusImage(i, 1)}
                                                    title="Move Right"
                                                    style={{
                                                        width: '22px', height: '22px', borderRadius: '4px',
                                                        background: i === content.campusImages.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                                                        color: i === content.campusImages.length - 1 ? 'rgba(255,255,255,0.35)' : '#ffffff',
                                                        border: 'none', cursor: i === content.campusImages.length - 1 ? 'not-allowed' : 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '9px', fontWeight: 800,
                                                    }}
                                                >
                                                    ▶
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {content.campusImages.length < CAMPUS_IMAGES_MAX && (
                                    <div onClick={() => document.getElementById('campusImagesInput').click()}
                                        style={{ height: '110px', border: '1.5px dashed #e2e8f0', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: (uploadingImage && cropTarget === 'campus') ? 'not-allowed' : 'pointer', background: '#fafafa' }}>
                                        {(uploadingImage && cropTarget === 'campus') ? (
                                            <svg style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke={tc.primary} strokeWidth="4" /><path style={{ opacity: 0.75 }} fill={tc.primary} d="M4 12a8 8 0 018-8v8z" /></svg>
                                        ) : (
                                            <>
                                                <BannerIcon size={20} />
                                                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Add Photo(s)</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <input id="campusImagesInput" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={e => openImageCrop(e, 'campus')} style={{ display: 'none' }} />
                            {content.campusImages.length === 0 && (
                                <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '10px' }}>No photos uploaded yet — this section stays hidden on the public page until you add at least one.</p>
                            )}
                        </div>
                    </div>
                </div>
                </>}

                {activeTab === 'testimonials' && <>
                {/* ── Testimonials ── */}
                <div className="hp-section" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '1.25rem 1.75rem', borderBottom: '0.5px solid #f8fafc', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '1px' }}>Testimonials</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>What parents and visitors say — shown below Campus Glimpses on the home page</p>
                        </div>
                    </div>
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Heading</label>
                            <input type="text" value={content.testimonialsHeading} onChange={e => handleChange('testimonialsHeading', e.target.value)}
                                placeholder="Enter heading" style={inputStyle} />
                            <ColorField label="Heading Color" value={content.testimonialsHeadingColor} defaultColor={tc.primary}
                                onChange={val => handleChange('testimonialsHeadingColor', val)} />
                            <FontField label="Heading Font" value={content.testimonialsHeadingFont} onChange={val => handleChange('testimonialsHeadingFont', val)} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', margin: '1.25rem 0' }}>
                    <button onClick={addTestimonial}
                        style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                        + Add Testimonial
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {content.testimonials.map((t, idx) => (
                        <TestimonialEntryCard key={t.id} tc={tc} testimonial={t} index={idx} length={content.testimonials.length}
                            onMove={(i, dir) => handleChange('testimonials', moveItem(content.testimonials, i, dir))}
                            onUpdate={(field, val) => updateTestimonial(idx, field, val)}
                            onRemove={() => removeTestimonial(idx)}
                            onUploadPhoto={(file) => uploadTestimonialPhoto(idx, t.id, file)}
                            uploading={testimonialUploading[t.id]}
                        />
                    ))}
                    {content.testimonials.length === 0 && (
                        <p style={{ fontSize: '11px', color: '#cbd5e1' }}>No testimonials added yet — this section stays hidden on the public page until you add at least one.</p>
                    )}
                </div>
                </>}

            </div>

            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={(cropTarget === 'intro1' || cropTarget === 'intro2') ? SHIELD_ASPECT : null}
                    maskShape={(cropTarget === 'intro1' || cropTarget === 'intro2') ? 'shield' : undefined}
                    onCancel={() => { setCropSrc(null); setImageQueue([]); }}
                    onCropComplete={onImageCropConfirmed}
                />
            )}
        </>
    );
};

export default HomePage;
