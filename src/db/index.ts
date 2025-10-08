import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@/db/schema";

// For local SQLite files, we can use a simple file path
const DATABASE_URL = process.env.DATABASE_URL || "tastebase.db";

// Remove file:// prefix if present
const databasePath = DATABASE_URL.replace("file:", "");

const sqlite = new Database(databasePath);
export const db = drizzle(sqlite, { schema });

// Auto-run migrations on startup (development and production)
if (process.env.NODE_ENV !== "test") {
  try {
    migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("✅ Database migrations applied successfully");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    // Don't exit - let the app handle the error
  }
}
