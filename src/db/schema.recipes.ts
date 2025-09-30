import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { users } from "@/db/schema.base";
import { RecipeDifficulty } from "@/lib/types";
import { TemplateCategory } from "@/lib/types/template-types";

// Main recipes table
export const recipes = sqliteTable(
  "recipes",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    servings: integer("servings"),
    prepTimeMinutes: integer("prep_time_minutes"),
    cookTimeMinutes: integer("cook_time_minutes"),
    difficulty: text("difficulty", {
      enum: [
        RecipeDifficulty.EASY,
        RecipeDifficulty.MEDIUM,
        RecipeDifficulty.HARD,
      ],
    }),
    cuisine: text("cuisine"),
    sourceUrl: text("source_url"),
    sourceName: text("source_name"),
    isPublic: integer("is_public", { mode: "boolean" })
      .default(false)
      .notNull(),
    isArchived: integer("is_archived", { mode: "boolean" })
      .default(false)
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("recipes_user_id_idx").on(table.userId),
    index("recipes_slug_idx").on(table.slug),
    index("recipes_title_idx").on(table.title),
    index("recipes_created_at_idx").on(table.createdAt),
    index("recipes_cuisine_idx").on(table.cuisine),
    index("recipes_difficulty_idx").on(table.difficulty),
    index("recipes_is_archived_idx").on(table.isArchived),
  ],
);

// Structured ingredients table
export const recipeIngredients = sqliteTable(
  "recipe_ingredients",
  {
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
  },
  (table) => [
    index("recipe_ingredients_recipe_id_idx").on(table.recipeId),
    index("recipe_ingredients_name_idx").on(table.name),
  ],
);

// Structured instructions table
export const recipeInstructions = sqliteTable(
  "recipe_instructions",
  {
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
  },
  (table) => [
    index("recipe_instructions_recipe_id_idx").on(table.recipeId),
    index("recipe_instructions_step_number_idx").on(table.stepNumber),
  ],
);

// Tags for recipe categorization
export const recipeTags = sqliteTable(
  "recipe_tags",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    color: text("color"), // Hex color for UI display
    category: text("category"), // e.g., "cuisine", "diet", "course"
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("recipe_tags_name_idx").on(table.name),
    index("recipe_tags_category_idx").on(table.category),
  ],
);

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
export const recipeImages = sqliteTable(
  "recipe_images",
  {
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
    metadata: text("metadata", { mode: "json" }),
    uploadedAt: integer("uploaded_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("recipe_images_recipe_id_idx").on(table.recipeId),
    index("recipe_images_is_hero_idx").on(table.isHero),
  ],
);

export const userSearchHistory = sqliteTable(
  "user_search_history",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    resultsCount: integer("results_count").notNull().default(0),
    runCount: integer("run_count").notNull().default(1),
    lastSearchedAt: integer("last_searched_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.query] }),
    lastSearchedIdx: index("user_search_history_last_searched_idx").on(
      table.lastSearchedAt,
    ),
  }),
);

// User notes and ratings for recipes
export const recipeNotes = sqliteTable(
  "recipe_notes",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    rating: integer("rating"), // 1-5 stars
    isPrivate: integer("is_private", { mode: "boolean" })
      .default(true)
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("recipe_notes_recipe_id_idx").on(table.recipeId),
    index("recipe_notes_user_id_idx").on(table.userId),
    index("recipe_notes_rating_idx").on(table.rating),
  ],
);

// User favorites for recipes
export const recipeFavorites = sqliteTable(
  "recipe_favorites",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    favoritedAt: integer("favorited_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("recipe_favorites_recipe_id_idx").on(table.recipeId),
    index("recipe_favorites_user_id_idx").on(table.userId),
    index("recipe_favorites_unique_idx").on(table.recipeId, table.userId),
  ],
);

// Recipe view tracking for recently viewed
export const recipeViews = sqliteTable(
  "recipe_views",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    viewedAt: integer("viewed_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("recipe_views_recipe_id_idx").on(table.recipeId),
    index("recipe_views_user_id_idx").on(table.userId),
    index("recipe_views_viewed_at_idx").on(table.viewedAt),
  ],
);

// Recipe modification history
export const recipeModifications = sqliteTable(
  "recipe_modifications",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    changeType: text("change_type", {
      enum: [
        "title",
        "ingredients",
        "instructions",
        "metadata",
        "images",
        "major",
      ],
    }).notNull(),
    changeDescription: text("change_description").notNull(),
    oldValue: text("old_value"), // JSON string of old data
    newValue: text("new_value"), // JSON string of new data
    versionNumber: integer("version_number").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("recipe_modifications_recipe_id_idx").on(table.recipeId),
    index("recipe_modifications_user_id_idx").on(table.userId),
    index("recipe_modifications_change_type_idx").on(table.changeType),
    index("recipe_modifications_created_at_idx").on(table.createdAt),
  ],
);

// Recipe collections for organization
export const recipeCollections = sqliteTable(
  "recipe_collections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"), // Hex color for UI
    icon: text("icon"), // Icon name for UI
    isDefault: integer("is_default", { mode: "boolean" })
      .default(false)
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("recipe_collections_user_id_idx").on(table.userId),
    index("recipe_collections_name_idx").on(table.name),
    index("recipe_collections_sort_order_idx").on(table.sortOrder),
  ],
);

// Many-to-many relationship between recipes and collections
export const recipeCollectionItems = sqliteTable(
  "recipe_collection_items",
  {
    id: text("id").primaryKey(),
    collectionId: text("collection_id")
      .notNull()
      .references(() => recipeCollections.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    addedAt: integer("added_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    index("recipe_collection_items_collection_id_idx").on(table.collectionId),
    index("recipe_collection_items_recipe_id_idx").on(table.recipeId),
    index("recipe_collection_items_sort_order_idx").on(table.sortOrder),
  ],
);

// User note templates for custom note creation
export const userNoteTemplates = sqliteTable(
  "user_note_templates",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category", {
      enum: [
        TemplateCategory.GENERAL,
        TemplateCategory.MODIFICATIONS,
        TemplateCategory.TIPS,
        TemplateCategory.TIMING,
        TemplateCategory.RATING,
      ],
    })
      .default(TemplateCategory.GENERAL)
      .notNull(),
    content: text("content").notNull(),
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    usageCount: integer("usage_count").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("user_templates_user_id_idx").on(table.userId),
    index("user_templates_category_idx").on(table.category),
    index("user_templates_usage_count_idx").on(table.usageCount),
    index("user_templates_created_at_idx").on(table.createdAt),
  ],
);

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
  favorites: many(recipeFavorites),
  views: many(recipeViews),
  collections: many(recipeCollectionItems),
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

export const recipeFavoritesRelations = relations(
  recipeFavorites,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeFavorites.recipeId],
      references: [recipes.id],
    }),
    user: one(users, {
      fields: [recipeFavorites.userId],
      references: [users.id],
    }),
  }),
);

export const recipeViewsRelations = relations(recipeViews, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeViews.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeViews.userId],
    references: [users.id],
  }),
}));

export const userSearchHistoryRelations = relations(
  userSearchHistory,
  ({ one }) => ({
    user: one(users, {
      fields: [userSearchHistory.userId],
      references: [users.id],
    }),
  }),
);

export const recipeCollectionsRelations = relations(
  recipeCollections,
  ({ one, many }) => ({
    user: one(users, {
      fields: [recipeCollections.userId],
      references: [users.id],
    }),
    items: many(recipeCollectionItems),
  }),
);

export const recipeCollectionItemsRelations = relations(
  recipeCollectionItems,
  ({ one }) => ({
    collection: one(recipeCollections, {
      fields: [recipeCollectionItems.collectionId],
      references: [recipeCollections.id],
    }),
    recipe: one(recipes, {
      fields: [recipeCollectionItems.recipeId],
      references: [recipes.id],
    }),
  }),
);

export const userNoteTemplatesRelations = relations(
  userNoteTemplates,
  ({ one }) => ({
    user: one(users, {
      fields: [userNoteTemplates.userId],
      references: [users.id],
    }),
  }),
);

// Export types for TypeScript
export type Recipe = typeof recipes.$inferSelect;
export type RecipeInsert = typeof recipes.$inferInsert;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type RecipeIngredientInsert = typeof recipeIngredients.$inferInsert;
export type RecipeInstruction = typeof recipeInstructions.$inferSelect;
export type RecipeTag = typeof recipeTags.$inferSelect;
export type RecipeImage = typeof recipeImages.$inferSelect;
export type RecipeNote = typeof recipeNotes.$inferSelect;
export type RecipeFavorite = typeof recipeFavorites.$inferSelect;
export type RecipeView = typeof recipeViews.$inferSelect;
export type UserSearchHistory = typeof userSearchHistory.$inferSelect;
export type RecipeCollection = typeof recipeCollections.$inferSelect;
export type RecipeCollectionInsert = typeof recipeCollections.$inferInsert;
export type RecipeCollectionItem = typeof recipeCollectionItems.$inferSelect;
export type UserNoteTemplate = typeof userNoteTemplates.$inferSelect;
export type UserNoteTemplateInsert = typeof userNoteTemplates.$inferInsert;
