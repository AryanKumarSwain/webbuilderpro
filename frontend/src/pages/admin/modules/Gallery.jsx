import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi, uploadContentImageApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import ImageCropModal from '../../../components/common/ImageCropModal';
import useSchoolStore from '../../../store/schoolStore';
import toast from 'react-hot-toast';

const MAX_PHOTOS_PER_FOLDER = 16;

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

// ── Icons (SVG, no emojis) ──
const IconFolder = ({ size = 28, color = '#8b2252' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
);
const IconImage = ({ size = 16, color = '#94a3b8' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
);
const IconVideo = ({ size = 16, color = '#94a3b8' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55-2.27A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);
const IconPlus = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);
const IconClose = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const IconHome = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
    </svg>
);
const IconCheck = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const IconUpload = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);
const IconCrop = ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2v14a2 2 0 002 2h14" />
        <path d="M18 22V8a2 2 0 00-2-2H2" />
    </svg>
);
const IconSpinner = ({ size = 24, color = '#8b2252' }) => (
    <div style={{ width: size, height: size, border: '3px solid #f0c4c4', borderTop: `3px solid ${color}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
);

const defaultContent = {
    photoNodes: [],
    videoNodes: [],
};

const Gallery = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [activeTree, setActiveTree] = useState('photo');
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [uploading, setUploading] = useState({});
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [cropTarget, setCropTarget] = useState(null); // { mode: 'cover' | 'vidThumb' | 'recropPhoto', folderId?, videoId?, index?, src, isBlob? }

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('gallery');
            if (res.data) {
                const merged = { ...defaultContent, ...res.data.content };
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
            await saveModuleContentApi('gallery', content, publish ? 1 : 0);
            if (publish) {
                setSavedSnapshot(JSON.stringify(content));
                setIsPublished(true);
                toast.success('Gallery published!');
            } else {
                toast.success('Saved!');
            }
        } catch (e) {
            toast.error('Failed to save');
        } finally {
            setSaving(false); setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        try {
            await togglePublishApi('gallery', 0);
            setIsPublished(false);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed to unpublish'); }
    };

    const nodesKey = activeTree === 'photo' ? 'photoNodes' : 'videoNodes';
    const nodes = content[nodesKey] || [];

    const updateNodes = (newNodes) => setContent(prev => ({ ...prev, [nodesKey]: newNodes }));

   const createFolder = () => {
    if (!newFolderName.trim()) return;
    const siblingCount = nodes.filter(n => n.parentId === currentFolderId).length;
    const newFolder = { id: `f-${Date.now()}`, parentId: currentFolderId, type: 'folder', name: newFolderName.trim(), images: [], videos: [], coverImage: '', priority: siblingCount + 1, createdAt: new Date().toISOString() };
    updateNodes([...nodes, newFolder]);
    setNewFolderName('');
    setShowNewFolder(false);
    toast.success('Folder created');
};

    const renameFolder = (id, name) => updateNodes(nodes.map(n => n.id === id ? { ...n, name } : n));
    const updateFolderPriority = (id, priority) => updateNodes(nodes.map(n => n.id === id ? { ...n, priority } : n));

    const deleteFolder = (id) => {
        const idsToDelete = new Set([id]);
        let changed = true;
        while (changed) {
            changed = false;
            nodes.forEach(n => {
                if (idsToDelete.has(n.parentId) && !idsToDelete.has(n.id)) {
                    idsToDelete.add(n.id);
                    changed = true;
                }
            });
        }
        updateNodes(nodes.filter(n => !idsToDelete.has(n.id)));
        toast.success('Folder deleted');
    };

    const getFolder = (id) => nodes.find(n => n.id === id);
    // Priority decides display order (both here and on the public site) — 1 shows first.
    // Folders without a priority (legacy data) sort after all prioritized ones, in creation order.
    const childFolders = nodes
        .filter(n => n.parentId === currentFolderId)
        .sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));
    const currentFolder = currentFolderId ? getFolder(currentFolderId) : null;

    const breadcrumb = [];
    let cursor = currentFolderId;
    while (cursor) {
        const f = getFolder(cursor);
        if (!f) break;
        breadcrumb.unshift(f);
        cursor = f.parentId;
    }

    // ── Image ops ──
    // Multiple images upload directly without popping up a crop modal for each one.
    // Users can click "Crop" on any individual photo to re-crop it at any time.
    const uploadMultipleImages = async (files) => {
        if (!currentFolderId) { toast.error('Open a folder first to add photos'); return; }
        if (!files || files.length === 0) return;
        const current = currentFolder?.images || [];
        const room = MAX_PHOTOS_PER_FOLDER - current.length;
        if (room <= 0) {
            toast.error(`Maximum ${MAX_PHOTOS_PER_FOLDER} photos allowed per folder`);
            return;
        }
        const toUpload = files.slice(0, room);
        if (files.length > toUpload.length) {
            toast.error(`Only ${room} more photo(s) can be added (max ${MAX_PHOTOS_PER_FOLDER} per folder)`);
        }

        setUploading(prev => ({ ...prev, images: true }));
        const toastId = toast.loading(`Uploading ${toUpload.length} photo${toUpload.length > 1 ? 's' : ''}...`);

        try {
            const uploadedUrls = [];
            let failCount = 0;
            for (let i = 0; i < toUpload.length; i++) {
                const file = toUpload[i];
                if (toUpload.length > 1) {
                    toast.loading(`Uploading photo ${i + 1} of ${toUpload.length}...`, { id: toastId });
                }
                try {
                    const res = await uploadContentImageApi(file);
                    if (res?.data?.url) {
                        uploadedUrls.push(res.data.url);
                    }
                } catch (err) {
                    console.error('Failed to upload photo:', file.name, err);
                    failCount++;
                }
            }

            if (uploadedUrls.length > 0) {
                updateNodes(nodes.map(n => n.id === currentFolderId ? {
                    ...n,
                    images: [...(n.images || []), ...uploadedUrls]
                } : n));
            }

            if (failCount === 0) {
                toast.success(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} uploaded!`, { id: toastId });
            } else if (uploadedUrls.length > 0) {
                toast.success(`${uploadedUrls.length} uploaded, ${failCount} failed`, { id: toastId });
            } else {
                toast.error('Failed to upload photos', { id: toastId });
            }
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload photos', { id: toastId });
        } finally {
            setUploading(prev => ({ ...prev, images: false }));
        }
    };

    const handleRecropPhoto = async (index, imageUrl) => {
        try {
            const res = await fetch(imageUrl, { mode: 'cors' });
            const blob = await res.blob();
            const objUrl = URL.createObjectURL(blob);
            setCropTarget({ mode: 'recropPhoto', index, folderId: currentFolderId, src: objUrl, isBlob: true });
        } catch (e) {
            const sep = imageUrl.includes('?') ? '&' : '?';
            setCropTarget({ mode: 'recropPhoto', index, folderId: currentFolderId, src: `${imageUrl}${sep}t=${Date.now()}` });
        }
    };

    const handleRecropCover = async (folderId, imageUrl) => {
        try {
            const res = await fetch(imageUrl, { mode: 'cors' });
            const blob = await res.blob();
            const objUrl = URL.createObjectURL(blob);
            setCropTarget({ mode: 'cover', folderId, src: objUrl, isBlob: true });
        } catch (e) {
            const sep = imageUrl.includes('?') ? '&' : '?';
            setCropTarget({ mode: 'cover', folderId, src: `${imageUrl}${sep}t=${Date.now()}` });
        }
    };

    const replacePhoto = async (folderId, photoIndex, file) => {
        setUploading(prev => ({ ...prev, [`photo-${photoIndex}`]: true }));
        const toastId = toast.loading('Updating photo...');
        try {
            const res = await uploadContentImageApi(file);
            updateNodes(nodes.map(n => {
                if (n.id !== folderId) return n;
                const images = [...(n.images || [])];
                images[photoIndex] = res.data.url;
                return { ...n, images };
            }));
            toast.success('Photo re-cropped successfully!', { id: toastId });
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to update cropped photo', { id: toastId });
        } finally {
            setUploading(prev => ({ ...prev, [`photo-${photoIndex}`]: false }));
        }
    };

    const uploadFolderCover = async (folderId, file) => {
        setUploading(prev => ({ ...prev, [`cover-${folderId}`]: true }));
        try {
            const res = await uploadContentImageApi(file);
            updateNodes(nodes.map(n => n.id === folderId ? { ...n, coverImage: res.data.url } : n));
            toast.success('Cover image set');
        } catch (e) { toast.error(e?.response?.data?.message || 'Failed to upload'); }
        finally { setUploading(prev => ({ ...prev, [`cover-${folderId}`]: false })); }
    };

    // ── Crop confirm handler — shared by folder covers, re-cropped gallery photos, and video thumbnails ──
    const onCropConfirmed = async (croppedFile) => {
        const target = cropTarget;
        setCropTarget(null);
        if (target?.isBlob && target?.src) {
            try { URL.revokeObjectURL(target.src); } catch (_) {}
        }
        if (target.mode === 'cover') {
            await uploadFolderCover(target.folderId, croppedFile);
        } else if (target.mode === 'vidThumb') {
            await uploadVideoThumb(target.videoId, croppedFile);
        } else if (target.mode === 'recropPhoto') {
            await replacePhoto(target.folderId, target.index, croppedFile);
        }
    };

    const removeImage = (idx) => updateNodes(nodes.map(n => n.id === currentFolderId ? { ...n, images: n.images.filter((_, i) => i !== idx) } : n));

    // ── Video ops ──
    // Each video item: { id, title, date, sourceType: 'youtube' | 'upload', youtubeUrl, videoUrl, thumbnail }
    const addVideo = () => {
        if (!currentFolderId) { toast.error('Open a folder first to add videos'); return; }
        updateNodes(nodes.map(n => n.id === currentFolderId
            ? { ...n, videos: [...(n.videos || []), { id: `vid-${Date.now()}`, title: '', date: '', sourceType: 'youtube', youtubeUrl: '', videoUrl: '', thumbnail: '' }] }
            : n));
    };

    const updateVideo = (videoId, field, value) => updateNodes(nodes.map(n => n.id === currentFolderId ? { ...n, videos: n.videos.map(v => v.id === videoId ? { ...v, [field]: value } : v) } : n));
    const removeVideo = (videoId) => updateNodes(nodes.map(n => n.id === currentFolderId ? { ...n, videos: n.videos.filter(v => v.id !== videoId) } : n));

    const uploadVideoThumb = async (videoId, file) => {
        setUploading(prev => ({ ...prev, [`vidthumb-${videoId}`]: true }));
        try {
            const res = await uploadContentImageApi(file);
            updateVideo(videoId, 'thumbnail', res.data.url);
            toast.success('Thumbnail uploaded');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Failed to upload thumbnail');
        } finally {
            setUploading(prev => ({ ...prev, [`vidthumb-${videoId}`]: false }));
        }
    };

    const inputStyle = {
        width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0',
        borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none',
        boxSizing: 'border-box', background: '#f8fafc', fontFamily: 'system-ui, sans-serif',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
    };

    const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <IconSpinner size={40} color={tc.primary} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .gallery-section { animation: fadeInUp 0.35s ease forwards; }
                .folder-card { transition: all 0.25s cubic-bezier(0.16,1,0.3,1); cursor: pointer; }
                .folder-card:hover { transform: translateY(-5px); background: #ffffff !important; border-color: ${hexToRgba(tc.primary, 0.25)} !important; box-shadow: 0 20px 36px rgba(15,23,42,0.14) !important; }
                .folder-cover-img { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1); }
                .folder-card:hover .folder-cover-img { transform: scale(1.08); }
                .folder-cover-overlay { transition: opacity 0.25s ease; }
                .folder-card:hover .folder-cover-overlay { opacity: 1; }
                .folder-action-btn { opacity: 0; transform: translateY(4px); transition: all 0.2s ease; }
                .folder-card:hover .folder-action-btn { opacity: 1; transform: translateY(0); }
                .crumb:hover { color: ${tc.primary} !important; cursor: pointer; }
                .source-toggle { transition: all 0.15s; cursor: pointer; }
                input[type=text]:focus, input[type=date]:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .gallery-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .gallery-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .gallery-hero-inner { gap: 12px !important; }
                    .gallery-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .gallery-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .gallery-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .gallery-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .gallery-status-badge { padding: 4px 9px !important; }
                    .gallery-status-badge span { font-size: 9.5px !important; }
                    .gallery-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                    .gallery-photo-grid { grid-template-columns: repeat(3, 1fr) !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* ── Hero Header ── */}
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="gallery-hero-orb" style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
                    <div className="gallery-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="gallery-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div className="gallery-hero-item">
                                <p className="gallery-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Gallery</p>
                                <h1 className="gallery-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Photo & Video Gallery</h1>
                                <p className="gallery-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                    Organize photos and videos in nested folders — just like on your computer.
                                </p>
                            </div>
                            <div className="gallery-hero-item gallery-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{isPublished ? 'Published' : 'Draft'}</span>
                            </div>
                        </div>
                        <div className="gallery-hero-item gallery-hero-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <ModuleActionButtons
                                tc={tc}
                                moduleKey="gallery"
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

                {/* ── Tree Switcher ── */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                    {[{ key: 'photo', label: 'Photo Gallery', Icon: IconImage }, { key: 'video', label: 'Video Gallery', Icon: IconVideo }].map(t => (
                        <button key={t.key} onClick={() => { setActiveTree(t.key); setCurrentFolderId(null); }}
                            style={{ padding: '10px 20px', borderRadius: '10px', border: activeTree === t.key ? `1.5px solid ${tc.primary}` : '1px solid #e5e7eb', fontSize: '13px', cursor: 'pointer', background: activeTree === t.key ? tc.light : '#ffffff', color: activeTree === t.key ? tc.primary : '#64748b', fontWeight: activeTree === t.key ? 600 : 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <t.Icon size={16} color={activeTree === t.key ? tc.primary : '#94a3b8'} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Breadcrumb ── */}
                <div className="gallery-section" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span className="crumb" onClick={() => setCurrentFolderId(null)} style={{ fontSize: '13px', color: !currentFolderId ? tc.primary : '#64748b', fontWeight: !currentFolderId ? 600 : 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconHome size={13} color={!currentFolderId ? tc.primary : '#94a3b8'} /> Root
                    </span>
                    {breadcrumb.map(f => (
                        <span key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>/</span>
                            <span className="crumb" onClick={() => setCurrentFolderId(f.id)} style={{ fontSize: '13px', color: f.id === currentFolderId ? tc.primary : '#64748b', fontWeight: f.id === currentFolderId ? 600 : 500 }}>
                                {f.name}
                            </span>
                        </span>
                    ))}
                </div>

                {/* ── Folder grid + new folder ── */}
                <div className="gallery-section" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '2rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>Folders <span style={{ color: '#94a3b8', fontWeight: 500 }}>({childFolders.length})</span></p>
                            <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '3px' }}>Set the # priority on a folder's cover to control its order — 1 shows first on the public gallery. Cover image: landscape (4:3) works best · JPG, PNG, WEBP · Max 1MB.</p>
                        </div>
                        <button onClick={() => setShowNewFolder(true)} disabled={showNewFolder}
                            style={{ padding: '10px 18px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12.5px', fontWeight: 600, cursor: showNewFolder ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '7px', opacity: showNewFolder ? 0.5 : 1, boxShadow: `0 6px 16px ${hexToRgba(tc.primary, 0.28)}` }}>
                            <IconPlus size={12} /> New Folder
                        </button>
                    </div>

                    {childFolders.length === 0 && !showNewFolder ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: `linear-gradient(135deg, ${hexToRgba(tc.primary, 0.1)}, ${hexToRgba(tc.secondary, 0.14)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <IconFolder size={28} color={tc.primary} />
                            </div>
                            <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '16px', fontWeight: 500 }}>No folders here yet</p>
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Create one to organize {activeTree === 'photo' ? 'photos' : 'videos'}</p>
                            <button onClick={() => setShowNewFolder(true)} style={{ marginTop: '18px', padding: '9px 20px', background: tc.light, color: tc.primary, border: `1px solid ${hexToRgba(tc.primary, 0.25)}`, borderRadius: '10px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <IconPlus size={11} /> Create Folder
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '20px' }}>
                            {showNewFolder && (
                                <div style={{ borderRadius: '20px', border: `1.5px dashed ${hexToRgba(tc.primary, 0.4)}`, background: tc.light, padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '218px', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
                                            <IconFolder size={18} color={tc.primary} />
                                        </div>
                                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: tc.primary }}>New Folder</span>
                                    </div>
                                    <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                                        placeholder="Enter Folder Name" style={{ ...inputStyle, background: '#ffffff' }}
                                        onKeyDown={e => e.key === 'Enter' && createFolder()} autoFocus />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={createFolder} style={{ flex: 1, padding: '9px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Create</button>
                                        <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} style={{ padding: '9px 14px', background: '#ffffff', color: '#64748b', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                </div>
                            )}
                            {childFolders.map(f => {
                                const subCount = nodes.filter(n => n.parentId === f.id).length;
                                const itemCount = activeTree === 'photo' ? (f.images || []).length : (f.videos || []).length;
                                return (
                                    <div key={f.id} className="folder-card" onClick={() => setCurrentFolderId(f.id)}
                                        style={{ borderRadius: '22px', background: '#f3f4f8', border: '1px solid #eaecf2', boxShadow: '0 2px 10px rgba(15,23,42,0.05)', position: 'relative', padding: '10px' }}>

                                        {/* Cover — inset with a margin on every side, like a framed photo */}
                                        <div style={{ height: '150px', borderRadius: '15px', position: 'relative', overflow: 'hidden', background: f.coverImage ? '#f1f5f9' : `linear-gradient(135deg, ${hexToRgba(tc.primary, 0.12)}, ${hexToRgba(tc.secondary, 0.18)})` }}>
                                            {f.coverImage ? (
                                                <img src={f.coverImage} alt="" className="folder-cover-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <IconFolder size={36} color={hexToRgba(tc.primary, 0.4)} />
                                                </div>
                                            )}
                                            <div className="folder-cover-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)', opacity: 0 }}></div>

                                            {/* Priority badge — numbered chip, gradient-filled to match the rest of the admin UI */}
                                            <div onClick={e => e.stopPropagation()} title="Priority — lower number shows first on the public gallery"
                                                style={{ position: 'absolute', top: '9px', left: '9px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(10px)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(255,255,255,0.18)' }}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: `linear-gradient(135deg, ${tc.primary}, ${tc.secondary})`, boxShadow: `0 2px 6px ${hexToRgba(tc.primary, 0.5)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <input type="number" min="1" value={f.priority ?? ''} placeholder="–"
                                                        onChange={e => updateFolderPriority(f.id, e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '12.5px', fontWeight: 800, letterSpacing: '-0.2px', outline: 'none', padding: 0, textAlign: 'center', fontFamily: "'Inter', system-ui, sans-serif", MozAppearance: 'textfield' }} />
                                                </div>
                                                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', paddingRight: '4px' }}>Order</span>
                                            </div>

                                            {/* Delete — reveals on hover */}
                                            <button className="folder-action-btn" onClick={e => { e.stopPropagation(); if (window.confirm(`Delete folder "${f.name}" and everything inside it?`)) deleteFolder(f.id); }}
                                                style={{ position: 'absolute', top: '9px', right: '9px', width: '26px', height: '26px', background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '50%', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                                <IconClose size={10} />
                                            </button>

                                            {/* Set cover — reveals on hover */}
                                            <button className="folder-action-btn" onClick={e => { e.stopPropagation(); document.getElementById(`cover-${f.id}`).click(); }}
                                                style={{ position: 'absolute', bottom: '9px', right: '9px', padding: '6px 12px', background: 'rgba(255,255,255,0.95)', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {uploading[`cover-${f.id}`] ? <IconSpinner size={11} color={tc.primary} /> : <><IconImage size={11} color="#475569" /> {f.coverImage ? 'Change' : 'Set'} Cover</>}
                                            </button>
                                            {f.coverImage && (
                                                <>
                                                    <button className="folder-action-btn" onClick={e => { e.stopPropagation(); handleRecropCover(f.id, f.coverImage); }}
                                                        title="Re-crop cover"
                                                        style={{ position: 'absolute', bottom: '9px', right: '104px', width: '26px', height: '26px', background: 'rgba(255,255,255,0.95)', color: tc.primary, border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                                        <IconCrop size={11} color={tc.primary} />
                                                    </button>
                                                    <button className="folder-action-btn" onClick={e => { e.stopPropagation(); updateNodes(nodes.map(n => n.id === f.id ? { ...n, coverImage: '' } : n)); }}
                                                        title="Remove cover"
                                                        style={{ position: 'absolute', bottom: '9px', right: '136px', width: '26px', height: '26px', background: 'rgba(255,255,255,0.95)', color: '#ef4444', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                                        <IconClose size={10} />
                                                    </button>
                                                </>
                                            )}
                                            <input id={`cover-${f.id}`} type="file" accept="image/*"
                                                onClick={e => e.stopPropagation()}
                                                onChange={e => {
                                                    const file = e.target.files[0];
                                                    e.target.value = '';
                                                    if (file) setCropTarget({ mode: 'cover', folderId: f.id, src: URL.createObjectURL(file) });
                                                }}
                                                style={{ display: 'none' }} />
                                        </div>

                                        {/* Caption — plain, minimal, like a filename label under a photo */}
                                        <div style={{ padding: '12px 4px 6px' }}>
                                            <input type="text" value={f.name} onClick={e => e.stopPropagation()} onChange={e => renameFolder(f.id, e.target.value)}
                                                style={{ width: '100%', fontSize: '13.5px', fontWeight: 600, color: '#0f172a', border: 'none', background: 'transparent', outline: 'none', padding: 0, marginBottom: '4px', fontFamily: 'inherit' }} />
                                            <p style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 400, margin: 0 }}>
                                                {subCount > 0
                                                    ? `${subCount} subfolder${subCount > 1 ? 's' : ''}`
                                                    : `${itemCount} ${activeTree === 'photo' ? 'photo' : 'video'}${itemCount !== 1 ? 's' : ''}`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Current folder content ── */}
                {currentFolderId && currentFolder && (
                    <div className="gallery-section" style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>

                        {activeTree === 'photo' && (
                            <>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '1.25rem' }}>Photos in "{currentFolder.name}" <span style={{ color: '#94a3b8', fontWeight: 400 }}>({(currentFolder.images || []).length} / {MAX_PHOTOS_PER_FOLDER})</span></p>
                                <div className="gallery-photo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '1.25rem' }}>
                                    {(currentFolder.images || []).map((img, i) => (
                                        <div key={i} className="photo-card" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', background: '#0f172a', boxShadow: '0 2px 8px rgba(15,23,42,0.08)' }}>
                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

                                            {/* Top gradient overlay for action button contrast */}
                                            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '44px', background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)', pointerEvents: 'none' }}></div>

                                            {uploading[`photo-${i}`] && (
                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                                                    <IconSpinner size={24} color={tc.primary} />
                                                </div>
                                            )}

                                            {/* Re-crop button */}
                                            <button
                                                type="button"
                                                onClick={() => handleRecropPhoto(i, img)}
                                                title="Re-crop this photo"
                                                style={{
                                                    position: 'absolute',
                                                    top: '6px',
                                                    left: '6px',
                                                    padding: '4px 9px',
                                                    background: 'rgba(15,23,42,0.75)',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    backdropFilter: 'blur(6px)',
                                                    zIndex: 2,
                                                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = tc.primary; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.75)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                            >
                                                <IconCrop size={11} color="#fff" />
                                                <span>Crop</span>
                                            </button>

                                            {/* Delete button */}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                title="Delete photo"
                                                style={{
                                                    position: 'absolute',
                                                    top: '6px',
                                                    right: '6px',
                                                    width: '24px',
                                                    height: '24px',
                                                    background: 'rgba(15,23,42,0.75)',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backdropFilter: 'blur(6px)',
                                                    zIndex: 2,
                                                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.75)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                            >
                                                <IconClose size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {(currentFolder.images || []).length >= MAX_PHOTOS_PER_FOLDER ? (
                                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '0.75rem' }}>
                                        Maximum {MAX_PHOTOS_PER_FOLDER} photos added to this folder — remove one to add another.
                                    </p>
                                ) : (
                                    <div onClick={() => document.getElementById('img-upload').click()}
                                        style={{ border: '1.5px dashed #e5e7eb', borderRadius: '14px', padding: '1.75rem', textAlign: 'center', cursor: 'pointer', background: '#fafbfc' }}>
                                        {uploading.images ? <IconSpinner size={22} color={tc.primary} /> : (
                                            <>
                                                <IconUpload size={20} color="#94a3b8" />
                                                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Click to add photos (multiple allowed)</p>
                                                <p style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>All photos are uploaded directly. You can re-crop any photo at any time. Square photos work best · JPG, PNG, WEBP · Max 1MB each · Up to {MAX_PHOTOS_PER_FOLDER} photos per folder.</p>
                                            </>
                                        )}
                                    </div>
                                )}
                                <input id="img-upload" type="file" accept="image/*" multiple
                                    onChange={e => { const files = Array.from(e.target.files); e.target.value = ''; if (files.length > 0) uploadMultipleImages(files); }}
                                    style={{ display: 'none' }} />
                            </>
                        )}

                        {activeTree === 'video' && (
                            <>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Videos in "{currentFolder.name}" <span style={{ color: '#94a3b8', fontWeight: 400 }}>({(currentFolder.videos || []).length})</span></p>
                                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>Thumbnail: landscape (16:9) works best · JPG, PNG, WEBP · Max 1MB.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.25rem' }}>
                                    {(currentFolder.videos || []).map(v => {
                                        const thumbKey = `vidthumb-${v.id}`;
                                        return (
                                            <div key={v.id} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '1rem', background: '#fafbfc' }}>
                                                <div style={{ display: 'flex', gap: '14px' }}>
                                                    {/* Thumbnail */}
                                                    <div style={{ flexShrink: 0 }}>
                                                        <div onClick={() => document.getElementById(`vidthumb-input-${v.id}`).click()}
                                                            style={{
                                                                position: 'relative', width: '120px', height: '68px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                                                                background: v.thumbnail ? 'transparent' : '#f1f5f9',
                                                                border: v.thumbnail ? 'none' : '1.5px dashed #cbd5e1',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                            {uploading[thumbKey] ? (
                                                                <IconSpinner size={18} color={tc.primary} />
                                                            ) : v.thumbnail ? (
                                                                <>
                                                                    <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    <button onClick={e => { e.stopPropagation(); updateVideo(v.id, 'thumbnail', ''); }}
                                                                        style={{ position: 'absolute', top: '3px', right: '3px', width: '18px', height: '18px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        title="Remove thumbnail">
                                                                        <IconClose size={8} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', padding: '0 8px' }}>+ Thumbnail</span>
                                                            )}
                                                        </div>
                                                        <input id={`vidthumb-input-${v.id}`} type="file" accept="image/*"
                                                            onChange={e => {
                                                                const f = e.target.files[0];
                                                                e.target.value = '';
                                                                if (f) setCropTarget({ mode: 'vidThumb', videoId: v.id, src: URL.createObjectURL(f) });
                                                            }}
                                                            style={{ display: 'none' }} />
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                            <input type="text" value={v.title} onChange={e => updateVideo(v.id, 'title', e.target.value)} placeholder="Video Title" style={{ ...inputStyle, flex: 2 }} />
                                                            <input type="date" value={v.date} onChange={e => updateVideo(v.id, 'date', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                                            <button onClick={() => removeVideo(v.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', width: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <IconClose size={13} />
                                                            </button>
                                                        </div>

                                                        <input type="text" value={v.youtubeUrl} onChange={e => updateVideo(v.id, 'youtubeUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." style={inputStyle} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button onClick={addVideo} style={{ width: '100%', padding: '11px', background: 'transparent', border: '1.5px dashed #e5e7eb', borderRadius: '12px', fontSize: '13px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    <IconPlus size={12} /> Add Video
                                </button>
                            </>
                        )}
                    </div>
                )}

            </div>

            {cropTarget && (
                <ImageCropModal
                    imageSrc={cropTarget.src}
                    aspect={cropTarget.mode === 'cover' ? 4 / 3 : cropTarget.mode === 'vidThumb' ? 16 / 9 : null}
                    onCancel={() => {
                        if (cropTarget?.isBlob && cropTarget?.src) {
                            try { URL.revokeObjectURL(cropTarget.src); } catch (_) {}
                        }
                        setCropTarget(null);
                    }}
                    onCropComplete={onCropConfirmed}
                    accent={tc.primary}
                    accentLight={tc.secondary}
                />
            )}
        </>
    );
};

export default Gallery;