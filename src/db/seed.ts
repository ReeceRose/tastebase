// import { db } from '@/db/index';
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("database-seed");

async function seed() {
  logger.info("Starting database seed");

  try {
    // Add your seed data here
    // Example:
    // await db.insert(users).values([
    //   { name: 'John Doe', email: 'john@example.com' },
    //   { name: 'Jane Smith', email: 'jane@example.com' },
    // ]);

    logger.info("Database seed completed successfully");
  } catch (error) {
    logError(logger, "Database seed failed", error);
    throw error;
  }
}

async function main() {
  try {
    await seed();
    process.exit(0);
  } catch (error) {
    logError(logger, "Seed process failed", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
