import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import OrientedImagesEditor from '../../../components/admin/OrientedImagesEditor';
import useSchoolStore from '../../../store/schoolStore';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const TAG_OPTIONS = ['General', 'Urgent', 'Event', 'Holiday', 'Exam Notice'];

const defaultContent = { heading: '', description: '', announcements: [] };

const Announcements = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('announcements');
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
            await saveModuleContentApi('announcements', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Announcements published! 🎉');
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
            await togglePublishApi('announcements', 0);
            setIsPublished(false);
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
                .announcements-section { animation: fadeInUp 0.35s ease forwards; }
                .announcements-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .announcement-card { animation: cardIn 0.4s cubic-bezier(0.16,1,0.3,1) both; transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease; }
                .announcement-card:hover { box-shadow: 0 10px 28px rgba(15,23,42,0.08); border-color: #e5e9f0; transform: translateY(-2px); }
                .announcements-addbtn { transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; }
                .announcements-addbtn:hover { transform: translateY(-1px); background: ${hexToRgba(tc.primary, 0.05)}; box-shadow: 0 4px 14px ${hexToRgba(tc.primary, 0.14)}; }
                .announcements-btn { transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; }
                .announcements-btn:hover { transform: translateY(-1px); }
                .announcements-pin:hover { color: ${tc.primary} !important; }
                .announcements-remove { transition: transform 0.18s ease, background 0.18s ease; }
                .announcements-remove:hover { transform: scale(1.08); background: #fee2e2; }
                @media (max-width: 480px) {
                    .announcements-date-grid { grid-template-columns: 1fr 1fr !important; }
                    .announcements-date-grid > div:last-child { grid-column: 1 / -1; }
                }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .announcements-hero-inner { gap: 12px !important; }
                    .announcements-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .announcements-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .announcements-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .announcements-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .announcements-status-badge { padding: 4px 9px !important; }
                    .announcements-status-badge span { font-size: 9.5px !important; }
                    .announcements-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="announcements-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="announcements-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div>
                                <p className="announcements-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Dynamic / Announcements</p>
                                <h1 className="announcements-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Announcements &amp; News</h1>
                                <p className="announcements-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                    Post school news, notices and updates for parents and students to see on the public site.
                                </p>
                            </div>
                            <div className="announcements-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{isPublished ? 'Published' : 'Draft'}</span>
                            </div>
                        </div>
                        <div className="announcements-hero-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <ModuleActionButtons
                                tc={tc}
                                moduleKey="announcements"
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

                <div className="announcements-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Top section — description RTE now fills the card's full width instead of
                        being capped at 818px, which used to leave dead space on both sides. */}
                    <div style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="announcements-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
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
                                placeholder="A short note about how parents/students can stay updated..." minHeight="120px"
                                fontSize="15px" />
                        </div>
                    </div>

                    {/* Add Announcement */}
                    <div style={{ display: 'flex' }}>
                        <button className="announcements-addbtn" onClick={() => updateField('announcements', [{
                            id: `ann-${Date.now()}`, title: '', date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), tag: 'General', body: '', images: [], pinned: false, tickerPriority: ''
                        }, ...content.announcements])}
                            style={{ padding: '11px 20px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                            + Add Announcement
                        </button>
                    </div>

                    {/* Announcement list */}
                    {content.announcements.length === 0 && (
                        <div style={{ background: '#ffffff', border: '1px dashed #e2e8f0', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>No announcements yet — click "+ Add Announcement" to post one.</p>
                        </div>
                    )}
                    {content.announcements.map((an, idx) => (
                        <AnnouncementCard key={an.id} announcement={an} delay={Math.min(idx * 0.05, 0.3)}
                            onUpdate={(field, val) => {
                                const updated = [...content.announcements];
                                updated[idx] = { ...updated[idx], [field]: val };
                                updateField('announcements', updated);
                            }}
                            onRemove={() => updateField('announcements', content.announcements.filter((_, i) => i !== idx))}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

// ── Announcement Card ──
const AnnouncementCard = ({ announcement, onUpdate, onRemove, delay = 0 }) => {
    const { tc } = useSchoolStore();
    const inputStyle = { width: '100%', padding: '10px 13px', border: '1px solid #e5e9f0', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', transition: 'border 0.2s, box-shadow 0.2s, background 0.2s' };
    const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div className="announcement-card" style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', animationDelay: `${delay}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '12px', flexWrap: 'wrap' }}>
                <label className="announcements-pin" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, color: announcement.pinned ? tc.primary : '#94a3b8', transition: 'color 0.2s ease' }}>
                    <input type="checkbox" checked={!!announcement.pinned} onChange={e => onUpdate('pinned', e.target.checked)} />
                    📌 Pin to top
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
                    title="Controls the order in the Home page ticker only — lower number shows first. Leave blank to fall back to Pin to top + date.">
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>Ticker Priority</span>
                    <input type="number" min="1" step="1" value={announcement.tickerPriority ?? ''}
                        onChange={e => onUpdate('tickerPriority', e.target.value)}
                        placeholder="Auto"
                        style={{ width: '64px', padding: '6px 8px', border: '1px solid #e5e9f0', borderRadius: '8px', fontSize: '12.5px', textAlign: 'center', color: '#0f172a', outline: 'none', background: '#f8fafc' }} />
                </div>
                <button className="announcements-remove" onClick={onRemove} style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <label style={labelStyle}>Title</label>
                    <input className="announcements-input" type="text" value={announcement.title} onChange={e => onUpdate('title', e.target.value)} placeholder="Enter Announcement Title" style={inputStyle} />
                </div>
                <div className="announcements-date-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={labelStyle}>Date</label>
                        <input className="announcements-input" type="date" value={announcement.date} onChange={e => onUpdate('date', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Time</label>
                        <input className="announcements-input" type="time" value={announcement.time || ''} onChange={e => onUpdate('time', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Tag</label>
                        <select className="announcements-input" value={announcement.tag} onChange={e => onUpdate('tag', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                            {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label style={labelStyle}>Details</label>
                    <RichTextEditor value={announcement.body} onChange={val => onUpdate('body', val)}
                        placeholder="Enter announcement details" minHeight="90px" fontSize="13px" />
                </div>
                <div>
                    <label style={labelStyle}>Image (optional)</label>
                    <OrientedImagesEditor images={announcement.images || []} onChange={val => onUpdate('images', val)} max={1} />
                </div>
            </div>
        </div>
    );
};

export default Announcements;
