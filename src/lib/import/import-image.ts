import sharp from "sharp";
import { saveRecipeImage } from "@/lib/file-storage";
import { fetchRecipeImage } from "@/lib/import/fetch-page";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type {
  CapturedImage,
  PhotoSuggestion,
  RecipeImportResult,
} from "@/lib/types/import-types";
import type { PendingImage } from "@/lib/types/recipe-types";

const logger = createOperationLogger("recipe-import-image");

const MAX_CAPTURED_BYTES = 10 * 1024 * 1024;
const MIN_PHOTO_WIDTH = 300;
const MAX_PHOTO_WIDTH = 2400;
const PHOTO_FAILED_WARNING =
  "The recipe's photo couldn't be brought in. Add one under Photos if you like.";

function decodeCapturedImage(image: CapturedImage): Buffer | null {
  if (!image.mimeType.startsWith("image/")) {
    return null;
  }
  const buffer = Buffer.from(image.data, "base64");
  return buffer.byteLength > 0 && buffer.byteLength <= MAX_CAPTURED_BYTES
    ? buffer
    : null;
}

function originalNameFor(imageUrl: string | null): string {
  const base = imageUrl
    ? (new URL(imageUrl).pathname.split("/").pop() ?? "")
    : "";
  const stem = base.replace(/\.[a-z0-9]+$/i, "").slice(0, 80);
  return `${stem || "imported-photo"}.jpg`;
}

// Re-encodes whatever the site served (often WebP or AVIF) as a JPEG so it
// goes through the same storage path as uploaded photos.
async function storePhoto(
  source: Buffer,
  imageUrl: string | null,
): Promise<PendingImage | null> {
  const image = sharp(source).rotate();
  const metadata = await image.metadata();
  if ((metadata.width ?? 0) < MIN_PHOTO_WIDTH) {
    logger.info({ width: metadata.width }, "Skipping image too small to use");
    return null;
  }

  const jpeg = await image
    .resize({ width: MAX_PHOTO_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();
  const file = new File([new Uint8Array(jpeg)], originalNameFor(imageUrl), {
    type: "image/jpeg",
  });
  const saved = await saveRecipeImage(file);
  if ("error" in saved) {
    logger.warn({ error: saved.code }, saved.error);
    return null;
  }

  return {
    filename: saved.filename,
    originalName: saved.originalName,
    fileSize: saved.fileSize,
    width: saved.width ?? null,
    height: saved.height ?? null,
    url: `/api/recipes/images/${saved.filename}`,
  };
}

// The browser extension sends the photo it already loaded, which matters for
// sites that block server downloads. Otherwise the server fetches it.
export async function attachImportedPhoto(
  result: RecipeImportResult,
  captured: CapturedImage | null,
): Promise<RecipeImportResult> {
  const fromBrowser = captured ? decodeCapturedImage(captured) : null;
  const imageUrl = result.imageUrl;
  if (!fromBrowser && !imageUrl) {
    return result;
  }

  try {
    const source =
      fromBrowser ?? (imageUrl ? await fetchRecipeImage(imageUrl) : null);
    if (!source) {
      return result;
    }
    const image = await storePhoto(source, result.imageUrl);
    return image ? { ...result, image } : result;
  } catch (error) {
    logError(logger, "Couldn't import the recipe photo", error, {
      imageUrl: result.imageUrl,
      fromBrowser: fromBrowser !== null,
    });
    return { ...result, warnings: [...result.warnings, PHOTO_FAILED_WARNING] };
  }
}

// Saves a photo the user picked from the page. Returns null when it's too
// small to be a recipe photo.
export async function saveSuggestedPhoto(
  photo: PhotoSuggestion,
): Promise<PendingImage | null> {
  const fromBrowser = photo.image ? decodeCapturedImage(photo.image) : null;
  const source = fromBrowser ?? (await fetchRecipeImage(photo.url));
  return storePhoto(source, photo.url);
}
