import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { STORAGE_CONFIG } from "@/lib/file-storage";
import { createOperationLogger } from "@/lib/logging/logger";

const logger = createOperationLogger("video-storage");

export const RECIPE_VIDEOS_DIR = path.join(
  STORAGE_CONFIG.uploadsDir,
  "recipe-videos",
);

const VIDEO_FILENAME = /^[a-zA-Z0-9-]+\.(mp4|webm)$/;

interface VideoFormat {
  extension: string;
  mimeType: string;
}

const MP4: VideoFormat = { extension: ".mp4", mimeType: "video/mp4" };
const WEBM: VideoFormat = { extension: ".webm", mimeType: "video/webm" };

export interface SavedVideoFile {
  filename: string;
  mimeType: string;
  fileSize: number;
}

// Reads the container from the file's first bytes rather than trusting the
// site's Content-Type. MP4 has "ftyp" at byte 4; WebM starts with the EBML
// magic number.
export function detectVideoFormat(bytes: Buffer): VideoFormat | null {
  if (bytes.length >= 12 && bytes.toString("latin1", 4, 8) === "ftyp") {
    return MP4;
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return WEBM;
  }
  return null;
}

export function isVideoFilename(filename: string): boolean {
  return VIDEO_FILENAME.test(filename);
}

export function videoMimeTypeFor(filename: string): string {
  return path.extname(filename).toLowerCase() === WEBM.extension
    ? WEBM.mimeType
    : MP4.mimeType;
}

export function getRecipeVideoPath(filename: string): string {
  return path.join(RECIPE_VIDEOS_DIR, filename);
}

export async function saveRecipeVideo(
  bytes: Buffer,
): Promise<SavedVideoFile | null> {
  const format = detectVideoFormat(bytes);
  if (!format) {
    logger.warn({ size: bytes.length }, "Download isn't an MP4 or WebM video");
    return null;
  }
  const filename = `${randomUUID()}${format.extension}`;
  await mkdir(RECIPE_VIDEOS_DIR, { recursive: true });
  await writeFile(getRecipeVideoPath(filename), bytes);
  logger.info({ filename, size: bytes.length }, "Saved recipe video");
  return { filename, mimeType: format.mimeType, fileSize: bytes.length };
}

export async function deleteRecipeVideo(filename: string): Promise<boolean> {
  if (!isVideoFilename(filename)) return false;
  try {
    await unlink(getRecipeVideoPath(filename));
    return true;
  } catch {
    logger.warn({ filename }, "Video file not found during deletion");
    return false;
  }
}
