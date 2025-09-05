import { db } from "@/db";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("auto-migration");

let migrationPromise: Promise<void> | null = null;

async function runMigrations() {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    try {
      logger.info("Running auto migrations");
      // Dynamic import to avoid bundling for client
      const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
      await migrate(db, { migrationsFolder: "./src/db/migrations" });
      logger.info("Auto migrations completed successfully");
    } catch (error) {
      logError(logger, "Auto migration failed", error);
      // Don't throw in production to avoid breaking the app
      if (process.env.NODE_ENV === "development") {
        throw error;
      }
    }
  })();

  return migrationPromise;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await runMigrations();
  }
}
