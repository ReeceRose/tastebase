#!/usr/bin/env tsx

import { 
  cleanupOrphanedData, 
  rebuildDatabase, 
  resetDatabase, 
  resetRecipeData, 
  resetUserData, 
  validateDatabaseIntegrity 
} from "@/lib/database/reset-scripts";
import { createRecipesFtsTable, rebuildRecipesFtsIndex } from "@/lib/search";

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case "reset":
        console.log("🔄 Resetting database...");
        await resetDatabase();
        console.log("✅ Database reset completed");
        break;

      case "reset-recipes":
        console.log("🔄 Resetting recipe data (preserving users)...");
        await resetRecipeData();
        console.log("✅ Recipe data reset completed");
        break;

      case "reset-users":
        console.log("🔄 Resetting all user data...");
        await resetUserData();
        console.log("✅ User data reset completed");
        break;

      case "rebuild":
        console.log("🔄 Rebuilding database...");
        await rebuildDatabase();
        console.log("✅ Database rebuild completed");
        break;

      case "validate":
        console.log("🔍 Validating database integrity...");
        const validation = await validateDatabaseIntegrity();
        if (validation.isValid) {
          console.log("✅ Database integrity check passed");
        } else {
          console.log("❌ Database integrity issues found:");
          validation.issues.forEach(issue => console.log(`  - ${issue}`));
          process.exit(1);
        }
        break;

      case "cleanup":
        console.log("🧹 Cleaning up orphaned data...");
        const cleanup = await cleanupOrphanedData();
        console.log(`✅ Cleanup completed: ${cleanup.cleaned} items cleaned`);
        if (cleanup.details.length > 0) {
          cleanup.details.forEach(detail => console.log(`  - ${detail}`));
        }
        break;

      case "setup-fts":
        console.log("🔍 Setting up full-text search...");
        await createRecipesFtsTable();
        console.log("✅ FTS setup completed");
        break;

      case "rebuild-fts":
        console.log("🔍 Rebuilding FTS index...");
        await rebuildRecipesFtsIndex();
        console.log("✅ FTS index rebuild completed");
        break;

      case "help":
      default:
        console.log(`
Database Management Commands:

  reset           - Reset entire database (⚠️  DESTRUCTIVE)
  reset-recipes   - Reset recipe data only (preserves users)
  reset-users     - Reset all user data (⚠️  DESTRUCTIVE)
  rebuild         - Rebuild database from migrations
  validate        - Check database integrity
  cleanup         - Clean up orphaned data
  setup-fts       - Set up full-text search tables
  rebuild-fts     - Rebuild FTS search index
  help            - Show this help

Examples:
  tsx scripts/db-reset.ts reset-recipes
  tsx scripts/db-reset.ts validate
  tsx scripts/db-reset.ts cleanup
        `);
        break;
    }
  } catch (error) {
    console.error("❌ Command failed:", error);
    process.exit(1);
  }
}

main();