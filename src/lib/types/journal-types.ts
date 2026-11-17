import type { JournalPhoto } from "@/db/schema.journal";
import type { JournalEntryKind } from "@/lib/types";

export type { JournalPhoto } from "@/db/schema.journal";

// A recipe on an entry. slug is null when it was deleted or isn't visible
export interface JournalEntryRecipe {
  recipeId: string | null;
  slug: string | null;
  title: string;
  swatch: string | null;
}

export interface JournalRecipeInput {
  recipeId: string | null;
  title: string;
}

export interface JournalEntry {
  id: string;
  kind: JournalEntryKind;
  userId: string;
  authorName: string;
  recipes: JournalEntryRecipe[];
  title: string | null;
  content: string | null;
  rating: number | null;
  isPrivate: boolean;
  happenedAt: Date;
  photos: JournalPhoto[];
}

export interface JournalGroup {
  key: string;
  label: string | null;
  entries: JournalEntry[];
}

export interface JournalStats {
  cooks: number;
  recipes: number;
  photos: number;
}

export interface JournalPhotoUpload {
  filename: string;
  originalName: string | null;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
}

export interface JournalEntryInput {
  id: string | null;
  kind: JournalEntryKind;
  recipes: JournalRecipeInput[];
  title: string | null;
  content: string | null;
  rating: number | null;
  isPrivate: boolean;
  happenedOn: string;
  photos: JournalPhotoUpload[];
}

export interface JournalActionResult {
  success: boolean;
  error: string | null;
}
