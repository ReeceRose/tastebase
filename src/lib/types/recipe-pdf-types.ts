import type {
  MeasurementUnit,
  RecipePdfScreen,
  RecipePdfStyle,
  RecipeSwatch,
  TemperatureUnit,
} from "@/lib/types";

export interface RecipePdfFact {
  label: string;
  value: string;
}

export interface RecipePdfIngredient {
  id: string;
  quantity: string;
  name: string;
  detail: string | null;
}

export interface RecipePdfIngredientGroup {
  name: string | null;
  items: RecipePdfIngredient[];
}

export interface RecipePdfStep {
  id: string;
  number: number;
  text: string;
  facts: string[];
  notes: string | null;
  photos: string[];
}

export interface RecipePdfStepGroup {
  name: string | null;
  steps: RecipePdfStep[];
}

export interface RecipePdfContent {
  id: string;
  title: string;
  description: string | null;
  author: string;
  swatch: RecipeSwatch;
  facts: RecipePdfFact[];
  methodSummary: string | null;
  ingredientGroups: RecipePdfIngredientGroup[];
  stepGroups: RecipePdfStepGroup[];
  sourceName: string | null;
  extraNotes: string | null;
  sourceUrl: string | null;
  mainPhoto: string | null;
  ingredientPhotos: string[];
  otherPhotos: string[];
}

export interface RecipePdfUnits {
  measurementSystem: MeasurementUnit;
  temperatureUnit: TemperatureUnit;
}

export interface RecipePdfChoices {
  style: RecipePdfStyle;
  includePhotos: boolean;
  colourPhotos: boolean;
  screen: RecipePdfScreen;
  includeLinkedRecipes?: boolean;
}

export interface RecipePdfOptions extends RecipePdfChoices {
  units: RecipePdfUnits;
}

export type RecipePdfPhotos = Map<string, Buffer>;

export interface RecipePdfRecipeProps {
  content: RecipePdfContent;
  photos: RecipePdfPhotos;
}

export interface RecipePdfDocumentProps {
  contents: RecipePdfContent[];
  photos: RecipePdfPhotos;
}

export interface RecipeDevicePdfProps extends RecipePdfDocumentProps {
  screen: RecipePdfScreen;
}

export type RecipePdfPhotoSize = {
  width: number;
  height: number;
};

export interface RecipePdfCoverLayout {
  ringSize: number;
  ringTop: number;
  ringRight: number;
  motifTop: number;
  motifLeft: number;
  textLeft: number;
  textRight: number;
  textBottom: number;
  titleScale: number;
}

export interface RecipePdfScreenLayout {
  page: [number, number];
  padding: number;
  ingredientWidth: number | null;
  quantityWidth: number;
  columnGap: number;
  stepPhoto: RecipePdfPhotoSize;
  galleryPhoto: RecipePdfPhotoSize;
  cover: RecipePdfCoverLayout;
}

export interface SwatchHexColours {
  bg: string;
  fg: string;
  deep: string;
}
