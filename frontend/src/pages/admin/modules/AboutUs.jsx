import { useEffect, useState } from "react";
import {
  getModuleContentApi,
  saveModuleContentApi,
  togglePublishApi,
  uploadContentImageApi,
  uploadPdfApi,
} from "../../../api/content.api";
import toast from "react-hot-toast";
import RichTextEditor from "../../../components/common/RichTextEditor";
import ModuleActionButtons from "../../../components/admin/ModuleActionButtons";
import ImageCropModal from "../../../components/common/ImageCropModal";
import ItalicToggle from "../../../components/common/ItalicToggle";
import HeadingStyleField from "../../../components/common/HeadingStyleField";
import ReorderButtons from "../../../components/common/ReorderButtons";
import useSchoolStore from "../../../store/schoolStore";
import { moveItem } from "../../../utils/reorder";

const hexToRgba = (hex, alpha) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const defaultContent = {
  visionMissionItems: [],
  history: "",
  historyImage: "",
  historyGalleryImages: [],
  historyHeading: "",
  historyHeadingColor: "",
  historyHeadingFont: "",
  historyHeadingItalic: false,
  foundedYear: "",
  leadershipMembers: [],
  leadershipHeading: "",
  leadershipHeadingColor: "",
  leadershipHeadingFont: "",
  leadershipHeadingItalic: false,
  values: [
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
    { title: "", description: "" },
  ],
  affiliationsHeading: "",
  affiliationsHeadingColor: "",
  affiliationsHeadingFont: "",
  affiliationsHeadingItalic: false,
  affiliations: [],
  awardsHeading: "",
  awardsHeadingColor: "",
  awardsHeadingFont: "",
  awardsHeadingItalic: false,
  awards: [],
};

const CROP_ASPECTS = { history: null, leader: null, historyGallery: null, affiliation: null, award: null };

const AboutUs = () => {
  const { tc, bc } = useSchoolStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [activeSection, setActiveSection] = useState("vision");
  const [content, setContent] = useState(defaultContent);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [uploading, setUploading] = useState({});
  const [pdfUploading, setPdfUploading] = useState({});
  const [cropTarget, setCropTarget] = useState(null); // { mode: 'history' | 'leader' | 'historyGallery', id?, src }
  const [galleryQueue, setGalleryQueue] = useState([]); // remaining files still waiting to be cropped

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await getModuleContentApi("about");
      if (res.data) {
        const raw = res.data.content || {};
        const merged = { ...defaultContent, ...raw };

        // Migrate legacy flat vision/mission/motto/goals/philosophy/approach fields
        // (pre-custom-items schema) into the new freeform visionMissionItems list.
        if (!raw.visionMissionItems || raw.visionMissionItems.length === 0) {
          const legacyMap = [
            ["vision", "Vision"],
            ["mission", "Mission"],
            ["motto", "Motto"],
            ["goals", "Goals"],
            ["philosophy", "Philosophy"],
            ["approach", "Approach"],
          ];
          const migrated = legacyMap
            .filter(([key]) => raw[key] && raw[key].replace(/<[^>]*>/g, "").trim())
            .map(([key, heading], i) => ({ id: `vm-legacy-${i}`, heading, text: raw[key] }));
          if (migrated.length) merged.visionMissionItems = migrated;
        }

        // Migrate legacy single-principal fields into the new leadershipMembers list.
        if (
          (!raw.leadershipMembers || raw.leadershipMembers.length === 0) &&
          (raw.principalName || raw.principalMessage || raw.principalPhoto)
        ) {
          merged.leadershipMembers = [
            {
              id: "leader-legacy-0",
              photo: raw.principalPhoto || "",
              name: raw.principalName || "",
              designation: raw.principalDesignation || "",
              message: raw.principalMessage || "",
            },
          ];
        }

        setContent(merged);
        setSavedSnapshot(res.data.has_draft_changes ? JSON.stringify(res.data.published_content || defaultContent) : JSON.stringify(merged));
        setIsPublished(res.data.is_published === 1);
      }
    } catch (e) {
      console.log("No content yet");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setContent((prev) => ({ ...prev, [field]: value }));
  };

  const handleValueChange = (index, field, value) => {
    const updated = [...content.values];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({ ...prev, values: updated }));
  };
  const addValue = () => {
    setContent((prev) => ({ ...prev, values: [...prev.values, { title: "", description: "" }] }));
  };
  const removeValue = (index) => {
    setContent((prev) => ({ ...prev, values: prev.values.filter((_, i) => i !== index) }));
  };

  // ── Vision & Mission items ──
  const addVisionItem = () => {
    const item = { id: `vm-${Date.now()}`, heading: "", text: "" };
    setContent((prev) => ({ ...prev, visionMissionItems: [item, ...prev.visionMissionItems] }));
  };
  const updateVisionItem = (id, field, value) => {
    setContent((prev) => ({
      ...prev,
      visionMissionItems: prev.visionMissionItems.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    }));
  };
  const removeVisionItem = (id) => {
    setContent((prev) => ({ ...prev, visionMissionItems: prev.visionMissionItems.filter((it) => it.id !== id) }));
  };
  const moveVisionItem = (idx, dir) => {
    setContent((prev) => ({ ...prev, visionMissionItems: moveItem(prev.visionMissionItems, idx, dir) }));
  };

  // ── Leadership members ──
  const addLeader = () => {
    const item = { id: `leader-${Date.now()}`, photo: "", name: "", designation: "", message: "", nameColor: "", nameFont: "", designationColor: "", designationFont: "" };
    setContent((prev) => ({ ...prev, leadershipMembers: [item, ...prev.leadershipMembers] }));
  };
  const updateLeader = (id, field, value) => {
    setContent((prev) => ({
      ...prev,
      leadershipMembers: prev.leadershipMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }));
  };
  const removeLeader = (id) => {
    setContent((prev) => ({ ...prev, leadershipMembers: prev.leadershipMembers.filter((m) => m.id !== id) }));
  };
  const moveLeader = (idx, dir) => {
    setContent((prev) => ({ ...prev, leadershipMembers: moveItem(prev.leadershipMembers, idx, dir) }));
  };

  // ── Affiliations & Certifications ──
  const addAffiliation = () => {
    const item = { id: `aff-${Date.now()}`, image: "", heading: "", link: "", pdfUrl: "" };
    setContent((prev) => ({ ...prev, affiliations: [item, ...prev.affiliations] }));
  };
  const updateAffiliation = (id, field, value) => {
    setContent((prev) => ({
      ...prev,
      affiliations: prev.affiliations.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    }));
  };
  const removeAffiliation = (id) => {
    setContent((prev) => ({ ...prev, affiliations: prev.affiliations.filter((it) => it.id !== id) }));
  };
  const moveAffiliation = (idx, dir) => {
    setContent((prev) => ({ ...prev, affiliations: moveItem(prev.affiliations, idx, dir) }));
  };
  const uploadAffiliationPdf = async (id, file) => {
    setPdfUploading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await uploadPdfApi(file);
      updateAffiliation(id, "pdfUrl", res.data.url);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to upload PDF");
    } finally {
      setPdfUploading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // ── Awards & Recognition ──
  const addAward = () => {
    const item = { id: `awd-${Date.now()}`, image: "", heading: "", name: "", designation: "" };
    setContent((prev) => ({ ...prev, awards: [item, ...prev.awards] }));
  };
  const updateAward = (id, field, value) => {
    setContent((prev) => ({
      ...prev,
      awards: prev.awards.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    }));
  };
  const removeAward = (id) => {
    setContent((prev) => ({ ...prev, awards: prev.awards.filter((it) => it.id !== id) }));
  };
  const moveAward = (idx, dir) => {
    setContent((prev) => ({ ...prev, awards: moveItem(prev.awards, idx, dir) }));
  };

  // ── History gallery images (horizontal strip below the history text) ──
  // Each file is cropped one at a time (freeform, no locked aspect) before upload;
  // once confirmed, the next queued file automatically opens in the crop modal.
  const HISTORY_GALLERY_MAX = 10;

  const startGalleryUpload = (files) => {
    if (files.length === 0) return;
    const remaining = HISTORY_GALLERY_MAX - (content.historyGalleryImages || []).length;
    if (remaining <= 0) return;
    const toUse = files.slice(0, remaining);
    if (files.length > remaining) toast.error(`Only ${HISTORY_GALLERY_MAX} images allowed — added first ${remaining}`);
    setGalleryQueue(toUse.slice(1));
    setCropTarget({ mode: "historyGallery", src: URL.createObjectURL(toUse[0]) });
  };

  const removeHistoryGalleryImage = (idx) => {
    setContent((prev) => ({ ...prev, historyGalleryImages: prev.historyGalleryImages.filter((_, i) => i !== idx) }));
  };

  // ── Crop-based image upload flow (history image / leader photos / history gallery) ──
  const onCropConfirmed = async (croppedFile) => {
    const target = cropTarget;
    setCropTarget(null);
    const key = target.mode === "leader" ? `leader-${target.id}`
      : target.mode === "affiliation" ? `affiliation-${target.id}`
      : target.mode === "award" ? `award-${target.id}`
      : target.mode;
    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await uploadContentImageApi(croppedFile);
      if (target.mode === "history") handleChange("historyImage", res.data.url);
      else if (target.mode === "leader") updateLeader(target.id, "photo", res.data.url);
      else if (target.mode === "affiliation") updateAffiliation(target.id, "image", res.data.url);
      else if (target.mode === "award") updateAward(target.id, "image", res.data.url);
      else if (target.mode === "historyGallery") {
        setContent((prev) => ({ ...prev, historyGalleryImages: [...(prev.historyGalleryImages || []), res.data.url] }));
      }
      toast.success("Image uploaded!");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
      if (target.mode === "historyGallery" && galleryQueue.length > 0) {
        const [next, ...rest] = galleryQueue;
        setGalleryQueue(rest);
        setCropTarget({ mode: "historyGallery", src: URL.createObjectURL(next) });
      }
    }
  };

  const fetchPublishedFlag = async () => {
    const res = await getModuleContentApi("about");
    return !!res?.data?.is_published;
  };

  const handleSave = async (publish = false) => {
    publish ? setPublishing(true) : setSaving(true);
    try {
      await saveModuleContentApi(
        "about",
        content,
        publish ? 1 : 0,
      );
      setSavedSnapshot(JSON.stringify(content));
      if (publish) {
        setIsPublished(true);
        toast.success("About Us published!");
      } else {
        toast.success("Content saved!");
      }
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      await togglePublishApi("about", 0);
      setIsPublished(false);
      toast.success("Unpublished");
    } catch (e) {
      toast.error("Failed to unpublish");
    }
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

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #f1f5f9",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  };

  const cardHeaderStyle = {
    padding: "1.25rem 1.75rem",
    borderBottom: "0.5px solid #f8fafc",
    background: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  };

  const addButtonStyle = {
    padding: "11px 20px",
    background: "#ffffff",
    color: tc.primary,
    border: `1.5px dashed ${tc.primary}55`,
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const removeButtonStyle = {
    padding: "6px 12px",
    background: "rgba(239,68,68,0.1)",
    color: "#dc2626",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const sections = [
    {
      key: "vision",
      label: "What Drives Us",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      key: "history",
      label: "History",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: "leadership",
      label: "Leadership Messages",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: "values",
      label: "Core Values",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
    {
      key: "awards",
      label: "Awards & Recognition",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      key: "affiliations",
      label: "Affiliations & Certifications",
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  const CropImageBox = ({ label, value, uploadKey, aspectHint, onFileSelected, onRemove, previewAspect, previewMaxWidth, boxClassName }) => {
    const isUploading = uploading[uploadKey];
    // previewAspect/previewMaxWidth make the field preview the same shape (e.g. portrait 3/4)
    // as the image renders on the live site, instead of the default wide banner box.
    const shaped = !!previewAspect;

    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div
          className={boxClassName}
          onClick={() => document.getElementById(`upload-${uploadKey}`).click()}
          style={{
            border: value ? "1px solid #e2e8f0" : "1.5px dashed #e2e8f0",
            borderRadius: "12px",
            padding: value ? 0 : "2rem",
            textAlign: "center",
            cursor: "pointer",
            background: value ? "transparent" : "#fafafa",
            boxShadow: value ? "0 6px 18px rgba(15,23,42,0.08)" : "none",
            overflow: "hidden",
            position: "relative",
            ...(shaped
              ? { width: previewMaxWidth || "260px", aspectRatio: previewAspect, display: "flex", flexDirection: "column", alignItems: value ? "stretch" : "center", justifyContent: value ? "stretch" : "center" }
              : { minHeight: value ? "160px" : "auto" }),
          }}
        >
          {isUploading ? (
            <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", border: "3px solid #f0c4c4", borderTop: `3px solid ${tc.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              <p style={{ fontSize: "12px", color: "#64748b" }}>Uploading...</p>
            </div>
          ) : value ? (
            <div style={shaped ? { position: "relative", width: "100%", height: "100%" } : { position: "relative" }}>
              <img src={value} alt={label} style={shaped ? { width: "100%", height: "100%", objectFit: "cover", display: "block" } : { width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
              <div
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
              >
                <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>Click to change</span>
              </div>
              {onRemove && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  style={{ position: "absolute", top: "8px", right: "8px", width: "24px", height: "24px", background: "rgba(15,23,42,0.7)", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Remove image">×</button>
              )}
            </div>
          ) : (
            <>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🖼️</div>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Click to upload — crop tool will open</p>
              <p style={{ fontSize: "11px", color: "#94a3b8" }}>{aspectHint ? `${aspectHint} · JPG, PNG, WEBP · Max 1MB` : "JPG, PNG, WEBP · Max 1MB"}</p>
            </>
          )}
        </div>
        <input
          id={`upload-${uploadKey}`}
          type="file"
          accept="image/png,image/jpg,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) onFileSelected(file);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />
      </div>
    );
  };

  const isDirty = savedSnapshot !== null && JSON.stringify(content) !== savedSnapshot;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid #f0c4c4", borderTop: `3px solid ${tc.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }}></div>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes heroIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes drift1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-24px, 18px) scale(1.08); } }
                .au-section { animation: fadeInUp 0.35s ease forwards; }
                .au-input:focus { border-color: ${tc.primary} !important; box-shadow: 0 0 0 3px ${hexToRgba(tc.primary, 0.08)} !important; background: #ffffff !important; }
                .au-hero-item { animation: heroIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }
                .au-hero-orb { animation: drift1 9s ease-in-out infinite; }
                @media (max-width: 900px) {
                    .au-awards-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 700px) {
                    .au-fixed-2col { grid-template-columns: 1fr !important; }
                    .au-values-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    /* ── Hero header — compact, same treatment as Dashboard/Settings/Contact Us/Home Page ── */
                    .dash-hero { padding: 1.1rem 1.15rem !important; border-radius: 16px !important; margin-bottom: 1rem !important; }
                    .au-hero-inner { gap: 12px !important; }
                    .au-hero-top { flex-wrap: wrap !important; gap: 10px !important; }
                    .au-hero-eyebrow { font-size: 9.5px !important; margin-bottom: 6px !important; }
                    .au-hero-title { font-size: 18px !important; margin-bottom: 4px !important; letter-spacing: -0.3px !important; }
                    .au-hero-desc { font-size: 11px !important; line-height: 1.5 !important; }
                    .au-status-badge { padding: 4px 9px !important; }
                    .au-status-badge span { font-size: 9.5px !important; }
                    .au-hero-actions button { padding: 6px 12px !important; font-size: 11px !important; }

                    /* ── Section tabs — horizontal swipeable strip ── */
                    .au-tabs { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; scrollbar-width: none !important; padding-bottom: 2px !important; }
                    .au-tabs::-webkit-scrollbar { display: none !important; }
                    .au-tabs button { flex-shrink: 0 !important; padding: 8px 14px !important; font-size: 12px !important; gap: 5px !important; white-space: nowrap !important; }
                    .au-tabs button svg { width: 14px !important; height: 14px !important; }

                    /* ── History gallery thumbnails — 2-per-row instead of 4 tiny tiles ── */
                    .au-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }

                    /* ── Awards & Recognition entry cards — one per row on phones (overrides
                       the 2-per-row tablet rule above) so each card gets full breathing room ── */
                    .au-awards-grid { grid-template-columns: 1fr !important; }

                    /* ── Leadership photo / Affiliation logo — center the fixed-width preview
                       box once its column stacks to full width on mobile, instead of it sitting
                       awkwardly to the left with empty space beside it ── */
                    .au-leader-photo-box, .au-affil-photo-box { margin: 0 auto !important; }

                    /* ── Section card headers (Vision/Leadership/Awards/Affiliations) — the
                       description text has no room next to the icon+title and the "+ Add"
                       button once squeezed onto mobile widths, so drop it and keep icon,
                       title and a properly-sized button in one tidy row ── */
                    .au-card-header-main { flex-wrap: nowrap !important; align-items: center !important; padding: 0.9rem 1rem !important; gap: 10px !important; }
                    .au-card-header-icon-row { gap: 8px !important; min-width: 0 !important; }
                    .au-card-header-icon { width: 30px !important; height: 30px !important; border-radius: 8px !important; flex-shrink: 0 !important; }
                    .au-card-header-icon svg { width: 14px !important; height: 14px !important; }
                    .au-card-header-title { font-size: 12.5px !important; margin-bottom: 0 !important; white-space: normal !important; overflow-wrap: break-word !important; }
                    .au-card-header-desc { display: none !important; }
                    .au-add-btn { padding: 8px 12px !important; font-size: 11px !important; white-space: nowrap !important; flex-shrink: 0 !important; border-radius: 7px !important; }
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
                            <span style={{ fontSize: '10.5px', color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Admin / Pages / About Us</span>
                        </div>
                        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>About Us</h1>
                        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '520px', margin: 0 }}>
                            Tell your school's story — vision, history, leadership and core values.
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
                    <div style={{
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Core Values</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.values?.length || 0} Values Listed`}</p>
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
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.7)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, lineHeight: 1.2 }}>Leadership</p>
                                <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${content.leaders?.length || 0} Key Leaders`}</p>
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
                        moduleKey="about"
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

        {/* Section Tabs */}
        <div className="au-tabs" style={{ display: "flex", gap: "6px", marginBottom: "1.75rem", flexWrap: "wrap" }}>
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: activeSection === s.key ? `1.5px solid ${tc.primary}` : "1px solid #e2e8f0",
                fontSize: "13px",
                cursor: "pointer",
                background: activeSection === s.key ? tc.light : "#ffffff",
                color: activeSection === s.key ? tc.primary : "#64748b",
                fontWeight: activeSection === s.key ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: "7px",
                transition: "all 0.15s",
                boxShadow: activeSection === s.key ? "0 4px 12px rgba(139,34,82,0.15)" : "none",
              }}
            >
              <span style={{ color: activeSection === s.key ? tc.primary : "#94a3b8" }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* ── What Drives Us Tab ── */}
        {activeSection === "vision" && (
          <div className="au-section" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={cardStyle}>
              <div className="au-card-header-main" style={cardHeaderStyle}>
                <div className="au-card-header-icon-row" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="au-card-header-icon" style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#1e3a5f,#2563eb)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}>
                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="au-card-header-title" style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "1px" }}>What Drives Us</p>
                    <p className="au-card-header-desc" style={{ fontSize: "11px", color: "#94a3b8" }}>Add as many statements as you like — you choose the heading for each. These scroll as an animated ticker on your website.</p>
                  </div>
                </div>
                <button className="au-add-btn" onClick={addVisionItem} style={addButtonStyle}>+ Add Item</button>
              </div>
            </div>

            {content.visionMissionItems.length === 0 && (
              <div style={{ ...cardStyle, padding: "2.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>No items yet — click "+ Add Item" above to create your first one (e.g. Vision, Mission, Motto).</p>
              </div>
            )}

            {content.visionMissionItems.map((item, i) => (
              <div key={item.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#1e3a5f,#2563eb)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Item {i + 1}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <ReorderButtons index={i} length={content.visionMissionItems.length} onMove={moveVisionItem} vertical={false} />
                    <button onClick={() => removeVisionItem(item.id)} style={removeButtonStyle}>Remove</button>
                  </div>
                </div>
                <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Heading</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        className="au-input"
                        type="text"
                        value={item.heading}
                        onChange={(e) => updateVisionItem(item.id, "heading", e.target.value)}
                        placeholder="Enter Heading"
                        style={{ ...inputStyle, fontStyle: item.headingItalic ? "italic" : "normal" }}
                      />
                      <ItalicToggle active={!!item.headingItalic} onToggle={() => updateVisionItem(item.id, "headingItalic", !item.headingItalic)} />
                    </div>
                    <p style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "5px" }}>Examples: Vision, Mission, Motto, Our Goals</p>
                    <HeadingStyleField
                      color={item.headingColor} onColorChange={(val) => updateVisionItem(item.id, "headingColor", val)}
                      font={item.headingFont} onFontChange={(val) => updateVisionItem(item.id, "headingFont", val)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Text</label>
                    <RichTextEditor
                      value={item.text}
                      onChange={(val) => updateVisionItem(item.id, "text", val)}
                      placeholder="Write the statement for this item..."
                      minHeight="100px"
                      fontSize="14px"
                      fontFamily="'Inter', system-ui, sans-serif"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeSection === "history" && (
          <div className="au-section" style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#064e3b,#059669)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(5,150,105,0.3)" }}>
                  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "1px" }}>Our History</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8" }}>The school's journey and story</p>
                </div>
              </div>
            </div>
            <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <label style={labelStyle}>Section Heading</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    className="au-input"
                    type="text"
                    value={content.historyHeading}
                    onChange={(e) => handleChange("historyHeading", e.target.value)}
                    placeholder="Enter Section Heading"
                    style={{ ...inputStyle, maxWidth: "420px", fontStyle: content.historyHeadingItalic ? "italic" : "normal" }}
                  />
                  <ItalicToggle active={!!content.historyHeadingItalic} onToggle={() => handleChange("historyHeadingItalic", !content.historyHeadingItalic)} />
                </div>
                <p style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "6px" }}>Leave blank to keep the default "Our History" heading.</p>
                <HeadingStyleField
                  color={content.historyHeadingColor} onColorChange={(val) => handleChange("historyHeadingColor", val)}
                  font={content.historyHeadingFont} onFontChange={(val) => handleChange("historyHeadingFont", val)}
                />
              </div>

              <div className="au-fixed-2col" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <CropImageBox
                    label="History Image (Vertical Photo)"
                    value={content.historyImage}
                    uploadKey="history"
                    aspectHint="Crop is freely adjustable from every side after upload — pick exactly how much to keep · Shows beside the history text"
                    onFileSelected={(file) => setCropTarget({ mode: "history", src: URL.createObjectURL(file) })}
                    onRemove={() => handleChange("historyImage", "")}
                    previewAspect="3/4"
                    previewMaxWidth="260px"
                  />
                  <div>
                    <label style={labelStyle}>Founded Year</label>
                    <input
                      className="au-input"
                      type="text"
                      value={content.foundedYear}
                      onChange={(e) => handleChange("foundedYear", e.target.value)}
                      placeholder="Enter Founded Year"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Our Story</label>
                  <p style={{ fontSize: "10.5px", color: "#94a3b8", marginBottom: "6px" }}>
                    Box width matches the text column next to the history image on the live page.
                  </p>
                  <RichTextEditor
                    value={content.history}
                    onChange={(val) => handleChange("history", val)}
                    placeholder="Tell the story of how your school began, key milestones, and how it has grown over the years..."
                    minHeight="220px"
                    maxWidth="918px"
                    fontSize="16px"
                    fontFamily="'Inter', system-ui, sans-serif"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>History Gallery Images (Horizontal)</label>
                <p style={{ fontSize: "10.5px", color: "#94a3b8", marginBottom: "10px" }}>
                  Shown as a horizontal strip below the history text — landscape/wide photos work best. You'll get a crop tool for each image (freely adjustable from every side) before it's added. JPG, PNG, WEBP · Max 1MB each. Max {HISTORY_GALLERY_MAX} images ({(content.historyGalleryImages || []).length}/{HISTORY_GALLERY_MAX} used). More than 3 images auto-rolls with 3 visible at a time; click any image on the site to view it larger.
                </p>
                <div className="au-gallery-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "1.25rem" }}>
                  {(content.historyGalleryImages || []).map((img, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "16/9" }}>
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={() => removeHistoryGalleryImage(i)}
                        style={{ position: "absolute", top: "6px", right: "6px", width: "24px", height: "24px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {(content.historyGalleryImages || []).length < HISTORY_GALLERY_MAX && (
                  <div
                    onClick={() => document.getElementById("history-gallery-input").click()}
                    style={{ border: "1.5px dashed #e2e8f0", borderRadius: "12px", padding: "1.5rem", textAlign: "center", cursor: "pointer", background: "#fafafa" }}
                  >
                    {uploading.historyGallery ? (
                      <p style={{ fontSize: "13px", color: "#64748b" }}>Uploading...</p>
                    ) : (
                      <p style={{ fontSize: "13px", color: "#64748b" }}>+ Click to add images (up to {HISTORY_GALLERY_MAX - (content.historyGalleryImages || []).length} more)</p>
                    )}
                  </div>
                )}
                <input
                  id="history-gallery-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    e.target.value = "";
                    startGalleryUpload(files);
                  }}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Leadership Tab ── */}
        {activeSection === "leadership" && (
          <div className="au-section" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={cardStyle}>
              <div className="au-card-header-main" style={cardHeaderStyle}>
                <div className="au-card-header-icon-row" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="au-card-header-icon" style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#4a1d96,#7c3aed)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="au-card-header-title" style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "1px" }}>Leadership Messages</p>
                    <p className="au-card-header-desc" style={{ fontSize: "11px", color: "#94a3b8" }}>Add a message from anyone in leadership — Principal, Director, Chairperson, etc. Add as many as you like.</p>
                  </div>
                </div>
                <button className="au-add-btn" onClick={addLeader} style={addButtonStyle}>+ Add Member</button>
              </div>
              <div style={{ padding: "1.5rem 1.75rem" }}>
                <label style={labelStyle}>Section Heading</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    className="au-input"
                    type="text"
                    value={content.leadershipHeading}
                    onChange={(e) => handleChange("leadershipHeading", e.target.value)}
                    placeholder="Enter Section Heading"
                    style={{ ...inputStyle, maxWidth: "420px", fontStyle: content.leadershipHeadingItalic ? "italic" : "normal" }}
                  />
                  <ItalicToggle active={!!content.leadershipHeadingItalic} onToggle={() => handleChange("leadershipHeadingItalic", !content.leadershipHeadingItalic)} />
                </div>
                <p style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "6px" }}>Leave blank to keep the default "Leadership Message" heading.</p>
                <HeadingStyleField
                  color={content.leadershipHeadingColor} onColorChange={(val) => handleChange("leadershipHeadingColor", val)}
                  font={content.leadershipHeadingFont} onFontChange={(val) => handleChange("leadershipHeadingFont", val)}
                />
              </div>
            </div>

            {content.leadershipMembers.length === 0 && (
              <div style={{ ...cardStyle, padding: "2.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>No leadership messages yet — click "+ Add Member" above to add one.</p>
              </div>
            )}

            {content.leadershipMembers.map((m, i) => (
              <div key={m.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#4a1d96,#7c3aed)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Member {i + 1}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <ReorderButtons index={i} length={content.leadershipMembers.length} onMove={moveLeader} vertical={false} />
                    <button onClick={() => removeLeader(m.id)} style={removeButtonStyle}>Remove</button>
                  </div>
                </div>
                <div className="au-fixed-2col" style={{ padding: "1.5rem 1.75rem", display: "grid", gridTemplateColumns: "220px 1fr", gap: "1.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <CropImageBox
                      label="Photo"
                      value={m.photo}
                      uploadKey={`leader-${m.id}`}
                      aspectHint="Portrait crop (4:5) after upload"
                      onFileSelected={(file) => setCropTarget({ mode: "leader", id: m.id, src: URL.createObjectURL(file) })}
                      onRemove={() => updateLeader(m.id, "photo", "")}
                      previewAspect="4/5"
                      previewMaxWidth="220px"
                      boxClassName="au-leader-photo-box"
                    />
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input
                        className="au-input"
                        type="text"
                        value={m.name}
                        onChange={(e) => updateLeader(m.id, "name", e.target.value)}
                        placeholder="Enter Full Name"
                        style={inputStyle}
                      />
                      <HeadingStyleField
                        color={m.nameColor} onColorChange={(val) => updateLeader(m.id, "nameColor", val)}
                        font={m.nameFont} onFontChange={(val) => updateLeader(m.id, "nameFont", val)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Designation</label>
                      <input
                        className="au-input"
                        type="text"
                        value={m.designation}
                        onChange={(e) => updateLeader(m.id, "designation", e.target.value)}
                        placeholder="Enter Designation"
                        style={inputStyle}
                      />
                      <HeadingStyleField
                        color={m.designationColor} onColorChange={(val) => updateLeader(m.id, "designationColor", val)}
                        font={m.designationFont} onFontChange={(val) => updateLeader(m.id, "designationFont", val)}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Message</label>
                    <p style={{ fontSize: "10.5px", color: "#94a3b8", marginBottom: "6px" }}>
                      Box width matches the text column next to the leader's photo on the live page.
                    </p>
                    <RichTextEditor
                      value={m.message}
                      onChange={(val) => updateLeader(m.id, "message", val)}
                      placeholder="Write a warm welcome message about the school's philosophy and commitment to students..."
                      minHeight="220px"
                      maxWidth="878px"
                      fontSize="17px"
                      fontFamily="'Inter', system-ui, sans-serif"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Core Values Tab ── */}
        {activeSection === "values" && (
          <div className="au-section" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={cardStyle}>
              <div className="au-card-header-main" style={cardHeaderStyle}>
                <div className="au-card-header-icon-row" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="au-card-header-icon" style={{ width: "38px", height: "38px", background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="au-card-header-title" style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "1px" }}>Core Values</p>
                    <p className="au-card-header-desc" style={{ fontSize: "11px", color: "#94a3b8" }}>Add as many values as you like — remove any you don't need.</p>
                  </div>
                </div>
                <button className="au-add-btn" onClick={addValue} style={addButtonStyle}>+ Add Value</button>
              </div>
            </div>
            {content.values.length === 0 && (
              <p style={{ fontSize: "13px", color: "#94a3b8" }}>No core values yet — click "+ Add Value" above to create your first one.</p>
            )}
          <div className="au-section au-values-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {content.values.map((v, i) => (
              <div key={i} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Core Value {i + 1}</p>
                  </div>
                  <button onClick={() => removeValue(i)} style={removeButtonStyle}>Remove</button>
                </div>
                <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Title</label>
                    <input
                      className="au-input"
                      type="text"
                      value={v.title}
                      onChange={(e) => handleValueChange(i, "title", e.target.value)}
                      placeholder="Enter Value Title"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <RichTextEditor
                      value={v.description}
                      onChange={(val) => handleValueChange(i, "description", val)}
                      placeholder="Brief description of this value..."
                      minHeight="80px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}

        {/* ── Affiliations & Certifications Tab ── */}
        {/* ── Awards & Recognition Tab ── */}
        {activeSection === "awards" && (
          <div className="au-section" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={cardStyle}>
              <div className="au-card-header-main" style={cardHeaderStyle}>
                <div className="au-card-header-icon-row" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="au-card-header-icon" style={{ width: "38px", height: "38px", background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${hexToRgba(tc.primary, 0.3)}` }}>
                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="au-card-header-title" style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "1px" }}>Awards & Recognition</p>
                    <p className="au-card-header-desc" style={{ fontSize: "11px", color: "#94a3b8" }}>Awards won by the school or its staff — e.g. Best Director Award. Add as many as you like.</p>
                  </div>
                </div>
                <button className="au-add-btn" onClick={addAward} style={addButtonStyle}>+ Add Item</button>
              </div>
              <div style={{ padding: "1.5rem 1.75rem" }}>
                <label style={labelStyle}>Section Heading</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    className="au-input"
                    type="text"
                    value={content.awardsHeading}
                    onChange={(e) => handleChange("awardsHeading", e.target.value)}
                    placeholder="Enter Section Heading"
                    style={{ ...inputStyle, maxWidth: "420px", fontStyle: content.awardsHeadingItalic ? "italic" : "normal" }}
                  />
                  <ItalicToggle active={!!content.awardsHeadingItalic} onToggle={() => handleChange("awardsHeadingItalic", !content.awardsHeadingItalic)} />
                </div>
                <p style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "6px" }}>Leave blank to keep the default "Awards & Recognition" heading.</p>
                <HeadingStyleField
                  color={content.awardsHeadingColor} onColorChange={(val) => handleChange("awardsHeadingColor", val)}
                  font={content.awardsHeadingFont} onFontChange={(val) => handleChange("awardsHeadingFont", val)}
                />
              </div>
            </div>

            {content.awards.length === 0 && (
              <div style={{ ...cardStyle, padding: "2.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>No items yet — click "+ Add Item" above to add one (e.g. Best Director Award).</p>
              </div>
            )}

            <div className="au-awards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
              {content.awards.map((item, i) => (
                <div key={item.id} style={{ ...cardStyle }}>
                  <div style={{ ...cardHeaderStyle, padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "24px", height: "24px", background: `linear-gradient(135deg,${tc.primary},${tc.secondary})`, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: "12.5px", fontWeight: 600, color: "#0f172a" }}>Item {i + 1}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <ReorderButtons index={i} length={content.awards.length} onMove={moveAward} vertical={false} />
                      <button onClick={() => removeAward(item.id)} style={{ ...removeButtonStyle, padding: "5px 9px" }}>Remove</button>
                    </div>
                  </div>
                  <div style={{ padding: "1.1rem" }}>
                    <CropImageBox
                      label="Photo"
                      value={item.image}
                      uploadKey={`award-${item.id}`}
                      aspectHint="Square crop works best"
                      onFileSelected={(file) => setCropTarget({ mode: "award", id: item.id, src: URL.createObjectURL(file) })}
                      onRemove={() => updateAward(item.id, "image", "")}
                      previewAspect="1/1"
                      previewMaxWidth="100%"
                    />
                    <div style={{ marginTop: "0.9rem" }}>
                      <label style={labelStyle}>Name</label>
                      <input
                        className="au-input"
                        type="text"
                        value={item.name || ""}
                        onChange={(e) => updateAward(item.id, "name", e.target.value)}
                        placeholder="Enter Name"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ marginTop: "0.9rem" }}>
                      <label style={labelStyle}>Designation</label>
                      <input
                        className="au-input"
                        type="text"
                        value={item.designation || ""}
                        onChange={(e) => updateAward(item.id, "designation", e.target.value)}
                        placeholder="Enter Designation"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ marginTop: "0.9rem" }}>
                      <label style={labelStyle}>Award / Heading</label>
                      <input
                        className="au-input"
                        type="text"
                        value={item.heading}
                        onChange={(e) => updateAward(item.id, "heading", e.target.value)}
                        placeholder="Enter Heading"
                        style={inputStyle}
                      />
                      <p style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "5px" }}>e.g. Best Director Award</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Affiliations & Certifications Tab ── */}
        {activeSection === "affiliations" && (
          <div className="au-section" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={cardStyle}>
              <div className="au-card-header-main" style={cardHeaderStyle}>
                <div className="au-card-header-icon-row" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="au-card-header-icon" style={{ width: "38px", height: "38px", background: "linear-gradient(135deg,#78350f,#f59e0b)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}>
                    <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="au-card-header-title" style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "1px" }}>Affiliations & Certifications</p>
                    <p className="au-card-header-desc" style={{ fontSize: "11px", color: "#94a3b8" }}>Board affiliations, certifications, memberships — e.g. CBSE Affiliation, NCC. Add as many as you like.</p>
                  </div>
                </div>
                <button className="au-add-btn" onClick={addAffiliation} style={addButtonStyle}>+ Add Item</button>
              </div>
              <div style={{ padding: "1.5rem 1.75rem" }}>
                <label style={labelStyle}>Section Heading</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    className="au-input"
                    type="text"
                    value={content.affiliationsHeading}
                    onChange={(e) => handleChange("affiliationsHeading", e.target.value)}
                    placeholder="Enter Section Heading"
                    style={{ ...inputStyle, maxWidth: "420px", fontStyle: content.affiliationsHeadingItalic ? "italic" : "normal" }}
                  />
                  <ItalicToggle active={!!content.affiliationsHeadingItalic} onToggle={() => handleChange("affiliationsHeadingItalic", !content.affiliationsHeadingItalic)} />
                </div>
                <p style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "6px" }}>Leave blank to keep the default "Affiliations & Certifications" heading.</p>
                <HeadingStyleField
                  color={content.affiliationsHeadingColor} onColorChange={(val) => handleChange("affiliationsHeadingColor", val)}
                  font={content.affiliationsHeadingFont} onFontChange={(val) => handleChange("affiliationsHeadingFont", val)}
                />
              </div>
            </div>

            {content.affiliations.length === 0 && (
              <div style={{ ...cardStyle, padding: "2.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>No items yet — click "+ Add Item" above to add one (e.g. CBSE Affiliation, NCC).</p>
              </div>
            )}

            {content.affiliations.map((item, i) => (
              <div key={item.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#78350f,#f59e0b)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Item {i + 1}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <ReorderButtons index={i} length={content.affiliations.length} onMove={moveAffiliation} vertical={false} />
                    <button onClick={() => removeAffiliation(item.id)} style={removeButtonStyle}>Remove</button>
                  </div>
                </div>
                <div className="au-fixed-2col" style={{ padding: "1.5rem 1.75rem", display: "grid", gridTemplateColumns: "160px 1fr", gap: "1.75rem", alignItems: "start" }}>
                  <CropImageBox
                    label="Image"
                    value={item.image}
                    uploadKey={`affiliation-${item.id}`}
                    aspectHint="Square crop works best (logo/badge/certificate)"
                    onFileSelected={(file) => setCropTarget({ mode: "affiliation", id: item.id, src: URL.createObjectURL(file) })}
                    onRemove={() => updateAffiliation(item.id, "image", "")}
                    previewAspect="1/1"
                    previewMaxWidth="160px"
                    boxClassName="au-affil-photo-box"
                  />
                  <div>
                    <label style={labelStyle}>Heading</label>
                    <input
                      className="au-input"
                      type="text"
                      value={item.heading}
                      onChange={(e) => updateAffiliation(item.id, "heading", e.target.value)}
                      placeholder="Enter Heading"
                      style={inputStyle}
                    />
                    <p style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "5px" }}>Examples: CBSE Affiliation, NCC, ISO Certified</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "1rem" }}>
                      <div>
                        <label style={labelStyle}>PDF Upload (optional)</label>
                        <label style={{ display: "block", padding: "11px 14px", border: item.pdfUrl ? "1.5px solid #bbf7d0" : "1.5px dashed #cbd5e1", borderRadius: "10px", cursor: "pointer", fontSize: "13px", color: item.pdfUrl ? "#15803d" : "#64748b", background: item.pdfUrl ? "#f0fdf4" : "#fafafa", textAlign: "center" }}>
                          {pdfUploading[item.id] ? "Uploading..." : item.pdfUrl ? "✓ PDF uploaded — click to change" : "📄 Click to upload PDF"}
                          <input type="file" accept="application/pdf" style={{ display: "none" }}
                            onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; if (f) uploadAffiliationPdf(item.id, f); }} />
                        </label>
                        {item.pdfUrl && !pdfUploading[item.id] && (
                          <button type="button" onClick={() => updateAffiliation(item.id, "pdfUrl", "")}
                            style={{ marginTop: "6px", fontSize: "11.5px", fontWeight: 600, color: "#dc2626", background: "transparent", border: "none", cursor: "pointer", padding: "2px 0" }}>
                            Remove PDF
                          </button>
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>Or Link URL (optional)</label>
                        <input
                          className="au-input"
                          type="text"
                          value={item.link || ""}
                          onChange={(e) => updateAffiliation(item.id, "link", e.target.value)}
                          placeholder="Enter Link URL"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <p style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "5px" }}>Upload a PDF or paste a Google Drive (or any) link to the affiliation letter/certificate — either/both optional, shown via the "View" button on your site.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {cropTarget && (
        <ImageCropModal
          imageSrc={cropTarget.src}
          aspect={CROP_ASPECTS[cropTarget.mode]}
          onCancel={() => { setCropTarget(null); setGalleryQueue([]); }}
          onCropComplete={onCropConfirmed}
        />
      )}
    </>
  );
};

export default AboutUs;
