import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

// For local SQLite files, we can use a simple file path
const DATABASE_URL = process.env.DATABASE_URL || "tastebase.db";

// Remove file:// prefix if present
const databasePath = DATABASE_URL.replace("file:", "");

const sqlite = new Database(databasePath);
export const db = drizzle(sqlite, { schema });
