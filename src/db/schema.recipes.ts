import { relations, sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { users } from "@/db/schema.base";

// Main recipes table
export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  servings: integer("servings"),
  prepTimeMinutes: integer("prep_time_minutes"),
  cookTimeMinutes: integer("cook_time_minutes"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }),
  cuisine: text("cuisine"),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false).notNull(),
  isArchived: integer("is_archived", { mode: "boolean" })
    .default(false)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Structured ingredients table
export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: text("amount"), // Store as string to handle fractions like "1/2"
  unit: text("unit"),
  notes: text("notes"),
  groupName: text("group_name"), // For ingredient sections like "For the sauce"
  sortOrder: integer("sort_order").notNull(),
  isOptional: integer("is_optional", { mode: "boolean" })
    .default(false)
    .notNull(),
});

// Structured instructions table
export const recipeInstructions = sqliteTable("recipe_instructions", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  instruction: text("instruction").notNull(),
  timeMinutes: integer("time_minutes"), // Optional timing for this step
  temperature: text("temperature"), // e.g., "350°F", "medium heat"
  notes: text("notes"),
  groupName: text("group_name"), // For instruction sections
});

// Tags for recipe categorization
export const recipeTags = sqliteTable("recipe_tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color"), // Hex color for UI display
  category: text("category"), // e.g., "cuisine", "diet", "course"
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Many-to-many relationship between recipes and tags
export const recipeTagRelations = sqliteTable(
  "recipe_tag_relations",
  {
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => recipeTags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.recipeId, table.tagId] }),
  }),
);

// Recipe images and media
export const recipeImages = sqliteTable("recipe_images", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name"),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  width: integer("width"),
  height: integer("height"),
  altText: text("alt_text"),
  isHero: integer("is_hero", { mode: "boolean" }).default(false).notNull(),
  sortOrder: integer("sort_order").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// User notes and ratings for recipes
export const recipeNotes = sqliteTable("recipe_notes", {
  id: text("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  rating: integer("rating"), // 1-5 stars
  isPrivate: integer("is_private", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Define relationships
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
  ingredients: many(recipeIngredients),
  instructions: many(recipeInstructions),
  tags: many(recipeTagRelations),
  images: many(recipeImages),
  notes: many(recipeNotes),
}));

export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipeId],
      references: [recipes.id],
    }),
  }),
);

export const recipeInstructionsRelations = relations(
  recipeInstructions,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeInstructions.recipeId],
      references: [recipes.id],
    }),
  }),
);

export const recipeTagsRelations = relations(recipeTags, ({ many }) => ({
  recipes: many(recipeTagRelations),
}));

export const recipeTagRelationsRelations = relations(
  recipeTagRelations,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeTagRelations.recipeId],
      references: [recipes.id],
    }),
    tag: one(recipeTags, {
      fields: [recipeTagRelations.tagId],
      references: [recipeTags.id],
    }),
  }),
);

export const recipeImagesRelations = relations(recipeImages, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeImages.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeNotesRelations = relations(recipeNotes, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeNotes.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeNotes.userId],
    references: [users.id],
  }),
}));

// Export types for TypeScript
export type Recipe = typeof recipes.$inferSelect;
export type RecipeInsert = typeof recipes.$inferInsert;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type RecipeIngredientInsert = typeof recipeIngredients.$inferInsert;
export type RecipeInstruction = typeof recipeInstructions.$inferSelect;
export type RecipeInstructionInsert = typeof recipeInstructions.$inferInsert;
export type RecipeTag = typeof recipeTags.$inferSelect;
export type RecipeTagInsert = typeof recipeTags.$inferInsert;
export type RecipeImage = typeof recipeImages.$inferSelect;
export type RecipeImageInsert = typeof recipeImages.$inferInsert;
export type RecipeNote = typeof recipeNotes.$inferSelect;
export type RecipeNoteInsert = typeof recipeNotes.$inferInsert;
