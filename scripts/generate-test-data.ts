#!/usr/bin/env tsx

/**
 * Test Data Generation Utility
 * Generates large amounts of test data for performance testing
 */

import { randomUUID } from "node:crypto";
import { db } from "@/db/index";
import { users } from "@/db/schema.base";
import { recipeIngredients, recipeInstructions, recipes, recipeTagRelations, recipeTags } from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { MeasurementUnit, RecipeDifficulty, TemperatureUnit, ViewMode } from "@/lib/types";
import { generateRecipeSlug } from "@/lib/utils/recipe-utils";

const logger = createOperationLogger("test-data-generation");

interface GenerationConfig {
  users: number;
  recipesPerUser: number;
  ingredientsPerRecipe: number;
  instructionsPerRecipe: number;
  tagsPerRecipe: number;
}

const DEFAULT_CONFIG: GenerationConfig = {
  users: 10,
  recipesPerUser: 20,
  ingredientsPerRecipe: 8,
  instructionsPerRecipe: 6,
  tagsPerRecipe: 3,
};

// Sample data pools for generation
const RECIPE_TITLES = [
  "Spicy Chicken Curry", "Classic Caesar Salad", "Chocolate Lava Cake", "Beef Stir Fry",
  "Margherita Pizza", "Lemon Garlic Salmon", "Vegetable Soup", "Banana Bread",
  "Thai Green Curry", "Greek Salad", "Chicken Parmesan", "Mushroom Risotto",
  "Fish Tacos", "Apple Pie", "Pasta Carbonara", "Grilled Vegetables",
  "Chicken Noodle Soup", "Chocolate Chip Cookies", "Beef Stew", "Caprese Salad"
];

const CUISINES = [
  "Italian", "Mexican", "Asian", "American", "Mediterranean", "Indian", 
  "French", "Thai", "Greek", "Japanese", "Chinese", "Spanish"
];

const DIFFICULTIES = [RecipeDifficulty.EASY, RecipeDifficulty.MEDIUM, RecipeDifficulty.HARD] as const;

const INGREDIENTS = [
  "Chicken breast", "Ground beef", "Salmon fillet", "Olive oil", "Garlic", "Onion",
  "Tomatoes", "Bell pepper", "Carrots", "Broccoli", "Spinach", "Mushrooms",
  "Rice", "Pasta", "Flour", "Eggs", "Milk", "Butter", "Salt", "Black pepper",
  "Basil", "Oregano", "Thyme", "Ginger", "Lemon", "Lime", "Cheese", "Yogurt"
];

const UNITS = ["cups", "tbsp", "tsp", "lbs", "oz", "cloves", "whole", "medium", "large"];

const INSTRUCTIONS = [
  "Preheat oven to 375°F",
  "Heat oil in a large skillet over medium heat",
  "Season with salt and pepper to taste",
  "Cook until golden brown, about 5 minutes",
  "Add vegetables and sauté until tender",
  "Stir in spices and cook for 1 minute",
  "Add liquid and bring to a boil",
  "Reduce heat and simmer until thickened",
  "Remove from heat and let cool",
  "Serve immediately with garnish"
];

function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUser(index: number) {
  return {
    id: `test-user-${index + 1}`,
    name: `Test User ${index + 1}`,
    email: `testuser${index + 1}@example.com`,
    emailVerified: Math.random() > 0.3,
    preferredTemperatureUnit: getRandomElement([TemperatureUnit.FAHRENHEIT, TemperatureUnit.CELSIUS]),
    preferredWeightUnit: getRandomElement([MeasurementUnit.IMPERIAL, MeasurementUnit.METRIC]),
    preferredVolumeUnit: getRandomElement([MeasurementUnit.IMPERIAL, MeasurementUnit.METRIC]), 
    recipeViewPreference: getRandomElement([ViewMode.CARDS, ViewMode.LIST, ViewMode.GRID]),
    image: null,
  };
}

function generateRecipe(userId: string, index: number) {
  const baseTitle = getRandomElement(RECIPE_TITLES);
  const variation = Math.random() > 0.7 ? ` (Variation ${index + 1})` : "";
  const title = `${baseTitle}${variation}`;
  
  return {
    id: `recipe-${userId}-${index + 1}`,
    slug: `${generateRecipeSlug(title)}-${userId.slice(-4)}-${index + 1}`,
    userId,
    title,
    description: `A delicious ${baseTitle.toLowerCase()} recipe perfect for any occasion. Generated for testing purposes.`,
    servings: getRandomNumber(2, 8),
    prepTimeMinutes: getRandomNumber(5, 45),
    cookTimeMinutes: getRandomNumber(10, 120),
    difficulty: getRandomElement(DIFFICULTIES),
    cuisine: getRandomElement(CUISINES),
    sourceUrl: Math.random() > 0.8 ? "https://example.com/recipe" : null,
    sourceName: Math.random() > 0.8 ? "Test Recipe Source" : null,
    isPublic: Math.random() > 0.4,
    isArchived: Math.random() > 0.9,
  };
}

function generateIngredient(recipeId: string, index: number) {
  return {
    id: `ingredient-${recipeId}-${index + 1}`,
    recipeId,
    name: getRandomElement(INGREDIENTS),
    amount: `${getRandomNumber(1, 4)}`,
    unit: getRandomElement(UNITS),
    notes: Math.random() > 0.7 ? "chopped" : "",
    groupName: Math.random() > 0.8 ? "Main ingredients" : null,
    sortOrder: index + 1,
    isOptional: Math.random() > 0.9,
  };
}

function generateInstruction(recipeId: string, index: number) {
  return {
    id: `instruction-${recipeId}-${index + 1}`,
    recipeId,
    stepNumber: index + 1,
    instruction: getRandomElement(INSTRUCTIONS),
    timeMinutes: Math.random() > 0.6 ? getRandomNumber(1, 15) : null,
    temperature: Math.random() > 0.8 ? "medium heat" : null,
    notes: Math.random() > 0.9 ? "Be careful not to overcook" : null,
    groupName: null,
  };
}

async function generateTestData(config: GenerationConfig = DEFAULT_CONFIG) {
  logger.info(config, "Starting test data generation");

  try {
    // Generate users
    logger.info("Generating users");
    const testUsers = Array.from({ length: config.users }, (_, i) => generateUser(i));
    await db.insert(users).values(testUsers);
    logger.info({ count: testUsers.length }, "Generated users");

    // Get existing tags for random assignment
    const existingTags = await db.select({ id: recipeTags.id }).from(recipeTags);
    const tagIds = existingTags.map(t => t.id);
    
    if (tagIds.length === 0) {
      logger.warn("No tags found, skipping tag assignments");
    }

    let totalRecipes = 0;
    let totalIngredients = 0;
    let totalInstructions = 0;
    let totalTagRelations = 0;

    // Generate recipes for each user
    for (const user of testUsers) {
      logger.info({ userId: user.id }, `Generating recipes for user ${user.name}`);
      
      const userRecipes = Array.from({ length: config.recipesPerUser }, (_, i) => 
        generateRecipe(user.id, i)
      );
      
      // Insert recipes in batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < userRecipes.length; i += batchSize) {
        const batch = userRecipes.slice(i, i + batchSize);
        await db.insert(recipes).values(batch);
        totalRecipes += batch.length;
      }

      // Generate ingredients and instructions for each recipe
      for (const recipe of userRecipes) {
        // Generate ingredients
        const recipeIngredientData = Array.from(
          { length: getRandomNumber(3, config.ingredientsPerRecipe) }, 
          (_, i) => generateIngredient(recipe.id, i)
        );
        await db.insert(recipeIngredients).values(recipeIngredientData);
        totalIngredients += recipeIngredientData.length;

        // Generate instructions
        const recipeInstructionData = Array.from(
          { length: getRandomNumber(3, config.instructionsPerRecipe) }, 
          (_, i) => generateInstruction(recipe.id, i)
        );
        await db.insert(recipeInstructions).values(recipeInstructionData);
        totalInstructions += recipeInstructionData.length;

        // Generate tag relationships (if tags exist)
        if (tagIds.length > 0) {
          const numTags = Math.min(getRandomNumber(1, config.tagsPerRecipe), tagIds.length);
          const selectedTags = [...tagIds].sort(() => 0.5 - Math.random()).slice(0, numTags);
          
          const tagRelations = selectedTags.map(tagId => ({
            recipeId: recipe.id,
            tagId,
          }));
          
          if (tagRelations.length > 0) {
            await db.insert(recipeTagRelations).values(tagRelations);
            totalTagRelations += tagRelations.length;
          }
        }
      }
    }

    const finalCounts = {
      users: testUsers.length,
      recipes: totalRecipes,
      ingredients: totalIngredients,
      instructions: totalInstructions,
      tagRelations: totalTagRelations,
    };

    logger.info(finalCounts, "Test data generation completed successfully");

    console.log("\n🎉 Test Data Generation Complete!");
    console.log("📊 Generated Data:");
    console.log(`   • Users: ${finalCounts.users}`);
    console.log(`   • Recipes: ${finalCounts.recipes}`);
    console.log(`   • Ingredients: ${finalCounts.ingredients}`);
    console.log(`   • Instructions: ${finalCounts.instructions}`);
    console.log(`   • Tag Relations: ${finalCounts.tagRelations}`);
    console.log("\n⚡ Ready for performance testing!");

  } catch (error) {
    logError(logger, "Test data generation failed", error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  let config = DEFAULT_CONFIG;

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = parseInt(args[i + 1], 10);
    
    if (key && !Number.isNaN(value) && key in config) {
      (config as any)[key] = value;
    }
  }

  console.log("🚀 Generating test data with configuration:");
  console.log(config);
  
  try {
    await generateTestData(config);
    process.exit(0);
  } catch (error) {
    console.error("❌ Generation failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}