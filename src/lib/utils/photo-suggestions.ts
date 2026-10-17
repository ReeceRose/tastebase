import type {
  PhotoSuggestion,
  RecipeImportResult,
} from "@/lib/types/import-types";

const SIZE_SUFFIX =
  /(-\d+x\d+|-scaled|-(articleLarge|superJumbo|jumbo|facebookJumbo|popup|blog\d+|master\d+|threeByTwo\w*|videoSixteenByNine\w*|mediumSquare\w*|square\w*|thumbStandard|thumbLarge\w*|verticalTwoByThree\w*|horizontalMediumAt2X))$/i;

export interface PhotoSize {
  width: number;
  height: number;
}

// Reads sizes sites put in image addresses: hummus-500x375.jpg,
// ?resize=500,375, ?fit=225,225 or ?wid=1000&hei=1000.
export function sizeFromUrl(url: string): PhotoSize | null {
  const match =
    url.match(/[?&](?:resize|fit)=(\d+)(?:%2C|,)(\d+)/i) ??
    url.match(/-(\d{2,5})x(\d{2,5})\.[a-z]+(?:[?#]|$)/i) ??
    url.match(/[?&]wid=(\d+)&hei=(\d+)/i);
  if (!match) return null;
  return {
    width: Number.parseInt(match[1], 10),
    height: Number.parseInt(match[2], 10),
  };
}

// Sites serve the same photo at several sizes; the file name is usually the
// part that stays the same.
export function photoKey(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const file = pathname.split("/").filter(Boolean).pop() ?? pathname;
    const stem = file.replace(/\.[a-z0-9]+$/i, "").replace(SIZE_SUFFIX, "");
    return `${hostname}/${stem.toLowerCase()}`;
  } catch {
    return url;
  }
}

// Photos the browser captured come first since they're ready to use, then
// any the server found. The main photo is already attached, so it's skipped.
export function mergePhotoSuggestions(
  captured: PhotoSuggestion[],
  result: RecipeImportResult,
): PhotoSuggestion[] {
  const seen = new Set<string>(
    result.imageUrl ? [photoKey(result.imageUrl)] : [],
  );
  return [
    ...captured,
    ...result.photoUrls.map((url) => ({ url, image: null })),
  ].filter((photo) => {
    const key = photoKey(photo.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
