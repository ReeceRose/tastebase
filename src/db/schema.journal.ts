import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "@/db/schema.base";
import { recipes } from "@/db/schema.recipes";
import { JournalEntryKind } from "@/lib/types";

// A dated entry in someone's cooking journal: something they made, or a note
export const journalEntries = sqliteTable(
  "journal_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", {
      enum: [JournalEntryKind.COOKED, JournalEntryKind.NOTE],
    }).notNull(),
    title: text("title"),
    content: text("content"),
    rating: integer("rating"),
    isPrivate: integer("is_private", { mode: "boolean" })
      .default(false)
      .notNull(),
    happenedAt: integer("happened_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index("journal_entries_user_happened_idx").on(
      table.userId,
      table.happenedAt,
    ),
  ],
);

// The recipes an entry is about, in the order they were picked
export const journalEntryRecipes = sqliteTable(
  "journal_entry_recipes",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id").references(() => recipes.id, {
      onDelete: "set null",
    }),
    // Kept so the entry still says what was made after the recipe is deleted
    recipeTitle: text("recipe_title").notNull(),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [
    index("journal_entry_recipes_entry_id_idx").on(table.entryId),
    index("journal_entry_recipes_recipe_id_idx").on(table.recipeId),
  ],
);

export const journalPhotos = sqliteTable(
  "journal_photos",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    originalName: text("original_name"),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    width: integer("width"),
    height: integer("height"),
    sortOrder: integer("sort_order").notNull(),
    uploadedAt: integer("uploaded_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [index("journal_photos_entry_id_idx").on(table.entryId)],
);

export const journalEntriesRelations = relations(
  journalEntries,
  ({ one, many }) => ({
    user: one(users, {
      fields: [journalEntries.userId],
      references: [users.id],
    }),
    recipes: many(journalEntryRecipes),
    photos: many(journalPhotos),
  }),
);

export const journalEntryRecipesRelations = relations(
  journalEntryRecipes,
  ({ one }) => ({
    entry: one(journalEntries, {
      fields: [journalEntryRecipes.entryId],
      references: [journalEntries.id],
    }),
    recipe: one(recipes, {
      fields: [journalEntryRecipes.recipeId],
      references: [recipes.id],
    }),
  }),
);

export const journalPhotosRelations = relations(journalPhotos, ({ one }) => ({
  entry: one(journalEntries, {
    fields: [journalPhotos.entryId],
    references: [journalEntries.id],
  }),
}));

export type JournalEntryRow = typeof journalEntries.$inferSelect;
export type JournalPhoto = typeof journalPhotos.$inferSelect;
