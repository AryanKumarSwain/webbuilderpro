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

  const onCropConfirmed = async (croppedFile) => {
    const target = cropTarget;
    setCropTarget(null);
    const key = target.mode === "horizontal" ? "horizontalImage" : "image";
    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await uploadContentImageApi(croppedFile);
      const cat = getActiveCategoryData();
      if (target.mode === "horizontal") {
        updateField("horizontalImages", [...(cat.horizontalImages || []), res.data.url]);
      } else {
        updateField("images", [...(cat.images || []), res.data.url]);
      }
      toast.success("Image uploaded!");
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
        <div className="dash-hero" style={{ background: `linear-gradient(135deg, ${tc.dark} 0%, ${tc.primary} 55%, ${tc.dark} 100%)`, borderRadius: '22px', padding: '2.25rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', boxShadow: `0 12px 40px ${hexToRgba(tc.primary, 0.25)}` }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
          <div className="infra-hero-orb" style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${hexToRgba(tc.primary, 0.25)} 0%, transparent 70%)`, top: '-140px', right: '4%', pointerEvents: 'none' }}></div>
          <div className="infra-hero-inner" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="infra-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div className="infra-hero-item">
                <p className="infra-hero-eyebrow" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Admin / Pages / Infrastructure</p>
                <h1 className="infra-hero-title" style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.4px' }}>Infrastructure Categories</h1>
                <p className="infra-hero-desc" style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '420px' }}>
                  Add categories like Our Campus, Sports Facilities, Transport — each gets its own page.
                </p>
              </div>
              <div className="infra-hero-item infra-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isPublished ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '999px', flexShrink: 0 }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPublished ? '#22c55e' : '#94a3b8', flexShrink: 0 }}></div>
                <span style={{ fontSize: '10.5px', color: isPublished ? '#86efac' : 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{isPublished ? 'Published' : 'Draft'}</span>
              </div>
            </div>
            <div className="infra-hero-item infra-hero-actions" style={{ display: "flex", justifyContent: 'flex-end', gap: "8px" }}>
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
                      <div
                        key={i}
                        style={{
                          position: "relative",
                          borderRadius: "10px",
                          overflow: "hidden",
                          aspectRatio: "3/4",
                        }}
                      >
                        <img
                          src={img}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <button
                          onClick={() => removeImage(i)}
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            width: "24px",
                            height: "24px",
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ×
                        </button>
                      </div>
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
                      <div
                        key={i}
                        style={{
                          position: "relative",
                          borderRadius: "10px",
                          overflow: "hidden",
                          aspectRatio: "16/9",
                        }}
                      >
                        <img
                          src={img}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <button
                          onClick={() => removeHorizontalImage(i)}
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            width: "24px",
                            height: "24px",
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ×
                        </button>
                      </div>
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
