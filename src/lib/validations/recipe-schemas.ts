import { z } from "zod";
import { RecipeDifficulty, SortOrder } from "@/lib/types";
import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(50, "Slug must be 50 characters or less")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens",
  );

const recipeIngredientSchema = z.object({
  name: z
    .string()
    .min(
      RECIPE_CONSTANTS.VALIDATION_LIMITS.INGREDIENT_NAME.MIN_LENGTH,
      "Ingredient name is required",
    )
    .max(
      RECIPE_CONSTANTS.VALIDATION_LIMITS.INGREDIENT_NAME.MAX_LENGTH,
      "Ingredient name must be 100 characters or less",
    ),
  amount: z.string().max(20, "Amount must be 20 characters or less").optional(),
  unit: z.string().max(50, "Unit must be 50 characters or less").optional(),
  notes: z.string().max(200, "Notes must be 200 characters or less").optional(),
  groupName: z
    .string()
    .max(50, "Group name must be 50 characters or less")
    .optional(),
  isOptional: z.boolean(),
});

const recipeInstructionSchema = z.object({
  instruction: z
    .string()
    .min(
      RECIPE_CONSTANTS.VALIDATION_LIMITS.INSTRUCTION.MIN_LENGTH,
      "Instruction is required",
    )
    .max(
      RECIPE_CONSTANTS.VALIDATION_LIMITS.INSTRUCTION.MAX_LENGTH,
      "Instruction must be 1000 characters or less",
    ),
  timeMinutes: z
    .number()
    .min(0, "Time must be positive")
    .max(RECIPE_CONSTANTS.TIME_LIMITS.MAX_COOK_TIME, "Time is too long")
    .optional(),
  temperature: z
    .string()
    .max(50, "Temperature must be 50 characters or less")
    .optional(),
  notes: z.string().max(200, "Notes must be 200 characters or less").optional(),
  groupName: z
    .string()
    .max(50, "Group name must be 50 characters or less")
    .optional(),
});

export const createRecipeSchema = z.object({
  title: z
    .string()
    .min(
      RECIPE_CONSTANTS.VALIDATION_LIMITS.TITLE.MIN_LENGTH,
      "Recipe title is required",
    )
    .max(
      RECIPE_CONSTANTS.VALIDATION_LIMITS.TITLE.MAX_LENGTH,
      "Title must be 200 characters or less",
    )
    .trim(),
  description: z
    .string()
    .max(
      RECIPE_CONSTANTS.VALIDATION_LIMITS.DESCRIPTION.MAX_LENGTH,
      "Description must be 2000 characters or less",
    )
    .optional(),
  servings: z
    .number()
    .int("Servings must be a whole number")
    .min(
      RECIPE_CONSTANTS.SERVING_LIMITS.MIN_SERVINGS,
      "Servings must be at least 1",
    )
    .max(
      RECIPE_CONSTANTS.SERVING_LIMITS.MAX_SERVINGS,
      "Servings must be 100 or less",
    )
    .optional(),
  prepTimeMinutes: z
    .number()
    .int("Prep time must be a whole number of minutes")
    .min(
      RECIPE_CONSTANTS.TIME_LIMITS.MIN_PREP_TIME,
      "Prep time must be positive",
    )
    .max(RECIPE_CONSTANTS.TIME_LIMITS.MAX_PREP_TIME, "Prep time is too long")
    .optional(),
  cookTimeMinutes: z
    .number()
    .int("Cook time must be a whole number of minutes")
    .min(
      RECIPE_CONSTANTS.TIME_LIMITS.MIN_COOK_TIME,
      "Cook time must be positive",
    )
    .max(RECIPE_CONSTANTS.TIME_LIMITS.MAX_COOK_TIME, "Cook time is too long")
    .optional(),
  difficulty: z.nativeEnum(RecipeDifficulty).optional(),
  cuisine: z
    .string()
    .max(50, "Cuisine must be 50 characters or less")
    .optional(),
  sourceUrl: z
    .string()
    .max(
      RECIPE_CONSTANTS.VALIDATION_LIMITS.SOURCE_URL.MAX_LENGTH,
      "Source URL must be 500 characters or less",
    )
    .refine(
      (value) => !value || z.string().url().safeParse(value).success,
      "Source URL must be a valid URL when provided",
    )
    .optional(),
  sourceName: z
    .string()
    .max(
      RECIPE_CONSTANTS.VALIDATION_LIMITS.SOURCE_NAME.MAX_LENGTH,
      "Source name must be 100 characters or less",
    )
    .optional(),
  isPublic: z.boolean(),
  ingredients: z
    .array(recipeIngredientSchema)
    .min(1, "At least one ingredient is required"),
  instructions: z
    .array(recipeInstructionSchema)
    .min(1, "At least one instruction is required"),
  tags: z
    .array(
      z
        .string()
        .max(
          RECIPE_CONSTANTS.VALIDATION_LIMITS.TAG_NAME.MAX_LENGTH,
          "Tag must be 50 characters or less",
        ),
    )
    .optional(),
});

// Internal schema with slug for server-side operations
export const createRecipeWithSlugSchema = createRecipeSchema.extend({
  slug: slugSchema,
});

export const updateRecipeSchema = createRecipeSchema.partial().extend({
  id: z.string().min(1, "Recipe ID is required"),
});

export const updateRecipeWithSlugSchema = createRecipeWithSlugSchema
  .partial()
  .extend({
    id: z.string().min(1, "Recipe ID is required"),
  });

export const createRecipeNoteSchema = z.object({
  recipeId: z.string().min(1, "Recipe ID is required"),
  content: z
    .string()
    .min(1, "Note content is required")
    .max(
      RECIPE_CONSTANTS.VALIDATION_LIMITS.NOTE_CONTENT.MAX_LENGTH,
      "Note must be 2000 characters or less",
    ),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be 5 or less")
    .optional(),
  isPrivate: z.boolean(),
});

export const updateRecipeNoteSchema = createRecipeNoteSchema.partial().extend({
  id: z.string().min(1, "Note ID is required"),
});

export const recipeSearchSchema = z.object({
  query: z
    .string()
    .min(
      RECIPE_CONSTANTS.SEARCH_LIMITS.MIN_QUERY_LENGTH,
      "Search query too short",
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.array(z.nativeEnum(RecipeDifficulty)).optional(),
  maxPrepTime: z.number().min(0, "Max prep time must be positive").optional(),
  maxCookTime: z.number().min(0, "Max cook time must be positive").optional(),
  servings: z.number().int().min(1).optional(),
  cuisine: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  minRating: z
    .number()
    .min(0, "Min rating must be positive")
    .max(5, "Rating must be 5 or less")
    .optional(),
  sortBy: z
    .enum([
      "title",
      "createdAt",
      "updatedAt",
      "prepTimeMinutes",
      "cookTimeMinutes",
      "averageRating",
      "relevance",
      "difficulty",
    ])
    .default("updatedAt"),
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.DESC),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(
      RECIPE_CONSTANTS.SEARCH_LIMITS.MAX_RESULTS_PER_PAGE,
      "Limit must be 50 or less",
    )
    .default(RECIPE_CONSTANTS.SEARCH_LIMITS.DEFAULT_RESULTS_PER_PAGE),
  offset: z.number().int().min(0, "Offset must be positive").default(0),
});

export const uploadRecipeImageSchema = z.object({
  recipeId: z.string().min(1, "Recipe ID is required"),
  altText: z
    .string()
    .max(200, "Alt text must be 200 characters or less")
    .optional(),
  isHero: z.boolean().default(false),
});

export const updateRecipeImageSchema = z.object({
  id: z.string().min(1, "Image ID is required"),
  altText: z
    .string()
    .max(200, "Alt text must be 200 characters or less")
    .optional(),
  isHero: z.boolean().optional(),
  sortOrder: z.number().int().min(0, "Sort order must be positive").optional(),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type CreateRecipeNoteInput = z.infer<typeof createRecipeNoteSchema>;
export type UpdateRecipeNoteInput = z.infer<typeof updateRecipeNoteSchema>;
export type RecipeSearchParams = z.infer<typeof recipeSearchSchema>;
export type UploadRecipeImageInput = z.infer<typeof uploadRecipeImageSchema>;
export type UpdateRecipeImageInput = z.infer<typeof updateRecipeImageSchema>;

// Individual ingredient schemas
export const createIngredientSchema = recipeIngredientSchema.extend({
  recipeId: z.string().min(1, "Recipe ID is required"),
});

export const updateIngredientSchema = recipeIngredientSchema.partial().extend({
  id: z.string().min(1, "Ingredient ID is required"),
});

// Individual instruction schemas
export const createInstructionSchema = recipeInstructionSchema.extend({
  recipeId: z.string().min(1, "Recipe ID is required"),
});

export const updateInstructionSchema = recipeInstructionSchema
  .partial()
  .extend({
    id: z.string().min(1, "Instruction ID is required"),
  });

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
export type CreateInstructionInput = z.infer<typeof createInstructionSchema>;
export type UpdateInstructionInput = z.infer<typeof updateInstructionSchema>;

// AI Recipe Parsing Schema - for validating AI-parsed recipe data
export const RECIPE_PARSING_SCHEMA = z.object({
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  servings: z.number().min(1).max(100).nullable().optional(),
  prepTime: z.number().min(0).max(1440).nullable().optional(),
  cookTime: z.number().min(0).max(1440).nullable().optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string().max(200),
        quantity: z.string().max(50).nullable().optional(),
        unit: z.string().max(20).nullable().optional(),
      }),
    )
    .max(50)
    .nullable()
    .optional(),
  instructions: z
    .array(
      z.object({
        step: z.number().min(1).max(50),
        instruction: z.string().max(1000),
        timeMinutes: z.number().min(0).max(1440).nullable().optional(),
        temperature: z.string().max(50).nullable().optional(),
      }),
    )
    .max(50)
    .nullable()
    .optional(),
  tags: z.array(z.string().max(30)).max(20).nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
  cuisine: z.string().max(50).nullable().optional(),
});

export type AIRecipeParsingResult = z.infer<typeof RECIPE_PARSING_SCHEMA>;

// Slug validation schema for URL parameters
export const recipeSlugSchema = z.object({
  slug: slugSchema,
});

export type RecipeSlugParams = z.infer<typeof recipeSlugSchema>;
