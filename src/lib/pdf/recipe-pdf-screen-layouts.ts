import { RecipePdfScreen } from "@/lib/types";
import type { RecipePdfScreenLayout } from "@/lib/types/recipe-pdf-types";

export const RECIPE_PDF_SCREEN_LAYOUTS: Record<
  RecipePdfScreen,
  RecipePdfScreenLayout
> = {
  [RecipePdfScreen.PHONE]: {
    page: [430, 764],
    padding: 18,
    ingredientWidth: null,
    quantityWidth: 92,
    columnGap: 0,
    stepPhoto: { width: 148, height: 111 },
    galleryPhoto: { width: 394, height: 295 },
    cover: {
      ringSize: 476,
      ringTop: -84,
      ringRight: -96,
      motifTop: 236,
      motifLeft: 52,
      textLeft: 28,
      textRight: 28,
      textBottom: 34,
      titleScale: 1,
    },
  },
  [RecipePdfScreen.TABLET]: {
    page: [768, 1024],
    padding: 24,
    ingredientWidth: 290,
    quantityWidth: 80,
    columnGap: 18,
    stepPhoto: { width: 158, height: 118 },
    galleryPhoto: { width: 412, height: 309 },
    cover: {
      ringSize: 780,
      ringTop: -130,
      ringRight: -150,
      motifTop: 420,
      motifLeft: 84,
      textLeft: 44,
      textRight: 44,
      textBottom: 48,
      titleScale: 1.35,
    },
  },
  [RecipePdfScreen.LAPTOP]: {
    page: [1120, 700],
    padding: 32,
    ingredientWidth: 370,
    quantityWidth: 92,
    columnGap: 24,
    stepPhoto: { width: 180, height: 135 },
    galleryPhoto: { width: 327, height: 245 },
    cover: {
      ringSize: 770,
      ringTop: -75,
      ringRight: -240,
      motifTop: 96,
      motifLeft: 330,
      textLeft: 56,
      textRight: 570,
      textBottom: 52,
      titleScale: 1.1,
    },
  },
};
