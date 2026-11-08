import sharp from "sharp";
import { getRecipeImagePath } from "@/lib/file-storage";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { RecipePdfPhotos } from "@/lib/types/recipe-pdf-types";

const logger = createOperationLogger("recipe-pdf-photos");

const MAX_PHOTO_EDGE = 1400;
const JPEG_QUALITY = 80;

type PreparedPhoto = [string, Buffer];

async function preparePhoto(
  filename: string,
  greyscale: boolean,
): Promise<PreparedPhoto | null> {
  try {
    const image = sharp(getRecipeImagePath(filename))
      .rotate()
      .resize({
        width: MAX_PHOTO_EDGE,
        height: MAX_PHOTO_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" });
    const toned = greyscale ? image.toColourspace("b-w") : image;
    return [filename, await toned.jpeg({ quality: JPEG_QUALITY }).toBuffer()];
  } catch (error) {
    logError(logger, "Photo left out of recipe PDF", error, { filename });
    return null;
  }
}

export async function loadRecipePdfPhotos(
  filenames: string[],
  greyscale: boolean,
): Promise<RecipePdfPhotos> {
  const prepared = await Promise.all(
    [...new Set(filenames)].map((filename) =>
      preparePhoto(filename, greyscale),
    ),
  );
  return new Map(
    prepared.filter((entry): entry is PreparedPhoto => entry !== null),
  );
}
