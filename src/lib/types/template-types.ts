import type { UserNoteTemplate } from "@/db/schema.recipes";

// Re-export the database types
export type { UserNoteTemplate };

// Template categories enum
export enum TemplateCategory {
  GENERAL = "general",
  MODIFICATIONS = "modifications",
  TIPS = "tips",
  TIMING = "timing",
  RATING = "rating",
}

export const TEMPLATE_CATEGORIES = Object.values(TemplateCategory);

// Enhanced template interface with computed properties
export interface TemplateWithMeta extends UserNoteTemplate {
  isSystem: boolean; // Whether this is a built-in system template
  lastUsed?: Date; // When the user last used this template
  isRecent?: boolean; // Whether this template was used recently
}

// Template sorting options
export enum TemplateSortBy {
  NAME = "name",
  USAGE = "usage",
  CREATED = "created",
  UPDATED = "updated",
}
