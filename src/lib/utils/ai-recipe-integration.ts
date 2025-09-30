import type { RecipeParsingResult } from "@/lib/types";
import { RecipeDifficulty } from "@/lib/types";
import type {
  RecipeFormData,
  RecipeFormIngredient,
  RecipeFormInstruction,
} from "@/lib/types/recipe-types";
import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";

export function mapParsedRecipeToFormData(
  parsedRecipe: RecipeParsingResult,
  existingFormData?: Partial<RecipeFormData>,
): Partial<RecipeFormData> {
  const formData: Partial<RecipeFormData> = {
    ...existingFormData,
  };

  // Basic recipe information
  if (parsedRecipe.title) {
    formData.title = parsedRecipe.title;
  }

  if (parsedRecipe.description) {
    formData.description = parsedRecipe.description;
  }

  if (parsedRecipe.servings) {
    formData.servings = Math.max(
      RECIPE_CONSTANTS.SERVING_LIMITS.MIN_SERVINGS,
      Math.min(
        RECIPE_CONSTANTS.SERVING_LIMITS.MAX_SERVINGS,
        parsedRecipe.servings,
      ),
    );
  }

  if (parsedRecipe.prepTime) {
    formData.prepTimeMinutes = Math.max(0, parsedRecipe.prepTime);
  }

  if (parsedRecipe.cookTime) {
    formData.cookTimeMinutes = Math.max(0, parsedRecipe.cookTime);
  }

  if (parsedRecipe.difficulty) {
    const difficultyMap: Record<string, RecipeDifficulty> = {
      easy: RecipeDifficulty.EASY,
      medium: RecipeDifficulty.MEDIUM,
      hard: RecipeDifficulty.HARD,
    };
    formData.difficulty =
      difficultyMap[parsedRecipe.difficulty] || RecipeDifficulty.MEDIUM;
  }

  if (parsedRecipe.cuisine) {
    formData.cuisine = parsedRecipe.cuisine;
  }

  // Convert ingredients
  if (parsedRecipe.ingredients && parsedRecipe.ingredients.length > 0) {
    formData.ingredients = parsedRecipe.ingredients.map(
      (ingredient, _index) => ({
        name: ingredient.name,
        amount: ingredient.quantity || undefined,
        unit: ingredient.unit || "",
        notes: "",
        groupName: "",
        isOptional: false,
      }),
    );

    // Ensure at least one ingredient exists
    if (formData.ingredients.length === 0) {
      formData.ingredients = [
        {
          name: "",
          amount: undefined,
          unit: "",
          notes: "",
          groupName: "",
          isOptional: false,
        },
      ];
    }
  }

  // Convert instructions
  if (parsedRecipe.instructions && parsedRecipe.instructions.length > 0) {
    formData.instructions = parsedRecipe.instructions.map(
      (instruction, _index) => ({
        instruction: instruction.instruction,
        timeMinutes: undefined,
        temperature: "",
        notes: "",
        groupName: "",
      }),
    );

    // Ensure at least one instruction exists
    if (formData.instructions.length === 0) {
      formData.instructions = [
        {
          instruction: "",
          timeMinutes: undefined,
          temperature: "",
          notes: "",
          groupName: "",
        },
      ];
    }
  }

  // Convert tags
  if (parsedRecipe.tags && parsedRecipe.tags.length > 0) {
    formData.tags = parsedRecipe.tags.filter((tag) => tag.trim().length > 0);
  }

  return formData;
}

export function validateParsedRecipe(recipe: RecipeParsingResult): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for missing essential data
  if (!recipe.title) {
    warnings.push("No recipe title found");
    suggestions.push("Consider adding a descriptive title");
  }

  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    warnings.push("No ingredients found");
    suggestions.push("Ingredients list is essential for a complete recipe");
  }

  if (!recipe.instructions || recipe.instructions.length === 0) {
    warnings.push("No cooking instructions found");
    suggestions.push("Step-by-step instructions help users follow the recipe");
  }

  // Check for incomplete ingredient data
  if (recipe.ingredients) {
    const missingQuantities = recipe.ingredients.filter(
      (ing) => !ing.quantity,
    ).length;
    if (missingQuantities > 0) {
      suggestions.push(
        `${missingQuantities} ingredients missing quantities - consider adding measurements`,
      );
    }
  }

  // Check for timing information
  if (!recipe.prepTime && !recipe.cookTime) {
    suggestions.push("Consider adding prep and cook times for better planning");
  }

  // Check for serving information
  if (!recipe.servings) {
    suggestions.push("Adding serving size helps with meal planning");
  }

  // Check for difficulty and cuisine
  if (!recipe.difficulty) {
    suggestions.push(
      "Adding difficulty level helps users choose appropriate recipes",
    );
  }

  if (!recipe.cuisine) {
    suggestions.push("Adding cuisine type helps with recipe organization");
  }

  const isValid = warnings.length === 0;

  return {
    isValid,
    warnings,
    suggestions,
  };
}

export function mergeRecipeData(
  existingData: Partial<RecipeFormData>,
  parsedData: RecipeParsingResult,
  options: {
    overwriteExisting?: boolean;
    preserveUserEdits?: boolean;
  } = {},
): Partial<RecipeFormData> {
  const { overwriteExisting = false, preserveUserEdits = true } = options;

  const merged: Partial<RecipeFormData> = { ...existingData };
  const parsed = mapParsedRecipeToFormData(parsedData);

  // Helper function to decide whether to update a field
  const shouldUpdate = (
    _fieldName: keyof RecipeFormData,
    existingValue: unknown,
    newValue: unknown,
  ) => {
    if (!newValue) return false;
    if (!existingValue) return true;
    if (overwriteExisting) return true;
    if (preserveUserEdits && existingValue !== "") return false;
    return true;
  };

  // Merge basic fields
  Object.keys(parsed).forEach((key) => {
    const fieldKey = key as keyof RecipeFormData;
    const existingValue = merged[fieldKey];
    const newValue = parsed[fieldKey];

    if (fieldKey === "ingredients" || fieldKey === "instructions") {
      // Handle arrays specially
      if (Array.isArray(newValue) && newValue.length > 0) {
        if (
          !existingValue ||
          (Array.isArray(existingValue) && existingValue.length === 0)
        ) {
          if (fieldKey === "ingredients") {
            merged.ingredients = newValue as RecipeFormIngredient[];
          } else if (fieldKey === "instructions") {
            merged.instructions = newValue as RecipeFormInstruction[];
          }
        } else if (overwriteExisting) {
          if (fieldKey === "ingredients") {
            merged.ingredients = newValue as RecipeFormIngredient[];
          } else if (fieldKey === "instructions") {
            merged.instructions = newValue as RecipeFormInstruction[];
          }
        }
      }
    } else if (fieldKey === "tags") {
      // Merge tags
      if (Array.isArray(newValue) && newValue.length > 0) {
        const existingTags = Array.isArray(existingValue) ? existingValue : [];
        const combinedTags = [...existingTags, ...newValue];
        merged[fieldKey] = [
          ...new Set(combinedTags),
        ] as RecipeFormData[typeof fieldKey]; // Remove duplicates
      }
    } else if (shouldUpdate(fieldKey, existingValue, newValue)) {
      (merged as Record<string, unknown>)[fieldKey] = newValue;
    }
  });

  return merged;
}

export function formatRecipeForAIContext(
  formData: Partial<RecipeFormData>,
): string {
  let context = "";

  if (formData.title) {
    context += `Title: ${formData.title}\n`;
  }

  if (formData.description) {
    context += `Description: ${formData.description}\n`;
  }

  if (
    formData.servings ||
    formData.prepTimeMinutes ||
    formData.cookTimeMinutes
  ) {
    context += "\nDetails:\n";
    if (formData.servings) context += `Servings: ${formData.servings}\n`;
    if (formData.prepTimeMinutes)
      context += `Prep Time: ${formData.prepTimeMinutes} minutes\n`;
    if (formData.cookTimeMinutes)
      context += `Cook Time: ${formData.cookTimeMinutes} minutes\n`;
  }

  if (formData.ingredients && formData.ingredients.length > 0) {
    context += "\nIngredients:\n";
    formData.ingredients.forEach((ingredient, index) => {
      const amount = ingredient.amount ? `${ingredient.amount} ` : "";
      const unit = ingredient.unit ? `${ingredient.unit} ` : "";
      context += `${index + 1}. ${amount}${unit}${ingredient.name}\n`;
    });
  }

  if (formData.instructions && formData.instructions.length > 0) {
    context += "\nInstructions:\n";
    formData.instructions.forEach((instruction, index) => {
      context += `${index + 1}. ${instruction.instruction}\n`;
    });
  }

  if (formData.tags && formData.tags.length > 0) {
    context += `\nTags: ${formData.tags.join(", ")}\n`;
  }

  return context.trim();
}
