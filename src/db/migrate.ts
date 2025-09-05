import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("database-migration");

// For local SQLite files, we can use a simple file path
const DATABASE_URL = process.env.DATABASE_URL || "tastebase.db";

// Remove file:// prefix if present
const databasePath = DATABASE_URL.replace("file:", "");

const sqlite = new Database(databasePath);
const db = drizzle(sqlite);

async function main() {
  logger.info("Running migrations");

  await migrate(db, { migrationsFolder: "./src/db/migrations" });

  logger.info("Migrations completed successfully");
  process.exit(0);
}

main().catch((error) => {
  logError(logger, "Migration failed", error);
  process.exit(1);
});
