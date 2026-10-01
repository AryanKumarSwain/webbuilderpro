import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicSchoolApi } from "../../api/school.api";
import { getPublicModuleContentApi } from "../../api/content.api";
import Navbar from "../../components/public/Navbar";
import Footer from "../../components/public/Footer";
import NotPublished from "../../components/public/NotPublished";
import { getThemeColors, getBaseColors, isModuleEnabled } from "../../constants/publicNav";
import { getFontFamily } from "../../constants/fonts";
import { parseDate, toDateKey, formatDate } from "../../utils/dateTimeFormat";
import { RTE_FONT_CSS, RTE_LIST_CSS } from "../../constants/rteContentStyles";

import { sanitizeHtml } from "../../utils/sanitizeHtml";
const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.65s ease ${delay}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
            {children}
        </div>
    );
};

const CATEGORY_COLORS = { Holiday: '#f59e0b', Exam: '#eab308', PTM: '#2563eb', Event: '#7c3aed', Other: '#d97706' };
const WORKING_DAY_COLOR = '#99edc3';
const SUNDAY_COLOR = '#dc2626';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── Simple line icons for the Calendar Stats panel — a calendar glyph for most
// categories, a ribbon/medal glyph for holiday-flavored ones. ──
const IconCalendar = ({ size = 16, color = '#0f172a' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
);
const IconRibbon = ({ size = 16, color = '#0f172a' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" /><path d="M9 13.5L7 22l5-3 5 3-2-8.5" />
    </svg>
);
const iconForCategory = (cat) => /holiday/i.test(cat || '') ? IconRibbon : IconCalendar;

const buildMonthGrid = (year, month) => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
};

const CalendarPublic = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [school, setSchool] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);
    const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setDate(1); return d; });
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null); // dateKey string or null
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [slug]);

    const fetchData = async () => {
        try {
            const res = await getPublicSchoolApi(slug);
            setSchool(res.data);
            if (res.data?.id) {
                const contentRes = await getPublicModuleContentApi(res.data.id, 'calendar');
                if (contentRes.data) setContent(contentRes.data);
            }
        } catch (e) {
            navigate('/school-not-found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid #f0c4c4', borderTop: '3px solid #8b2252', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!school) return null;

    const tc = getThemeColors(school.theme);
    const bc = getBaseColors(school.base_theme);

    if (!isModuleEnabled(school, 'calendar')) return <NotPublished tc={tc} slug={slug} label="Event Calendar" reason="disabled" />;
    if (!content) return <NotPublished tc={tc} slug={slug} label="Event Calendar" />;

    const items = (content.items || []).filter(i => i.title && i.date);
    const presentCategories = [...new Set(items.map(i => i.category).filter(Boolean))];

    const itemsByDate = {};
    items.forEach(item => {
        const d = parseDate(item.date);
        if (!d) return;
        const key = toDateKey(d);
        (itemsByDate[key] = itemsByDate[key] || []).push(item);
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const grid = buildMonthGrid(year, month);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = toDateKey(new Date());
    const isCurrentMonth = todayKey.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`;

    const monthItems = items
        .map(item => ({ item, d: parseDate(item.date) }))
        .filter(({ d }) => d && d.getFullYear() === year && d.getMonth() === month)
        .sort((a, b) => a.d - b.d);

    // ── Stat tiles — quick glance at what's happening this month, per category ──
    const monthStats = presentCategories
        .map(cat => ({ cat, count: monthItems.filter(({ item }) => item.category === cat).length }))
        .filter(s => s.count > 0);

    // ── Sidebar: either the selected day's events, or (if nothing selected) the
    // next upcoming dated items — falling back to the most recent past items if
    // the whole calendar is in the past (e.g. viewed after the academic year ends). ──
    const todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    const dated = items.map(item => ({ item, d: parseDate(item.date) })).filter(({ d }) => d);
    const futureItems = dated.filter(({ d }) => d >= todayD).sort((a, b) => a.d - b.d);
    const isUpcomingFallback = futureItems.length === 0;
    const sidebarFeed = (isUpcomingFallback ? [...dated].sort((a, b) => b.d - a.d) : futureItems)
        .filter(({ item }) => !activeCategory || item.category === activeCategory)
        .slice(0, 6);

    const selectedDayItems = selectedDay ? (itemsByDate[selectedDay] || []).filter(it => !activeCategory || it.category === activeCategory) : [];

    const goMonth = (delta) => { setSelectedDay(null); setViewDate(d => { const nd = new Date(d); nd.setMonth(nd.getMonth() + delta); return nd; }); };
    const goToday = () => { setSelectedDay(null); setViewDate(() => { const d = new Date(); d.setDate(1); return d; }); };
    const jumpToDate = (d) => { setViewDate(new Date(d.getFullYear(), d.getMonth(), 1)); setSelectedDay(toDateKey(d)); };
    const toggleCategory = (cat) => setActiveCategory(prev => prev === cat ? null : cat);

    return (
        <>
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html { scroll-behavior: smooth; }
                @keyframes spin { to { transform: rotate(360deg); } }
                body { background: ${bc.surface}; }
                .rte-content p { margin-bottom: 0.6em; }
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

                .cal-nav-btn:hover { background: ${tc.primary}16 !important; border-color: ${tc.primary}55 !important; }
                .cal-today-btn:hover { background: ${tc.primary}16 !important; }
                .cal-day { position: relative; cursor: default; transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; box-shadow: 0 1px 4px rgba(15,23,42,0.05); }
                .cal-day.has-events { cursor: pointer; }
                .cal-day.has-events:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 8px 20px rgba(15,23,42,0.12); z-index: 3; }
                .cal-dot { transition: opacity 0.15s ease, transform 0.15s ease; }
                .cal-chip { transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease; cursor: pointer; }
                .cal-chip:hover { transform: translateY(-1px); }
                .cal-side-row { transition: background 0.15s ease, padding-left 0.15s ease; cursor: pointer; }
                .cal-side-row:hover { background: #f8fafc; padding-left: 1.6rem !important; }
                @keyframes calGridIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
                .cal-grid-anim { animation: calGridIn 0.3s ease both; }
                @keyframes calPulse { 0%,100% { box-shadow: 0 0 0 0 ${tc.primary}55; } 50% { box-shadow: 0 0 0 5px ${tc.primary}00; } }
                .cal-today-ring { animation: calPulse 2.4s ease-in-out infinite; }

                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #f8fafc; }
                ::-webkit-scrollbar-thumb { background: ${tc.primary}50; border-radius: 3px; }

                .cal-layout { display: grid; grid-template-columns: 1fr 340px; gap: 28px; align-items: start; }
                @media (max-width: 880px) {
                    .cal-layout { grid-template-columns: 1fr; }
                    .cal-day-num { font-size: 11px !important; }
                }
                @media (max-width: 640px) {
                    .cal-container { padding: 1rem 0.6rem 6rem !important; }
                    .cal-card { padding: 12px 6px !important; border-radius: 16px !important; }
                    .cal-weekdays { gap: 3px !important; }
                    .cal-grid-anim { gap: 3px !important; }
                    .cal-day { min-height: 48px !important; padding: 4px 4px 3px !important; border-radius: 8px !important; }
                    .cal-legend-bar { padding: 8px 10px !important; border-radius: 10px !important; gap: 6px !important; overflow-x: auto !important; flex-wrap: nowrap !important; scrollbar-width: none !important; -webkit-overflow-scrolling: touch; }
                    .cal-legend-bar::-webkit-scrollbar { display: none !important; }
                    .cal-chip { padding: 4px 9px !important; white-space: nowrap !important; flex-shrink: 0 !important; }
                }
                @media (max-width: 480px) {
                    .cal-stat-tile { min-width: 84px !important; padding: 10px 12px !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bc.surface, minHeight: '100vh', overflowX: 'hidden' }}>

                {/* ── Navbar ── */}
                <Navbar school={school} slug={slug} tc={tc} scrollY={scrollY} activeKey="calendar" />

                {/* ── Header ── */}
                <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 60%, ${tc.dark} 100%)`, padding: 'calc(92px + 1.6rem) clamp(1.25rem,6vw,3rem) 0.75rem', textAlign: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
                    <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}35, transparent 70%)`, top: '-180px', right: '-100px' }}></div>
                    <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: `radial-gradient(circle, ${tc.secondary}25, transparent 70%)`, bottom: '-160px', left: '-90px' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{ fontFamily: content.headingFont ? getFontFamily(content.headingFont) : "'Playfair Display', Georgia, serif", fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: content.headingColor || '#ffffff', letterSpacing: '-1px', marginBottom: '10px', fontStyle: content.headingItalic ? 'italic' : 'normal' }}>
                            {content.heading || 'Event Calendar'}
                        </h1>
                        <div style={{ width: '44px', height: '3px', background: tc.secondary, margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>
                </div>

                {/* ── Description ── */}
                {content.description && (
                    <div style={{ padding: '3.5rem clamp(1.25rem,6vw,3rem) 0' }}>
                        <Reveal>
                            <div className="rte-content" style={{ maxWidth: '820px', margin: '0 auto', fontSize: '15px', color: '#475569', lineHeight: 1.9, textAlign: 'center' }}
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.description) }} />
                        </Reveal>
                    </div>
                )}

                {/* ── Calendar ── */}
                <div className="cal-container" style={{ padding: '1.5rem clamp(1.25rem,6vw,3rem) 6rem' }}>
                    <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

                        {/* Legend — colored pill per category, doubles as the filter control */}
                        {presentCategories.length > 0 && (
                            <Reveal>
                                <div className="cal-legend-bar" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '12px 18px', background: bc.card, border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '2px', flexShrink: 0 }}>Legend</span>
                                    {presentCategories.map(cat => {
                                        const color = CATEGORY_COLORS[cat] || tc.primary;
                                        const isActive = activeCategory === cat;
                                        const isDimmed = activeCategory && !isActive;
                                        return (
                                            <button key={cat} onClick={() => toggleCategory(cat)} className="cal-chip"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '7px',
                                                    padding: '5px 12px', borderRadius: '999px',
                                                    border: `1px solid ${isActive ? color : '#e2e8f0'}`,
                                                    background: isActive ? `${color}14` : '#ffffff',
                                                    opacity: isDimmed ? 0.45 : 1,
                                                    flexShrink: 0
                                                }}>
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }}></span>
                                                <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: 600 }}>{cat}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Reveal>
                        )}

                        <div className="cal-layout">
                            {/* ── Calendar card ── */}
                            <Reveal>
                                <div className="cal-card" style={{ background: bc.card, borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 14px 40px rgba(15,23,42,0.09)', padding: 'clamp(1.25rem,4vw,2rem) clamp(1rem,3vw,2.25rem)' }}>

                                    {/* Month navigator */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '10px' }}>
                                        <button onClick={() => goMonth(-1)} className="cal-nav-btn"
                                            style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #e5e9f0', background: 'transparent', cursor: 'pointer', fontSize: '16px', color: '#334155', transition: 'background 0.15s, border-color 0.15s', flexShrink: 0 }}>
                                            ‹
                                        </button>
                                        <div style={{ textAlign: 'center' }}>
                                            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(18px,3vw,23px)', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>{MONTH_NAMES[month]} {year}</h2>
                                            {!isCurrentMonth && (
                                                <button onClick={goToday} className="cal-today-btn"
                                                    style={{ marginTop: '3px', fontSize: '10.5px', fontWeight: 700, color: tc.primary, background: `${tc.primary}12`, border: 'none', borderRadius: '999px', padding: '2px 10px', cursor: 'pointer', letterSpacing: '0.03em' }}>
                                                    Jump to Today
                                                </button>
                                            )}
                                        </div>
                                        <button onClick={() => goMonth(1)} className="cal-nav-btn"
                                            style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #e5e9f0', background: 'transparent', cursor: 'pointer', fontSize: '16px', color: '#334155', transition: 'background 0.15s, border-color 0.15s', flexShrink: 0 }}>
                                            ›
                                        </button>
                                    </div>

                                    {/* Weekday header */}
                                    <div className="cal-weekdays" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
                                        {WEEKDAYS.map(w => (
                                            <div key={w} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: w === 'Sun' ? SUNDAY_COLOR : w === 'Sat' ? tc.primary : '#94a3b8', padding: '4px 0' }}>{w}</div>
                                        ))}
                                    </div>

                                    {/* Day grid */}
                                    <div key={`${year}-${month}`} className="cal-grid-anim" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                                        {grid.map((day, i) => {
                                            if (!day) return <div key={i} style={{ minHeight: 'clamp(52px,8vw,92px)' }}></div>;
                                            const key = toDateKey(new Date(year, month, day));
                                            const dayItems = (itemsByDate[key] || []).filter(it => !activeCategory || it.category === activeCategory);
                                            const hasAll = (itemsByDate[key] || []).length > 0;
                                            const isToday = key === todayKey;
                                            const isSunday = i % 7 === 0;
                                            const isSaturday = i % 7 === 6;
                                            const isWeekend = isSunday || isSaturday;
                                            const weekendColor = isSunday ? SUNDAY_COLOR : tc.primary;
                                            const isSelected = selectedDay === key;
                                            const visibleDots = dayItems.slice(0, 4);
                                            const extraCount = dayItems.length - visibleDots.length;
                                            const soloColor = dayItems.length === 1 ? (CATEGORY_COLORS[dayItems[0].category] || tc.primary) : null;
                                            const hasHoliday = dayItems.some(it => it.category === 'Holiday');
                                            const bgColor = hasHoliday ? CATEGORY_COLORS.Holiday : soloColor;
                                            return (
                                                <div key={i} className={`cal-day ${hasAll ? 'has-events' : ''} ${isToday ? 'cal-today-ring' : ''}`}
                                                    onClick={() => hasAll && setSelectedDay(isSelected ? null : key)}
                                                    title={dayItems.length ? dayItems.map(it => it.title).join(', ') : undefined}
                                                    style={{
                                                        position: 'relative',
                                                        minHeight: 'clamp(52px,8vw,92px)', display: 'flex', flexDirection: 'column',
                                                        alignItems: 'flex-start', padding: '7px 7px 5px', gap: '3px',
                                                        borderRadius: '10px', overflow: 'hidden',
                                                        border: isSelected ? `1.5px solid ${tc.primary}` : isToday ? `1.5px solid ${tc.primary}` : bgColor ? `1px solid ${bgColor}60` : isWeekend ? `1px solid ${weekendColor}35` : `1px solid ${WORKING_DAY_COLOR}`,
                                                        background: `linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%), ${bgColor ? `${bgColor}35` : isSelected ? `${tc.primary}14` : isToday ? `${tc.primary}0a` : isWeekend ? `${weekendColor}14` : `${WORKING_DAY_COLOR}55`}`,
                                                    }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: '20px' }}>
                                                        <span className="cal-day-num" style={{
                                                            fontSize: isToday ? '11.5px' : '13px', fontWeight: 800,
                                                            ...(isToday ? {
                                                                background: tc.primary, color: '#ffffff',
                                                                width: '21px', height: '21px', borderRadius: '50%',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                boxShadow: `0 2px 5px ${tc.primary}45`, flexShrink: 0
                                                            } : {
                                                                color: (!bgColor && isWeekend) ? `${weekendColor}cc` : '#1e293b'
                                                            })
                                                        }}>{day}</span>
                                                        {isToday && (
                                                            <span style={{ fontSize: '7px', fontWeight: 800, color: tc.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                Today
                                                            </span>
                                                        )}
                                                        {soloColor && !isToday && (
                                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 3px rgba(15,23,42,0.18)', flexShrink: 0 }}></span>
                                                        )}
                                                    </div>
                                                    {soloColor ? (
                                                        <span style={{
                                                            fontSize: '8.5px', fontWeight: 800, color: soloColor, textTransform: 'uppercase', letterSpacing: '0.02em',
                                                            maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        }}>{dayItems[0].category}</span>
                                                    ) : visibleDots.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', maxWidth: '100%' }}>
                                                            {visibleDots.map((it, di) => (
                                                                <span key={di} className="cal-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: CATEGORY_COLORS[it.category] || tc.primary, flexShrink: 0 }} />
                                                            ))}
                                                            {extraCount > 0 && <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#94a3b8', lineHeight: '5px' }}>+{extraCount}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                </div>
                            </Reveal>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* ── Calendar Stats ── */}
                                <Reveal delay={0.05}>
                                    <div style={{ background: bc.card, borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 14px 40px rgba(15,23,42,0.09)', overflow: 'hidden' }}>
                                        <div style={{ padding: '1.2rem 1.4rem 0.6rem' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0f172a' }}>Calendar Stats</span>
                                        </div>
                                        <div style={{ padding: '0.6rem 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${tc.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <IconCalendar size={16} color={tc.primary} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Days</div>
                                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{daysInMonth} Days</div>
                                                </div>
                                            </div>
                                            {monthStats.map(({ cat, count }) => {
                                                const color = CATEGORY_COLORS[cat] || tc.primary;
                                                const StatIcon = iconForCategory(cat);
                                                return (
                                                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: `${color}0d`, borderRadius: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <StatIcon size={16} color={color} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat}{count === 1 ? '' : 's'}</div>
                                                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{count} Day{count === 1 ? '' : 's'}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {monthStats.length === 0 && (
                                                <p style={{ fontSize: '12.5px', color: '#94a3b8', textAlign: 'center', padding: '0.5rem 0' }}>No dated entries this month.</p>
                                            )}
                                        </div>
                                        <button onClick={() => setShowInstructions(s => !s)}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.2rem', background: 'transparent', border: 'none', borderTop: '1px solid #eef1f6', cursor: 'pointer' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>ⓘ Instructions</span>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: tc.primary }}>{showInstructions ? 'Hide' : 'Show'}</span>
                                        </button>
                                        {showInstructions && (
                                            <div style={{ padding: '0 1.2rem 1.1rem' }}>
                                                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
                                                    Click a legend chip to filter the calendar by category. Click a highlighted day to see its full details below.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Reveal>

                            {/* ── Sidebar: selected day detail, or upcoming/recent feed ── */}
                            <Reveal delay={0.1}>
                                <div style={{ background: bc.card, borderRadius: '22px', border: '1px solid #e2e8f0', boxShadow: '0 14px 40px rgba(15,23,42,0.09)', overflow: 'hidden' }}>
                                    <div style={{ padding: '1.1rem 1.4rem', background: `linear-gradient(135deg,${tc.dark},${tc.primary})`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
                                            {selectedDay ? formatDate(selectedDay).month + ' ' + formatDate(selectedDay).day : (isUpcomingFallback ? 'Recent Dates' : 'Upcoming')}
                                        </span>
                                        {selectedDay && (
                                            <button onClick={() => setSelectedDay(null)} style={{ fontSize: '10.5px', fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '999px', padding: '3px 10px', cursor: 'pointer' }}>
                                                ← Back
                                            </button>
                                        )}
                                    </div>

                                    <div>
                                        {selectedDay ? (
                                            selectedDayItems.length === 0 ? (
                                                <div style={{ padding: '2rem 1.4rem', textAlign: 'center' }}>
                                                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>No dates match the selected filter for this day.</p>
                                                </div>
                                            ) : selectedDayItems.map((it, i) => {
                                                const color = CATEGORY_COLORS[it.category] || tc.primary;
                                                return (
                                                    <div key={it.id || i} style={{ padding: '0.9rem 1.4rem', borderBottom: i < selectedDayItems.length - 1 ? '1px solid #eef1f6' : 'none' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }}></span>
                                                            <span style={{ fontSize: '9.5px', fontWeight: 800, color, background: `${color}16`, padding: '3px 9px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{it.category}</span>
                                                        </div>
                                                        <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>{it.title}</div>
                                                        {it.note && <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px', lineHeight: 1.5 }}>{it.note}</div>}
                                                    </div>
                                                );
                                            })
                                        ) : sidebarFeed.length === 0 ? (
                                            <div style={{ padding: '2rem 1.4rem', textAlign: 'center' }}>
                                                <p style={{ fontSize: '13px', color: '#94a3b8' }}>No dates on the calendar yet.</p>
                                            </div>
                                        ) : sidebarFeed.map(({ item, d }, i) => {
                                            const { day, month: mon } = formatDate(item.date);
                                            const color = CATEGORY_COLORS[item.category] || tc.primary;
                                            return (
                                                <div key={item.id || i} className="cal-side-row" onClick={() => jumpToDate(d)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.85rem 1.4rem', borderBottom: i < sidebarFeed.length - 1 ? '1px solid #eef1f6' : 'none' }}>
                                                    <div style={{ flexShrink: 0, width: '44px', textAlign: 'center', background: `${color}14`, border: `1px solid ${color}30`, borderRadius: '10px', padding: '6px 0' }}>
                                                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{day}</div>
                                                        <div style={{ fontSize: '8px', fontWeight: 800, color, letterSpacing: '0.04em', marginTop: '3px', textTransform: 'uppercase' }}>{mon}</div>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, flexShrink: 0 }}></span>
                                                            <span style={{ fontSize: '10.5px', fontWeight: 700, color }}>{item.category}</span>
                                                        </div>
                                                    </div>
                                                    <svg width="14" height="14" fill="none" stroke="#cbd5e1" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Reveal>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Site Footer ── */}
                <Footer school={school} slug={slug} tc={tc} bgImage={school.footer_bg_url} />
            </div>
        </>
    );
};

export default CalendarPublic;
