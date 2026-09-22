import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/webbuilder-removebg-preview.png";
import schoolHeroBg from "../assets/school-hero-bg.jpg";
import previewSlide1 from "../assets/preview-slide-1.jpg";
import previewSlide2 from "../assets/preview-slide-2.jpg";
import previewSlide3 from "../assets/preview-slide-3.jpg";
import previewMobile1 from "../assets/preview-mobile-1.jpg";
import previewMobile2 from "../assets/preview-mobile-2.jpg";
import previewMobile3 from "../assets/preview-mobile-3.jpg";

// ── Scroll-triggered fade+slide-up, same IntersectionObserver pattern used on every public page ──
const useScrollReveal = () => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.15 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, visible];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
            ...style,
        }}>
            {children}
        </div>
    );
};

// ── Pop-in reveal (scale + fade) — used for cards, badges, anything that should feel like it's "popping" onto the page ──
const PopReveal = ({ children, delay = 0, style = {} }) => {
    const [ref, visible] = useScrollReveal();
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(16px)',
            transition: `opacity 0.55s cubic-bezier(0.34,1.56,0.64,1) ${delay}s, transform 0.55s cubic-bezier(0.34,1.56,0.64,1) ${delay}s`,
            ...style,
        }}>
            {children}
        </div>
    );
};

const BLUE = '#4169E1';
const BLUE_DARK = '#2541A8';
const BLUE_LIGHT = '#EDF1FD';
const GREY = '#3B3B3B';
const TEXT_MUTED_LIGHT = '#5B6270';
const TEXT_DARK = '#20242C';
const LIGHT_BG = '#F5F6FA';

// ── Simple isometric "school building" icon — pure SVG, two tone variants, reused as a
// floating hero accent and again (larger) in the closing CTA banner. ──
const IsoSchool = ({ size = 96, tone = 'blue' }) => {
    const top = tone === 'blue' ? '#93AAF0' : '#B7BBC2';
    const left = tone === 'blue' ? BLUE : '#8B8F97';
    const right = tone === 'blue' ? BLUE_DARK : GREY;
    const trim = tone === 'blue' ? BLUE_DARK : GREY;
    return (
        <svg width={size} height={size * 1.08} viewBox="0 0 120 130" fill="none">
            <polygon points="60,14 100,36 60,58 20,36" fill={top} />
            <polygon points="20,36 60,58 60,112 20,90" fill={left} />
            <polygon points="100,36 60,58 60,112 100,90" fill={right} />
            <polygon points="30,34 60,18 60,40 30,54" fill={trim} opacity="0.9" />
            <rect x="29" y="70" width="11" height="13" rx="1.5" fill="#ffffff" opacity="0.85" />
            <rect x="47" y="76" width="11" height="13" rx="1.5" fill="#ffffff" opacity="0.55" />
            <rect x="77" y="76" width="11" height="13" rx="1.5" fill="#ffffff" opacity="0.45" />
            <rect x="34" y="93" width="15" height="19" rx="1.5" fill="#ffffff" opacity="0.9" />
            <line x1="60" y1="14" x2="60" y2="1" stroke={trim} strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="60,1 73,5 60,9" fill={left} />
        </svg>
    );
};

const CheckIcon = ({ color = BLUE }) => (
    <svg width="15" height="15" fill="none" stroke={color} strokeWidth="2.4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
);

const PlayIcon = ({ color = BLUE }) => (
    <svg width="13" height="13" fill={color} viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
);

// ── Colourful, modern module chip with unique gradient, category tag, and vibrant hover effects ──
const ModuleChip = ({ m }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="lp-mod-chip"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                flexShrink: 0,
                width: '280px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                background: hovered ? '#ffffff' : 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
                border: `1.5px solid ${hovered ? m.gradient[0] : '#e5e9f2'}`,
                borderRadius: '16px',
                boxShadow: hovered
                    ? `0 16px 32px -4px ${m.glow}, 0 4px 12px rgba(15,23,42,0.06)`
                    : '0 4px 16px rgba(15, 23, 42, 0.04)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'default',
            }}
        >
            {/* Colourful gradient icon tile with matching ambient glow */}
            <div
                style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '13px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${m.gradient[0]}, ${m.gradient[1]})`,
                    boxShadow: `0 8px 18px ${m.glow}, inset 0 1.5px 1.5px rgba(255,255,255,0.4)`,
                    transform: hovered ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                <svg width="22" height="22" fill="none" stroke="#ffffff" strokeWidth="2" viewBox="0 0 24 24">{m.icon}</svg>
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 700,
                    color: hovered ? m.gradient[1] : '#0f1f4b',
                    marginBottom: '3px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'color 0.2s ease',
                }}>{m.title}</p>
                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.35,
                }}>{m.desc}</p>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: hovered ? m.lightBg : 'transparent',
                    color: hovered ? m.gradient[0] : '#cbd5e1',
                    opacity: hovered ? 1 : 0.45,
                    transform: hovered ? 'translateX(3px)' : 'translateX(0)',
                    transition: 'all 0.25s ease',
                    flexShrink: 0,
                }}
            >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </div>
        </div>
    );
};

// ── Module showcase data — each module has its own vibrant color palette, glow, and category tag ──
const MODULE_DATA = [
    { key: 'home', title: 'Home Page', desc: 'Hero banners & highlights', tag: 'Essential', gradient: ['#3b82f6', '#1d4ed8'], glow: 'rgba(59, 130, 246, 0.32)', lightBg: '#eff6ff', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { key: 'about', title: 'About Us', desc: 'Vision, mission & history', tag: 'Identity', gradient: ['#8b5cf6', '#6d28d9'], glow: 'rgba(139, 92, 246, 0.32)', lightBg: '#f5f3ff', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { key: 'fee', title: 'Fee Structure', desc: 'Class-wise fee tables', tag: 'Finance', gradient: ['#10b981', '#047857'], glow: 'rgba(16, 185, 129, 0.32)', lightBg: '#ecfdf5', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /> },
    { key: 'courses', title: 'Courses & Streams', desc: 'Every stream, explained', tag: 'Academic', gradient: ['#06b6d4', '#0284c7'], glow: 'rgba(6, 182, 212, 0.32)', lightBg: '#ecfeff', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
    { key: 'faculty', title: 'Faculty', desc: 'Meet the teaching staff', tag: 'Staff', gradient: ['#6366f1', '#4338ca'], glow: 'rgba(99, 102, 241, 0.32)', lightBg: '#eef2ff', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
    { key: 'infrastructure', title: 'Infrastructure', desc: 'Campus facilities showcase', tag: 'Campus', gradient: ['#14b8a6', '#0f766e'], glow: 'rgba(20, 184, 166, 0.32)', lightBg: '#f0fdfa', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
    { key: 'sports', title: 'Sports', desc: 'Events & certifications', tag: 'Athletics', gradient: ['#f97316', '#ea580c'], glow: 'rgba(249, 115, 22, 0.32)', lightBg: '#fff7ed', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { key: 'gallery', title: 'Gallery', desc: 'Photos & video albums', tag: 'Media', gradient: ['#ec4899', '#be185d'], glow: 'rgba(236, 72, 153, 0.32)', lightBg: '#fdf2f8', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    { key: 'achievements', title: 'Achievements', desc: 'Awards & recognitions', tag: 'Awards', gradient: ['#f59e0b', '#d97706'], glow: 'rgba(245, 158, 11, 0.32)', lightBg: '#fffbeb', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /> },
    { key: 'alumni', title: 'Alumni', desc: 'Success stories network', tag: 'Network', gradient: ['#2563eb', '#1e40af'], glow: 'rgba(37, 99, 235, 0.32)', lightBg: '#eff6ff', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /> },
    { key: 'testimonials', title: 'Testimonials', desc: 'What parents say', tag: 'Trust', gradient: ['#d946ef', '#9333ea'], glow: 'rgba(217, 70, 239, 0.32)', lightBg: '#fdf4ff', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
    { key: 'admissionProcedure', title: 'Admission Procedure', desc: 'Step-by-step process', tag: 'Process', gradient: ['#84cc16', '#4d7c0f'], glow: 'rgba(132, 204, 22, 0.32)', lightBg: '#f7fee7', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { key: 'bookList', title: 'Book List', desc: 'Class-wise book lists', tag: 'Syllabus', gradient: ['#d97706', '#92400e'], glow: 'rgba(217, 119, 6, 0.32)', lightBg: '#fffbeb', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
    { key: 'disclosure', title: 'Public Disclosure', desc: 'Mandatory CBSE info', tag: 'CBSE', gradient: ['#64748b', '#334155'], glow: 'rgba(100, 116, 139, 0.32)', lightBg: '#f8fafc', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { key: 'tc', title: 'TC Information', desc: 'Transfer certificates', tag: 'Official', gradient: ['#0d9488', '#115e59'], glow: 'rgba(13, 148, 136, 0.32)', lightBg: '#f0fdfa', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /> },
    { key: 'announcements', title: 'Announcements', desc: 'Latest school news', tag: 'Live Alerts', gradient: ['#ef4444', '#b91c1c'], glow: 'rgba(239, 68, 68, 0.32)', lightBg: '#fef2f2', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /> },
    { key: 'events', title: 'Events & Activities', desc: 'Upcoming & past events', tag: 'Campus', gradient: ['#f43f5e', '#e11d48'], glow: 'rgba(244, 63, 94, 0.32)', lightBg: '#fff1f2', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    { key: 'calendar', title: 'Event Calendar', desc: 'Academic year at a glance', tag: 'Planner', gradient: ['#4f46e5', '#3730a3'], glow: 'rgba(79, 70, 229, 0.32)', lightBg: '#eef2ff', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    { key: 'circulars', title: 'Circulars', desc: 'Official notices & PDFs', tag: 'Notices', gradient: ['#0284c7', '#0369a1'], glow: 'rgba(2, 132, 199, 0.32)', lightBg: '#f0f9ff', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> },
    { key: 'admission', title: 'Admission Enquiry', desc: 'Capture every lead', tag: 'Enquiry', gradient: ['#fb7185', '#e11d48'], glow: 'rgba(251, 113, 133, 0.32)', lightBg: '#fff1f2', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /> },
    { key: 'career', title: 'Career Enquiry', desc: 'Teacher job applications', tag: 'Hiring', gradient: ['#7c3aed', '#5b21b6'], glow: 'rgba(124, 58, 237, 0.32)', lightBg: '#f5f3ff', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
];

const MODULES_ROW_TOP = MODULE_DATA.slice(0, 11);
const MODULES_ROW_BOTTOM = MODULE_DATA.slice(11);

const ICON_GROUPS = [
    {
        heading: 'For Your Website',
        tagline: 'Delight parents and students with a fast, modern school website',
        cards: [
            {
                title: 'Custom Public Website',
                gradient: ['#1e3a8a', '#2563eb'],
                glow: 'rgba(37, 99, 235, 0.28)',
                cardBg: 'linear-gradient(160deg, #ffffff 40%, #eff6ff 100%)',
                borderColor: '#bfdbfe',
                desc: 'A professional public site for your school, ready in minutes — no coding required.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            },
            {
                title: 'Rich Content Modules',
                gradient: ['#5b21b6', '#7c3aed'],
                glow: 'rgba(124, 58, 237, 0.28)',
                cardBg: 'linear-gradient(160deg, #ffffff 40%, #f5f3ff 100%)',
                borderColor: '#ddd6fe',
                desc: 'Fee tables, galleries, events, and more — manage everything from one place.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            },
            {
                title: 'Smart Enquiry Forms',
                gradient: ['#c2410c', '#e15241'],
                glow: 'rgba(225, 82, 65, 0.28)',
                cardBg: 'linear-gradient(160deg, #ffffff 40%, #fff1f0 100%)',
                borderColor: '#fecdd3',
                desc: 'Admission and career forms that land straight in your inbox — no missed leads.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            },
        ],
    },
    {
        heading: 'For Your Operations',
        tagline: 'Automate daily school workflows with one clean, intuitive interface',
        cards: [
            {
                title: 'One Admin Dashboard',
                gradient: ['#065f46', '#059669'],
                glow: 'rgba(5, 150, 105, 0.28)',
                cardBg: 'linear-gradient(160deg, #ffffff 40%, #ecfdf5 100%)',
                borderColor: '#a7f3d0',
                desc: 'Every module, one clean dashboard your staff will actually enjoy using.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            },
            {
                title: 'Announcements & Calendar',
                gradient: ['#b45309', '#d97706'],
                glow: 'rgba(217, 119, 6, 0.28)',
                cardBg: 'linear-gradient(160deg, #ffffff 40%, #fffbeb 100%)',
                borderColor: '#fde68a',
                desc: 'Keep parents and students updated on holidays, exams, and events — automatically.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            },
            {
                title: 'Secure by Design',
                gradient: ['#0f766e', '#0d9488'],
                glow: 'rgba(13, 148, 136, 0.28)',
                cardBg: 'linear-gradient(160deg, #ffffff 40%, #f0fdfa 100%)',
                borderColor: '#99f6e4',
                desc: 'JWT-secured logins and tenant-isolated data, so every school\'s data stays its own.',
                icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            },
        ],
    },
];

const TRUST_CARDS = [
    {
        title: 'Room to Grow',
        tag: 'Flexible Scaling',
        desc: 'Scale smoothly as your student count expands — seamlessly upgrade from Base to Gold with extra modules and quota on demand.',
        perk: 'Instant tier upgrades',
        cardBg: 'linear-gradient(160deg, #ffffff 40%, #eff6ff 100%)',
        borderColor: '#bfdbfe',
        badgeBg: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
        badgeShadow: 'rgba(37, 99, 235, 0.28)',
        tagBg: '#dbeafe',
        tagColor: '#1d4ed8',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    },
    {
        title: 'Seriously Secure',
        tag: 'Tenant Isolation',
        desc: 'Enterprise-grade protection with JWT authentication, tenant isolation, and automated database backups for complete peace of mind.',
        perk: 'Zero data cross-leak',
        cardBg: 'linear-gradient(160deg, #ffffff 40%, #ecfdf5 100%)',
        borderColor: '#a7f3d0',
        badgeBg: 'linear-gradient(135deg, #047857, #059669)',
        badgeShadow: 'rgba(5, 150, 105, 0.28)',
        tagBg: '#d1fae5',
        tagColor: '#047857',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    },
    {
        title: 'Your Own Domain',
        tag: 'Custom Branding',
        desc: 'Connect your school\'s own official domain (e.g. yourschool.edu.in) with free automated SSL certificates and lightning DNS routing.',
        perk: 'Free SSL certificate',
        cardBg: 'linear-gradient(160deg, #ffffff 40%, #f5f3ff 100%)',
        borderColor: '#ddd6fe',
        badgeBg: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
        badgeShadow: 'rgba(124, 58, 237, 0.28)',
        tagBg: '#ede9fe',
        tagColor: '#6d28d9',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
    },
    {
        title: 'Reliable Storage',
        tag: 'Cloudinary CDN',
        desc: 'High-speed media delivery powered by Cloudinary CDN — ultra-fast photo galleries, event photos, and academic syllabus PDFs.',
        perk: 'Global media CDN',
        cardBg: 'linear-gradient(160deg, #ffffff 40%, #fff7ed 100%)',
        borderColor: '#fed7aa',
        badgeBg: 'linear-gradient(135deg, #c2410c, #ea580c)',
        badgeShadow: 'rgba(234, 88, 12, 0.28)',
        tagBg: '#ffedd5',
        tagColor: '#c2410c',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h10a4 4 0 001.6-7.67 5 5 0 00-9.5-2.79A4 4 0 003 15z" />
    }
];

const DEMO_URL = 'https://jdis.wbpro.in';

const PREVIEW_DESKTOP_SLIDES = [
    {
        image: previewSlide1,
        title: "Modern Architectural Presence",
        tag: "Heritage & Infrastructure"
    },
    {
        image: previewSlide2,
        title: "Discipline & Athletic Excellence",
        tag: "NCC Cadets & Sports"
    },
    {
        image: previewSlide3,
        title: "Vibrant School Life & Celebrations",
        tag: "Annual Day & Culture"
    }
];

const PREVIEW_MOBILE_SLIDES = [
    {
        image: previewMobile1,
        title: "JD International School Mobile - Campus & Architecture"
    },
    {
        image: previewMobile2,
        title: "JD International School Mobile - NCC Cadets & Sports"
    },
    {
        image: previewMobile3,
        title: "JD International School Mobile - Annual Carnival Fiesta"
    }
];

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
    const [previewSlide, setPreviewSlide] = useState(0);

    // Auto-advance preview slides synchronously every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setPreviewSlide(prev => (prev + 1) % PREVIEW_DESKTOP_SLIDES.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const makeTilt = (setter, strengthX, strengthY) => (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        setter({ x: py * -strengthX, y: px * strengthY });
    };
    const handlePreviewMove = makeTilt(setTilt, 12, 16);
    const handlePreviewLeave = () => setTilt({ x: 0, y: 0 });
    const handleHeroMove = makeTilt(setHeroTilt, 6, 8);
    const handleHeroLeave = () => setHeroTilt({ x: 0, y: 0 });

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <style>{`
                html, body, #root { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                * { box-sizing: border-box; }
                html { scroll-behavior: smooth; }

                @keyframes lpOrbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-26px,20px) scale(1.08); } }
                @keyframes lpFloatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
                @keyframes lpChipFloat { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-13px) rotate(3deg); } }
                @keyframes lpShimmer { 0% { background-position: -100% center; } 100% { background-position: 100% center; } }
                @keyframes lpShimmerRTL { 0% { background-position: 100% center; } 100% { background-position: -100% center; } }
                @keyframes lpSpin { to { transform: rotate(360deg); } }
                @keyframes lpPulseRing { 0%,100% { box-shadow: 0 0 0 0 rgba(65,105,225,0.35); } 50% { box-shadow: 0 0 0 12px rgba(65,105,225,0); } }

                .lp-shimmer-text {
                    background: linear-gradient(90deg, ${TEXT_DARK} 0%, ${TEXT_DARK} 42%, ${BLUE} 50%, ${TEXT_DARK} 58%, ${TEXT_DARK} 100%);
                    background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
                    animation: lpShimmer 8s linear infinite;
                }
                .lp-shimmer-text-light {
                    background: linear-gradient(90deg, #ffffff 0%, #ffffff 42%, ${BLUE_LIGHT} 50%, #ffffff 58%, #ffffff 100%);
                    background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
                    animation: lpShimmer 8s linear infinite;
                }
                .lp-hero-heading-shimmer {
                    background: linear-gradient(90deg, #0f1f4b 0%, #0f1f4b 42%, #1d4ed8 50%, #0f1f4b 58%, #0f1f4b 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: lpShimmerRTL 8s linear infinite;
                }
                /* RTL shimmer — dark navy colours, right to left */
                .lp-hero-rtl-shimmer {
                    background: linear-gradient(90deg, #0f1f4b 0%, #0f1f4b 42%, #2563eb 50%, #0f1f4b 58%, #0f1f4b 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: lpShimmerRTL 7s linear infinite;
                }
                /* LTR shimmer — blue colours, left to right */
                .lp-hero-ltr-shimmer {
                    background: linear-gradient(90deg, #1d4ed8 0%, #1d4ed8 42%, #60a5fa 50%, #1d4ed8 58%, #1d4ed8 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: lpShimmer 7s linear infinite;
                }
                /* Unified shimmer on full h1 */
                .lp-hero-h1-unified {
                    background: linear-gradient(90deg, #0f1f4b 0%, #0f1f4b 42%, #2563eb 50%, #1d4ed8 58%, #1d4ed8 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: lpShimmerRTL 7s linear infinite;
                }

                .lp-nav-link { transition: color 0.2s ease, text-shadow 0.2s ease; }
                .lp-nav-link-dark:hover { color: ${BLUE} !important; }
                .lp-nav-link-light:hover { color: #ffffff !important; text-shadow: 0 0 16px rgba(255,255,255,0.6); }

                .lp-btn { position: relative; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .lp-btn::after { content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent); transform: skewX(-20deg); transition: left 0.65s ease; }
                .lp-btn:hover { transform: translateY(-2px); }
                .lp-btn:hover::after { left: 130%; }
                .lp-btn-outline:hover { background: ${BLUE} !important; color: #ffffff !important; }
                .lp-btn-outline:hover svg { fill: #ffffff !important; }
                .lp-btn-outline-hero:hover { background: #ffffff !important; color: ${BLUE_DARK} !important; border-color: #ffffff !important; }

                .lp-mock-float { animation: lpFloatY 6.5s ease-in-out infinite; }
                .lp-chip { position: absolute; border-radius: 14px; box-shadow: 0 14px 30px rgba(59,59,59,0.22); background: #ffffff; }
                .lp-chip-1 { animation: lpChipFloat 5.5s ease-in-out infinite; }
                .lp-chip-2 { animation: lpChipFloat 6.5s ease-in-out infinite reverse; }
                .lp-chip-3 { animation: lpChipFloat 5s ease-in-out infinite; }

                .lp-trust-card { transition: transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s ease, border-color 0.28s ease; }
                .lp-trust-card:hover { transform: translateY(-6px) scale(1.015); box-shadow: 0 26px 50px rgba(0,0,0,0.16); }
                .lp-icon-badge { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
                .lp-trust-card:hover .lp-icon-badge { transform: scale(1.12) rotate(-6deg); }

                /* ── Modern feature cards — compact lift, smooth glow, crisp light theme ── */
                .lp-feature-card {
                    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
                }
                .lp-feature-card:hover {
                    transform: translateY(-4px);
                }
                .lp-feature-tile {
                    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
                }
                .lp-feature-card:hover .lp-feature-tile {
                    transform: scale(1.06);
                }

                .lp-tilt-frame { transition: transform 0.25s ease-out; transform-style: preserve-3d; }
                .lp-hero-mock-tilt { transition: transform 0.25s ease-out; transform-style: preserve-3d; }

                /* ── Module marquee — two rows of sharp rectangular chips, each row's content
                     duplicated so the loop is seamless; rows scroll opposite directions and
                     pause on hover so a module can actually be read. ── */
                @keyframes lpMarqueeRight { from { transform: translateX(-50%); } to { transform: translateX(0); } }
                @keyframes lpMarqueeLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .lp-mod-track { display: flex; gap: 18px; width: max-content; padding: 6px 0; }
                .lp-mod-track-right { animation: lpMarqueeRight 48s linear infinite; }
                .lp-mod-track-left { animation: lpMarqueeLeft 44s linear infinite; }
                .lp-mod-track:hover { animation-play-state: paused; }
                .lp-mod-chip {
                    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease;
                    cursor: default;
                }
                .lp-mod-tile {
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
                }
                .lp-mod-arrow {
                    transition: transform 0.25s ease, opacity 0.25s ease;
                }

                @media (max-width: 980px) {
                    .lp-hero-grid { grid-template-columns: 1fr !important; text-align: center; }
                    .lp-hero-visual { margin: 2.5rem auto 0 !important; max-width: 420px; }
                    .lp-hero-ctas { justify-content: center !important; }
                    .lp-hero-checks { justify-content: center !important; }
                    .lp-preview-grid { grid-template-columns: 1fr !important; }
                    .lp-trust-grid { grid-template-columns: 1fr !important; text-align: center; }
                    .lp-trust-grid > div:first-child { align-items: center !important; }
                    .lp-nav-links { display: none !important; }
                }

                @keyframes lpFloatIso {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-7px); }
                }

                @media (max-width: 640px) {
                    .lp-cta-btn-group { flex-direction: column !important; width: 100% !important; align-items: stretch !important; }
                    .lp-cta-btn-group button { width: 100% !important; max-width: 100% !important; justify-content: center !important; }
                }
            `}</style>

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: TEXT_DARK, background: '#ffffff', minHeight: '100vh', overflowX: 'hidden' }}>

                {/* ── Nav — Clean modern white FeeFlow-style navbar for Web Builder Pro ── */}
                <nav style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '74px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 clamp(1.25rem, 5vw, 3.5rem)',
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    transition: 'all 0.25s ease',
                }}>
                    {/* Brand / Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src={logo} alt="Web Builder Pro" style={{ height: 'clamp(56px, 6vw, 62px)', width: 'auto', objectFit: 'contain' }} />
                    </div>

                    {/* Center Nav Links */}
                    <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <a href="#features" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', textDecoration: 'none', transition: 'color 0.18s ease' }} onMouseOver={e => e.currentTarget.style.color = BLUE} onMouseOut={e => e.currentTarget.style.color = '#334155'}>
                            Features
                        </a>
                        <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontWeight: 600, color: '#e15241', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.18s ease' }} onMouseOver={e => e.currentTarget.style.color = '#c53b2c'} onMouseOut={e => e.currentTarget.style.color = '#e15241'}>
                            <span style={{ fontSize: '13px' }}>✦</span> Platform Demo
                        </a>
                        <a href="#modules" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', textDecoration: 'none', transition: 'color 0.18s ease' }} onMouseOver={e => e.currentTarget.style.color = BLUE} onMouseOut={e => e.currentTarget.style.color = '#334155'}>
                            Modules
                        </a>
                        <a href="#preview" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', textDecoration: 'none', transition: 'color 0.18s ease' }} onMouseOver={e => e.currentTarget.style.color = BLUE} onMouseOut={e => e.currentTarget.style.color = '#334155'}>
                            Preview
                        </a>
                    </div>

                    {/* Right Actions (Sign In + Coral Primary CTA) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <button onClick={() => navigate('/login')} style={{ fontSize: '14px', fontWeight: 600, color: '#334155', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', transition: 'color 0.18s ease' }} onMouseOver={e => e.currentTarget.style.color = '#0f172a'} onMouseOut={e => e.currentTarget.style.color = '#334155'}>
                            Sign In
                        </button>
                        <button onClick={() => navigate('/signup')} style={{
                            padding: '10px 22px',
                            background: '#e15241',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '999px',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 14px rgba(225, 82, 65, 0.35)',
                            transition: 'all 0.2s ease'
                        }} onMouseOver={e => { e.currentTarget.style.background = '#d04332'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseOut={e => { e.currentTarget.style.background = '#e15241'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                            Start Free Trial →
                        </button>
                    </div>
                </nav>

                {/* ── Hero — Light canvas with blurred school sports-day background image,
                     ambient glows, bold dark typography with wavy accent, dual pill CTAs ── */}
                <section style={{
                    position: 'relative',
                    padding: 'calc(74px + clamp(2.5rem,6vw,4.2rem)) clamp(1.25rem,6vw,4rem) clamp(4.5rem,7vw,6.5rem)',
                    overflow: 'hidden',
                    background: '#f0f4f8'
                }}>
                    {/* Local school sports-day background image */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${schoolHeroBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 45%',
                        filter: 'saturate(1.15) brightness(0.92)',
                        opacity: 0.22,
                        pointerEvents: 'none',
                        zIndex: 0
                    }}></div>

                    {/* Very light white tint — just enough for text readability */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(248,250,252,0.30)',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}></div>

                    {/* Warm amber glow — bottom-right */}
                    <div style={{
                        position: 'absolute',
                        width: '520px', height: '520px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(254,215,170,0.5) 0%, rgba(254,215,170,0.1) 45%, transparent 70%)',
                        bottom: '-120px', right: '-80px',
                        animation: 'lpOrbDrift 14s ease-in-out infinite alternate',
                        pointerEvents: 'none', zIndex: 1
                    }}></div>

                    {/* Cool blue glow — top-left */}
                    <div style={{
                        position: 'absolute',
                        width: '480px', height: '480px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(191,219,254,0.55) 0%, rgba(191,219,254,0.1) 45%, transparent 70%)',
                        top: '-80px', left: '-60px',
                        animation: 'lpOrbDrift 12s ease-in-out infinite alternate-reverse',
                        pointerEvents: 'none', zIndex: 1
                    }}></div>

                    {/* Bottom wave divider seamlessly transitioning into #ffffff modules section */}
                    <div style={{
                        position: 'absolute',
                        bottom: -1,
                        left: 0,
                        right: 0,
                        width: '100%',
                        overflow: 'hidden',
                        lineHeight: 0,
                        pointerEvents: 'none',
                        zIndex: 2
                    }}>
                        <svg
                            viewBox="0 0 1440 90"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            preserveAspectRatio="none"
                            style={{
                                position: 'relative',
                                display: 'block',
                                width: '100%',
                                height: 'clamp(48px, 6vw, 88px)',
                            }}
                        >
                            {/* Crisp single white wave smoothly dividing hero from modules */}
                            <path
                                d="M0,45 C320,72 640,16 1020,26 C1220,32 1350,46 1440,38 L1440,90 L0,90 Z"
                                fill="#ffffff"
                            />
                        </svg>
                    </div>

                    <div className="lp-hero-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 'clamp(2rem,5vw,3rem)', alignItems: 'center', position: 'relative', zIndex: 3 }}>

                        {/* Left — copy */}
                        <div>
                            <Reveal delay={0.05}>
                                <h1 style={{
                                    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
                                    fontSize: 'clamp(40px, 5.6vw, 68px)',
                                    fontWeight: 900,
                                    lineHeight: 1.08,
                                    letterSpacing: '-2px',
                                    marginBottom: '1.5rem'
                                }}>
                                    <span className="lp-hero-rtl-shimmer" style={{ display: 'block' }}>Build a School</span>
                                    <span className="lp-hero-rtl-shimmer" style={{ display: 'block' }}>Website That</span>
                                    <span className="lp-hero-ltr-shimmer" style={{ position: 'relative', display: 'inline-block', paddingBottom: '8px' }}>
                                        Stands Apart.
                                        <svg
                                            style={{
                                                position: 'absolute',
                                                left: 0,
                                                bottom: '-2px',
                                                width: '100%',
                                                height: '16px',
                                                overflow: 'visible'
                                            }}
                                            viewBox="0 0 300 16"
                                            fill="none"
                                            preserveAspectRatio="none"
                                        >
                                            <path
                                                d="M 2 8 Q 18 1, 37 8 T 75 8 T 113 8 T 151 8 T 189 8 T 227 8 T 265 8 T 298 8"
                                                stroke="#e15241"
                                                strokeWidth="4.5"
                                                strokeLinecap="round"
                                                fill="none"
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        </svg>
                                    </span>
                                </h1>
                            </Reveal>
                            <Reveal delay={0.16}>
                                <p style={{
                                    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                                    fontSize: 'clamp(15px, 1.5vw, 17px)',
                                    fontWeight: 400,
                                    color: '#475569',
                                    lineHeight: 1.8,
                                    letterSpacing: '0.1px',
                                    maxWidth: '520px',
                                    marginBottom: '1.75rem'
                                }}>
                                    A complete platform to run your school's public website and day-to-day operations — fees, admissions, events, gallery, and more — all from one simple dashboard.
                                </p>
                            </Reveal>
                            <Reveal delay={0.24}>
                                <div className="lp-hero-checks" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', marginBottom: '2.25rem' }}>
                                    {['Custom public website', 'One dashboard, every module', 'No coding required'].map(item => (
                                        <span key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', system-ui, sans-serif", fontSize: '13.5px', color: '#334155', fontWeight: 600, letterSpacing: '0.15px' }}>
                                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(225,82,65,0.15)', border: '1.5px solid rgba(225,82,65,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <CheckIcon color="#e15241" />
                                            </span>
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </Reveal>
                            <Reveal delay={0.32}>
                                <div className="lp-hero-ctas" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="lp-btn"
                                        style={{
                                            padding: '14px 28px',
                                            background: '#e15241',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '999px',
                                            fontSize: '15px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '9px',
                                            boxShadow: '0 8px 24px rgba(225, 82, 65, 0.35)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.background = '#d04332'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                        onMouseOut={e => { e.currentTarget.style.background = '#e15241'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        Login to Dashboard
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M20 12H4" />
                                        </svg>
                                    </button>
                                    <a
                                        href={DEMO_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="lp-btn"
                                        style={{
                                            padding: '13px 26px',
                                            background: '#ffffff',
                                            color: '#0f172a',
                                            border: '1.5px solid #e2e8f0',
                                            borderRadius: '999px',
                                            fontSize: '14.5px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            textDecoration: 'none',
                                            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 23, 42, 0.08)'; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.05)'; }}
                                    >
                                        <span style={{
                                            width: '26px',
                                            height: '26px',
                                            borderRadius: '50%',
                                            background: '#f59e0b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)'
                                        }}>
                                            <PlayIcon color="#ffffff" />
                                        </span>
                                        Watch Demo
                                    </a>
                                </div>
                            </Reveal>
                        </div>

                        {/* Right — layered editor-style mockup with floating panels, mouse-tilt */}
                        <div className="lp-hero-visual" style={{ position: 'relative', perspective: '1500px' }}
                            onMouseMove={handleHeroMove} onMouseLeave={handleHeroLeave}>
                            <div className="lp-mock-float" style={{ width: 'min(420px, 92vw)', margin: '0 auto', position: 'relative' }}>
                                <div className="lp-hero-mock-tilt" style={{ transform: `rotateX(${heroTilt.x}deg) rotateY(${heroTilt.y}deg)` }}>
                                    <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 70px rgba(15,23,42,0.14), 0 10px 28px rgba(15,23,42,0.08)', border: '1px solid rgba(226,232,240,0.9)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#fafbfe', borderBottom: '1px solid #eef0f6' }}>
                                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f87171' }}></span>
                                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#fbbf24' }}></span>
                                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#4ade80' }}></span>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED_LIGHT, marginLeft: '6px' }}>Home Page — Editor</span>
                                            <span style={{ marginLeft: 'auto', fontSize: '10.5px', fontWeight: 700, color: '#fff', background: '#2563eb', padding: '4px 14px', borderRadius: '999px', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)' }}>Publish</span>
                                        </div>
                                        <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ height: '15px', width: '70%', borderRadius: '4px', background: '#e2e8f0' }}></div>
                                            <div style={{ height: '9px', width: '90%', borderRadius: '3px', background: '#f1f5f9' }}></div>
                                            <div style={{ height: '9px', width: '55%', borderRadius: '3px', background: '#f1f5f9' }}></div>
                                            <div style={{ height: '120px', borderRadius: '14px', marginTop: '6px', background: `linear-gradient(135deg, #eff6ff, #f8fafc)`, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `linear-gradient(135deg,#2563eb,#1d4ed8)`, boxShadow: '0 12px 24px rgba(37, 99, 235, 0.35)' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating block-inserter panel */}
                                <div className="lp-chip lp-chip-1" style={{ top: '-9%', left: '-13%', width: '150px', padding: '10px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 14px 30px rgba(15,23,42,0.1)' }}>
                                    <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#64748b', marginBottom: '7px' }}>+ Add Block</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                                        {[0, 1, 2, 3, 4, 5].map(i => (
                                            <div key={i} style={{ height: '22px', borderRadius: '5px', background: i === 0 ? '#eff6ff' : '#f8fafc', border: i === 0 ? `1.5px solid #3b82f6` : '1px solid #e2e8f0' }}></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Floating dark nav panel */}
                                <div className="lp-chip lp-chip-2" style={{ bottom: '4%', right: '-15%', width: '140px', padding: '12px 10px', background: '#1e293b', borderRadius: '14px', boxShadow: '0 18px 38px rgba(15,23,42,0.24)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dashboard</div>
                                    {['Modules', 'Enquiries', 'Settings'].map((t, i) => (
                                        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 8px', borderRadius: '7px', background: i === 0 ? '#2563eb' : 'transparent', marginBottom: '3px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)' }}></span>
                                            <span style={{ fontSize: '10.5px', fontWeight: 600, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.65)' }}>{t}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Floating isometric school badge */}
                                <div className="lp-chip lp-chip-3" style={{ top: '28%', right: '-16%', width: '70px', height: '70px', borderRadius: '16px', background: '#ffffff', boxShadow: '0 14px 32px rgba(15,23,42,0.12)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IsoSchool size={46} tone="blue" />
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* ── Module Showcase — every module in the platform, rendered as a two-row marquee
                     of colourful, modern cards with vibrant palettes, category pills, and smooth glows. ── */}
                <section id="modules" style={{ padding: 'clamp(4rem,7vw,6rem) 0', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
                    {/* Ambient background glows & dot matrix — smoothly masked at the top to eliminate any hard horizontal cutoff line */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 60px, black 160px)',
                        maskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 60px, black 160px)',
                    }}>
                        {/* Dot matrix pattern */}
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99, 102, 241, 0.13) 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}></div>
                        
                        {/* Soft theme-matching ambient glows with rich vivid hues */}
                        <div style={{ position: 'absolute', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, transparent 70%)', top: '10px', left: '-80px' }}></div>
                        <div style={{ position: 'absolute', width: '540px', height: '540px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.20) 0%, transparent 70%)', top: '25%', right: '-100px' }}></div>
                        <div style={{ position: 'absolute', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(251, 146, 60, 0.20) 0%, transparent 70%)', bottom: '-100px', left: '25%' }}></div>
                    </div>

                    <div style={{ maxWidth: '1200px', margin: '0 auto clamp(2.5rem,5vw,3.5rem)', padding: '0 clamp(1.25rem,6vw,4rem)', position: 'relative', textAlign: 'center' }}>
                        <Reveal style={{ textAlign: 'center' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 18px',
                                borderRadius: '999px',
                                background: 'linear-gradient(90deg, rgba(37,99,235,0.08), rgba(139,92,246,0.08))',
                                border: '1px solid rgba(99,102,241,0.25)',
                                marginBottom: '16px',
                                boxShadow: '0 2px 12px rgba(99,102,241,0.08)'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #8b5cf6)', display: 'inline-block' }}></span>
                                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#4338ca', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                    A Module For Every Need
                                </span>
                            </div>
                            <h2 style={{
                                fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
                                fontSize: 'clamp(32px, 4.2vw, 50px)',
                                fontWeight: 900,
                                letterSpacing: '-1.5px',
                                marginBottom: '14px',
                                lineHeight: 1.15
                            }}>
                                <span className="lp-hero-rtl-shimmer">Explore </span>
                                <span className="lp-hero-ltr-shimmer">Every Module</span>
                            </h2>
                            <p style={{
                                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                                fontSize: '15.5px',
                                color: '#64748b',
                                maxWidth: '600px',
                                margin: '0 auto',
                                lineHeight: 1.7,
                                fontWeight: 400
                            }}>
                                Publish once, manage everything — 21+ purpose-built modules live and ready in the platform today.
                            </p>
                        </Reveal>
                    </div>

                    <Reveal>
                        <div style={{ position: 'relative' }}>
                            {/* Smooth edge fades for the marquee */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '160px', background: 'linear-gradient(90deg, #ffffff 40%, rgba(255,255,255,0.7) 70%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }}></div>
                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '160px', background: 'linear-gradient(270deg, #ffffff 40%, rgba(255,255,255,0.7) 70%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }}></div>

                            <div style={{ overflow: 'hidden', marginBottom: '16px' }}>
                                <div className="lp-mod-track lp-mod-track-right">
                                    {[...MODULES_ROW_TOP, ...MODULES_ROW_TOP].map((m, i) => <ModuleChip key={`${m.key}-${i}`} m={m} />)}
                                </div>
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div className="lp-mod-track lp-mod-track-left">
                                    {[...MODULES_ROW_BOTTOM, ...MODULES_ROW_BOTTOM].map((m, i) => <ModuleChip key={`${m.key}-${i}`} m={m} />)}
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* ── Feature icon-cards — warm off-white canvas, crisp typography, clean cards ── */}
                <section id="features" style={{
                    padding: 'clamp(2.75rem, 4.5vw, 4rem) clamp(1.25rem, 5vw, 3.5rem)',
                    background: 'linear-gradient(180deg, #fbfcfe 0%, #fdfbf7 50%, #fbfcfe 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    borderTop: '1px solid #eef2f7'
                }}>
                    {/* Soft warm & sky ambient glows matching theme */}
                    <div style={{ position: 'absolute', width: '550px', height: '550px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(224, 242, 254, 0.65) 0%, transparent 70%)', top: '-120px', left: '-100px', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(254, 237, 213, 0.55) 0%, transparent 70%)', bottom: '-80px', right: '-80px', pointerEvents: 'none' }}></div>

                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'relative' }}>
                        {ICON_GROUPS.map((group, gi) => (
                            <div key={group.heading}>
                                <Reveal delay={gi * 0.04}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '12px',
                                        marginBottom: '1.25rem',
                                        paddingBottom: '10px',
                                        borderBottom: '1.5px solid #edf2f7'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: gi === 0 ? '#1e3a8a' : '#0f766e',
                                                boxShadow: gi === 0 ? '0 0 10px rgba(30, 58, 138, 0.4)' : '0 0 10px rgba(15, 118, 110, 0.4)',
                                                display: 'inline-block'
                                            }} />
                                            <h3 style={{
                                                fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                                                fontSize: 'clamp(21px, 2.4vw, 26px)',
                                                fontWeight: 900,
                                                letterSpacing: '-0.5px',
                                                margin: 0,
                                                lineHeight: 1.2
                                            }}>
                                                <span style={{ color: '#0f172a' }}>{group.heading.split(' ')[0]} {group.heading.split(' ')[1]} </span>
                                                <span style={{ color: '#1e3a8a' }}>{group.heading.split(' ').slice(2).join(' ')}</span>
                                            </h3>
                                        </div>
                                        <p style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '13.5px',
                                            color: '#64748b',
                                            margin: 0
                                        }}>{group.tagline}</p>
                                    </div>
                                </Reveal>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                    {group.cards.map((c, i) => (
                                        <PopReveal key={c.title} delay={i * 0.05}>
                                            <div
                                                className="lp-feature-card"
                                                style={{
                                                    background: c.cardBg,
                                                    border: `1.5px solid ${c.borderColor}`,
                                                    borderRadius: '18px',
                                                    padding: '1.4rem 1.5rem',
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)',
                                                    position: 'relative'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.borderColor = c.gradient[1] || c.gradient[0];
                                                    e.currentTarget.style.boxShadow = `0 16px 32px -6px ${c.glow}, 0 0 0 1px ${c.borderColor}`;
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.borderColor = c.borderColor;
                                                    e.currentTarget.style.boxShadow = '0 4px 18px rgba(15, 23, 42, 0.03)';
                                                }}
                                            >
                                                {/* Squircle Gradient Icon Tile */}
                                                <div
                                                    className="lp-feature-tile"
                                                    style={{
                                                        width: '44px',
                                                        height: '44px',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`,
                                                        boxShadow: `0 6px 14px ${c.glow}, inset 0 1px 1px rgba(255,255,255,0.4)`,
                                                        marginBottom: '14px',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <svg width="21" height="21" fill="none" stroke="#ffffff" strokeWidth="2.1" viewBox="0 0 24 24">{c.icon}</svg>
                                                </div>

                                                {/* Title */}
                                                <h4 style={{
                                                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                                                    fontSize: '17px',
                                                    fontWeight: 800,
                                                    color: '#0f172a',
                                                    letterSpacing: '-0.3px',
                                                    marginBottom: '8px',
                                                    lineHeight: 1.3
                                                }}>{c.title}</h4>

                                                {/* Description */}
                                                <p style={{
                                                    fontFamily: "'Inter', sans-serif",
                                                    fontSize: '13.5px',
                                                    color: '#475569',
                                                    lineHeight: 1.65,
                                                    margin: 0,
                                                    flex: 1
                                                }}>{c.desc}</p>

                                                {/* Micro-footer with tiny checkmark */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    marginTop: '16px',
                                                    paddingTop: '10px',
                                                    borderTop: `1px solid ${c.borderColor}`,
                                                    fontSize: '11.5px',
                                                    fontWeight: 600,
                                                    color: '#64748b'
                                                }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.gradient[1] || c.gradient[0]} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    <span>Included with platform</span>
                                                </div>
                                            </div>
                                        </PopReveal>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Screenshots / Product Preview ── */}
                <section id="preview" style={{
                    padding: 'clamp(4rem, 7vw, 6rem) clamp(1.25rem, 5vw, 3.5rem)',
                    background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 50%, #f8fafc 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    borderTop: '1px solid #e2e8f0',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    {/* Precision blueprint dot grid pattern */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(rgba(100, 116, 139, 0.22) 1.2px, transparent 1.2px)',
                        backgroundSize: '28px 28px',
                        opacity: 0.65,
                        pointerEvents: 'none'
                    }} />

                    {/* Luminous dynamic ambient glow auras */}
                    <div style={{
                        position: 'absolute',
                        width: '650px',
                        height: '650px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.13) 0%, rgba(59, 130, 246, 0.04) 45%, transparent 70%)',
                        top: '5%',
                        left: '12%',
                        filter: 'blur(40px)',
                        pointerEvents: 'none'
                    }} />
                    <div style={{
                        position: 'absolute',
                        width: '550px',
                        height: '550px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.11) 0%, rgba(245, 158, 11, 0.03) 40%, transparent 70%)',
                        bottom: '2%',
                        right: '8%',
                        filter: 'blur(40px)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ maxWidth: '1220px', margin: '0 auto', position: 'relative' }}>
                        <Reveal style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 style={{
                                fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                                fontSize: 'clamp(28px, 4vw, 44px)',
                                fontWeight: 900,
                                letterSpacing: '-0.9px',
                                marginBottom: '14px',
                                lineHeight: 1.15
                            }}>
                                <span style={{ color: '#0f172a' }}>World-Class on Desktop. </span>
                                <span style={{
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0284c7 100%)',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    display: 'inline-block'
                                }}>
                                    Flawless on Mobile.
                                </span>
                            </h2>
                            <p style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '15.5px',
                                color: '#64748b',
                                maxWidth: '640px',
                                margin: '0 auto',
                                lineHeight: 1.7
                            }}>
                                Explore how your institution's public website, admissions, academic showcase, and cultural events adapt synchronously across desktop and handheld screens.
                            </p>
                        </Reveal>

                        <div className="lp-preview-grid" style={{ display: 'grid', gridTemplateColumns: '1.38fr 0.62fr', gap: 'clamp(2rem, 4vw, 3.25rem)', alignItems: 'center' }}>
                            {/* Desktop Live Website Carousel Window */}
                            <Reveal>
                                <div style={{ perspective: '1600px' }} onMouseMove={handlePreviewMove} onMouseLeave={handlePreviewLeave}>
                                    {/* Desktop Device Label */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '0 4px' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#475569', background: '#ffffff', padding: '4px 12px', borderRadius: '999px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                            <span>🖥️</span>
                                            <span>Desktop Experience</span>
                                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>&bull; 1920 &times; 1080</span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>
                                            {PREVIEW_DESKTOP_SLIDES[previewSlide]?.tag}
                                        </span>
                                    </div>

                                    <div className="lp-tilt-frame" style={{ transform: `perspective(1600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
                                        <div style={{
                                            background: '#ffffff',
                                            borderRadius: '22px',
                                            overflow: 'hidden',
                                            boxShadow: '0 32px 75px -18px rgba(15, 23, 42, 0.2), 0 12px 28px -6px rgba(0,0,0,0.06), 0 0 0 1px rgba(226, 232, 240, 0.9)',
                                            border: '1.5px solid #e2e8f0',
                                            position: 'relative'
                                        }}>
                                            {/* Browser Window Header */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171', border: '1px solid rgba(0,0,0,0.08)' }}></span>
                                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', border: '1px solid rgba(0,0,0,0.08)' }}></span>
                                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', border: '1px solid rgba(0,0,0,0.08)' }}></span>
                                                </div>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    padding: '5px 16px', borderRadius: '999px',
                                                    background: '#ffffff', border: '1px solid #e2e8f0',
                                                    fontSize: '11.5px', color: '#334155', fontWeight: 600,
                                                    maxWidth: '290px', width: '100%', justifyContent: 'center',
                                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
                                                }}>
                                                    <span style={{ color: '#059669', fontSize: '10.5px' }}>🔒</span>
                                                    <span>https://jdis.wbpro.in</span>
                                                    <a href="https://jdis.wbpro.in" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '11px', marginLeft: '4px' }} title="Open live site in new tab">↗</a>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#ffffff', padding: '2px 6px', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
                                                        <button
                                                            onClick={() => setPreviewSlide(prev => (prev - 1 + PREVIEW_DESKTOP_SLIDES.length) % PREVIEW_DESKTOP_SLIDES.length)}
                                                            aria-label="Previous slide"
                                                            style={{
                                                                width: '20px', height: '20px', borderRadius: '50%',
                                                                background: '#f8fafc', border: '1px solid #cbd5e1',
                                                                color: '#334155', cursor: 'pointer', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                                                                fontWeight: 700, padding: 0
                                                            }}
                                                        >
                                                            ‹
                                                        </button>
                                                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', minWidth: '24px', textAlign: 'center' }}>
                                                            {previewSlide + 1}/{PREVIEW_DESKTOP_SLIDES.length}
                                                        </span>
                                                        <button
                                                            onClick={() => setPreviewSlide(prev => (prev + 1) % PREVIEW_DESKTOP_SLIDES.length)}
                                                            aria-label="Next slide"
                                                            style={{
                                                                width: '20px', height: '20px', borderRadius: '50%',
                                                                background: '#f8fafc', border: '1px solid #cbd5e1',
                                                                color: '#334155', cursor: 'pointer', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                                                                fontWeight: 700, padding: 0
                                                            }}
                                                        >
                                                            ›
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '999px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
                                                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#047857' }}>Live</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Slides Container Area (Clean, 100% Unobstructed Full View) */}
                                            <div style={{
                                                position: 'relative',
                                                height: 'clamp(310px, 34vw, 415px)',
                                                background: '#0f172a',
                                                overflow: 'hidden'
                                            }}>
                                                {PREVIEW_DESKTOP_SLIDES.map((s, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            opacity: previewSlide === idx ? 1 : 0,
                                                            transform: previewSlide === idx ? 'scale(1)' : 'scale(1.03)',
                                                            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            pointerEvents: previewSlide === idx ? 'auto' : 'none'
                                                        }}
                                                    >
                                                        <img
                                                            src={s.image}
                                                            alt={s.title}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                objectPosition: 'top center',
                                                                display: 'block'
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>

                            {/* Mobile Website Mockup (Ultra-Realistic Modern iPhone Pro Chassis) */}
                            <Reveal delay={0.12}>
                                <div style={{ width: 'min(245px, 80vw)', margin: '0 auto', position: 'relative' }}>
                                    {/* Mobile Device Label */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#475569', background: '#ffffff', padding: '4px 12px', borderRadius: '999px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                            <span>📱</span>
                                            <span>Mobile App & Web</span>
                                        </div>
                                    </div>

                                    {/* Realistic iPhone Titanium Outer Frame */}
                                    <div style={{
                                        position: 'relative',
                                        background: 'linear-gradient(155deg, #334155 0%, #1e293b 40%, #0f172a 100%)',
                                        borderRadius: '46px',
                                        padding: '10px',
                                        boxShadow: '0 35px 75px -15px rgba(15, 23, 42, 0.45), 0 12px 28px -4px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.3)',
                                        border: '1.5px solid #475569'
                                    }}>
                                        {/* Physical Hardware Buttons */}
                                        {/* Silent / Action Button (Left) */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '-4px',
                                            top: '64px',
                                            width: '3.5px',
                                            height: '22px',
                                            background: 'linear-gradient(to bottom, #64748b, #334155)',
                                            borderRadius: '3px 0 0 3px',
                                            boxShadow: '-1px 0 2px rgba(0,0,0,0.35)'
                                        }} />
                                        {/* Volume Up (Left) */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '-4px',
                                            top: '98px',
                                            width: '3.5px',
                                            height: '40px',
                                            background: 'linear-gradient(to bottom, #64748b, #334155)',
                                            borderRadius: '3px 0 0 3px',
                                            boxShadow: '-1px 0 2px rgba(0,0,0,0.35)'
                                        }} />
                                        {/* Volume Down (Left) */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '-4px',
                                            top: '148px',
                                            width: '3.5px',
                                            height: '40px',
                                            background: 'linear-gradient(to bottom, #64748b, #334155)',
                                            borderRadius: '3px 0 0 3px',
                                            boxShadow: '-1px 0 2px rgba(0,0,0,0.35)'
                                        }} />
                                        {/* Power Button (Right) */}
                                        <div style={{
                                            position: 'absolute',
                                            right: '-4px',
                                            top: '112px',
                                            width: '3.5px',
                                            height: '52px',
                                            background: 'linear-gradient(to bottom, #64748b, #334155)',
                                            borderRadius: '0 3px 3px 0',
                                            boxShadow: '1px 0 2px rgba(0,0,0,0.35)'
                                        }} />

                                        {/* Inner OLED Display Glass */}
                                        <div style={{
                                            position: 'relative',
                                            height: '405px',
                                            background: '#020617',
                                            borderRadius: '36px',
                                            overflow: 'hidden',
                                            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.8), inset 0 2px 4px rgba(0,0,0,0.6)'
                                        }}>
                                            {/* Dynamic Island Floating Notch */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '9px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '72px',
                                                height: '18px',
                                                background: '#000000',
                                                borderRadius: '999px',
                                                zIndex: 30,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0 7px',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.6)'
                                            }}>
                                                <div style={{
                                                    width: '7.5px',
                                                    height: '7.5px',
                                                    borderRadius: '50%',
                                                    background: '#0f172a',
                                                    border: '1px solid #1e293b'
                                                }} />
                                                <div style={{
                                                    width: '5px',
                                                    height: '5px',
                                                    borderRadius: '50%',
                                                    background: '#082f49'
                                                }} />
                                            </div>

                                            {/* Subtle Diagonal Glass Gloss Highlight */}
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'linear-gradient(135deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.02) 34%, transparent 54%)',
                                                pointerEvents: 'none',
                                                zIndex: 25
                                            }} />

                                            {/* Synchronized Mobile Slides */}
                                            {PREVIEW_MOBILE_SLIDES.map((slide, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        opacity: previewSlide === idx ? 1 : 0,
                                                        transform: previewSlide === idx ? 'scale(1)' : 'scale(1.04)',
                                                        transition: 'opacity 0.65s cubic-bezier(0.4, 0, 0.2, 1), transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        pointerEvents: previewSlide === idx ? 'auto' : 'none'
                                                    }}
                                                >
                                                    <img
                                                        src={slide.image}
                                                        alt={slide.title}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            objectPosition: 'top center',
                                                            display: 'block'
                                                        }}
                                                    />
                                                </div>
                                            ))}

                                            {/* Bottom iOS Home Indicator Bar */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '7px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '48px',
                                                height: '3.5px',
                                                borderRadius: '999px',
                                                background: 'rgba(255, 255, 255, 0.92)',
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                                                zIndex: 30,
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Synchronized Mobile Switcher Dots */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        marginTop: '15px'
                                    }}>
                                        {PREVIEW_MOBILE_SLIDES.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setPreviewSlide(i)}
                                                aria-label={`Switch preview to slide ${i + 1}`}
                                                style={{
                                                    width: previewSlide === i ? '20px' : '6px',
                                                    height: '6px',
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    padding: 0,
                                                    cursor: 'pointer',
                                                    background: previewSlide === i ? '#2563eb' : '#cbd5e1',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p style={{
                                        textAlign: 'center',
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#64748b',
                                        marginTop: '6px'
                                    }}>
                                        100% Touch Responsive
                                    </p>
                                </div>
                            </Reveal>
                        </div>

                        {/* Synchronized Interactive Slide Switcher Pills & Live CTA */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '14px',
                            marginTop: '32px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                                gap: '10px'
                            }}>
                                {PREVIEW_DESKTOP_SLIDES.map((slide, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setPreviewSlide(idx)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '9px 20px',
                                            borderRadius: '999px',
                                            border: previewSlide === idx ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                                            background: previewSlide === idx ? '#eff6ff' : '#ffffff',
                                            color: previewSlide === idx ? '#1d4ed8' : '#64748b',
                                            boxShadow: previewSlide === idx ? '0 4px 14px -2px rgba(37,99,235,0.22)' : '0 2px 6px rgba(0,0,0,0.04)',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.22s ease'
                                        }}
                                    >
                                        <span style={{
                                            width: '7px',
                                            height: '7px',
                                            borderRadius: '50%',
                                            background: previewSlide === idx ? '#2563eb' : '#cbd5e1',
                                            transition: 'background 0.22s ease'
                                        }} />
                                        <span>{slide.title}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Direct Live Website Link & Auto-rotate indicator */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                                <a
                                    href="https://jdis.wbpro.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        padding: '7px 18px',
                                        borderRadius: '999px',
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        textDecoration: 'none',
                                        fontSize: '12.5px',
                                        fontWeight: 700,
                                        boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'}
                                    onMouseOut={e => e.currentTarget.style.background = '#2563eb'}
                                >
                                    <span>Explore Live Portal</span>
                                    <span>↗</span>
                                </a>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                                    &bull; Auto-syncs every 4s across devices
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Trust section — "Built to grow with your school" ── */}
                <section style={{
                    padding: 'clamp(4rem, 7vw, 6rem) clamp(1.25rem, 5vw, 3.5rem)',
                    background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 50%, #ffffff 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    borderTop: '1px solid #edf2f7'
                }}>
                    {/* Subtle blueprint dot grid pattern */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(rgba(100, 116, 139, 0.16) 1.2px, transparent 1.2px)',
                        backgroundSize: '28px 28px',
                        opacity: 0.5,
                        pointerEvents: 'none'
                    }} />

                    {/* Ambient luminous glow auras */}
                    <div style={{
                        position: 'absolute',
                        width: '500px',
                        height: '500px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
                        top: '-80px',
                        right: '5%',
                        filter: 'blur(50px)',
                        pointerEvents: 'none'
                    }} />
                    <div style={{
                        position: 'absolute',
                        width: '500px',
                        height: '500px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
                        bottom: '-80px',
                        left: '5%',
                        filter: 'blur(50px)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ maxWidth: '1220px', margin: '0 auto', position: 'relative' }}>
                        <Reveal style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3.5rem auto' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 16px',
                                borderRadius: '999px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                marginBottom: '16px'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                    Enterprise Cloud Foundation
                                </span>
                            </div>

                            <h2 style={{
                                fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                                fontSize: 'clamp(28px, 4vw, 42px)',
                                fontWeight: 900,
                                letterSpacing: '-0.8px',
                                lineHeight: 1.15,
                                marginBottom: '14px',
                                color: '#0f172a'
                            }}>
                                <span>Built to Grow With </span>
                                <span style={{
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #38bdf8 100%)',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    display: 'inline-block'
                                }}>
                                    Your School
                                </span>
                            </h2>

                            <p style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '15.5px',
                                color: '#64748b',
                                lineHeight: 1.7,
                                marginBottom: '1.75rem'
                            }}>
                                Every plan comes with a fast, secure, reliable cloud platform — so your administration can focus on education, not server management.
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="lp-btn"
                                    style={{
                                        padding: '13px 28px',
                                        background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.35)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <span>Get Started Free</span>
                                    <span>&rarr;</span>
                                </button>
                                <a
                                    href="#features"
                                    style={{
                                        padding: '12px 24px',
                                        background: '#ffffff',
                                        color: '#334155',
                                        border: '1.5px solid #e2e8f0',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                                    onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    <span>Explore Modules</span>
                                    <span>&darr;</span>
                                </a>
                            </div>
                        </Reveal>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                            gap: '1.5rem',
                            position: 'relative'
                        }}>
                            {TRUST_CARDS.map((c, i) => (
                                <PopReveal key={c.title} delay={i * 0.08}>
                                    <div
                                        className="lp-trust-card"
                                        style={{
                                            background: c.cardBg,
                                            border: `1.5px solid ${c.borderColor}`,
                                            borderRadius: '20px',
                                            padding: '1.85rem 1.65rem',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            boxShadow: '0 4px 20px -3px rgba(15, 23, 42, 0.05)',
                                            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                                            cursor: 'default'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-6px)';
                                            e.currentTarget.style.boxShadow = '0 16px 36px -6px rgba(15, 23, 42, 0.12)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 20px -3px rgba(15, 23, 42, 0.05)';
                                        }}
                                    >
                                        {/* Card Header: Icon & Tag */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                                            <div style={{
                                                width: '46px',
                                                height: '46px',
                                                borderRadius: '14px',
                                                background: c.badgeBg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: `0 8px 18px -2px ${c.badgeShadow}`
                                            }}>
                                                <svg width="22" height="22" fill="none" stroke="#ffffff" strokeWidth="2" viewBox="0 0 24 24">
                                                    {c.icon}
                                                </svg>
                                            </div>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                padding: '4px 10px',
                                                borderRadius: '999px',
                                                background: c.tagBg,
                                                color: c.tagColor,
                                                letterSpacing: '0.03em'
                                            }}>
                                                {c.tag}
                                            </span>
                                        </div>

                                        {/* Card Title & Desc */}
                                        <h3 style={{
                                            fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
                                            fontSize: '18px',
                                            fontWeight: 800,
                                            color: '#0f172a',
                                            marginBottom: '8px',
                                            letterSpacing: '-0.3px'
                                        }}>
                                            {c.title}
                                        </h3>
                                        <p style={{
                                            fontSize: '13.5px',
                                            color: '#475569',
                                            lineHeight: 1.7,
                                            marginBottom: '18px',
                                            flex: 1
                                        }}>
                                            {c.desc}
                                        </p>

                                        {/* Bottom Perk Pill */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '7px',
                                            paddingTop: '12px',
                                            borderTop: `1px dashed ${c.borderColor}`,
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            color: c.tagColor
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>{c.perk}</span>
                                        </div>
                                    </div>
                                </PopReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA Banner (High-Converting & Mobile-Responsive) ── */}
                <section style={{ padding: 'clamp(2.5rem, 5vw, 4.5rem) clamp(1rem, 4vw, 2.5rem)', background: '#ffffff', position: 'relative' }}>
                    <Reveal>
                        <div style={{
                            maxWidth: '1100px',
                            margin: '0 auto',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: 'clamp(20px, 3.5vw, 32px)',
                            padding: 'clamp(2.75rem, 6vw, 4.75rem) clamp(1.25rem, 4vw, 3.5rem)',
                            background: 'linear-gradient(135deg, #1b2848 0%, #1d408f 42%, #2563eb 100%)',
                            border: '1px solid rgba(255, 255, 255, 0.16)',
                            boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35), 0 12px 28px -6px rgba(37, 99, 235, 0.3)',
                            textAlign: 'center'
                        }}>
                            {/* Circle accent at top-left — matching user screenshot */}
                            <div style={{
                                position: 'absolute',
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.08)',
                                top: '24px',
                                left: 'clamp(20px, 5vw, 68px)',
                                pointerEvents: 'none'
                            }} />

                            {/* Soft glowing ambient orbs */}
                            <div style={{
                                position: 'absolute',
                                width: '380px',
                                height: '380px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 68%)',
                                top: '-100px',
                                right: '-50px',
                                pointerEvents: 'none'
                            }} />
                            <div style={{
                                position: 'absolute',
                                width: '340px',
                                height: '340px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 68%)',
                                bottom: '-80px',
                                left: '-40px',
                                pointerEvents: 'none'
                            }} />

                            {/* Isometric School Building Icon with floating motion */}
                            <div style={{
                                position: 'relative',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '18px',
                                filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.32))',
                                animation: 'lpFloatIso 5s ease-in-out infinite'
                            }}>
                                <IsoSchool size={84} tone="blue" />
                            </div>

                            {/* Crisp High-Contrast Bold Heading */}
                            <h2 style={{
                                fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                                fontSize: 'clamp(25px, 4.4vw, 42px)',
                                fontWeight: 800,
                                letterSpacing: '-0.8px',
                                lineHeight: 1.2,
                                color: '#ffffff',
                                marginBottom: '14px',
                                position: 'relative',
                                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                            }}>
                                Ready to bring your school online?
                            </h2>

                            {/* Subtitle */}
                            <p style={{
                                fontFamily: "'Inter', system-ui, sans-serif",
                                fontSize: 'clamp(14px, 2vw, 16.5px)',
                                color: 'rgba(255, 255, 255, 0.9)',
                                maxWidth: '580px',
                                margin: '0 auto clamp(1.75rem, 3.5vw, 2.5rem) auto',
                                lineHeight: 1.65,
                                position: 'relative'
                            }}>
                                Login to your dashboard and start building your school's website today.
                            </p>

                            {/* Buttons Group — Responsive Flex on Mobile */}
                            <div className="lp-cta-btn-group" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '14px',
                                flexWrap: 'wrap',
                                position: 'relative',
                                zIndex: 5
                            }}>
                                <button
                                    onClick={() => navigate('/login')}
                                    style={{
                                        padding: '14px 34px',
                                        background: '#ffffff',
                                        color: '#1d4ed8',
                                        border: 'none',
                                        borderRadius: '13px',
                                        fontSize: '15px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.26)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
                                    }}
                                >
                                    Login to Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="lp-btn"
                                    style={{
                                        padding: '13px 30px',
                                        background: 'rgba(255, 255, 255, 0.14)',
                                        color: '#ffffff',
                                        border: '1.5px solid rgba(255, 255, 255, 0.38)',
                                        borderRadius: '13px',
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(8px)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.24)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.65)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.38)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <span>Start Free Trial</span>
                                    <span>&rarr;</span>
                                </button>
                            </div>

                            {/* Trust Assurance Row */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'clamp(12px, 3vw, 24px)',
                                flexWrap: 'wrap',
                                marginTop: '2rem',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'rgba(255, 255, 255, 0.85)',
                                position: 'relative'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ color: '#4ade80' }}>✓</span> No credit card required
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ color: '#4ade80' }}>✓</span> Instant setup in 10 mins
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ color: '#4ade80' }}>✓</span> Dedicated school onboarding
                                </span>
                            </div>
                        </div>
                    </Reveal>

                    {/* Centered logo preview directly beneath card as in user screenshot */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 'clamp(2.5rem, 5vw, 3.75rem)'
                    }}>
                        <img
                            src={logo}
                            alt="Web Builder Pro"
                            style={{
                                height: 'clamp(32px, 4vw, 42px)',
                                width: 'auto',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                </section>

                {/* ── Rich Dark Footer (Web Builder Pro) ── */}
                <footer style={{
                    background: '#0a0f1d',
                    color: '#94a3b8',
                    padding: 'clamp(3.5rem, 6vw, 5rem) clamp(1.25rem, 6vw, 4rem) 2rem',
                    borderTop: '1px solid #1e293b',
                    position: 'relative'
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {/* 4-Column Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 'clamp(2rem, 4vw, 3.5rem)',
                            marginBottom: '3.5rem'
                        }}>
                            {/* Column 1: Brand & Bio */}
                            <div style={{ maxWidth: '340px' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#ffffff',
                                    padding: '8px 16px',
                                    borderRadius: '12px',
                                    marginBottom: '18px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}>
                                    <img src={logo} alt="Web Builder Pro" style={{ height: '30px', objectFit: 'contain' }} />
                                </div>
                                <p style={{
                                    fontSize: '13.5px',
                                    lineHeight: 1.75,
                                    color: '#94a3b8',
                                    marginBottom: '20px'
                                }}>
                                    Web Builder Pro is an all-in-one school website builder that helps educational institutions launch modern, mobile-responsive websites in minutes with 21+ purpose-built modules for admissions, fees, notices, galleries, and CBSE disclosures.
                                </p>
                                {/* Social Media Icons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {[
                                        {
                                            label: 'Twitter / X',
                                            href: 'https://twitter.com',
                                            icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                        },
                                        {
                                            label: 'LinkedIn',
                                            href: 'https://linkedin.com',
                                            icon: <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.75a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z"/>
                                        },
                                        {
                                            label: 'Facebook',
                                            href: 'https://facebook.com',
                                            icon: <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
                                        },
                                        {
                                            label: 'Instagram',
                                            href: 'https://instagram.com',
                                            icon: (
                                                <>
                                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                                                </>
                                            ),
                                            stroke: true
                                        }
                                    ].map((s, idx) => (
                                        <a
                                            key={idx}
                                            href={s.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={s.label}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                background: '#0f172a',
                                                border: '1px solid #1e293b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#94a3b8',
                                                transition: 'all 0.2s ease',
                                                textDecoration: 'none'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.color = '#38bdf8';
                                                e.currentTarget.style.borderColor = '#38bdf8';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.color = '#94a3b8';
                                                e.currentTarget.style.borderColor = '#1e293b';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <svg
                                                width="16"
                                                height="16"
                                                fill={s.stroke ? "none" : "currentColor"}
                                                stroke={s.stroke ? "currentColor" : "none"}
                                                strokeWidth={s.stroke ? "2" : "0"}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                viewBox="0 0 24 24"
                                            >
                                                {s.icon}
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Column 2: Features (Strictly from Web Builder Pro platform) */}
                            <div>
                                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginBottom: '18px', letterSpacing: '-0.2px' }}>
                                    Features
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                    {[
                                        { label: 'Custom Public Website', href: '#features' },
                                        { label: '21+ School Modules', href: '#modules' },
                                        { label: 'Smart Enquiry Forms', href: '#features' },
                                        { label: 'One Admin Dashboard', href: '#features' },
                                        { label: 'Announcements & Calendar', href: '#features' },
                                        { label: 'Dynamic Photo Gallery', href: '#modules' },
                                        { label: 'CBSE Public Disclosure', href: '#modules' }
                                    ].map((item, idx) => (
                                        <li key={idx}>
                                            <a
                                                href={item.href}
                                                style={{
                                                    fontSize: '13.5px',
                                                    color: '#94a3b8',
                                                    textDecoration: 'none',
                                                    transition: 'color 0.18s ease'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Column 3: Platform & Support */}
                            <div>
                                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginBottom: '18px', letterSpacing: '-0.2px' }}>
                                    Platform
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                    {[
                                        { label: 'Platform Live Demo', href: DEMO_URL, external: true },
                                        { label: 'Interactive Preview', href: '#preview' },
                                        { label: 'Fee Structure Tables', href: '#modules' },
                                        { label: 'Contact Support', href: 'tel:+918947919195' },
                                        { label: 'Privacy Policy', href: '#' },
                                        { label: 'Terms & Conditions', href: '#' },
                                        { label: 'Super Admin Login', href: '/super-admin/login' }
                                    ].map((item, idx) => (
                                        <li key={idx}>
                                            <a
                                                href={item.href}
                                                target={item.external ? "_blank" : undefined}
                                                rel={item.external ? "noopener noreferrer" : undefined}
                                                style={{
                                                    fontSize: '13.5px',
                                                    color: '#94a3b8',
                                                    textDecoration: 'none',
                                                    transition: 'color 0.18s ease'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                            >
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Column 4: Contact */}
                            <div>
                                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginBottom: '18px', letterSpacing: '-0.2px' }}>
                                    Contact
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {/* Email */}
                                    <a
                                        href="mailto:testmaster@webncode.in"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '13.5px',
                                            color: '#94a3b8',
                                            textDecoration: 'none',
                                            transition: 'color 0.18s ease'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                    >
                                        <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}>
                                            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                <rect x="3" y="4" width="18" height="16" rx="2"/>
                                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                            </svg>
                                        </span>
                                        <span>testmaster@webncode.in</span>
                                    </a>

                                    {/* Phone Number */}
                                    <a
                                        href="tel:+918947919195"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '13.5px',
                                            color: '#94a3b8',
                                            textDecoration: 'none',
                                            transition: 'color 0.18s ease'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#34d399'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                    >
                                        <span style={{ color: '#34d399', display: 'flex', alignItems: 'center' }}>
                                            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                            </svg>
                                        </span>
                                        <span style={{ fontWeight: 600 }}>+91 8947919195</span>
                                    </a>

                                    {/* Location */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '13.5px',
                                        color: '#94a3b8'
                                    }}>
                                        <span style={{ color: '#f472b6', display: 'flex', alignItems: 'center' }}>
                                            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                        </span>
                                        <span>Jaipur, Rajasthan</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Copyright & Legal Links Bar */}
                        <div style={{
                            borderTop: '1px solid #1e293b',
                            paddingTop: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '14px',
                            fontSize: '12.5px',
                            color: '#64748b'
                        }}>
                            <div>
                                &copy; 2026 Web Builder Pro. All rights reserved.
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <a
                                    href="#"
                                    style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.18s ease' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                                >
                                    Privacy policy
                                </a>
                                <a
                                    href="#"
                                    style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.18s ease' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                                >
                                    Terms of service
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
};

export default LandingPage;
