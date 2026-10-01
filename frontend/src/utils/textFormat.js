// Browsers treat a plain hyphen "-" as a valid point to break a line, per the
// Unicode line-breaking rules — this happens on any heading/paragraph with no
// special CSS involved. Swapping it for the "non-breaking hyphen" (U+2011)
// keeps the exact same visual character in every font, but removes that break
// opportunity, so text wraps only at spaces like normal words.
const NB_HYPHEN = '‑';

// Pasting from Word/Google Docs into the RTE routinely lands every inter-word
// space as a non-breaking space instead of a normal one. Quill's HTML output
// serializes that as the literal 6-character entity "&nbsp;" (not the raw
// U+00A0 codepoint), and that's exactly what ends up saved in tbl_module_content.
// A non-breaking space is, by spec, never a valid line-wrap point — so a whole
// paragraph of nbsp-joined "words" becomes one unbreakable run that either
// overflows its box (overflow-wrap: normal) or gets force-broken at arbitrary
// character positions (overflow-wrap: break-word), which looks like a word
// split in half. Converting both forms back to a normal space restores
// ordinary word-by-word wrapping.
const NBSP_CHAR_RE = / /g;
const NBSP_ENTITY_RE = /&nbsp;/gi;

// Replaces "-" and stray nbsp (both the raw character and the "&nbsp;" entity
// text) outside of HTML tags only, so URLs/attributes inside RTE HTML (e.g.
// Cloudinary URLs, which routinely contain hyphens) are left untouched.
export const noBreakHyphens = (str) => {
    if (!str || typeof str !== 'string') return str;
    const trimmed = str.trim();
    if (/^https?:\/\//i.test(trimmed)) return str; // whole-string URL fields (photo, pdfUrl, etc.)
    if (/^\d{4}[-\u2010-\u2015\u2212]\d{2}[-\u2010-\u2015\u2212]\d{2}/.test(trimmed)) {
        // Standardize YYYY-MM-DD to standard ASCII hyphens so HTML date inputs and Date.parse don't break
        return str.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-');
    }
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) return str; // emails
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return str; // UUIDs
    return str
        .split(/(<[^>]*>)/g)
        .map((part, i) => (i % 2 === 0
            ? part.replace(/-/g, NB_HYPHEN).replace(NBSP_CHAR_RE, ' ').replace(NBSP_ENTITY_RE, ' ')
            : part))
        .join('');
};

const EXEMPT_KEYS = new Set(['date', 'time', 'id', 'parentId', 'createdAt', 'updatedAt', 'url', 'linkUrl', 'pdfUrl', 'youtubeUrl', 'videoUrl', 'slug']);

// Recursively applies noBreakHyphens to every string in a module's content
// object/array, regardless of shape (each module's content JSON differs).
export const noBreakHyphensDeep = (value, parentKey = '') => {
    if (typeof value === 'string') {
        if (EXEMPT_KEYS.has(parentKey)) {
            // If it's a date or time field, normalize to standard ASCII hyphen
            return value.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-');
        }
        return noBreakHyphens(value);
    }
    if (Array.isArray(value)) return value.map(item => noBreakHyphensDeep(item, parentKey));
    if (value && typeof value === 'object') {
        const result = {};
        for (const key in value) result[key] = noBreakHyphensDeep(value[key], key);
        return result;
    }
    return value;
};
