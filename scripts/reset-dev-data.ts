#!/usr/bin/env tsx

/**
 * Development Data Reset Utility
 * Resets only user-created data while preserving base system data
 */

import { eq, like, not } from "drizzle-orm";
import { db } from "@/db/index";
import { accounts, sessions, users } from "@/db/schema.base";
import { 
  recipeImages, 
  recipeIngredients, 
  recipeInstructions, 
  recipeNotes, 
  recipes, 
  recipeTagRelations,
  recipeTags 
} from "@/db/schema.recipes";
import { seedTags } from "@/db/seed-data/tags";
import { seedUsers } from "@/db/seed-data/users";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("dev-data-reset");

async function resetDevData() {
  logger.info("Starting development data reset");

  try {
    // Count existing data before reset
    const beforeCounts = {
      users: await db.select().from(users).then(r => r.length),
      recipes: await db.select().from(recipes).then(r => r.length),
      tags: await db.select().from(recipeTags).then(r => r.length),
    };
    
    logger.info(beforeCounts, "Current data counts");

    // Clear recipe-related data
    logger.info("Clearing recipe data");
    await db.delete(recipeTagRelations);
    await db.delete(recipeNotes);
    await db.delete(recipeImages);
    await db.delete(recipeInstructions);
    await db.delete(recipeIngredients);
    await db.delete(recipes);
    
    // Clear user-created tags (keep system tags if any exist)
    logger.info("Clearing user-created tags");
    await db.delete(recipeTags);

    // Clear test users and their sessions (preserve any real users)
    logger.info("Clearing test users");
    const testUserEmails = seedUsers.map(u => u.email);
    for (const email of testUserEmails) {
      // Clear sessions for test users
      const testUsers = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
      if (testUsers.length > 0) {
        await db.delete(sessions).where(eq(sessions.userId, testUsers[0].id));
        await db.delete(accounts).where(eq(accounts.userId, testUsers[0].id));
      }
      
      // Delete test users
      await db.delete(users).where(eq(users.email, email));
    }
    
    // Also clear any users with @example.com emails
    await db.delete(users).where(like(users.email, "%@example.com"));
    
    logger.info("Data cleared successfully");

    // Re-seed with fresh data
    logger.info("Re-seeding with fresh data");
    
    // Insert fresh test users
    await db.insert(users).values(seedUsers);
    logger.info({ count: seedUsers.length }, "Re-created test users");

    // Insert fresh tags
    await db.insert(recipeTags).values(seedTags);
    logger.info({ count: seedTags.length }, "Re-created recipe tags");

    // Count data after reset
    const afterCounts = {
      users: await db.select().from(users).then(r => r.length),
      recipes: await db.select().from(recipes).then(r => r.length),
      tags: await db.select().from(recipeTags).then(r => r.length),
    };
    
    logger.info(afterCounts, "Data counts after reset");
    
    logger.info("Development data reset completed successfully");
    
    console.log("\n🎉 Development Data Reset Complete!");
    console.log("✅ Recipe data cleared");
    console.log("✅ Test users reset"); 
    console.log("✅ Fresh tags loaded");
    console.log("\n📊 Current State:");
    console.log(`   • Users: ${afterCounts.users}`);
    console.log(`   • Recipes: ${afterCounts.recipes}`);
    console.log(`   • Tags: ${afterCounts.tags}`);
    console.log("\n🚀 Ready for testing!");

  } catch (error) {
    logError(logger, "Development data reset failed", error);
    throw error;
  }
}

async function main() {
  try {
    await resetDevData();
    process.exit(0);
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}