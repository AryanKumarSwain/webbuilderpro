import { useEffect, useState } from "react";
import {
  getModuleContentApi,
  saveModuleContentApi,
  togglePublishApi,
  uploadContentImageApi,
} from "../../../api/content.api";
import RichTextEditor from "../../../components/common/RichTextEditor";
import ModuleActionButtons from "../../../components/admin/ModuleActionButtons";
import ImageCropModal from "../../../components/common/ImageCropModal";
import ImageThumbnailCard, { loadCropSrc } from "../../../components/common/ImageThumbnailCard";
import { moveItem } from "../../../utils/reorder";
import ItalicToggle from "../../../components/common/ItalicToggle";
import HeadingStyleField from "../../../components/common/HeadingStyleField";
import useSchoolStore from "../../../store/schoolStore";
import toast from "react-hot-toast";

const MAX_CATEGORY_IMAGES = 5;
const MAX_HORIZONTAL_IMAGES = 10;

const hexToRgba = (hex, alpha) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const defaultCategory = {
  id: "",
  slug: "",
  name: "",
  heading: "",
  description: "",
  images: [],
  horizontalImages: [],
};
const defaultContent = { categories: [] };

const Infrastructure = () => {
  const { tc, bc } = useSchoolStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [content, setContent] = useState(defaultContent);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [uploading, setUploading] = useState({});
  const [cropTarget, setCropTarget] = useState(null); // { mode: 'image' | 'horizontal', src }
  const [imageQueue, setImageQueue] = useState([]); // remaining files still waiting to be cropped, for whichever mode is active

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await getModuleContentApi("infrastructure");
      if (res.data) {
        const merged = { ...defaultContent, ...res.data.content };
        setContent(merged);
        setSavedSnapshot(res.data.has_draft_changes ? JSON.stringify(res.data.published_content || defaultContent) : JSON.stringify(merged));
        setIsPublished(res.data.is_published === 1);
        if (res.data.content?.categories?.length > 0) {
          setActiveCategory(res.data.content.categories[0].id);
        }
      }
    } catch (e) {
      console.log("No content yet");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    publish ? setPublishing(true) : setSaving(true);
    try {
      await saveModuleContentApi(
        "infrastructure",
        content,
        publish ? 1 : 0,
      );
      setSavedSnapshot(JSON.stringify(content));
      if (publish) {
        setIsPublished(true);
        toast.success("Infrastructure published! 🎉");
      } else toast.success("Saved!");
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      await togglePublishApi("infrastructure", 0);
      setIsPublished(false);
      toast.success("Unpublished");
    } catch (e) {
      toast.error("Failed");
    }
  };

  const addCategory = (name) => {
    if (!name.trim()) return;
    const slug = slugify(name);
    if (content.categories.find((c) => c.slug === slug)) {
      toast.error("A category with this name already exists");
      return;
    }
    const newCat = {
      ...defaultCategory,
      id: `cat-${Date.now()}`,
      slug,
      name: name.trim(),
    };
    setContent((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
    setActiveCategory(newCat.id);
    setShowAddCategory(false);
    setNewCategoryName("");
  };

  const removeCategory = (id) => {
    setContent((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
    if (activeCategory === id) {
      const remaining = content.categories.filter((c) => c.id !== id);
      setActiveCategory(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const getActiveCategoryData = () =>
    content.categories.find((c) => c.id === activeCategory);

  const updateField = (field, value) => {
    setContent((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === activeCategory ? { ...c, [field]: value } : c,
      ),
    }));
  };

  // Each file is cropped one at a time (freeform, no locked aspect — keep it tall/vertical
  // for the best fit in the public slider) before upload; capped at MAX_CATEGORY_IMAGES per
  // category. Once confirmed, the next queued file automatically opens in the crop modal.
  const startImageUpload = (files) => {
    const cat = getActiveCategoryData();
    const room = MAX_CATEGORY_IMAGES - (cat?.images || []).length;
    if (room <= 0) {
      toast.error(`Maximum ${MAX_CATEGORY_IMAGES} images allowed per category`);
      return;
    }
    const toQueue = files.slice(0, room);
    if (files.length > toQueue.length) {
      toast.error(`Only ${room} more image(s) can be added (max ${MAX_CATEGORY_IMAGES})`);
    }
    setImageQueue(toQueue.slice(1));
    setCropTarget({ mode: "image", src: URL.createObjectURL(toQueue[0]) });
  };

  // Horizontal gallery images (carousel below the description) — same queued crop flow,
  // freeform aspect, capped at MAX_HORIZONTAL_IMAGES per category.
  const startHorizontalUpload = (files) => {
    if (files.length === 0) return;
    const cat = getActiveCategoryData();
    const room = MAX_HORIZONTAL_IMAGES - (cat?.horizontalImages || []).length;
    if (room <= 0) {
      toast.error(`Maximum ${MAX_HORIZONTAL_IMAGES} images allowed per category`);
      return;
    }
    const toQueue = files.slice(0, room);
    if (files.length > toQueue.length) {
      toast.error(`Only ${room} more image(s) can be added (max ${MAX_HORIZONTAL_IMAGES})`);
    }
    setImageQueue(toQueue.slice(1));
    setCropTarget({ mode: "horizontal", src: URL.createObjectURL(toQueue[0]) });
  };

  const recropImage = async (idx, url) => {
    setImageQueue([]);
    const src = await loadCropSrc(url);
    setCropTarget({ mode: "recrop-image", index: idx, src });
  };

  const recropHorizontalImage = async (idx, url) => {
    setImageQueue([]);
    const src = await loadCropSrc(url);
    setCropTarget({ mode: "recrop-horizontal", index: idx, src });
  };

  const moveImage = (index, direction) => {
    const cat = getActiveCategoryData();
    const updated = moveItem(cat?.images || [], index, direction);
    updateField("images", updated);
  };

  const moveHorizontalImage = (index, direction) => {
    const cat = getActiveCategoryData();
    const updated = moveItem(cat?.horizontalImages || [], index, direction);
    updateField("horizontalImages", updated);
  };

  const onCropConfirmed = async (croppedFile) => {
    const target = cropTarget;
    setCropTarget(null);
    const isHoriz = target.mode === "horizontal" || target.mode === "recrop-horizontal";
    const key = isHoriz ? "horizontalImage" : "image";
    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await uploadContentImageApi(croppedFile);
      const cat = getActiveCategoryData();
      if (target.mode === "recrop-image") {
        const next = [...(cat.images || [])];
        next[target.index] = res.data.url;
        updateField("images", next);
        toast.success("Image updated!");
      } else if (target.mode === "recrop-horizontal") {
        const next = [...(cat.horizontalImages || [])];
        next[target.index] = res.data.url;
        updateField("horizontalImages", next);
        toast.success("Image updated!");
      } else if (target.mode === "horizontal") {
        updateField("horizontalImages", [...(cat.horizontalImages || []), res.data.url]);
        toast.success("Image uploaded!");
      } else {
        updateField("images", [...(cat.images || []), res.data.url]);
        toast.success("Image uploaded!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
      if (imageQueue.length > 0) {
        const [next, ...rest] = imageQueue;
        setImageQueue(rest);
        setCropTarget({ mode: target.mode, src: URL.createObjectURL(next) });
      }
    }
  };

  const removeImage = (idx) => {
    const cat = getActiveCategoryData();
    updateField(
      "images",
      cat.images.filter((_, i) => i !== idx),
    );
  };

  const removeHorizontalImage = (idx) => {
    const cat = getActiveCategoryData();
    updateField(
      "horizontalImages",
      (cat.horizontalImages || []).filter((_, i) => i !== idx),
    );
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    border: "1px solid #e5e9f0",
    borderRadius: "10px",
    fontSize: "13.5px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    background: "#f8fafc",
    fontFamily: "system-ui, sans-serif",
    transition: "border 0.2s, box-shadow 0.2s, background 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#64748b",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #f0c4c4",
            borderTop: `3px solid ${tc.primary}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  const activeData = activeCategory ? getActiveCategoryData() : null;

  return (
    <>
      <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .infra-section { animation: fadeInUp 0.35s ease forwards; }
                .cat-tab:hover { background: ${tc.light} !important; }
                .infra-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .infra-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .infra-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @media (max-width: 700px) {
                    .infra-main-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .infra-hero-inner { gap: 12px !important; }
                    .infra-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .infra-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .infra-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .infra-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .infra-status-badge { padding: 4px 9px !important; }
                    .infra-status-badge span { font-size: 9.5px !important; }
                    .infra-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }
                    .infra-img-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
            `}</style>

      <div style={{ fontFamily: "system-ui, sans-serif", background: bc.surface, margin: "-24px", padding: "24px", minHeight: "100vh" }}>
        {/* Hero Header */}
        <div className="dash-hero" style={{
            background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.secondary || tc.dark} 100%)`,
            borderRadius: '24px',
            padding: '2.25rem 2.75rem',
            marginBottom: '1.75rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 16px 40px ${hexToRgba(tc.primary, 0.28)}`
        }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', width: '380px', height: '380px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.secondary || tc.primary, 0.28)} 0%, transparent 70%)`, top: '-140px', right: '-80px', pointerEvents: 'none', filter: 'blur(30px)' }}></div>
            <div style={{ position: 'absolute', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', bottom: '-80px', left: '15%', pointerEvents: 'none', filter: 'blur(20px)' }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.22)', marginBottom: '12px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></div>
                            <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / Pages / Infrastructure</span>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Campus & Infrastructure</h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                            Showcase smart classrooms, STEM labs, libraries, sports grounds, and transport fleets.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: isPublished ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.12)', border: `1.5px solid ${isPublished ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.25)'}`, borderRadius: '999px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#4ade80' : '#facc15' }}></div>
                                <span style={{ fontSize: '11px', color: isPublished ? '#bbf7d0' : '#ffffff', fontWeight: 700, letterSpacing: '0.03em' }}>
                                    {isPublished ? 'Live on Website' : 'Draft (Unpublished)'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Standardized Whiter Frosted Glass Panel */}
                    <div className="dash-hero-stats-panel" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.13) 100%)',
                        border: '1.5px solid rgba(255,255,255,0.42)',
                        borderRadius: '16px',
                        padding: '0.75rem 1.1rem',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.18), inset 0 1px 1.5px rgba(255,255,255,0.5)',
                        width: '230px',
                        minWidth: '230px',
                        maxWidth: '230px',
                        flexShrink: 0,
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.18)' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.22)',
                                border: '1px solid rgba(255,255,255,0.38)',
                                color: '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Facilities</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.categories?.length || 0} Wings Detailed`}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '5px 0' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.22)',
                                border: '1px solid rgba(255,255,255,0.38)',
                                color: '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Safety Standard</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'Modern Campus Amenities'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero Bottom Actions */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.16)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                            {isDirty ? '⚠️ You have unsaved changes in this module' : '✓ All changes are currently up to date'}
                        </span>
                    </div>
                    <ModuleActionButtons
                        tc={tc}
                        moduleKey="infrastructure"
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

        {/* ── Main Layout ── */}
        <div
          className="infra-main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: "1.25rem",
            alignItems: "flex-start",
          }}
        >
          {/* Left — Category List */}
          <div
            style={{
              background: "#ffffff",
              border: "0.5px solid #f1f5f9",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              position: "sticky",
              top: "24px",
            }}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "0.5px solid #f8fafc",
                background: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "1px",
                }}
              >
                Categories
              </p>
              <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                {content.categories.length} added
              </p>
            </div>

            <div style={{ padding: "8px" }}>
              {content.categories.length === 0 && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    textAlign: "center",
                    padding: "1.5rem 0",
                  }}
                >
                  No categories yet
                </p>
              )}
              {content.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="cat-tab"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginBottom: "2px",
                    background:
                      activeCategory === cat.id ? tc.light : "transparent",
                    border:
                      activeCategory === cat.id
                        ? "1px solid #f9c4d4"
                        : "1px solid transparent",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: activeCategory === cat.id ? 600 : 400,
                      color: activeCategory === cat.id ? tc.primary : "#0f172a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {cat.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCategory(cat.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: "2px",
                      fontSize: "14px",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div style={{ padding: "8px", borderTop: "0.5px solid #f1f5f9" }}>
              {showAddCategory ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "4px",
                  }}
                >
                  <input
                    className="infra-input"
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter Category Name"
                    style={{
                      ...inputStyle,
                      fontSize: "12px",
                      padding: "8px 10px",
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && addCategory(newCategoryName)
                    }
                  />
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => addCategory(newCategoryName)}
                      style={{
                        flex: 1,
                        padding: "7px",
                        background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`,
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName("");
                      }}
                      style={{
                        flex: 1,
                        padding: "7px",
                        background: "#f1f5f9",
                        color: "#64748b",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCategory(true)}
                  style={{
                    width: "100%",
                    padding: "9px",
                    background: "transparent",
                    border: "1.5px dashed #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  + Add Category
                </button>
              )}
            </div>
          </div>

          {/* Right — Category Editor */}
          {!activeData ? (
            <div
              style={{
                background: "#ffffff",
                border: "0.5px solid #f1f5f9",
                borderRadius: "16px",
                padding: "4rem",
                textAlign: "center",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <p
                style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}
              >
                🏛️
              </p>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                No category selected
              </p>
              <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                Add a category — e.g. "Our Campus" or "Sports Facilities"
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "#ffffff",
                border: "0.5px solid #f1f5f9",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  padding: "1.25rem 1.75rem",
                  borderBottom: "0.5px solid #f8fafc",
                  background: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {activeData.name}
                </p>
                <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                  /infrastructure/{activeData.slug}
                </p>
              </div>

              <div
                style={{
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* Heading */}
                <div>
                  <label style={labelStyle}>Heading</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      className="infra-input"
                      type="text"
                      value={activeData.heading}
                      onChange={(e) => updateField("heading", e.target.value)}
                      placeholder="Enter Heading"
                      style={{ ...inputStyle, fontStyle: activeData.headingItalic ? "italic" : "normal" }}
                    />
                    <ItalicToggle active={!!activeData.headingItalic} onToggle={() => updateField("headingItalic", !activeData.headingItalic)} />
                  </div>
                  <HeadingStyleField
                    color={activeData.headingColor} onColorChange={(val) => updateField("headingColor", val)}
                    font={activeData.headingFont} onFontChange={(val) => updateField("headingFont", val)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle}>Description</label>
                  <RichTextEditor
                    value={activeData.description}
                    onChange={(val) => updateField("description", val)}
                    placeholder="Describe this facility/category in detail..."
                    minHeight="150px"
                    maxWidth="814px"
                    fontSize="15.5px"
                    fontFamily="'Inter', system-ui, sans-serif"
                  />
                </div>

                {/* Images Grid */}
                <div>
                  <label style={labelStyle}>Images (Vertical, max {MAX_CATEGORY_IMAGES})</label>
                  <p style={{ fontSize: "10.5px", color: "#94a3b8", marginBottom: "10px" }}>
                    Shown as a slider beside the description on the live page. You'll get a crop tool for each image (freely adjustable from every side — keep it tall/vertical) before it's added. JPG, PNG, WEBP · Max 1MB each.
                  </p>
                  <div
                    className="infra-img-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: "14px",
                      marginBottom: "1.25rem",
                    }}
                  >
                    {(activeData.images || []).map((img, i) => (
                      <ImageThumbnailCard
                        key={i}
                        url={img}
                        index={i}
                        total={(activeData.images || []).length}
                        onRecrop={recropImage}
                        onRemove={removeImage}
                        onMove={moveImage}
                        aspectRatio="3/4"
                      />
                    ))}
                  </div>
                  {(activeData.images || []).length >= MAX_CATEGORY_IMAGES ? (
                    <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "0.75rem" }}>
                      Maximum {MAX_CATEGORY_IMAGES} images added — remove one to add another.
                    </p>
                  ) : (
                    <div
                      onClick={() =>
                        document.getElementById("image-input").click()
                      }
                      style={{
                        border: "1.5px dashed #e2e8f0",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        textAlign: "center",
                        cursor: "pointer",
                        background: "#fafafa",
                      }}
                    >
                      {uploading.image ? (
                        <p style={{ fontSize: "13px", color: "#64748b" }}>
                          Uploading...
                        </p>
                      ) : (
                        <p style={{ fontSize: "13px", color: "#64748b" }}>
                          + Click to add image
                        </p>
                      )}
                    </div>
                  )}
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      e.target.value = "";
                      if (files.length > 0) startImageUpload(files);
                    }}
                    style={{ display: "none" }}
                  />
                </div>

                {/* Horizontal Gallery Images (Carousel) */}
                <div>
                  <label style={labelStyle}>
                    Horizontal Gallery Images (Carousel) — {(activeData.horizontalImages || []).length} / {MAX_HORIZONTAL_IMAGES}
                  </label>
                  <p style={{ fontSize: "10.5px", color: "#94a3b8", marginBottom: "10px" }}>
                    Shown as a sliding carousel below the description — landscape/wide photos work best. You'll get a crop tool for each image (freely adjustable from every side) before it's added. JPG, PNG, WEBP · Max 1MB each · Up to {MAX_HORIZONTAL_IMAGES} images.
                  </p>
                  <div
                    className="infra-img-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: "14px",
                      marginBottom: "1.25rem",
                    }}
                  >
                    {(activeData.horizontalImages || []).map((img, i) => (
                      <ImageThumbnailCard
                        key={i}
                        url={img}
                        index={i}
                        total={(activeData.horizontalImages || []).length}
                        onRecrop={recropHorizontalImage}
                        onRemove={removeHorizontalImage}
                        onMove={moveHorizontalImage}
                        aspectRatio="16/9"
                      />
                    ))}
                  </div>
                  {(activeData.horizontalImages || []).length >= MAX_HORIZONTAL_IMAGES ? (
                    <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "0.75rem" }}>
                      Maximum {MAX_HORIZONTAL_IMAGES} images added — remove one to add another.
                    </p>
                  ) : (
                    <div
                      onClick={() =>
                        document.getElementById("horizontal-image-input").click()
                      }
                      style={{
                        border: "1.5px dashed #e2e8f0",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        textAlign: "center",
                        cursor: "pointer",
                        background: "#fafafa",
                      }}
                    >
                      {uploading.horizontalImage ? (
                        <p style={{ fontSize: "13px", color: "#64748b" }}>
                          Uploading...
                        </p>
                      ) : (
                        <p style={{ fontSize: "13px", color: "#64748b" }}>
                          + Click to add images (multiple allowed)
                        </p>
                      )}
                    </div>
                  )}
                  <input
                    id="horizontal-image-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      e.target.value = "";
                      startHorizontalUpload(files);
                    }}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {cropTarget && (
        <ImageCropModal
          imageSrc={cropTarget.src}
          aspect={null}
          onCancel={() => { setCropTarget(null); setImageQueue([]); }}
          onCropComplete={onCropConfirmed}
        />
      )}
    </>
  );
};

export default Infrastructure;
