import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { recipeImages } from "@/db/schema.recipes";
import { deleteRecipeImage, STORAGE_CONFIG } from "@/lib/file-storage";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("unused-image-cleanup");

// Photos are stored before their recipe is saved (uploads and imports), so
// anything younger than this may still be waiting on the editor.
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;
const VARIANT_SUFFIX = new RegExp(
  `_(${Object.keys(STORAGE_CONFIG.imageSizes).join("|")})$`,
);

export interface StoredImageFile {
  filename: string;
  modifiedAt: number;
}

export function findUnusedImages(
  files: StoredImageFile[],
  usedFilenames: Set<string>,
  now: number,
): string[] {
  return files
    .filter((file) => !VARIANT_SUFFIX.test(path.parse(file.filename).name))
    .filter((file) => !usedFilenames.has(file.filename))
    .filter((file) => now - file.modifiedAt > GRACE_PERIOD_MS)
    .map((file) => file.filename);
}

async function listStoredImages(): Promise<StoredImageFile[]> {
  const names = await readdir(STORAGE_CONFIG.recipeImagesDir).catch(
    () => [] as string[],
  );
  const files = await Promise.all(
    names.map(async (filename) => {
      const info = await stat(
        path.join(STORAGE_CONFIG.recipeImagesDir, filename),
      ).catch(() => null);
      return info?.isFile() ? { filename, modifiedAt: info.mtimeMs } : null;
    }),
  );
  return files.filter((file) => file !== null);
}

export async function deleteUnusedRecipeImages(): Promise<number> {
  const [files, rows] = await Promise.all([
    listStoredImages(),
    db.select({ filename: recipeImages.filename }).from(recipeImages),
  ]);
  const unused = findUnusedImages(
    files,
    new Set(rows.map((row) => row.filename)),
    Date.now(),
  );
  for (const filename of unused) {
    await deleteRecipeImage(filename);
  }
  if (unused.length > 0) {
    logger.info({ count: unused.length }, "Deleted photos no recipe uses");
  }
  return unused.length;
}

const globalForCleanup = globalThis as typeof globalThis & {
  tastebaseImageCleanup?: boolean;
};

export function scheduleUnusedImageCleanup() {
  if (globalForCleanup.tastebaseImageCleanup) return;
  globalForCleanup.tastebaseImageCleanup = true;

  const run = () =>
    deleteUnusedRecipeImages().catch((error) =>
      logError(logger, "Unused photo cleanup failed", error),
    );
  setTimeout(run, FIRST_RUN_DELAY_MS).unref();
  setInterval(run, CLEANUP_INTERVAL_MS).unref();
}
