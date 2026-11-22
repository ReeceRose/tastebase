import { randomUUID } from "node:crypto";
import { type FileHandle, mkdir, open, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { MAX_VIDEO_BYTES, MAX_VIDEO_LABEL } from "@/lib/config/video-limits";
import { STORAGE_CONFIG } from "@/lib/file-storage";
import { createOperationLogger } from "@/lib/logging/logger";

const logger = createOperationLogger("video-storage");

export const RECIPE_VIDEOS_DIR = path.join(
  STORAGE_CONFIG.uploadsDir,
  "recipe-videos",
);

const VIDEO_FILENAME = /^[a-zA-Z0-9-]+\.(mp4|webm)$/;
const PARTIAL_FILENAME = /^[a-zA-Z0-9-]+\.part$/;
const HEADER_BYTES = 12;

interface VideoFormat {
  extension: string;
  mimeType: string;
}

const MP4: VideoFormat = { extension: ".mp4", mimeType: "video/mp4" };
const WEBM: VideoFormat = { extension: ".webm", mimeType: "video/webm" };

export class VideoTooLargeError extends Error {
  constructor() {
    super(`Videos must be ${MAX_VIDEO_LABEL} or smaller`);
  }
}

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

async function writeAll(file: FileHandle, chunk: Uint8Array): Promise<void> {
  let offset = 0;
  while (offset < chunk.byteLength) {
    const { bytesWritten } = await file.write(chunk, offset);
    offset += bytesWritten;
  }
}

interface StreamedFile {
  size: number;
  format: VideoFormat | null;
}

// Copies the stream to disk a chunk at a time, so memory use stays flat
// whatever the size. Stops early once the first bytes show it isn't a video.
async function streamToFile(
  body: ReadableStream<Uint8Array>,
  file: FileHandle,
): Promise<StreamedFile> {
  const reader = body.getReader();
  let header = Buffer.alloc(0);
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_VIDEO_BYTES) throw new VideoTooLargeError();
      if (header.length < HEADER_BYTES) {
        header = Buffer.concat([
          header,
          value.subarray(0, HEADER_BYTES - header.length),
        ]);
        if (header.length >= HEADER_BYTES && !detectVideoFormat(header)) {
          return { size, format: null };
        }
      }
      await writeAll(file, value);
    }
    return { size, format: detectVideoFormat(header) };
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

// Writes to a ".part" file first so a half-sent video is never served.
// Returns null when the bytes aren't an MP4 or WebM video.
export async function saveRecipeVideo(
  body: ReadableStream<Uint8Array>,
): Promise<SavedVideoFile | null> {
  await mkdir(RECIPE_VIDEOS_DIR, { recursive: true });
  const id = randomUUID();
  const partPath = getRecipeVideoPath(`${id}.part`);
  const file = await open(partPath, "w");
  let kept = false;
  try {
    const { size, format } = await streamToFile(body, file);
    await file.close();
    if (!format) {
      logger.warn({ size }, "Video isn't an MP4 or WebM file");
      return null;
    }
    const filename = `${id}${format.extension}`;
    await rename(partPath, getRecipeVideoPath(filename));
    kept = true;
    logger.info({ filename, size }, "Saved recipe video");
    return { filename, mimeType: format.mimeType, fileSize: size };
  } finally {
    await file.close().catch(() => undefined);
    if (!kept) await unlink(partPath).catch(() => undefined);
  }
}

// Also takes ".part" files a crash left behind, so the cleanup can clear them.
export async function deleteRecipeVideo(filename: string): Promise<boolean> {
  if (!isVideoFilename(filename) && !PARTIAL_FILENAME.test(filename)) {
    return false;
  }
  try {
    await unlink(getRecipeVideoPath(filename));
    return true;
  } catch {
    logger.warn({ filename }, "Video file not found during deletion");
    return false;
  }
}
