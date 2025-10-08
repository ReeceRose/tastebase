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
      const { drizzle } = await import("drizzle-orm/better-sqlite3");
      const Database = (await import("better-sqlite3")).default;
      const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");

      const databasePath =
        process.env.DATABASE_URL?.replace("file:", "") ||
        "/app/data/tastebase.db";
      const sqlite = new Database(databasePath);
      const db = drizzle(sqlite);

      await migrate(db, { migrationsFolder: "./src/db/migrations" });

      sqlite.close();
      logger.info("Auto migrations completed successfully");
    } catch (error) {
      logError(logger, "Auto migration failed", error);
      // Throw in production too - if migrations fail, the app shouldn't start
      throw error;
    }
  })();

  return migrationPromise;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await runMigrations();
  }
}
