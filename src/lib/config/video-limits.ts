// Shared by the editor and the server. Videos are streamed to disk, so the
// limit doesn't change how much memory an upload uses.
export const MAX_VIDEO_MB = 500;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
export const MAX_VIDEO_LABEL = `${MAX_VIDEO_MB} MB`;

export const VIDEO_UPLOAD_PATH = "/api/recipes/videos/upload";
export const VIDEO_NAME_HEADER = "x-video-name";
export const VIDEO_DURATION_HEADER = "x-video-duration";
