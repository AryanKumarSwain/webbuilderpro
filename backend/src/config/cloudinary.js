const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Per-school folder suffix — keeps uploads segregated so Cloudinary's own usage
// stats can be cross-checked against the tbl_media_usage ledger later. req.user is
// already set by `protect` (which runs before these upload middlewares in every
// authenticated route chain), so no extra DB lookup is needed here. Falls back to
// req.params.schoolId for the one public (unauthenticated) upload route — the
// career enquiry form's resume upload — which has no req.user.
const schoolFolder = (base) => (req) => `${base}/school-${req.user?.schoolId || req.params?.schoolId || 'misc'}`;

// Image upload (small — logos, profile photos)
const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: schoolFolder('school-saas/schools'),
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    },
});

// Content image upload (bigger — banners, gallery, module content)
const contentImageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: schoolFolder('school-saas/content'),
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1920, height: 1920, crop: 'limit', quality: 'auto' }],
    },
});

// PDF upload — NOTE: this Cloudinary account has the "Restricted media types"
// security default ON, which blocks public *delivery* of PDF/ZIP files entirely
// (visitors get a 401 "deny or ACL failure" placeholder instead of the real file,
// which is why downloads were coming through empty/wrong-format rather than a
// real PDF). This is an account-level Cloudinary setting, not something fixable
// from upload code — resource_type (raw vs image) and URL flags like
// fl_attachment were both tested and neither bypasses it. Fix: in the Cloudinary
// dashboard, Settings -> Security -> disable "Restricted media types" (or enable
// "Allow delivery of PDF and ZIP files"). The public_id below is still forced to
// end in ".pdf" so filenames are clean once delivery is unblocked.
const pdfStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: schoolFolder('school-saas/documents'),
        resource_type: 'raw',
        allowed_formats: ['pdf'],
        public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`,
    },
});

// Video upload
const videoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: schoolFolder('school-saas/videos'),
        resource_type: 'video',
        allowed_formats: ['mp4', 'webm', 'mov'],
        transformation: [{ quality: 'auto', fetch_format: 'mp4' }],
    },
});

// 2MB cap — the frontend auto-compresses every image to ~0.9MB before upload
// (frontend/src/utils/compressImage.js); this leaves headroom for the odd
// large-dimension PNG that compresses less and still rejects anything abnormal.
const upload = multer({
    storage: imageStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadContentImage = multer({
    storage: contentImageStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadPdf = multer({
    storage: pdfStorage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
});

const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Home page hero video only — same Cloudinary storage as uploadVideo, but capped
// tighter (5MB) since it's a background/decorative clip, not the general-purpose
// content video uploader other modules (e.g. Events) rely on staying at 50MB.
const uploadHeroVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { cloudinary, upload, uploadContentImage, uploadPdf, uploadVideo, uploadHeroVideo };