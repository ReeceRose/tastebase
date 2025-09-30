#!/usr/bin/env tsx

/**
 * Recipe Data Quality Health Check
 * Validates recipe data completeness, consistency, and quality
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
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

const logger = createOperationLogger("recipe-data-quality-check");

interface QualityIssue {
  type: "error" | "warning" | "info";
  category: string;
  description: string;
  count?: number;
  details?: any;
}

class RecipeDataQualityChecker {
  private issues: QualityIssue[] = [];

  addIssue(issue: QualityIssue) {
    this.issues.push(issue);
    const level = issue.type === "error" ? "error" : issue.type === "warning" ? "warn" : "info";
    logger[level]({
      category: issue.category,
      count: issue.count,
      details: issue.details
    }, issue.description);
  }

  async checkRecipeCompleteness() {
    logger.info("Checking recipe data completeness");

    // Recipes without descriptions
    const recipesWithoutDescriptions = await db.select({
      id: recipes.id,
      title: recipes.title,
      userId: recipes.userId
    }).from(recipes).where(
      sql`${recipes.description} IS NULL OR ${recipes.description} = ''`
    );

    if (recipesWithoutDescriptions.length > 0) {
      this.addIssue({
        type: "warning",
        category: "completeness",
        description: "Recipes without descriptions",
        count: recipesWithoutDescriptions.length,
        details: recipesWithoutDescriptions.slice(0, 5).map(r => ({ 
          id: r.id, 
          title: r.title 
        }))
      });
    }

    // Recipes without ingredients
    const recipesWithoutIngredients = await db.select({
      id: recipes.id,
      title: recipes.title
    })
    .from(recipes)
    .leftJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
    .where(isNull(recipeIngredients.recipeId))
    .groupBy(recipes.id, recipes.title);

    if (recipesWithoutIngredients.length > 0) {
      this.addIssue({
        type: "error",
        category: "completeness",
        description: "Recipes without any ingredients",
        count: recipesWithoutIngredients.length,
        details: recipesWithoutIngredients.slice(0, 5)
      });
    }

    // Recipes without instructions
    const recipesWithoutInstructions = await db.select({
      id: recipes.id,
      title: recipes.title
    })
    .from(recipes)
    .leftJoin(recipeInstructions, eq(recipes.id, recipeInstructions.recipeId))
    .where(isNull(recipeInstructions.recipeId))
    .groupBy(recipes.id, recipes.title);

    if (recipesWithoutInstructions.length > 0) {
      this.addIssue({
        type: "error",
        category: "completeness",
        description: "Recipes without any instructions",
        count: recipesWithoutInstructions.length,
        details: recipesWithoutInstructions.slice(0, 5)
      });
    }

    // Recipes without servings information
    const recipesWithoutServings = await db.select({
      id: recipes.id,
      title: recipes.title
    }).from(recipes).where(
      sql`${recipes.servings} IS NULL OR ${recipes.servings} <= 0`
    );

    if (recipesWithoutServings.length > 0) {
      this.addIssue({
        type: "warning",
        category: "completeness",
        description: "Recipes without valid servings information",
        count: recipesWithoutServings.length,
        details: recipesWithoutServings.slice(0, 5)
      });
    }

    // Recipes without any timing information
    const recipesWithoutTiming = await db.select({
      id: recipes.id,
      title: recipes.title
    }).from(recipes).where(
      sql`(${recipes.prepTimeMinutes} IS NULL OR ${recipes.prepTimeMinutes} <= 0) AND (${recipes.cookTimeMinutes} IS NULL OR ${recipes.cookTimeMinutes} <= 0)`
    );

    if (recipesWithoutTiming.length > 0) {
      this.addIssue({
        type: "warning",
        category: "completeness",
        description: "Recipes without any timing information",
        count: recipesWithoutTiming.length,
        details: recipesWithoutTiming.slice(0, 5)
      });
    }
  }

  async checkIngredientQuality() {
    logger.info("Checking ingredient data quality");

    // Ingredients without names
    const ingredientsWithoutNames = await db.select({
      id: recipeIngredients.id,
      recipeId: recipeIngredients.recipeId,
      name: recipeIngredients.name
    }).from(recipeIngredients).where(
      sql`${recipeIngredients.name} IS NULL OR ${recipeIngredients.name} = ''`
    );

    if (ingredientsWithoutNames.length > 0) {
      this.addIssue({
        type: "error",
        category: "ingredient-quality",
        description: "Ingredients without names",
        count: ingredientsWithoutNames.length,
        details: ingredientsWithoutNames.slice(0, 5)
      });
    }

    // Ingredients without amounts
    const ingredientsWithoutAmounts = await db.select({
      id: recipeIngredients.id,
      recipeId: recipeIngredients.recipeId,
      name: recipeIngredients.name,
      amount: recipeIngredients.amount
    }).from(recipeIngredients).where(
      sql`${recipeIngredients.amount} IS NULL OR ${recipeIngredients.amount} = ''`
    );

    if (ingredientsWithoutAmounts.length > 0) {
      this.addIssue({
        type: "warning",
        category: "ingredient-quality",
        description: "Ingredients without amounts specified",
        count: ingredientsWithoutAmounts.length,
        details: ingredientsWithoutAmounts.slice(0, 5).map(i => ({
          id: i.id,
          name: i.name,
          recipeId: i.recipeId
        }))
      });
    }

    // Check for very long ingredient names (potential data entry errors)
    const longIngredientNames = await db.select({
      id: recipeIngredients.id,
      recipeId: recipeIngredients.recipeId,
      name: recipeIngredients.name
    }).from(recipeIngredients).where(
      sql`LENGTH(${recipeIngredients.name}) > 100`
    );

    if (longIngredientNames.length > 0) {
      this.addIssue({
        type: "warning",
        category: "ingredient-quality",
        description: "Ingredients with unusually long names (>100 chars)",
        count: longIngredientNames.length,
        details: longIngredientNames.slice(0, 5).map(i => ({
          id: i.id,
          name: i.name?.substring(0, 50) + "...",
          length: i.name?.length
        }))
      });
    }

    // Check ingredient sort order gaps
    const sortOrderGaps = await db.select({
      recipeId: recipeIngredients.recipeId,
      ingredients: sql<string>`GROUP_CONCAT(${recipeIngredients.sortOrder} ORDER BY ${recipeIngredients.sortOrder})`
    })
    .from(recipeIngredients)
    .groupBy(recipeIngredients.recipeId);

    const recipesWithGaps = sortOrderGaps.filter(recipe => {
      if (!recipe.ingredients) return false;
      const orders = recipe.ingredients.split(',').map(Number).sort((a, b) => a - b);
      for (let i = 1; i < orders.length; i++) {
        if (orders[i] - orders[i-1] > 1) return true;
      }
      return false;
    });

    if (recipesWithGaps.length > 0) {
      this.addIssue({
        type: "info",
        category: "ingredient-quality",
        description: "Recipes with gaps in ingredient sort order",
        count: recipesWithGaps.length,
        details: recipesWithGaps.slice(0, 5).map(r => ({
          recipeId: r.recipeId,
          orders: r.ingredients
        }))
      });
    }
  }

  async checkInstructionQuality() {
    logger.info("Checking instruction data quality");

    // Instructions without content
    const emptyInstructions = await db.select({
      id: recipeInstructions.id,
      recipeId: recipeInstructions.recipeId,
      stepNumber: recipeInstructions.stepNumber
    }).from(recipeInstructions).where(
      sql`${recipeInstructions.instruction} IS NULL OR ${recipeInstructions.instruction} = ''`
    );

    if (emptyInstructions.length > 0) {
      this.addIssue({
        type: "error",
        category: "instruction-quality",
        description: "Instructions without content",
        count: emptyInstructions.length,
        details: emptyInstructions.slice(0, 5)
      });
    }

    // Very short instructions (likely incomplete)
    const shortInstructions = await db.select({
      id: recipeInstructions.id,
      recipeId: recipeInstructions.recipeId,
      stepNumber: recipeInstructions.stepNumber,
      instruction: recipeInstructions.instruction
    }).from(recipeInstructions).where(
      sql`LENGTH(${recipeInstructions.instruction}) < 10 AND ${recipeInstructions.instruction} IS NOT NULL`
    );

    if (shortInstructions.length > 0) {
      this.addIssue({
        type: "warning",
        category: "instruction-quality",
        description: "Very short instructions (< 10 characters)",
        count: shortInstructions.length,
        details: shortInstructions.slice(0, 5).map(i => ({
          id: i.id,
          stepNumber: i.stepNumber,
          instruction: i.instruction
        }))
      });
    }

    // Check for missing step numbers or gaps
    const stepNumberGaps = await db.select({
      recipeId: recipeInstructions.recipeId,
      steps: sql<string>`GROUP_CONCAT(${recipeInstructions.stepNumber} ORDER BY ${recipeInstructions.stepNumber})`
    })
    .from(recipeInstructions)
    .groupBy(recipeInstructions.recipeId);

    const recipesWithStepGaps = stepNumberGaps.filter(recipe => {
      if (!recipe.steps) return false;
      const steps = recipe.steps.split(',').map(Number).sort((a, b) => a - b);
      if (steps[0] !== 1) return true; // Should start at 1
      for (let i = 1; i < steps.length; i++) {
        if (steps[i] - steps[i-1] !== 1) return true; // Should be consecutive
      }
      return false;
    });

    if (recipesWithStepGaps.length > 0) {
      this.addIssue({
        type: "warning",
        category: "instruction-quality",
        description: "Recipes with gaps or invalid step numbering",
        count: recipesWithStepGaps.length,
        details: recipesWithStepGaps.slice(0, 5).map(r => ({
          recipeId: r.recipeId,
          steps: r.steps
        }))
      });
    }
  }

  async checkImageData() {
    logger.info("Checking recipe image data");

    // Get upload directory from environment or default
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";

    // Images with missing files
    const allImages = await db.select({
      id: recipeImages.id,
      recipeId: recipeImages.recipeId,
      filename: recipeImages.filename,
      originalName: recipeImages.originalName
    }).from(recipeImages);

    const missingImageFiles: any[] = [];
    for (const image of allImages) {
      const filePath = join(uploadDir, image.filename);
      if (!existsSync(filePath)) {
        missingImageFiles.push({
          id: image.id,
          recipeId: image.recipeId,
          filename: image.filename,
          originalName: image.originalName
        });
      }
    }

    if (missingImageFiles.length > 0) {
      this.addIssue({
        type: "error",
        category: "image-data",
        description: "Recipe images with missing files on disk",
        count: missingImageFiles.length,
        details: missingImageFiles.slice(0, 5)
      });
    }

    // Images without alt text
    const imagesWithoutAlt = await db.select({
      id: recipeImages.id,
      recipeId: recipeImages.recipeId,
      filename: recipeImages.filename
    }).from(recipeImages).where(
      sql`${recipeImages.altText} IS NULL OR ${recipeImages.altText} = ''`
    );

    if (imagesWithoutAlt.length > 0) {
      this.addIssue({
        type: "warning",
        category: "image-data",
        description: "Recipe images without alt text (accessibility issue)",
        count: imagesWithoutAlt.length,
        details: imagesWithoutAlt.slice(0, 5)
      });
    }

    // Check for recipes with multiple hero images
    const multipleHeroImages = await db.select({
      recipeId: recipeImages.recipeId,
      heroCount: sql<number>`COUNT(*)`
    })
    .from(recipeImages)
    .where(eq(recipeImages.isHero, true))
    .groupBy(recipeImages.recipeId)
    .having(sql`COUNT(*) > 1`);

    if (multipleHeroImages.length > 0) {
      this.addIssue({
        type: "warning",
        category: "image-data",
        description: "Recipes with multiple hero images (should have only one)",
        count: multipleHeroImages.length,
        details: multipleHeroImages
      });
    }
  }

  async checkTagConsistency() {
    logger.info("Checking recipe tag consistency");

    // Recipes with excessive tags
    const recipesWithManyTags = await db.select({
      recipeId: recipeTagRelations.recipeId,
      tagCount: sql<number>`COUNT(*)`
    })
    .from(recipeTagRelations)
    .groupBy(recipeTagRelations.recipeId)
    .having(sql`COUNT(*) > 10`);

    if (recipesWithManyTags.length > 0) {
      this.addIssue({
        type: "warning",
        category: "tag-consistency",
        description: "Recipes with excessive tags (>10)",
        count: recipesWithManyTags.length,
        details: recipesWithManyTags.slice(0, 5)
      });
    }

    // Public recipes without tags
    const publicRecipesWithoutTags = await db.select({
      id: recipes.id,
      title: recipes.title
    })
    .from(recipes)
    .leftJoin(recipeTagRelations, eq(recipes.id, recipeTagRelations.recipeId))
    .where(and(
      eq(recipes.isPublic, true),
      isNull(recipeTagRelations.recipeId)
    ))
    .groupBy(recipes.id, recipes.title);

    if (publicRecipesWithoutTags.length > 0) {
      this.addIssue({
        type: "info",
        category: "tag-consistency",
        description: "Public recipes without any tags (may be harder to discover)",
        count: publicRecipesWithoutTags.length,
        details: publicRecipesWithoutTags.slice(0, 5)
      });
    }

    // Check for unused tags
    const unusedTags = await db.select({
      id: recipeTags.id,
      name: recipeTags.name
    })
    .from(recipeTags)
    .leftJoin(recipeTagRelations, eq(recipeTags.id, recipeTagRelations.tagId))
    .where(isNull(recipeTagRelations.tagId))
    .groupBy(recipeTags.id, recipeTags.name);

    if (unusedTags.length > 0) {
      this.addIssue({
        type: "info",
        category: "tag-consistency", 
        description: "Unused tags (not assigned to any recipes)",
        count: unusedTags.length,
        details: unusedTags.slice(0, 10).map(t => ({ id: t.id, name: t.name }))
      });
    }
  }

  async generateQualityMetrics() {
    logger.info("Generating recipe quality metrics");

    // Recipe completeness score
    const totalRecipes = await db.select().from(recipes).then(r => r.length);
    const recipesWithDescriptions = await db.select().from(recipes)
      .where(sql`${recipes.description} IS NOT NULL AND ${recipes.description} != ''`)
      .then(r => r.length);
    const recipesWithImages = await db.select()
      .from(recipes)
      .innerJoin(recipeImages, eq(recipes.id, recipeImages.recipeId))
      .then(r => new Set(r.map(row => row.recipes.id)).size);

    // Average ingredients and instructions per recipe
    const avgIngredients = await db.select({
      avg: sql<number>`CAST(COUNT(*) AS REAL) / CAST((SELECT COUNT(*) FROM ${recipes}) AS REAL)`
    }).from(recipeIngredients).then(r => r[0]?.avg || 0);

    const avgInstructions = await db.select({
      avg: sql<number>`CAST(COUNT(*) AS REAL) / CAST((SELECT COUNT(*) FROM ${recipes}) AS REAL)`
    }).from(recipeInstructions).then(r => r[0]?.avg || 0);

    // Tag coverage
    const recipesWithTags = await db.select()
      .from(recipes)
      .innerJoin(recipeTagRelations, eq(recipes.id, recipeTagRelations.recipeId))
      .then(r => new Set(r.map(row => row.recipes.id)).size);

    const qualityMetrics = {
      totalRecipes,
      completenessScore: Math.round((recipesWithDescriptions / totalRecipes) * 100),
      imagesCoverage: Math.round((recipesWithImages / totalRecipes) * 100),
      tagCoverage: Math.round((recipesWithTags / totalRecipes) * 100),
      avgIngredientsPerRecipe: Math.round(avgIngredients * 10) / 10,
      avgInstructionsPerRecipe: Math.round(avgInstructions * 10) / 10,
    };

    this.addIssue({
      type: "info",
      category: "quality-metrics",
      description: "Recipe data quality metrics",
      details: qualityMetrics
    });

    return qualityMetrics;
  }

  async runAllChecks() {
    logger.info("Starting comprehensive recipe data quality check");

    try {
      await this.checkRecipeCompleteness();
      await this.checkIngredientQuality();
      await this.checkInstructionQuality();
      await this.checkImageData();
      await this.checkTagConsistency();
      const metrics = await this.generateQualityMetrics();

      const summary = {
        total: this.issues.length,
        errors: this.issues.filter(i => i.type === "error").length,
        warnings: this.issues.filter(i => i.type === "warning").length,
        info: this.issues.filter(i => i.type === "info").length,
      };

      logger.info({ summary, metrics }, "Recipe data quality check completed");

      return {
        success: summary.errors === 0,
        issues: this.issues,
        summary,
        metrics
      };

    } catch (error) {
      logError(logger, "Recipe data quality check failed", error);
      throw error;
    }
  }
}

async function main() {
  console.log("🔍 Running Recipe Data Quality Check...\n");
  
  try {
    const checker = new RecipeDataQualityChecker();
    const result = await checker.runAllChecks();

    console.log("\n📊 Quality Check Results:");
    console.log(`   • Total Issues: ${result.summary.total}`);
    console.log(`   • Errors: ${result.summary.errors}`);
    console.log(`   • Warnings: ${result.summary.warnings}`);
    console.log(`   • Info: ${result.summary.info}`);

    if (result.metrics) {
      console.log("\n📈 Quality Metrics:");
      console.log(`   • Total Recipes: ${result.metrics.totalRecipes}`);
      console.log(`   • Completeness Score: ${result.metrics.completenessScore}%`);
      console.log(`   • Images Coverage: ${result.metrics.imagesCoverage}%`);
      console.log(`   • Tag Coverage: ${result.metrics.tagCoverage}%`);
      console.log(`   • Avg Ingredients/Recipe: ${result.metrics.avgIngredientsPerRecipe}`);
      console.log(`   • Avg Instructions/Recipe: ${result.metrics.avgInstructionsPerRecipe}`);
    }

    if (result.summary.errors > 0) {
      console.log("\n❌ Critical data quality issues found:");
      result.issues
        .filter(i => i.type === "error")
        .forEach(issue => {
          console.log(`   • ${issue.description} (${issue.count || "unknown"} items)`);
        });
    }

    if (result.summary.warnings > 0) {
      console.log("\n⚠️  Data quality warnings:");
      result.issues
        .filter(i => i.type === "warning")
        .forEach(issue => {
          console.log(`   • ${issue.description} (${issue.count || "unknown"} items)`);
        });
    }

    if (result.success) {
      console.log("\n✅ Recipe data quality check passed!");
    } else {
      console.log("\n❌ Recipe data quality check failed - please address the errors above");
      process.exit(1);
    }

  } catch (error) {
    console.error("❌ Quality check failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}