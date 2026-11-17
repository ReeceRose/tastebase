import type { RecipeSwatch } from "@/lib/types";
import type { JournalEntry, JournalGroup } from "@/lib/types/journal-types";
import type { RecipeSummary } from "@/lib/types/recipe-types";

export interface CookMoment {
  recipeId: string;
  cookedAt: Date;
}

export interface HeatmapDay {
  day: string;
  count: number;
  inYear: boolean;
}

export interface HeatmapWeek {
  key: string;
  monthLabel: string | null;
  days: HeatmapDay[];
}

export interface MonthCount {
  month: number;
  label: string;
  count: number;
}

export interface RecipeCookCount {
  recipe: RecipeSummary;
  count: number;
}

export interface YearReviewTotals {
  cooks: number;
  recipes: number;
  newRecipes: number;
  cookingDays: number;
  longestStreak: number;
  photos: number;
  notes: number;
}

export interface YearReview {
  year: number;
  totals: YearReviewTotals;
  weeks: HeatmapWeek[];
  busiestDay: number;
  months: MonthCount[];
  busiestMonth: MonthCount | null;
  topRecipes: RecipeCookCount[];
  highlights: JournalEntry[];
  years: number[];
}

export interface YearSnapshot {
  year: number;
  month: number;
  cooks: number;
  recipes: number;
}

export interface WallPhoto {
  id: string;
  filename: string;
  caption: string;
  happenedAt: Date;
  recipeSlug: string | null;
}

export interface WallMonth {
  key: string;
  label: string;
  photos: WallPhoto[];
}

export interface RatedCook {
  entryId: string;
  day: string;
  rating: number;
}

export interface RecipeHistory {
  count: number;
  firstAt: Date | null;
  lastAt: Date | null;
  ratings: RatedCook[];
}

export interface OnThisDay {
  groups: JournalGroup[];
}

export interface MonthRef {
  year: number;
  month: number;
}

export interface CalendarRecipe {
  id: string;
  title: string;
  swatch: RecipeSwatch;
}

export interface CalendarDay {
  day: string;
  inMonth: boolean;
  cooks: number;
  recipes: CalendarRecipe[];
  photo: string | null;
  entries: number;
}

export interface MonthReviewTotals {
  cooks: number;
  recipes: number;
  newRecipes: number;
  cookingDays: number;
  photos: number;
  notes: number;
}

export interface MonthReview {
  year: number;
  month: number;
  today: string;
  totals: MonthReviewTotals;
  previousCooks: number;
  weeks: CalendarDay[][];
  topRecipes: RecipeCookCount[];
  firstTries: RecipeSummary[];
  entries: JournalEntry[];
  older: MonthRef | null;
  newer: MonthRef | null;
}

export interface JournalStatTile {
  label: string;
  value: number;
}
