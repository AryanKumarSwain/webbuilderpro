import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// ── Custom font whitelist — matches the site's FONT_OPTIONS (constants/fonts.js) so the
// rich-text font picker offers the same brand fonts used elsewhere, not generic web-safe ones.
const FONT_STACKS = {
  inter: "'Inter', system-ui, sans-serif",
  poppins: "'Poppins', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
  raleway: "'Raleway', sans-serif",
  merriweather: "'Merriweather', Georgia, serif",
};
const FONT_LABELS = {
  inter: "Inter",
  poppins: "Poppins",
  montserrat: "Montserrat",
  playfair: "Playfair Display",
  raleway: "Raleway",
  merriweather: "Merriweather",
};
const FONT_WHITELIST = Object.keys(FONT_STACKS);

const QuillFont = Quill.import("formats/font");
QuillFont.whitelist = FONT_WHITELIST;
Quill.register(QuillFont, true);

// A tidy, brand-safe swatch set for the color/background pickers (Quill renders these as
// clickable swatches automatically when given an array instead of the full palette).
// A leading '' entry is required for Quill's snow theme to render a "remove color" swatch
// (styled as a red diagonal slash) — without it, users can only switch between swatches,
// never clear back to no color/no highlight.
const COLOR_SWATCHES = [
  "", "#0f172a", "#334155", "#64748b", "#94a3b8", "#ffffff",
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2",
  "#2563eb", "#7c3aed", "#c026d3", "#db2777",
];

const modules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ size: ["small", false, "large", "huge"] }],
    [{ font: FONT_WHITELIST }],
    [{ color: COLOR_SWATCHES }, { background: COLOR_SWATCHES }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["clean"],
  ],
};

const formats = [
  "bold",
  "italic",
  "underline",
  "strike",
  "size",
  "font",
  "color",
  "background",
  "list",
  "align",
];

const fontFaceCss = FONT_WHITELIST.map(
  (key) => `
.rte-wrapper .ql-font-${key} { font-family: ${FONT_STACKS[key]}; }
.rte-wrapper .ql-picker.ql-font .ql-picker-label[data-value="${key}"]::before,
.rte-wrapper .ql-picker.ql-font .ql-picker-item[data-value="${key}"]::before {
    content: '${FONT_LABELS[key]}';
    font-family: ${FONT_STACKS[key]};
}`
).join("\n");

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  minHeight = "120px",
  maxWidth,
  fontSize = "13.5px",
  fontFamily = "system-ui, sans-serif",
}) => {
  return (
    <div
      className="rte-wrapper"
      style={{
        "--rte-min-height": minHeight,
        "--rte-font-size": fontSize,
        "--rte-font-family": fontFamily,
        width: "100%",
        maxWidth: maxWidth || "100%",
        boxSizing: "border-box",
      }}
    >
      <style>{`
                .rte-wrapper .ql-toolbar {
                    border: 0.5px solid #e2e8f0;
                    border-bottom: none;
                    border-radius: 10px 10px 0 0;
                    background: #f8fafc;
                }
                .rte-wrapper .ql-container {
                    border: 0.5px solid #e2e8f0;
                    border-radius: 0 0 10px 10px;
                    font-family: var(--rte-font-family);
                    font-size: var(--rte-font-size);
                    background: #ffffff;
                }
                .rte-wrapper .ql-editor {
                    min-height: var(--rte-min-height);
                    line-height: 1.7;
                    color: #0f172a;
                }
                .rte-wrapper .ql-editor.ql-blank::before {
                    color: #94a3b8;
                    font-style: normal;
                    font-size: var(--rte-font-size);
                }
                .rte-wrapper .ql-snow.ql-toolbar button:hover,
                .rte-wrapper .ql-snow .ql-toolbar button:hover,
                .rte-wrapper .ql-snow.ql-toolbar button.ql-active,
                .rte-wrapper .ql-snow .ql-toolbar button.ql-active {
                    color: #8b2252;
                }
                .rte-wrapper .ql-snow.ql-toolbar button:hover .ql-stroke,
                .rte-wrapper .ql-snow .ql-toolbar button:hover .ql-stroke,
                .rte-wrapper .ql-snow.ql-toolbar button.ql-active .ql-stroke {
                    stroke: #8b2252;
                }
                .rte-wrapper .ql-snow.ql-toolbar button:hover .ql-fill,
                .rte-wrapper .ql-snow .ql-toolbar button:hover .ql-fill,
                .rte-wrapper .ql-snow.ql-toolbar button.ql-active .ql-fill {
                    fill: #8b2252;
                }
                .rte-wrapper .ql-editor .ql-size-small { font-size: 0.75em; }
                .rte-wrapper .ql-editor .ql-size-large { font-size: 1.5em; }
                .rte-wrapper .ql-editor .ql-size-huge { font-size: 2.5em; }
                .rte-wrapper .ql-picker.ql-font { width: 130px; }
                .rte-wrapper .ql-picker.ql-font .ql-picker-label::before,
                .rte-wrapper .ql-picker.ql-font .ql-picker-item::before { content: 'Font'; }
                ${fontFaceCss}
                @media (max-width: 640px) {
                    /* ── Toolbar — wrap into neat rows of small, evenly-spaced controls
                       instead of the cramped/overflowing default layout on narrow screens ── */
                    .rte-wrapper .ql-toolbar.ql-snow {
                        display: flex !important; flex-wrap: wrap !important;
                        align-items: center !important; gap: 4px 6px !important;
                        padding: 6px 8px !important;
                    }
                    .rte-wrapper .ql-toolbar.ql-snow .ql-formats {
                        margin: 0 !important; display: flex !important; align-items: center !important; gap: 2px !important;
                    }
                    .rte-wrapper .ql-toolbar.ql-snow button {
                        width: 24px !important; height: 24px !important; padding: 3px !important;
                    }
                    .rte-wrapper .ql-picker.ql-font { width: 68px !important; }
                    .rte-wrapper .ql-picker.ql-size { width: 54px !important; }
                    .rte-wrapper .ql-picker.ql-align { width: 40px !important; }
                    .rte-wrapper .ql-picker-label { padding-left: 4px !important; padding-right: 12px !important; font-size: 11px !important; }
                    .rte-wrapper .ql-picker.ql-color .ql-picker-label,
                    .rte-wrapper .ql-picker.ql-background .ql-picker-label {
                        width: 24px !important; height: 24px !important; padding: 3px !important;
                    }
                }
            `}</style>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
