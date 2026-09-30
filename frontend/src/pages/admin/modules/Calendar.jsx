import { useEffect, useState } from 'react';
import { getModuleContentApi, saveModuleContentApi, togglePublishApi } from '../../../api/content.api';
import ModuleActionButtons from '../../../components/admin/ModuleActionButtons';
import RichTextEditor from '../../../components/common/RichTextEditor';
import ItalicToggle from '../../../components/common/ItalicToggle';
import HeadingStyleField from '../../../components/common/HeadingStyleField';
import useSchoolStore from '../../../store/schoolStore';
import { parseDate, toDateKey } from '../../../utils/dateTimeFormat';
import toast from 'react-hot-toast';

const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

export const CATEGORY_OPTIONS = ['Holiday', 'Exam', 'PTM', 'Event', 'Other'];
const CATEGORY_COLORS = { Holiday: '#059669', Exam: '#dc2626', PTM: '#2563eb', Event: '#7c3aed', Other: '#64748b' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const buildMonthGrid = (year, month) => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
};

const defaultContent = { heading: '', description: '', items: [] };

const Calendar = () => {
    const { tc, bc } = useSchoolStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [content, setContent] = useState(defaultContent);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setDate(1); return d; });
    const [selectedDayKey, setSelectedDayKey] = useState(null);

    useEffect(() => { fetchContent(); }, []);

    const fetchContent = async () => {
        try {
            const res = await getModuleContentApi('calendar');
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
            await saveModuleContentApi('calendar', content, publish ? 1 : 0);
            setSavedSnapshot(JSON.stringify(content));
            if (publish) {
                setIsPublished(true);
                toast.success('Calendar published! 🎉');
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
            await togglePublishApi('calendar', 0);
            setIsPublished(false);
            toast.success('Unpublished');
        } catch (e) { toast.error('Failed'); }
    };

    const updateField = (field, value) => setContent(prev => ({ ...prev, [field]: value }));

    const addEventForDate = (dateKey) => {
        const newItem = { id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: '', date: dateKey, category: 'Event', note: '' };
        updateField('items', [newItem, ...content.items]);
    };
    const updateItemById = (id, field, val) => {
        updateField('items', content.items.map(it => it.id === id ? { ...it, [field]: val } : it));
    };
    const removeItemById = (id) => {
        updateField('items', content.items.filter(it => it.id !== id));
    };

    const goMonth = (delta) => setViewDate(d => { const nd = new Date(d); nd.setMonth(nd.getMonth() + delta); return nd; });

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

    const itemsByDate = {};
    content.items.forEach(item => {
        const d = parseDate(item.date);
        if (!d) return;
        const key = toDateKey(d);
        (itemsByDate[key] = itemsByDate[key] || []).push(item);
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const grid = buildMonthGrid(year, month);
    const todayKey = toDateKey(new Date());
    const dayItemsForModal = selectedDayKey ? (itemsByDate[selectedDayKey] || []) : [];

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
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalIn { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .calendar-section { animation: fadeInUp 0.35s ease forwards; }
                .calendar-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .admin-cal-nav-btn { transition: background 0.18s ease, transform 0.18s ease; }
                .admin-cal-nav-btn:hover { background: ${tc.primary}14 !important; transform: scale(1.06); }
                .admin-cal-day { transition: background 0.15s ease, box-shadow 0.15s ease; }
                .admin-cal-day:hover { background: #f8fafc !important; box-shadow: inset 0 0 0 1px #e5e9f0; }
                .calendar-btn { transition: transform 0.18s ease, box-shadow 0.18s ease; }
                .calendar-btn:hover { transform: translateY(-1px); }
                .calendar-remove { transition: transform 0.18s ease, background 0.18s ease; }
                .calendar-remove:hover { transform: scale(1.08); background: #fee2e2; }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .calendar-hero-inner { gap: 12px !important; }
                    .calendar-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .calendar-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .calendar-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .calendar-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .calendar-status-badge { padding: 4px 9px !important; }
                    .calendar-status-badge span { font-size: 9.5px !important; }
                    .calendar-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                    .calendar-picker-head { flex-wrap: wrap !important; }
                }
            `}</style>

            <div style={{ fontFamily: 'system-ui, sans-serif', background: bc.surface, margin: '-24px', padding: '24px', minHeight: '100vh' }}>

                {/* Hero Header */}
                <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
                    <div className="calendar-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div className="calendar-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div>
                                <p className="calendar-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Dynamic / Event Calendar</p>
                                <h1 className="calendar-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Event Calendar</h1>
                                <p className="calendar-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                                    Mark holidays, exams, PTMs and important dates. They'll show up on a month-view calendar on your public site.
                                </p>
                            </div>
                            <div className="calendar-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{isPublished ? 'Published' : 'Draft'}</span>
                            </div>
                        </div>
                        <div className="calendar-hero-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <ModuleActionButtons
                                tc={tc}
                                moduleKey="calendar"
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

                <div className="calendar-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Top section — description RTE now fills the card's full width instead of
                        being capped at 818px, which used to leave dead space on both sides. */}
                    <div style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div>
                            <label style={labelStyle}>Heading</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="calendar-input" type="text" value={content.heading} onChange={e => updateField('heading', e.target.value)}
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
                                placeholder="A short note about the school's academic calendar..." minHeight="120px"
                                fontSize="15px" />
                        </div>
                    </div>

                    {/* Pick-a-date calendar */}
                    <div style={{ background: '#ffffff', border: '1px solid #eef1f6', borderRadius: '16px', padding: '1.75rem 2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div className="calendar-picker-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <label style={{ ...labelStyle, marginBottom: '4px' }}>Pick A Date</label>
                                <p style={{ fontSize: '12.5px', color: '#94a3b8' }}>Click any day below to add or manage events for that date.</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button onClick={() => goMonth(-1)} className="admin-cal-nav-btn"
                                    style={{ width: '32px', height: '32px', borderRadius: '9px', border: '1px solid #e5e9f0', background: 'transparent', cursor: 'pointer', fontSize: '15px', color: '#334155' }}>
                                    ‹
                                </button>
                                <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', minWidth: '128px', textAlign: 'center' }}>{MONTH_NAMES[month]} {year}</span>
                                <button onClick={() => goMonth(1)} className="admin-cal-nav-btn"
                                    style={{ width: '32px', height: '32px', borderRadius: '9px', border: '1px solid #e5e9f0', background: 'transparent', cursor: 'pointer', fontSize: '15px', color: '#334155' }}>
                                    ›
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
                            {WEEKDAYS.map(w => (
                                <div key={w} style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{w}</div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#eef1f6', border: '1.5px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
                            {grid.map((day, i) => {
                                if (!day) return <div key={i} style={{ background: '#fafbfc', minHeight: '62px' }}></div>;
                                const key = toDateKey(new Date(year, month, day));
                                const dayItems = itemsByDate[key] || [];
                                const isToday = key === todayKey;
                                const visibleItems = dayItems.slice(0, 2);
                                const extraCount = dayItems.length - visibleItems.length;
                                return (
                                    <button key={i} onClick={() => setSelectedDayKey(key)} className="admin-cal-day"
                                        style={{
                                            minHeight: '62px', display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                                            padding: '5px 4px', gap: '2px', overflow: 'hidden', textAlign: 'left', cursor: 'pointer',
                                            border: 'none', boxShadow: isToday ? `inset 0 0 0 1.5px ${tc.primary}` : 'none',
                                            background: isToday ? `${tc.primary}0a` : '#ffffff',
                                        }}>
                                        <span style={{ fontSize: '12px', fontWeight: isToday ? 800 : 600, color: isToday ? tc.primary : '#334155', paddingLeft: '2px' }}>{day}</span>
                                        {visibleItems.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                                {visibleItems.map((it, di) => (
                                                    <span key={di} title={it.title}
                                                        style={{
                                                            fontSize: '9.5px', fontWeight: 600, color: '#ffffff',
                                                            background: CATEGORY_COLORS[it.category] || tc.primary,
                                                            borderRadius: '4px', padding: '2px 5px', lineHeight: 1.3,
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        }}>
                                                        {it.title || 'Untitled'}
                                                    </span>
                                                ))}
                                                {extraCount > 0 && (
                                                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, paddingLeft: '3px' }}>+{extraCount} more</span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Day events modal */}
            {selectedDayKey && (
                <DayEventsModal
                    dateKey={selectedDayKey}
                    items={dayItemsForModal}
                    tc={tc}
                    onAdd={() => addEventForDate(selectedDayKey)}
                    onUpdate={updateItemById}
                    onRemove={removeItemById}
                    onClose={() => setSelectedDayKey(null)}
                />
            )}
        </>
    );
};

// ── Day Events Modal — opened by clicking a date on the pick-a-date calendar; lets the
// admin add as many events as needed for that single day without hunting through the
// full date list below. ──
const DayEventsModal = ({ dateKey, items, tc, onAdd, onUpdate, onRemove, onClose }) => {
    const d = parseDate(dateKey);
    const label = d ? d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : dateKey;
    const rowInputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #e5e9f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' };

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.15s ease' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '18px', width: 'min(560px, 100%)', maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 70px rgba(15,23,42,0.35)', animation: 'modalIn 0.22s cubic-bezier(0.16,1,0.3,1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem 1.6rem', borderBottom: '1px solid #eef1f6' }}>
                    <div>
                        <p style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tc.primary, marginBottom: '4px' }}>Manage Events</p>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{label}</h3>
                    </div>
                    <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '9px', border: '1px solid #e5e9f0', background: '#f8fafc', color: '#64748b', fontSize: '16px', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ padding: '1.25rem 1.6rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.length === 0 ? (
                        <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>No events yet for this date — add one below.</p>
                    ) : items.map(item => (
                        <div key={item.id} style={{ border: '1px solid #eef1f6', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="text" value={item.title} onChange={e => onUpdate(item.id, 'title', e.target.value)} placeholder="Enter Title" style={rowInputStyle} />
                                <button className="calendar-remove" onClick={() => onRemove(item.id)} style={{ flexShrink: 0, background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '32px', height: '32px' }}>×</button>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select value={item.category} onChange={e => onUpdate(item.id, 'category', e.target.value)} style={{ ...rowInputStyle, width: '130px', cursor: 'pointer', color: CATEGORY_COLORS[item.category], fontWeight: 700, flexShrink: 0 }}>
                                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input type="text" value={item.note || ''} onChange={e => onUpdate(item.id, 'note', e.target.value)} placeholder="Note (optional)" style={rowInputStyle} />
                            </div>
                        </div>
                    ))}
                    <button onClick={onAdd}
                        style={{ padding: '11px 16px', background: '#ffffff', border: `1.5px dashed ${tc.primary}55`, borderRadius: '9px', fontSize: '13px', fontWeight: 600, color: tc.primary, cursor: 'pointer' }}>
                        + Add Event
                    </button>
                </div>

                <div style={{ padding: '1rem 1.6rem', borderTop: '1px solid #eef1f6', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose}
                        style={{ padding: '9px 20px', background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, color: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
