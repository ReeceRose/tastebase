import type { RecipeDifficulty, RecipeSwatch } from "@/lib/types";

export interface SeedIngredient {
  amount: string | null;
  unit: string | null;
  name: string;
  notes: string | null;
  isOptional: boolean;
}

export interface SeedIngredientGroup {
  name: string | null;
  items: SeedIngredient[];
}

export interface SeedInstruction {
  instruction: string;
  timeMinutes: number | null;
  temperature: string | null;
}

// Photo stored at src/db/seed-data/images/<slug>.jpg, credited in CREDITS.md
export interface SeedImage {
  altText: string;
  author: string;
  license: string;
  sourceUrl: string;
}

export interface SeedRecipe {
  slug: string;
  userId: string;
  title: string;
  description: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  cuisine: string;
  swatch: RecipeSwatch;
  sourceUrl: string;
  sourceName: string;
  isPublic: boolean;
  tagIds: string[];
  image: SeedImage;
  ingredientGroups: SeedIngredientGroup[];
  instructions: SeedInstruction[];
}
