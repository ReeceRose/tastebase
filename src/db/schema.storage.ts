import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./schema.base";

export const storageStats = sqliteTable("storage_stats", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(), // Add unique constraint for proper upserts

  // Calculated storage metrics
  totalRecipes: integer("total_recipes").default(0).notNull(),
  totalImages: integer("total_images").default(0).notNull(),
  databaseSizeMB: real("database_size_mb").default(0).notNull(),
  imagesSizeMB: real("images_size_mb").default(0).notNull(),
  totalSizeMB: real("total_size_mb").default(0).notNull(),

  lastCalculated: integer("last_calculated", { mode: "timestamp" })
    .defaultNow()
    .notNull(),

  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type StorageStats = typeof storageStats.$inferSelect;
export type StorageStatsInsert = typeof storageStats.$inferInsert;
