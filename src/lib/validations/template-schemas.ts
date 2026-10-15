import { z } from "zod";
import { SortOrder } from "@/lib/types";
import { TEMPLATE_CATEGORIES } from "@/lib/types/template-types";

// Base template validation schema
const templateBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be 100 characters or less")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .optional(),
  category: z.enum(TEMPLATE_CATEGORIES, "Please select a valid category"),
  content: z
    .string()
    .min(1, "Template content is required")
    .max(5000, "Template content must be 5000 characters or less")
    .trim(),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(10, "Maximum 10 tags allowed"),
});

// Create template schema
export const createTemplateSchema = templateBaseSchema;

// Update template schema (with id)
export const updateTemplateSchema = templateBaseSchema.extend({
  id: z.string().min(1, "Template ID is required"),
});

// Unified template form schema that handles both create and update
export const templateFormSchema = z.object({
  id: z.string().min(1, "Template ID is required").optional(),
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be 100 characters or less")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .trim()
    .optional(),
  category: z.enum(TEMPLATE_CATEGORIES, "Please select a valid category"),
  content: z
    .string()
    .min(1, "Template content is required")
    .max(5000, "Template content must be 5000 characters or less")
    .trim(),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(10, "Maximum 10 tags allowed"),
});

// Template filters schema
export const templateFiltersSchema = z.object({
  category: z.enum(TEMPLATE_CATEGORIES).optional(),
  tags: z.array(z.string()).optional(),
  searchTerm: z.string().trim().max(200).optional(),
  sortBy: z.enum(["name", "usage", "created", "updated"]).default("name"),
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.ASC),
});

// Template usage schema
export const templateUsageSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  context: z.string().max(200).optional(),
});

// Bulk template operations
export const bulkTemplateActionSchema = z.object({
  templateIds: z
    .array(z.string().min(1))
    .min(1, "At least one template must be selected"),
  action: z.enum(["delete", "export", "duplicate", "updateCategory"]),
  newCategory: z.enum(TEMPLATE_CATEGORIES).optional(), // For updateCategory action
});

// Type exports for TypeScript
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TemplateFormInput = z.infer<typeof templateFormSchema>;
export type TemplateFiltersInput = z.infer<typeof templateFiltersSchema>;
export type TemplateUsageInput = z.infer<typeof templateUsageSchema>;
export type BulkTemplateActionInput = z.infer<typeof bulkTemplateActionSchema>;
