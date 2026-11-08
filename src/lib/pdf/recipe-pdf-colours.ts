import { RecipeSwatch } from "@/lib/types";
import type { SwatchHexColours } from "@/lib/types/recipe-pdf-types";

// PDFs can't read CSS variables. A test keeps these in step with globals.css.
export const PDF_SWATCH_COLOURS: Record<RecipeSwatch, SwatchHexColours> = {
  [RecipeSwatch.TOMATO]: { bg: "#d63a25", fg: "#ffffff", deep: "#a82a18" },
  [RecipeSwatch.LEEK]: { bg: "#3c6b45", fg: "#ffffff", deep: "#8cc152" },
  [RecipeSwatch.AUBERGINE]: { bg: "#4d2463", fg: "#ffffff", deep: "#7a3b98" },
  [RecipeSwatch.BEET]: { bg: "#9e1f4f", fg: "#ffffff", deep: "#ef7fa0" },
  [RecipeSwatch.TURMERIC]: { bg: "#f4b400", fg: "#172015", deep: "#e08a00" },
  [RecipeSwatch.RADISH]: { bg: "#ef7fa0", fg: "#172015", deep: "#d63a25" },
  [RecipeSwatch.SKY]: { bg: "#7cc4e6", fg: "#172015", deep: "#ffe36e" },
  [RecipeSwatch.HERB]: { bg: "#8cc152", fg: "#172015", deep: "#3c6b45" },
  [RecipeSwatch.CARROT]: { bg: "#f07f2a", fg: "#172015", deep: "#c2531a" },
  [RecipeSwatch.KALE]: { bg: "#1f5c5a", fg: "#ffffff", deep: "#7fc8b8" },
  [RecipeSwatch.BLUEBERRY]: { bg: "#2e4a9e", fg: "#ffffff", deep: "#7cc4e6" },
  [RecipeSwatch.LAVENDER]: { bg: "#b9a3e3", fg: "#172015", deep: "#6e4fb0" },
  [RecipeSwatch.MUSHROOM]: { bg: "#c9a27a", fg: "#172015", deep: "#8a6440" },
  [RecipeSwatch.COCOA]: { bg: "#5a3524", fg: "#ffffff", deep: "#c9a27a" },
};

export const PDF_PAPER = "#f1f3ec";
export const PDF_SURFACE = "#ffffff";
export const PDF_INK = "#172015";
export const PDF_INK_MUTED = "#5d6657";
export const PDF_PRINT_BLACK = "#000000";
