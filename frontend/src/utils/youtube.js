// Accepts youtu.be/watch/embed/shorts URLs (with or without extra query params) and
// returns video ID, playable embed URL, or thumbnail URL.
export const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const trimmed = String(url).trim();
    if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
};

export const getYoutubeEmbedUrl = (url) => {
    const id = getYouTubeVideoId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
};

export const getYouTubeThumbnail = (url) => {
    const id = getYouTubeVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
};

