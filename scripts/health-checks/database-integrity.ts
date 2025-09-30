#!/usr/bin/env tsx

/**
 * Database Integrity Health Check
 * Validates database schema integrity, foreign key relationships, and identifies orphaned records
 */

import { eq, isNull, notInArray, sql } from "drizzle-orm";
import { db } from "@/db/index";
import { users } from "@/db/schema.base";
import { 
  recipeImages, 
  recipeIngredients, 
  recipeInstructions, 
  recipeNotes, 
  recipes, 
  recipeTagRelations,
  recipeTags 
} from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("database-integrity-check");

interface IntegrityIssue {
  type: "error" | "warning" | "info";
  category: string;
  description: string;
  count?: number;
  details?: any;
}

class DatabaseIntegrityChecker {
  private issues: IntegrityIssue[] = [];

  addIssue(issue: IntegrityIssue) {
    this.issues.push(issue);
    const level = issue.type === "error" ? "error" : issue.type === "warning" ? "warn" : "info";
    logger[level]({
      category: issue.category,
      count: issue.count,
      details: issue.details
    }, issue.description);
  }

  async checkUserIntegrity() {
    logger.info("Checking user data integrity");

    // Check for users with invalid email formats
    const invalidEmails = await db.select({
      id: users.id,
      email: users.email
    }).from(users).where(sql`${users.email} NOT LIKE '%@%.%'`);

    if (invalidEmails.length > 0) {
      this.addIssue({
        type: "error",
        category: "user-data",
        description: "Users found with invalid email formats",
        count: invalidEmails.length,
        details: invalidEmails.map(u => ({ id: u.id, email: u.email }))
      });
    }

    // Check for duplicate emails
    const duplicateEmails = await db.select({
      email: users.email,
      count: sql<number>`COUNT(*)`
    })
    .from(users)
    .groupBy(users.email)
    .having(sql`COUNT(*) > 1`);

    if (duplicateEmails.length > 0) {
      this.addIssue({
        type: "error",
        category: "user-data",
        description: "Duplicate email addresses found",
        count: duplicateEmails.length,
        details: duplicateEmails
      });
    }

    // Check for users with null names
    const nullNames = await db.select({
      id: users.id,
      email: users.email
    }).from(users).where(isNull(users.name));

    if (nullNames.length > 0) {
      this.addIssue({
        type: "warning",
        category: "user-data",
        description: "Users with null names found",
        count: nullNames.length,
        details: nullNames
      });
    }
  }

  async checkRecipeIntegrity() {
    logger.info("Checking recipe data integrity");

    // Check for recipes with invalid user references
    const validUserIds = await db.select({ id: users.id }).from(users);
    const validUserIdSet = new Set(validUserIds.map(u => u.id));

    const orphanedRecipes = await db.select({
      id: recipes.id,
      title: recipes.title,
      userId: recipes.userId
    }).from(recipes).where(
      validUserIds.length > 0 
        ? notInArray(recipes.userId, validUserIds.map(u => u.id))
        : sql`1=1`
    );

    if (orphanedRecipes.length > 0) {
      this.addIssue({
        type: "error",
        category: "foreign-keys",
        description: "Recipes found with invalid user references (orphaned recipes)",
        count: orphanedRecipes.length,
        details: orphanedRecipes
      });
    }

    // Check for recipes with missing required fields
    const incompleteRecipes = await db.select({
      id: recipes.id,
      title: recipes.title,
      userId: recipes.userId
    }).from(recipes).where(
      sql`${recipes.title} IS NULL OR ${recipes.title} = '' OR ${recipes.userId} IS NULL`
    );

    if (incompleteRecipes.length > 0) {
      this.addIssue({
        type: "error",
        category: "data-quality",
        description: "Recipes with missing required fields (title or userId)",
        count: incompleteRecipes.length,
        details: incompleteRecipes
      });
    }

    // Check for recipes with invalid time values
    const invalidTimes = await db.select({
      id: recipes.id,
      title: recipes.title,
      prepTimeMinutes: recipes.prepTimeMinutes,
      cookTimeMinutes: recipes.cookTimeMinutes
    }).from(recipes).where(
      sql`${recipes.prepTimeMinutes} < 0 OR ${recipes.cookTimeMinutes} < 0`
    );

    if (invalidTimes.length > 0) {
      this.addIssue({
        type: "error",
        category: "data-quality",
        description: "Recipes with negative time values",
        count: invalidTimes.length,
        details: invalidTimes
      });
    }

    // Check for recipes with invalid difficulty values
    const invalidDifficulty = await db.select({
      id: recipes.id,
      title: recipes.title,
      difficulty: recipes.difficulty
    }).from(recipes).where(
      sql`${recipes.difficulty} NOT IN ('easy', 'medium', 'hard') AND ${recipes.difficulty} IS NOT NULL`
    );

    if (invalidDifficulty.length > 0) {
      this.addIssue({
        type: "error",
        category: "data-quality", 
        description: "Recipes with invalid difficulty values",
        count: invalidDifficulty.length,
        details: invalidDifficulty
      });
    }
  }

  async checkRecipeComponentIntegrity() {
    logger.info("Checking recipe component integrity");

    // Get valid recipe IDs
    const validRecipeIds = await db.select({ id: recipes.id }).from(recipes);
    const validRecipeIdSet = new Set(validRecipeIds.map(r => r.id));

    // Check orphaned ingredients
    const orphanedIngredients = await db.select({
      id: recipeIngredients.id,
      recipeId: recipeIngredients.recipeId,
      name: recipeIngredients.name
    }).from(recipeIngredients).where(
      validRecipeIds.length > 0
        ? notInArray(recipeIngredients.recipeId, validRecipeIds.map(r => r.id))
        : sql`1=1`
    );

    if (orphanedIngredients.length > 0) {
      this.addIssue({
        type: "error",
        category: "foreign-keys",
        description: "Orphaned recipe ingredients found",
        count: orphanedIngredients.length,
        details: orphanedIngredients.slice(0, 10) // Limit details for readability
      });
    }

    // Check orphaned instructions
    const orphanedInstructions = await db.select({
      id: recipeInstructions.id,
      recipeId: recipeInstructions.recipeId,
      stepNumber: recipeInstructions.stepNumber
    }).from(recipeInstructions).where(
      validRecipeIds.length > 0
        ? notInArray(recipeInstructions.recipeId, validRecipeIds.map(r => r.id))
        : sql`1=1`
    );

    if (orphanedInstructions.length > 0) {
      this.addIssue({
        type: "error",
        category: "foreign-keys",
        description: "Orphaned recipe instructions found",
        count: orphanedInstructions.length,
        details: orphanedInstructions.slice(0, 10)
      });
    }

    // Check orphaned images
    const orphanedImages = await db.select({
      id: recipeImages.id,
      recipeId: recipeImages.recipeId,
      filename: recipeImages.filename
    }).from(recipeImages).where(
      validRecipeIds.length > 0
        ? notInArray(recipeImages.recipeId, validRecipeIds.map(r => r.id))
        : sql`1=1`
    );

    if (orphanedImages.length > 0) {
      this.addIssue({
        type: "error",
        category: "foreign-keys",
        description: "Orphaned recipe images found",
        count: orphanedImages.length,
        details: orphanedImages.slice(0, 10)
      });
    }

    // Check orphaned notes
    const orphanedNotes = await db.select({
      id: recipeNotes.id,
      recipeId: recipeNotes.recipeId,
      userId: recipeNotes.userId
    }).from(recipeNotes).where(
      validRecipeIds.length > 0
        ? notInArray(recipeNotes.recipeId, validRecipeIds.map(r => r.id))
        : sql`1=1`
    );

    if (orphanedNotes.length > 0) {
      this.addIssue({
        type: "error",
        category: "foreign-keys",
        description: "Orphaned recipe notes found",
        count: orphanedNotes.length,
        details: orphanedNotes.slice(0, 10)
      });
    }

    // Check for ingredients with invalid sort orders
    const invalidIngredientOrder = await db.select({
      recipeId: recipeIngredients.recipeId,
      count: sql<number>`COUNT(*)`,
      maxSort: sql<number>`MAX(${recipeIngredients.sortOrder})`,
      minSort: sql<number>`MIN(${recipeIngredients.sortOrder})`
    })
    .from(recipeIngredients)
    .groupBy(recipeIngredients.recipeId)
    .having(sql`MIN(${recipeIngredients.sortOrder}) < 1`);

    if (invalidIngredientOrder.length > 0) {
      this.addIssue({
        type: "warning",
        category: "data-quality",
        description: "Recipes with invalid ingredient sort orders (should start at 1)",
        count: invalidIngredientOrder.length,
        details: invalidIngredientOrder.slice(0, 10)
      });
    }

    // Check for instructions with invalid step numbers
    const invalidInstructionSteps = await db.select({
      recipeId: recipeInstructions.recipeId,
      count: sql<number>`COUNT(*)`,
      maxStep: sql<number>`MAX(${recipeInstructions.stepNumber})`,
      minStep: sql<number>`MIN(${recipeInstructions.stepNumber})`
    })
    .from(recipeInstructions)
    .groupBy(recipeInstructions.recipeId)
    .having(sql`MIN(${recipeInstructions.stepNumber}) < 1`);

    if (invalidInstructionSteps.length > 0) {
      this.addIssue({
        type: "warning",
        category: "data-quality",
        description: "Recipes with invalid instruction step numbers (should start at 1)",
        count: invalidInstructionSteps.length,
        details: invalidInstructionSteps.slice(0, 10)
      });
    }
  }

  async checkTagIntegrity() {
    logger.info("Checking tag system integrity");

    // Check orphaned tag relations
    const validRecipeIds = await db.select({ id: recipes.id }).from(recipes);
    const validTagIds = await db.select({ id: recipeTags.id }).from(recipeTags);

    if (validRecipeIds.length > 0) {
      const orphanedTagRelationsRecipes = await db.select({
        recipeId: recipeTagRelations.recipeId,
        tagId: recipeTagRelations.tagId
      }).from(recipeTagRelations).where(
        notInArray(recipeTagRelations.recipeId, validRecipeIds.map(r => r.id))
      );

      if (orphanedTagRelationsRecipes.length > 0) {
        this.addIssue({
          type: "error",
          category: "foreign-keys",
          description: "Tag relations with invalid recipe references",
          count: orphanedTagRelationsRecipes.length,
          details: orphanedTagRelationsRecipes.slice(0, 10)
        });
      }
    }

    if (validTagIds.length > 0) {
      const orphanedTagRelationsTags = await db.select({
        recipeId: recipeTagRelations.recipeId,
        tagId: recipeTagRelations.tagId
      }).from(recipeTagRelations).where(
        notInArray(recipeTagRelations.tagId, validTagIds.map(t => t.id))
      );

      if (orphanedTagRelationsTags.length > 0) {
        this.addIssue({
          type: "error",
          category: "foreign-keys",
          description: "Tag relations with invalid tag references",
          count: orphanedTagRelationsTags.length,
          details: orphanedTagRelationsTags.slice(0, 10)
        });
      }
    }

    // Check for duplicate tag names
    const duplicateTagNames = await db.select({
      name: recipeTags.name,
      count: sql<number>`COUNT(*)`
    })
    .from(recipeTags)
    .groupBy(recipeTags.name)
    .having(sql`COUNT(*) > 1`);

    if (duplicateTagNames.length > 0) {
      this.addIssue({
        type: "warning",
        category: "data-quality",
        description: "Duplicate tag names found (unique constraint violation)",
        count: duplicateTagNames.length,
        details: duplicateTagNames
      });
    }
  }

  async generateSummaryStats() {
    logger.info("Generating database summary statistics");

    const stats = {
      users: await db.select().from(users).then(r => r.length),
      recipes: await db.select().from(recipes).then(r => r.length),
      publicRecipes: await db.select().from(recipes).where(eq(recipes.isPublic, true)).then(r => r.length),
      archivedRecipes: await db.select().from(recipes).where(eq(recipes.isArchived, true)).then(r => r.length),
      ingredients: await db.select().from(recipeIngredients).then(r => r.length),
      instructions: await db.select().from(recipeInstructions).then(r => r.length),
      images: await db.select().from(recipeImages).then(r => r.length),
      notes: await db.select().from(recipeNotes).then(r => r.length),
      tags: await db.select().from(recipeTags).then(r => r.length),
      tagRelations: await db.select().from(recipeTagRelations).then(r => r.length),
    };

    this.addIssue({
      type: "info",
      category: "summary",
      description: "Database summary statistics",
      details: stats
    });

    return stats;
  }

  async runAllChecks() {
    logger.info("Starting comprehensive database integrity check");

    try {
      await this.checkUserIntegrity();
      await this.checkRecipeIntegrity();
      await this.checkRecipeComponentIntegrity();
      await this.checkTagIntegrity();
      await this.generateSummaryStats();

      const summary = {
        total: this.issues.length,
        errors: this.issues.filter(i => i.type === "error").length,
        warnings: this.issues.filter(i => i.type === "warning").length,
        info: this.issues.filter(i => i.type === "info").length,
      };

      logger.info(summary, "Database integrity check completed");
      
      return {
        success: summary.errors === 0,
        issues: this.issues,
        summary
      };

    } catch (error) {
      logError(logger, "Database integrity check failed", error);
      throw error;
    }
  }
}

async function main() {
  console.log("🔍 Running Database Integrity Check...\n");
  
  try {
    const checker = new DatabaseIntegrityChecker();
    const result = await checker.runAllChecks();

    console.log("\n📊 Integrity Check Results:");
    console.log(`   • Total Issues: ${result.summary.total}`);
    console.log(`   • Errors: ${result.summary.errors}`);
    console.log(`   • Warnings: ${result.summary.warnings}`);
    console.log(`   • Info: ${result.summary.info}`);

    if (result.summary.errors > 0) {
      console.log("\n❌ Critical issues found that require attention:");
      result.issues
        .filter(i => i.type === "error")
        .forEach(issue => {
          console.log(`   • ${issue.description} (${issue.count || "unknown"} items)`);
        });
    }

    if (result.summary.warnings > 0) {
      console.log("\n⚠️  Warnings found (should be reviewed):");
      result.issues
        .filter(i => i.type === "warning")
        .forEach(issue => {
          console.log(`   • ${issue.description} (${issue.count || "unknown"} items)`);
        });
    }

    if (result.success) {
      console.log("\n✅ Database integrity check passed!");
    } else {
      console.log("\n❌ Database integrity check failed - please address the errors above");
      process.exit(1);
    }

  } catch (error) {
    console.error("❌ Health check failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}