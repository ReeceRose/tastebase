import { like } from "drizzle-orm";
import { db } from "@/db/index";
import { users } from "@/db/schema.base";
import {
  recipeIngredients,
  recipeInstructions,
  recipes,
  recipeTagRelations,
  recipeTags,
} from "@/db/schema.recipes";
import { seedRecipes } from "@/db/seed-data/recipes";
import { seedTags } from "@/db/seed-data/tags";
import { seedUsers } from "@/db/seed-data/users";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("database-seed");

async function seed() {
  logger.info("Starting comprehensive database seed");

  try {
    // Clear existing data for clean seed
    logger.info("Clearing existing seed data");
    await db.delete(recipeTagRelations);
    await db.delete(recipeInstructions);
    await db.delete(recipeIngredients);
    await db.delete(recipes);
    await db.delete(recipeTags);
    await db.delete(users).where(like(users.email, "%@example.com"));

    // Insert test users
    logger.info("Creating test users");
    await db.insert(users).values(seedUsers);
    logger.info({ count: seedUsers.length }, "Created test users");

    // Insert recipe tags
    logger.info("Creating recipe tags");
    await db.insert(recipeTags).values(seedTags);
    logger.info({ count: seedTags.length }, "Created recipe tags");

    // Insert recipes with ingredients and instructions
    logger.info("Creating recipes with full data");
    for (const recipe of seedRecipes) {
      // Insert recipe
      await db.insert(recipes).values({
        id: recipe.id,
        slug: recipe.slug,
        userId: recipe.userId,
        title: recipe.title,
        description: recipe.description,
        servings: recipe.servings,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        difficulty: recipe.difficulty,
        cuisine: recipe.cuisine,
        sourceUrl: recipe.sourceUrl,
        sourceName: recipe.sourceName,
        isPublic: recipe.isPublic,
        isArchived: recipe.isArchived,
      });

      // Insert ingredients
      if (recipe.ingredients.length > 0) {
        await db.insert(recipeIngredients).values(
          recipe.ingredients.map((ing) => ({
            ...ing,
            recipeId: recipe.id,
          })),
        );
      }

      // Insert instructions
      if (recipe.instructions.length > 0) {
        await db.insert(recipeInstructions).values(
          recipe.instructions.map((inst) => ({
            ...inst,
            recipeId: recipe.id,
          })),
        );
      }

      // Insert tag relationships
      if (recipe.tags.length > 0) {
        await db.insert(recipeTagRelations).values(
          recipe.tags.map((tagId) => ({
            recipeId: recipe.id,
            tagId,
          })),
        );
      }

      logger.info(
        { recipeId: recipe.id, title: recipe.title },
        "Created recipe with full data",
      );
    }

    logger.info(
      {
        users: seedUsers.length,
        tags: seedTags.length,
        recipes: seedRecipes.length,
      },
      "Database seed completed successfully",
    );
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
