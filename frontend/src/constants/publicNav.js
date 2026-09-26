import { COURSE_LEVELS } from "../utils/courseLevels";

// ── Single source of truth for theme colors used across ALL public pages ──
const THEME_COLORS_MAP = {
    // ── Classic Gradient Themes ──
    rosePink:  { primary: "#8b2252", secondary: "#c9687e", light: "#fdf2f6", dark: "#2d0a1a" },
    default:   { primary: "#8b2252", secondary: "#c9687e", light: "#fdf2f6", dark: "#2d0a1a" },
    blue:      { primary: "#1e3a5f", secondary: "#2563eb", light: "#eff6ff", dark: "#0f1e3d" },
    green:     { primary: "#064e3b", secondary: "#059669", light: "#f0fdf4", dark: "#022c22" },
    purple:    { primary: "#4a1d96", secondary: "#7c3aed", light: "#faf5ff", dark: "#1e0a3c" },
    orange:    { primary: "#7c2d12", secondary: "#ea580c", light: "#fff7ed", dark: "#3c1006" },
    dark:      { primary: "#0f0c05", secondary: "#c9a227", light: "#fefce8", dark: "#0a0800" },
    beige:     { primary: "#7a624a", secondary: "#cbab7c", light: "#faf5ec", dark: "#241c12" },
    slate:     { primary: "#414b56", secondary: "#8b98a8", light: "#f2f4f6", dark: "#171b20" },
    cream:     { primary: "#9c8a63", secondary: "#e6d7b0", light: "#fffcf5", dark: "#2b2515" },
    red:       { primary: "#7f1d1d", secondary: "#dc2626", light: "#fef2f2", dark: "#3f0d0d" },
    teal:      { primary: "#134e4a", secondary: "#0d9488", light: "#f0fdfa", dark: "#042f2e" },
    navy:      { primary: "#0f1c3f", secondary: "#3b5bdb", light: "#eef2ff", dark: "#070d1f" },
    burgundy:  { primary: "#4a0e1f", secondary: "#be123c", light: "#fff1f2", dark: "#26060f" },
    olive:     { primary: "#1f2e0a", secondary: "#65a30d", light: "#f7fee7", dark: "#0f1705" },
    cyan:      { primary: "#0e3b45", secondary: "#0891b2", light: "#ecfeff", dark: "#071e24" },
    amber:     { primary: "#78350f", secondary: "#f59e0b", light: "#fffbeb", dark: "#3d1c04" },
    charcoal:  { primary: "#18181b", secondary: "#71717a", light: "#fafafa", dark: "#09090b" },
    lavender:  { primary: "#3f2d63", secondary: "#a78bfa", light: "#f5f3ff", dark: "#1f1733" },
    coral:     { primary: "#7c2d3d", secondary: "#fb7185", light: "#fff5f5", dark: "#3d1620" },
    plainCream: { primary: "#8a7550", secondary: "#f3ecd9", light: "#fdfaf3", dark: "#332a1a" },
    mustard:   { primary: "#7a5c00", secondary: "#eab308", light: "#fffbeb", dark: "#332600" },
    indigo:    { primary: "#312e81", secondary: "#6366f1", light: "#eef2ff", dark: "#181650" },

    // ── Light & Bright Gradient Themes ──
    brightCyan:        { primary: "#0891b2", secondary: "#06b6d4", light: "#ecfeff", dark: "#155e75" },
    brightLime:        { primary: "#4d7c0f", secondary: "#84cc16", light: "#f7fee7", dark: "#365314" },
    brightViolet:      { primary: "#7c3aed", secondary: "#a855f7", light: "#faf5ff", dark: "#581c87" },
    brightTangerine:   { primary: "#ea580c", secondary: "#f97316", light: "#fff7ed", dark: "#9a3412" },
    brightMagenta:     { primary: "#c026d3", secondary: "#e879f9", light: "#fdf4ff", dark: "#701a75" },
    brightSunshine:    { primary: "#ca8a04", secondary: "#facc15", light: "#fefce8", dark: "#854d0e" },
    brightSky:         { primary: "#0284c7", secondary: "#38bdf8", light: "#f0f9ff", dark: "#075985" },
    brightWatermelon:  { primary: "#e11d48", secondary: "#fb7185", light: "#fff1f2", dark: "#881337" },
    pastelMint:        { primary: "#059669", secondary: "#34d399", light: "#ecfdf5", dark: "#064e3b" },
    pastelLilac:       { primary: "#6d28d9", secondary: "#c4b5fd", light: "#f5f3ff", dark: "#4c1d95" },
    pastelPeach:       { primary: "#c2410c", secondary: "#fdba74", light: "#fff7ed", dark: "#7c2d12" },
    pastelSky:         { primary: "#0369a1", secondary: "#7dd3fc", light: "#f0f9ff", dark: "#0c4a6e" },

    // ── Classic Solid Themes (Without Gradient) ──
    solidRoyalBlue:    { primary: "#1d4ed8", secondary: "#1d4ed8", light: "#eff6ff", dark: "#1e3a8a" },
    solidNavy:         { primary: "#0f2b5c", secondary: "#0f2b5c", light: "#eef2ff", dark: "#091a38" },
    solidSky:          { primary: "#0284c7", secondary: "#0284c7", light: "#f0f9ff", dark: "#0369a1" },
    solidTeal:         { primary: "#0f766e", secondary: "#0f766e", light: "#f0fdfa", dark: "#115e59" },
    solidEmerald:      { primary: "#047857", secondary: "#047857", light: "#f0fdf4", dark: "#064e3b" },
    solidForest:       { primary: "#14532d", secondary: "#14532d", light: "#f0fdf4", dark: "#052e16" },
    solidCrimson:      { primary: "#b91c1c", secondary: "#b91c1c", light: "#fef2f2", dark: "#7f1d1d" },
    solidMaroon:       { primary: "#831843", secondary: "#831843", light: "#fdf2f8", dark: "#500724" },
    solidPurple:       { primary: "#6b21a8", secondary: "#6b21a8", light: "#faf5ff", dark: "#3b0764" },
    solidSaffron:      { primary: "#d97706", secondary: "#d97706", light: "#fffbeb", dark: "#92400e" },
    solidAmber:        { primary: "#b45309", secondary: "#b45309", light: "#fffbeb", dark: "#78350f" },
    solidCoral:        { primary: "#e11d48", secondary: "#e11d48", light: "#fff1f2", dark: "#881337" },
    solidCharcoal:     { primary: "#18181b", secondary: "#18181b", light: "#fafafa", dark: "#09090b" },
    solidSlate:        { primary: "#334155", secondary: "#334155", light: "#f8fafc", dark: "#0f172a" },
    solidIndigo:       { primary: "#3730a3", secondary: "#3730a3", light: "#eef2ff", dark: "#1e1b4b" },
    solidLemon:        { primary: "#ca8a04", secondary: "#ca8a04", light: "#fefce8", dark: "#713f12" },
    solidLime:         { primary: "#4d7c0f", secondary: "#4d7c0f", light: "#f7fee7", dark: "#1a2e05" },
    solidRose:         { primary: "#9f1239", secondary: "#9f1239", light: "#fff1f2", dark: "#4c0519" },

    // ── Light & Pastel Solid Themes (Without Gradient) ──
    solidPowderBlue:   { primary: "#38bdf8", secondary: "#38bdf8", light: "#f0f9ff", dark: "#0369a1" },
    solidBabyBlue:     { primary: "#60a5fa", secondary: "#60a5fa", light: "#eff6ff", dark: "#1d4ed8" },
    solidPastelMint:   { primary: "#34d399", secondary: "#34d399", light: "#ecfdf5", dark: "#065f46" },
    solidSeafoam:      { primary: "#2dd4bf", secondary: "#2dd4bf", light: "#f0fdfa", dark: "#0f766e" },
    solidSage:         { primary: "#84a98c", secondary: "#84a98c", light: "#f2f6f3", dark: "#354f52" },
    solidPastelPeach:  { primary: "#fb923c", secondary: "#fb923c", light: "#fff7ed", dark: "#9a3412" },
    solidApricot:      { primary: "#f8a567", secondary: "#f8a567", light: "#fff7ed", dark: "#9a3412" },
    solidPastelPink:   { primary: "#f472b6", secondary: "#f472b6", light: "#fdf2f8", dark: "#9d174d" },
    solidBlush:        { primary: "#fb7185", secondary: "#fb7185", light: "#fff1f2", dark: "#9f1239" },
    solidLavender:     { primary: "#a78bfa", secondary: "#a78bfa", light: "#f5f3ff", dark: "#5b21b6" },
    solidPastelLilac:  { primary: "#c084fc", secondary: "#c084fc", light: "#faf5ff", dark: "#6b21a8" },
    solidPeriwinkle:   { primary: "#818cf8", secondary: "#818cf8", light: "#eef2ff", dark: "#3730a3" },
    solidButtercup:    { primary: "#facc15", secondary: "#facc15", light: "#fefce8", dark: "#854d0e" },
    solidVanilla:      { primary: "#eab308", secondary: "#eab308", light: "#fefce8", dark: "#713f12" },
    solidPistachio:    { primary: "#a3e635", secondary: "#a3e635", light: "#f7fee7", dark: "#3f6212" },
    solidIceCyan:      { primary: "#22d3ee", secondary: "#22d3ee", light: "#ecfeff", dark: "#0e7490" },
    solidSand:         { primary: "#c7ad8c", secondary: "#c7ad8c", light: "#faf7f2", dark: "#52402e" },
    solidCloud:        { primary: "#94a3b8", secondary: "#94a3b8", light: "#f8fafc", dark: "#334155" },
};

export const getThemeColors = (theme) => THEME_COLORS_MAP[theme] || THEME_COLORS_MAP.default;

// ── Whether a school admin has this module switched on via "Manage Modules" ──
// `selected_modules` comes back from the public school API as an array of module keys
// (or is missing/non-array on very old data) — fail-open only in that legacy case so an
// unset field doesn't accidentally hide every module on a school that predates this field.
export const isModuleEnabled = (school, moduleKey) => {
    const mods = school?.selected_modules;
    if (!Array.isArray(mods)) return true;
    return mods.includes(moduleKey);
};

// ── Base/surface palette — independent of the accent theme above. Drives the
// site's overall background (previously hardcoded white) plus the shade used
// for cards/panels that sit on top of it, so accent theme (primary/secondary)
// and base theme (surface/card) can be mixed and matched freely.
//  - surface:    main page/section background (replaces hardcoded #ffffff)
//  - surfaceAlt: muted/alternating section background (replaces #fafafa / #f8fafc stripes)
//  - card:       card/panel background sitting on a tinted or surfaceAlt section
//  - cardAlt:    a slightly deeper card shade, for secondary cards or hover states
// NOTE: these need to stay visibly distinct from #ffffff at a glance — the first
// version of this palette (surface tones like #fffef7) was so close to pure white
// it was indistinguishable on a normal monitor, which read as "the base color isn't
// changing." Keep `surface`/`surfaceAlt` clearly tinted; `card` can stay closer to
// white since real cards commonly do even on a tinted page.
const BASE_COLORS_MAP = {
    // ── Modern Neutrals ──
    white:      { label: "White",          category: "neutral", surface: "#ffffff", surfaceAlt: "#f1f5f9", card: "#ffffff", cardAlt: "#e9edf3" },
    pearl:      { label: "Pearl",          category: "neutral", surface: "#f4f1eb", surfaceAlt: "#e6e0d4", card: "#fbf9f6", cardAlt: "#d4cac0" },
    gray:       { label: "Soft Gray",      category: "neutral", surface: "#e7ebef", surfaceAlt: "#d4dbe1", card: "#ffffff", cardAlt: "#c2ccd4" },
    nordic:     { label: "Nordic Gray",    category: "neutral", surface: "#e2e6eb", surfaceAlt: "#c7d0d8", card: "#f3f6f8", cardAlt: "#a7b5c1" },
    cashmere:   { label: "Cashmere",       category: "neutral", surface: "#eee5db", surfaceAlt: "#ded0c0", card: "#faf6f2", cardAlt: "#c7b49e" },
    sand:       { label: "Light Sand",     category: "neutral", surface: "#ece3d4", surfaceAlt: "#d9c7ab", card: "#f7f3ea", cardAlt: "#c7b28c" },

    // ── Warm & Cream ──
    cream:      { label: "Cream",          category: "warm",    surface: "#f7ead0", surfaceAlt: "#edd6a4", card: "#fffaf0", cardAlt: "#e6cd94" },
    ivory:      { label: "Ivory",          category: "warm",    surface: "#f2ecdd", surfaceAlt: "#e4d8bd", card: "#fbf8f0", cardAlt: "#d9cca8" },
    champagne:  { label: "Champagne",      category: "warm",    surface: "#f8edd7", surfaceAlt: "#eddcb0", card: "#fffbf3", cardAlt: "#dfc78f" },
    yellow:     { label: "Light Yellow",   category: "warm",    surface: "#f9f0d0", surfaceAlt: "#f2e0a0", card: "#fdf9ec", cardAlt: "#ecd482" },
    butter:     { label: "Buttercup",      category: "warm",    surface: "#fdf1d4", surfaceAlt: "#f8df9e", card: "#fefcf2", cardAlt: "#f1cc67" },
    amber:      { label: "Amber",          category: "warm",    surface: "#fbe9c9", surfaceAlt: "#f5d28f", card: "#fef9ee", cardAlt: "#eabb5e" },
    peach:      { label: "Light Peach",    category: "warm",    surface: "#fbe6d4", surfaceAlt: "#f5cca4", card: "#fef6ee", cardAlt: "#edb87e" },
    apricot:    { label: "Apricot",        category: "warm",    surface: "#fde7d4", surfaceAlt: "#fad0aa", card: "#fef7f0", cardAlt: "#f5b67e" },
    coral:      { label: "Light Coral",    category: "warm",    surface: "#fbe0d8", surfaceAlt: "#f5b8a8", card: "#fef4f0", cardAlt: "#ee9c86" },

    // ── Cool & Sky Blues ──
    blue:       { label: "Light Blue",     category: "cool",    surface: "#dceefb", surfaceAlt: "#b8ddf5", card: "#f2f9fe", cardAlt: "#a8d0ec" },
    azure:      { label: "Azure Sky",      category: "cool",    surface: "#d7ecfc", surfaceAlt: "#b0d9f8", card: "#f0f8fe", cardAlt: "#8fc3f2" },
    glacier:    { label: "Ice Blue",       category: "cool",    surface: "#daf1f7", surfaceAlt: "#b2e3ed", card: "#f1fafd", cardAlt: "#92d2e1" },
    indigo:     { label: "Indigo",         category: "cool",    surface: "#e0e4fb", surfaceAlt: "#c2c9f5", card: "#f4f5fe", cardAlt: "#a9b2ec" },
    periwinkle: { label: "Periwinkle",     category: "cool",    surface: "#e2e6fa", surfaceAlt: "#c3cbfa", card: "#f3f5fe", cardAlt: "#a3aff4" },
    slate:      { label: "Slate Blue",     category: "cool",    surface: "#e2e8f2", surfaceAlt: "#c7d1e3", card: "#f4f7fb", cardAlt: "#aebbd4" },

    // ── Botanical & Greens ──
    green:      { label: "Light Green",    category: "green",   surface: "#e3efe0", surfaceAlt: "#c7dfc0", card: "#f4f9f2", cardAlt: "#b3d2a8" },
    sage:       { label: "Sage",           category: "green",   surface: "#dfe7df", surfaceAlt: "#c2d4c2", card: "#f3f7f3", cardAlt: "#a9c3a9" },
    mint:       { label: "Light Mint",     category: "green",   surface: "#dcefe6", surfaceAlt: "#b3ddc9", card: "#f0faf5", cardAlt: "#93cbae" },
    pistachio:  { label: "Pistachio",      category: "green",   surface: "#e5eed6", surfaceAlt: "#cde0b4", card: "#f5f9ed", cardAlt: "#b1ce90" },
    honeydew:   { label: "Honeydew",       category: "green",   surface: "#e0f3e6", surfaceAlt: "#bce4c7", card: "#f2faf5", cardAlt: "#99d2aa" },
    teal:       { label: "Light Teal",     category: "green",   surface: "#dcf0ec", surfaceAlt: "#b0ded4", card: "#f0faf8", cardAlt: "#8fcec0" },
    seafoam:    { label: "Seafoam",        category: "green",   surface: "#daf2ee", surfaceAlt: "#b2e5dc", card: "#f1fbf9", cardAlt: "#8ed4c7" },
    oliveMist:  { label: "Olive Mist",     category: "green",   surface: "#e7e8d7", surfaceAlt: "#d1d4b8", card: "#f5f6ed", cardAlt: "#b3b794" },

    // ── Pastels, Pinks & Purples ──
    pink:       { label: "Light Pink",     category: "pink",    surface: "#fbe1ea", surfaceAlt: "#f5c2d6", card: "#fef4f8", cardAlt: "#f0aec8" },
    rose:       { label: "Rose",           category: "pink",    surface: "#fce0e6", surfaceAlt: "#f7bdc9", card: "#fef5f7", cardAlt: "#f0a3b3" },
    blush:      { label: "Blush",          category: "pink",    surface: "#fbe3df", surfaceAlt: "#f5c4bc", card: "#fef5f3", cardAlt: "#eda397" },
    lavender:   { label: "Light Lavender", category: "pink",    surface: "#ece4f7", surfaceAlt: "#d6c5ec", card: "#f7f3fc", cardAlt: "#c3a8e0" },
    lilac:      { label: "Lilac",          category: "pink",    surface: "#ebe3f7", surfaceAlt: "#d6c3ee", card: "#f7f4fc", cardAlt: "#bfa5e4" },
    mauve:      { label: "Mauve",          category: "pink",    surface: "#f0e2ed", surfaceAlt: "#e0c2db", card: "#faf3f8", cardAlt: "#c99ec2" },
    plumMist:   { label: "Plum Mist",      category: "pink",    surface: "#efe2e7", surfaceAlt: "#ddc3ce", card: "#faf4f6", cardAlt: "#c6a2b3" },
};

export const getBaseColors = (base) => BASE_COLORS_MAP[base] || BASE_COLORS_MAP.white;

export const BASE_COLOR_OPTIONS = Object.entries(BASE_COLORS_MAP).map(([key, v]) => ({ key, ...v }));

export const HOME_LINK = { key: 'home', label: 'Home', path: (slug) => `/school/${slug}` };

export const DISCLOSURE_LINK = { key: 'disclosure', label: 'Mandatory Public Disclosure', path: (slug) => `/school/${slug}/public-disclosure` };

// ── Navbar top-level items ──
// Three shapes, rendered differently by Navbar.jsx:
//  - plain link:        { key, label, path }                          → no dropdown
//  - group dropdown:    { label, links: [...] }                       → dropdown listing each link;
//                        a link may itself carry `subItems` (static) or `dynamicSubItems` (fetched,
//                        see Infrastructure/Courses below) for a nested flyout on hover
//  - single flyout:      { key, label, path, subItems }                → top-level hover opens the
//                        subItems flyout directly, skipping an intermediate group row (used by Sports)
export const NAVBAR_ITEMS = [
    HOME_LINK,
    {
        label: 'About Us',
        links: [
            { key: 'about',          label: 'About Us',       path: (slug) => `/school/${slug}/about` },
            { key: 'faculty',        label: 'Faculty',        path: (slug) => `/school/${slug}/faculty` },
            { key: 'infrastructure', label: 'Infrastructure', path: (slug) => `/school/${slug}/infrastructure`, dynamicSubItems: 'infrastructure' },
            { key: 'alumni',         label: 'Our Proud Alumni',         path: (slug) => `/school/${slug}/alumni` },
            { key: 'testimonials',   label: 'Testimonials',   path: (slug) => `/school/${slug}/testimonials` },
            { key: 'disclosure',     label: 'Mandatory Public Disclosure', path: (slug) => `/school/${slug}/public-disclosure` },
        ],
    },
    {
        label: 'Academics',
        links: [
            { key: 'courses',            label: 'Courses',              path: (slug) => `/school/${slug}/courses`, subItems: COURSE_LEVELS, dynamicSubItems: 'courses' },
            { key: 'fee',                label: 'Fee Structure',        path: (slug) => `/school/${slug}/fee` },
            { key: 'results',            label: 'Results',              path: (slug) => `/school/${slug}/results` },
            { key: 'tc',                 label: 'TC Information',       path: (slug) => `/school/${slug}/tc` },
            { key: 'achievements',       label: 'Achievements',         path: (slug) => `/school/${slug}/achievements` },
            { key: 'admissionProcedure', label: 'Admission Procedure',  path: (slug) => `/school/${slug}/admission-procedure` },
            { key: 'bookList',           label: 'Book List',            path: (slug) => `/school/${slug}/book-list` },
            { key: 'parentsCorner',      label: 'Parents Corner',       path: (slug) => `/school/${slug}/parents-corner` },
        ],
    },
    {
        key: 'sports', label: 'Sports', path: (slug) => `/school/${slug}/sports`,
        subItems: [
            { label: 'Sports at School', path: (slug) => `/school/${slug}/sports/sportsAt` },
            { label: 'Sports Offered',   path: (slug) => `/school/${slug}/sports/sportsOffered` },
            { label: 'Sporting Events',  path: (slug) => `/school/${slug}/sports/sportingEvents` },
            { label: 'Clubs & Activities', path: (slug) => `/school/${slug}/sports/clubsActivities` },
            { label: 'Awards & Achievements', path: (slug) => `/school/${slug}/sports/awards` },
        ],
    },
    {
        label: 'Gallery',
        links: [
            { key: 'gallery',       label: 'Photo Gallery', path: (slug) => `/school/${slug}/gallery/photo` },
            { key: 'gallery-video', label: 'Video Gallery', path: (slug) => `/school/${slug}/gallery/video` },
        ],
    },
    {
        label: 'News & Events',
        links: [
            { key: 'announcements', label: 'Announcements',      path: (slug) => `/school/${slug}/announcements` },
            { key: 'events',        label: 'Events & Activities', path: (slug) => `/school/${slug}/events` },
            { key: 'calendar',      label: 'Event Calendar',      path: (slug) => `/school/${slug}/calendar` },
            { key: 'circulars',     label: 'Circulars',           path: (slug) => `/school/${slug}/circulars` },
            { key: 'faqs',          label: 'FAQs',                path: (slug) => `/school/${slug}/faqs` },
        ],
    },
];

// ── Footer nav — same links, grouped by heading for the footer columns ──
// Milestone 2 only. Add more headings (Student Life, Community, Admissions)
// when those modules are built in Milestone 3.
export const FOOTER_NAV_GROUPS = [
    {
        heading: 'About Us',
        links: [
            { key: 'about',          label: 'About Us',        path: (slug) => `/school/${slug}/about` },
            { key: 'faculty',        label: 'Faculty',         path: (slug) => `/school/${slug}/faculty` },
            { key: 'infrastructure', label: 'Infrastructure',  path: (slug) => `/school/${slug}/infrastructure` },
            { key: 'alumni',         label: 'Alumni',          path: (slug) => `/school/${slug}/alumni` },
            { key: 'testimonials',   label: 'Testimonials',    path: (slug) => `/school/${slug}/testimonials` },
            { key: 'tc',             label: 'TC Information',  path: (slug) => `/school/${slug}/tc` },
        ],
    },
    {
        heading: 'Academics',
        links: [
            { key: 'courses',            label: 'Courses',              path: (slug) => `/school/${slug}/courses` },
            { key: 'fee',                label: 'Fee Structure',        path: (slug) => `/school/${slug}/fee` },
            { key: 'results',            label: 'Results',              path: (slug) => `/school/${slug}/results` },
            { key: 'admissionProcedure', label: 'Admission Procedure',  path: (slug) => `/school/${slug}/admission-procedure` },
            { key: 'bookList',           label: 'Book List',            path: (slug) => `/school/${slug}/book-list` },
            { key: 'parentsCorner',      label: 'Parents Corner',       path: (slug) => `/school/${slug}/parents-corner` },
            { key: 'disclosure',         label: 'Mandatory Public Disclosure', path: (slug) => `/school/${slug}/public-disclosure` },
        ],
    },
    {
        heading: 'Highlights',
        links: [
            { key: 'sports',       label: 'Sports',       path: (slug) => `/school/${slug}/sports` },
            { key: 'gallery',      label: 'Gallery',      path: (slug) => `/school/${slug}/gallery/photo` },
            { key: 'achievements', label: 'Achievements', path: (slug) => `/school/${slug}/achievements` },
            { key: 'announcements', label: 'Announcements', path: (slug) => `/school/${slug}/announcements` },
            { key: 'events',        label: 'Events & Activities', path: (slug) => `/school/${slug}/events` },
            { key: 'calendar',      label: 'Event Calendar', path: (slug) => `/school/${slug}/calendar` },
            { key: 'circulars',     label: 'Circulars', path: (slug) => `/school/${slug}/circulars` },
            { key: 'faqs',          label: 'FAQs', path: (slug) => `/school/${slug}/faqs` },
        ],
    },
];
