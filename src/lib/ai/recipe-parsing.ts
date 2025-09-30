import { processTask } from "@/lib/ai/service";
import { createOperationLogger } from "@/lib/logging/logger";
import type {
  AIProviderConfig,
  AIResponse,
  AITaskRequest,
  RecipeParsingResult,
} from "@/lib/types";

const logger = createOperationLogger("recipe-parsing");

export async function parseRecipeText(
  userId: string,
  recipeText: string,
  config: AIProviderConfig,
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
  userPreferences?: {
    temperatureUnit?: string;
    measurementSystem?: string;
  },
): Promise<AIResponse<RecipeParsingResult>> {
  logger.info({ userId, provider: config.provider }, "Starting recipe parsing");

  const request: AITaskRequest = {
    taskType: "recipe-parsing",
    userId,
    input: recipeText.trim(),
    options,
  };

  return (await processTask(
    request,
    config,
    userPreferences,
  )) as AIResponse<RecipeParsingResult>;
}

export async function parseRecipeUrl(
  userId: string,
  url: string,
  config: AIProviderConfig,
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<AIResponse<RecipeParsingResult>> {
  // For now, we'll just pass the URL as text
  // In the future, we could implement web scraping here
  const request: AITaskRequest = {
    taskType: "recipe-parsing",
    userId,
    input: `Please extract recipe information from this URL: ${url}`,
    options,
  };

  return (await processTask(
    request,
    config,
  )) as AIResponse<RecipeParsingResult>;
}

export async function enhanceRecipe(
  userId: string,
  existingRecipe: Partial<RecipeParsingResult>,
  config: AIProviderConfig,
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<AIResponse<RecipeParsingResult>> {
  const recipeText = formatRecipeForEnhancement(existingRecipe);

  const request: AITaskRequest = {
    taskType: "recipe-parsing",
    userId,
    input: `Please enhance and improve this recipe by filling in missing details, improving instructions, and suggesting better organization:

${recipeText}

Focus on:
- Adding missing cooking times or serving sizes
- Improving instruction clarity
- Suggesting appropriate tags or cuisine type
- Estimating difficulty level`,
    options,
  };

  return (await processTask(
    request,
    config,
  )) as AIResponse<RecipeParsingResult>;
}

export async function suggestImprovements(
  userId: string,
  recipe: RecipeParsingResult,
  config: AIProviderConfig,
): Promise<AIResponse<string>> {
  const recipeText = formatRecipeForEnhancement(recipe);

  const request: AITaskRequest = {
    taskType: "chat-conversation",
    userId,
    input: `Please analyze this recipe and suggest improvements:

${recipeText}

Provide suggestions for:
- Ingredient improvements or substitutions
- Cooking technique enhancements
- Flavor enhancement tips
- Presentation suggestions
- Nutritional improvements`,
  };

  return (await processTask(request, config)) as AIResponse<string>;
}

function formatRecipeForEnhancement(
  recipe: Partial<RecipeParsingResult>,
): string {
  let formatted = "";

  if (recipe.title) {
    formatted += `Title: ${recipe.title}\n\n`;
  }

  if (recipe.description) {
    formatted += `Description: ${recipe.description}\n\n`;
  }

  if (recipe.servings) {
    formatted += `Servings: ${recipe.servings}\n`;
  }

  if (recipe.prepTime) {
    formatted += `Prep Time: ${recipe.prepTime} minutes\n`;
  }

  if (recipe.cookTime) {
    formatted += `Cook Time: ${recipe.cookTime} minutes\n`;
  }

  if (recipe.difficulty) {
    formatted += `Difficulty: ${recipe.difficulty}\n`;
  }

  if (recipe.cuisine) {
    formatted += `Cuisine: ${recipe.cuisine}\n`;
  }

  formatted += "\n";

  if (recipe.ingredients && recipe.ingredients.length > 0) {
    formatted += "Ingredients:\n";
    recipe.ingredients.forEach((ingredient, index) => {
      const quantity = ingredient.quantity ? `${ingredient.quantity} ` : "";
      const unit = ingredient.unit ? `${ingredient.unit} ` : "";
      formatted += `${index + 1}. ${quantity}${unit}${ingredient.name}\n`;
    });
    formatted += "\n";
  }

  if (recipe.instructions && recipe.instructions.length > 0) {
    formatted += "Instructions:\n";
    recipe.instructions.forEach((instruction) => {
      formatted += `${instruction.step}. ${instruction.instruction}\n`;
    });
    formatted += "\n";
  }

  if (recipe.tags && recipe.tags.length > 0) {
    formatted += `Tags: ${recipe.tags.join(", ")}\n`;
  }

  return formatted.trim();
}

export function validateRecipeData(data: RecipeParsingResult): {
  isValid: boolean;
  missingFields: string[];
  suggestions: string[];
} {
  const missingFields: string[] = [];
  const suggestions: string[] = [];

  if (!data.title) {
    missingFields.push("title");
    suggestions.push("Add a descriptive title for the recipe");
  }

  if (!data.ingredients || data.ingredients.length === 0) {
    missingFields.push("ingredients");
    suggestions.push("Add ingredients list with quantities");
  }

  if (!data.instructions || data.instructions.length === 0) {
    missingFields.push("instructions");
    suggestions.push("Add step-by-step cooking instructions");
  }

  if (!data.servings) {
    suggestions.push("Consider adding serving size information");
  }

  if (!data.prepTime && !data.cookTime) {
    suggestions.push("Add timing information for better planning");
  }

  if (!data.difficulty) {
    suggestions.push(
      "Add difficulty level to help users choose appropriate recipes",
    );
  }

  const isValid = missingFields.length === 0;

  return {
    isValid,
    missingFields,
    suggestions,
  };
}
