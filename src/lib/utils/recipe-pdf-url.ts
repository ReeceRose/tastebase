import { RecipePdfScreen, RecipePdfStyle } from "@/lib/types";
import type { RecipePdfChoices } from "@/lib/types/recipe-pdf-types";

const TABLET_MIN_WIDTH = 640;
const LAPTOP_MIN_WIDTH = 1024;

export function recipePdfScreenForWidth(width: number): RecipePdfScreen {
  if (width >= LAPTOP_MIN_WIDTH) return RecipePdfScreen.LAPTOP;
  if (width >= TABLET_MIN_WIDTH) return RecipePdfScreen.TABLET;
  return RecipePdfScreen.PHONE;
}

export function recipePdfFilename(
  slug: string,
  style: RecipePdfStyle,
  screen: RecipePdfScreen,
): string {
  const name = slug.replace(/[^a-zA-Z0-9-]/g, "-");
  return style === RecipePdfStyle.PRINTER
    ? `${name}-printable.pdf`
    : `${name}-${screen}.pdf`;
}

export function recipePdfUrl(
  slug: string,
  choices: RecipePdfChoices,
  download: boolean,
): string {
  const query = new URLSearchParams({ style: choices.style });
  if (choices.includePhotos) query.set("photos", "1");
  if (choices.colourPhotos) query.set("colour", "1");
  if (choices.includeLinkedRecipes) query.set("linked", "1");
  if (choices.style === RecipePdfStyle.DEVICE) {
    query.set("screen", choices.screen);
  }
  if (download) query.set("download", "1");
  return `/api/recipe-pdf/${encodeURIComponent(slug)}?${query}`;
}
