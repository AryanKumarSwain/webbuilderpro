import toast from 'react-hot-toast';

// ── Hard image size gate — an original over this size is rejected outright,
// no compression attempted. (Previously every image was auto-compressed
// regardless of original size; per product decision, compression now only
// ever runs on an original that's already ≤1MB — see compressImage.js — so
// this check is the real gate, not just a browser-hang safeguard.) Every
// image upload call site (logo, welcome banner, footer background, content
// images, super admin's create-school logo) calls this before compressing. ──
export const MAX_IMAGE_SIZE_MB = 1;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export const assertImageSizeOk = (file) => {
    if (file && file.size > MAX_IMAGE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`Image is too large (${sizeMb}MB) — please use an image under ${MAX_IMAGE_SIZE_MB}MB`);
        throw new Error(`Image exceeds ${MAX_IMAGE_SIZE_MB}MB limit`);
    }
};

// ── Home page hero video cap — mirrors the backend's dedicated uploadHeroVideo
// multer config (backend/src/config/cloudinary.js), kept tighter than the
// general content-video uploader other modules (e.g. Events) still use. ──
export const MAX_HERO_VIDEO_SIZE_MB = 5;
const MAX_HERO_VIDEO_SIZE_BYTES = MAX_HERO_VIDEO_SIZE_MB * 1024 * 1024;

export const assertHeroVideoSizeOk = (file) => {
    if (file && file.size > MAX_HERO_VIDEO_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`Video size is too big (${sizeMb}MB) — please compress it to under ${MAX_HERO_VIDEO_SIZE_MB}MB and try again`);
        throw new Error(`Video exceeds ${MAX_HERO_VIDEO_SIZE_MB}MB limit`);
    }
};

// ── General-purpose content video cap — the shared uploadVideoFileApi
// (backend's /content/upload-video, used by Events, Gallery, and every other
// module's video slots) is capped at 5MB server-side; this is the matching
// client-side check, called from inside uploadVideoFileApi itself so every
// caller gets it for free instead of each module remembering to check first.
// (Renamed from the old Events-specific name — this was never actually
// Events-only, just the only module that happened to call it directly.) ──
export const MAX_VIDEO_SIZE_MB = 5;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

export const assertVideoSizeOk = (file) => {
    if (file && file.size > MAX_VIDEO_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`Video size is too big (${sizeMb}MB) — please compress it to under ${MAX_VIDEO_SIZE_MB}MB and try again`);
        throw new Error(`Video exceeds ${MAX_VIDEO_SIZE_MB}MB limit`);
    }
};

// ── PDF cap — mirrors the backend's uploadPdf multer config (3MB), used by
// both the admin content-module PDF uploader and the public career-enquiry
// resume upload. Client-side check for a fast, clear rejection instead of a
// round-trip to hit the server's limit. ──
export const MAX_PDF_SIZE_MB = 3;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

export const assertPdfSizeOk = (file) => {
    if (file && file.size > MAX_PDF_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`PDF is too large (${sizeMb}MB) — please use a PDF under ${MAX_PDF_SIZE_MB}MB`);
        throw new Error(`PDF exceeds ${MAX_PDF_SIZE_MB}MB limit`);
    }
};
