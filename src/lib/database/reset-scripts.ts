import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  recipeImages,
  recipeIngredients,
  recipeInstructions,
  recipeNotes,
  recipes,
  recipeTagRelations,
  recipeTags,
} from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("database-reset");

export async function resetDatabase(): Promise<void> {
  try {
    logger.info("Starting database reset");

    // Drop FTS table and triggers first
    await db.run(sql`DROP TRIGGER IF EXISTS recipes_fts_update`);
    await db.run(sql`DROP TRIGGER IF EXISTS recipes_fts_delete`);
    await db.run(sql`DROP TRIGGER IF EXISTS recipes_fts_insert`);
    await db.run(sql`DROP TABLE IF EXISTS recipes_fts`);

    // Delete all recipe-related data in correct order (respecting foreign keys)
    await db.delete(recipeNotes);
    await db.delete(recipeImages);
    await db.delete(recipeTagRelations);
    await db.delete(recipeIngredients);
    await db.delete(recipeInstructions);
    await db.delete(recipeTags);
    await db.delete(recipes);

    // Note: We don't delete users as they may be needed for auth
    // If you want to delete users too, uncomment:
    // await db.delete(users);

    logger.info("Database reset completed successfully");
  } catch (error) {
    logError(logger, "Database reset failed", error);
    throw error;
  }
}

export async function resetRecipeData(): Promise<void> {
  try {
    logger.info("Starting recipe data reset (preserving users)");

    // Drop FTS table and triggers first
    await db.run(sql`DROP TRIGGER IF EXISTS recipes_fts_update`);
    await db.run(sql`DROP TRIGGER IF EXISTS recipes_fts_delete`);
    await db.run(sql`DROP TRIGGER IF EXISTS recipes_fts_insert`);
    await db.run(sql`DROP TABLE IF EXISTS recipes_fts`);

    // Delete recipe-related data only
    await db.delete(recipeNotes);
    await db.delete(recipeImages);
    await db.delete(recipeTagRelations);
    await db.delete(recipeIngredients);
    await db.delete(recipeInstructions);
    await db.delete(recipeTags);
    await db.delete(recipes);

    logger.info("Recipe data reset completed successfully");
  } catch (error) {
    logError(logger, "Recipe data reset failed", error);
    throw error;
  }
}

export async function resetUserData(): Promise<void> {
  try {
    logger.info("Starting user data reset");

    // First reset all recipe data
    await resetRecipeData();

    // Then delete users
    await db.delete(users);

    logger.info("User data reset completed successfully");
  } catch (error) {
    logError(logger, "User data reset failed", error);
    throw error;
  }
}

export async function rebuildDatabase(): Promise<void> {
  try {
    logger.info("Starting database rebuild");

    // Reset the database
    await resetDatabase();

    // Run migrations to rebuild schema
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    await migrate(db, { migrationsFolder: "./src/db/migrations" });

    logger.info("Database rebuild completed successfully");
  } catch (error) {
    logError(logger, "Database rebuild failed", error);
    throw error;
  }
}

export async function validateDatabaseIntegrity(): Promise<{
  isValid: boolean;
  issues: string[];
}> {
  try {
    logger.info("Starting database integrity check");

    const issues: string[] = [];

    // Check for orphaned recipe ingredients
    const orphanedIngredients = (await db.get(sql`
      SELECT COUNT(*) as count 
      FROM recipe_ingredients ri 
      LEFT JOIN recipes r ON ri.recipe_id = r.id 
      WHERE r.id IS NULL
    `)) as { count: number } | undefined;

    if (orphanedIngredients?.count && orphanedIngredients.count > 0) {
      issues.push(
        `Found ${orphanedIngredients.count} orphaned recipe ingredients`,
      );
    }

    // Check for orphaned recipe instructions
    const orphanedInstructions = (await db.get(sql`
      SELECT COUNT(*) as count 
      FROM recipe_instructions ri 
      LEFT JOIN recipes r ON ri.recipe_id = r.id 
      WHERE r.id IS NULL
    `)) as { count: number } | undefined;

    if (orphanedInstructions?.count && orphanedInstructions.count > 0) {
      issues.push(
        `Found ${orphanedInstructions.count} orphaned recipe instructions`,
      );
    }

    // Check for orphaned recipe tag relations
    const orphanedTagRelations = (await db.get(sql`
      SELECT COUNT(*) as count 
      FROM recipe_tag_relations rtr 
      LEFT JOIN recipes r ON rtr.recipe_id = r.id 
      WHERE r.id IS NULL
    `)) as { count: number } | undefined;

    if (orphanedTagRelations?.count && orphanedTagRelations.count > 0) {
      issues.push(
        `Found ${orphanedTagRelations.count} orphaned recipe tag relations`,
      );
    }

    // Check for orphaned recipe images
    const orphanedImages = (await db.get(sql`
      SELECT COUNT(*) as count 
      FROM recipe_images ri 
      LEFT JOIN recipes r ON ri.recipe_id = r.id 
      WHERE r.id IS NULL
    `)) as { count: number } | undefined;

    if (orphanedImages?.count && orphanedImages.count > 0) {
      issues.push(`Found ${orphanedImages.count} orphaned recipe images`);
    }

    // Check for orphaned recipe notes
    const orphanedNotes = (await db.get(sql`
      SELECT COUNT(*) as count 
      FROM recipe_notes rn 
      LEFT JOIN recipes r ON rn.recipe_id = r.id 
      WHERE r.id IS NULL
    `)) as { count: number } | undefined;

    if (orphanedNotes?.count && orphanedNotes.count > 0) {
      issues.push(`Found ${orphanedNotes.count} orphaned recipe notes`);
    }

    // Check for recipes without owners
    const orphanedRecipes = (await db.get(sql`
      SELECT COUNT(*) as count 
      FROM recipes r 
      LEFT JOIN users u ON r.user_id = u.id 
      WHERE u.id IS NULL
    `)) as { count: number } | undefined;

    if (orphanedRecipes?.count && orphanedRecipes.count > 0) {
      issues.push(
        `Found ${orphanedRecipes.count} recipes without valid owners`,
      );
    }

    // Check FTS table integrity
    try {
      await db.run(sql`SELECT COUNT(*) FROM recipes_fts`);
    } catch (_error) {
      issues.push("FTS table is missing or corrupted");
    }

    const isValid = issues.length === 0;

    logger.info(
      { isValid, issueCount: issues.length },
      "Database integrity check completed",
    );

    return { isValid, issues };
  } catch (error) {
    logError(logger, "Database integrity check failed", error);
    throw error;
  }
}

export async function cleanupOrphanedData(): Promise<{
  cleaned: number;
  details: string[];
}> {
  try {
    logger.info("Starting orphaned data cleanup");

    let totalCleaned = 0;
    const details: string[] = [];

    // Clean orphaned recipe ingredients
    const deletedIngredients = await db.run(sql`
      DELETE FROM recipe_ingredients 
      WHERE recipe_id NOT IN (SELECT id FROM recipes)
    `);
    if (deletedIngredients.changes > 0) {
      totalCleaned += deletedIngredients.changes;
      details.push(
        `Cleaned ${deletedIngredients.changes} orphaned recipe ingredients`,
      );
    }

    // Clean orphaned recipe instructions
    const deletedInstructions = await db.run(sql`
      DELETE FROM recipe_instructions 
      WHERE recipe_id NOT IN (SELECT id FROM recipes)
    `);
    if (deletedInstructions.changes > 0) {
      totalCleaned += deletedInstructions.changes;
      details.push(
        `Cleaned ${deletedInstructions.changes} orphaned recipe instructions`,
      );
    }

    // Clean orphaned recipe tag relations
    const deletedTagRelations = await db.run(sql`
      DELETE FROM recipe_tag_relations 
      WHERE recipe_id NOT IN (SELECT id FROM recipes)
    `);
    if (deletedTagRelations.changes > 0) {
      totalCleaned += deletedTagRelations.changes;
      details.push(
        `Cleaned ${deletedTagRelations.changes} orphaned recipe tag relations`,
      );
    }

    // Clean orphaned recipe images
    const deletedImages = await db.run(sql`
      DELETE FROM recipe_images 
      WHERE recipe_id NOT IN (SELECT id FROM recipes)
    `);
    if (deletedImages.changes > 0) {
      totalCleaned += deletedImages.changes;
      details.push(`Cleaned ${deletedImages.changes} orphaned recipe images`);
    }

    // Clean orphaned recipe notes
    const deletedNotes = await db.run(sql`
      DELETE FROM recipe_notes 
      WHERE recipe_id NOT IN (SELECT id FROM recipes)
    `);
    if (deletedNotes.changes > 0) {
      totalCleaned += deletedNotes.changes;
      details.push(`Cleaned ${deletedNotes.changes} orphaned recipe notes`);
    }

    // Clean recipes without valid owners
    const deletedRecipes = await db.run(sql`
      DELETE FROM recipes 
      WHERE user_id NOT IN (SELECT id FROM users)
    `);
    if (deletedRecipes.changes > 0) {
      totalCleaned += deletedRecipes.changes;
      details.push(
        `Cleaned ${deletedRecipes.changes} recipes without valid owners`,
      );
    }

    logger.info({ totalCleaned, details }, "Orphaned data cleanup completed");

    return { cleaned: totalCleaned, details };
  } catch (error) {
    logError(logger, "Orphaned data cleanup failed", error);
    throw error;
  }
}
