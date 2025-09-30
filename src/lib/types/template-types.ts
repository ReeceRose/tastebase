import type {
  UserNoteTemplate,
  UserNoteTemplateInsert,
} from "@/db/schema.recipes";

// Re-export the database types
export type { UserNoteTemplate, UserNoteTemplateInsert };

// Template categories for UI organization
import { FormFieldType, type SortOrder } from "@/lib/types";

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

// Template placeholder types
export enum TemplatePlaceholderType {
  DATE = "date",
  SELECT = "select",
}

// Template with user relationship (for admin/sharing features)
export interface TemplateWithUser extends UserNoteTemplate {
  user?: {
    id: string;
    name: string;
  };
}

// Template creation/update forms
export interface CreateTemplateData {
  name: string;
  description?: string;
  category: TemplateCategory;
  content: string;
  tags?: string[];
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  id: string;
}

// Template usage tracking
export interface TemplateUsage {
  templateId: string;
  usedAt: Date;
  context?: string; // What recipe/note it was used for
}

// Template filters for UI
export interface TemplateFilters {
  category?: TemplateCategory;
  tags?: string[];
  searchTerm?: string;
  sortBy?: TemplateSortBy;
  sortOrder?: SortOrder;
}

// Template placeholders for content replacement
export interface TemplatePlaceholder {
  key: string;
  label: string;
  defaultValue?: string;
  type: FormFieldType | TemplatePlaceholderType;
  options?: string[]; // For select type
  required?: boolean;
}

// Common template placeholders
export const TEMPLATE_PLACEHOLDERS: Record<string, TemplatePlaceholder> = {
  date: {
    key: "{{date}}",
    label: "Current Date",
    defaultValue: new Date().toLocaleDateString(),
    type: TemplatePlaceholderType.DATE,
  },
  recipeName: {
    key: "{{recipeName}}",
    label: "Recipe Name",
    type: FormFieldType.TEXT,
    required: true,
  },
  servings: {
    key: "{{servings}}",
    label: "Number of Servings",
    type: FormFieldType.NUMBER,
  },
  prepTime: {
    key: "{{prepTime}}",
    label: "Prep Time",
    type: FormFieldType.TEXT,
  },
  cookTime: {
    key: "{{cookTime}}",
    label: "Cook Time",
    type: FormFieldType.TEXT,
  },
  difficulty: {
    key: "{{difficulty}}",
    label: "Difficulty Level",
    type: TemplatePlaceholderType.SELECT,
    options: ["Easy", "Medium", "Hard"],
  },
  rating: {
    key: "{{rating}}",
    label: "Your Rating",
    type: TemplatePlaceholderType.SELECT,
    options: ["1", "2", "3", "4", "5"],
  },
};

// Template statistics for analytics
export interface TemplateStats {
  totalTemplates: number;
  recentlyUsed: number;
  mostUsed: TemplateWithMeta[];
  categoryCounts: Record<TemplateCategory, number>;
  averageUsagePerTemplate: number;
}
