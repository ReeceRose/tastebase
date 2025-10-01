import type { RecipeDisplayInfo } from "@/lib/types";
import type {
  CreateRecipeData,
  RecipeFormData,
  RecipeIngredient,
  RecipeInstruction,
} from "@/lib/types/recipe-types";
import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";

export function formatTime(minutes: number): string {
  if (minutes === 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hr" : `${hours} hrs`;
  }

  const hourLabel = hours === 1 ? "hr" : "hrs";
  return `${hours} ${hourLabel} ${remainingMinutes} min`;
}

export function formatServings(servings?: number): string {
  if (!servings) return "Servings not specified";
  return servings === 1 ? "1 serving" : `${servings} servings`;
}

export function getDifficultyColor(difficulty?: string): string {
  switch (difficulty) {
    case "easy":
      return "text-green-600 dark:text-green-400";
    case "medium":
      return "text-yellow-600 dark:text-yellow-400";
    case "hard":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}

export function getDifficultyLabel(difficulty?: string): string {
  const level = RECIPE_CONSTANTS.DIFFICULTY_LEVELS.find(
    (d) => d.value === difficulty,
  );
  return level?.label || "Not specified";
}

export function parseIngredientAmount(amountString: string): {
  amount?: number;
  unit?: string;
} {
  if (!amountString.trim()) return {};

  // Common fraction patterns
  const fractionMap: Record<string, number> = {
    "1/2": 0.5,
    "1/3": 0.33,
    "2/3": 0.67,
    "1/4": 0.25,
    "3/4": 0.75,
    "1/8": 0.125,
    "3/8": 0.375,
    "5/8": 0.625,
    "7/8": 0.875,
  };

  // Try to parse number + unit pattern (including fractions and mixed numbers)
  const match = amountString.match(
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(.*)$/,
  );
  if (!match) return { unit: amountString };

  const [, amountPart, unitPart] = match;

  // Handle mixed numbers (e.g., "1 1/2")
  if (amountPart.includes(" ")) {
    const [whole, fraction] = amountPart.split(" ");
    const wholeNum = parseInt(whole, 10);
    const fractionNum = fractionMap[fraction] || parseFraction(fraction) || 0;
    return {
      amount: wholeNum + fractionNum,
      unit: unitPart.trim() || undefined,
    };
  }

  // Handle simple fractions
  if (amountPart.includes("/")) {
    const fractionValue = fractionMap[amountPart] || parseFraction(amountPart);
    if (fractionValue) {
      return {
        amount: fractionValue,
        unit: unitPart.trim() || undefined,
      };
    }
  }

  // Handle decimal/integer numbers
  const amount = parseFloat(amountPart);
  if (!Number.isNaN(amount)) {
    return {
      amount,
      unit: unitPart.trim() || undefined,
    };
  }

  return { unit: amountString };
}

function parseFraction(fraction: string): number | null {
  const parts = fraction.split("/");
  if (parts.length === 2) {
    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);
    if (
      !Number.isNaN(numerator) &&
      !Number.isNaN(denominator) &&
      denominator !== 0
    ) {
      return numerator / denominator;
    }
  }
  return null;
}

export function formatIngredientAmount(ingredient: RecipeIngredient): string {
  const parts: string[] = [];

  if (ingredient.amount) {
    // Amount is stored as string, so just use it directly
    parts.push(ingredient.amount);
  }

  if (ingredient.unit) {
    parts.push(ingredient.unit);
  }

  parts.push(ingredient.name);

  if (ingredient.notes) {
    parts.push(`(${ingredient.notes})`);
  }

  if (ingredient.isOptional) {
    parts.push("(optional)");
  }

  return parts.join(" ");
}

export function groupIngredientsByGroup(
  ingredients: RecipeIngredient[],
): Record<string, RecipeIngredient[]> {
  return ingredients
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .reduce(
      (groups, ingredient) => {
        const groupName = ingredient.groupName || "Ingredients";
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(ingredient);
        return groups;
      },
      {} as Record<string, RecipeIngredient[]>,
    );
}

export function groupInstructionsByGroup(
  instructions: RecipeInstruction[],
): Record<string, RecipeInstruction[]> {
  return instructions
    .sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0))
    .reduce(
      (groups, instruction) => {
        const groupName = instruction.groupName || "Instructions";
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(instruction);
        return groups;
      },
      {} as Record<string, RecipeInstruction[]>,
    );
}

export function generateRecipeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

export function extractRecipeKeywords(recipe: RecipeDisplayInfo): string[] {
  const keywords = new Set<string>();

  // Extract from title
  if (recipe.title) {
    recipe.title
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        if (word.length > 2) keywords.add(word);
      });
  }

  // Extract from description
  if (recipe.description) {
    recipe.description
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        if (word.length > 3) keywords.add(word);
      });
  }

  // Add cuisine
  if (recipe.cuisine) {
    keywords.add(recipe.cuisine.toLowerCase());
  }

  return Array.from(keywords).slice(0, 10);
}

export function validateRecipeFormData(data: RecipeFormData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push("Recipe title is required");
  } else if (
    data.title.length > RECIPE_CONSTANTS.VALIDATION_LIMITS.TITLE.MAX_LENGTH
  ) {
    errors.push(
      `Title must be ${RECIPE_CONSTANTS.VALIDATION_LIMITS.TITLE.MAX_LENGTH} characters or less`,
    );
  }

  if (
    data.description &&
    data.description.length >
      RECIPE_CONSTANTS.VALIDATION_LIMITS.DESCRIPTION.MAX_LENGTH
  ) {
    errors.push(
      `Description must be ${RECIPE_CONSTANTS.VALIDATION_LIMITS.DESCRIPTION.MAX_LENGTH} characters or less`,
    );
  }

  if (
    data.servings &&
    (data.servings < RECIPE_CONSTANTS.SERVING_LIMITS.MIN_SERVINGS ||
      data.servings > RECIPE_CONSTANTS.SERVING_LIMITS.MAX_SERVINGS)
  ) {
    errors.push(
      `Servings must be between ${RECIPE_CONSTANTS.SERVING_LIMITS.MIN_SERVINGS} and ${RECIPE_CONSTANTS.SERVING_LIMITS.MAX_SERVINGS}`,
    );
  }

  if (
    data.prepTimeMinutes &&
    (data.prepTimeMinutes < 0 ||
      data.prepTimeMinutes > RECIPE_CONSTANTS.TIME_LIMITS.MAX_PREP_TIME)
  ) {
    errors.push(
      `Prep time must be between 0 and ${RECIPE_CONSTANTS.TIME_LIMITS.MAX_PREP_TIME} minutes`,
    );
  }

  if (
    data.cookTimeMinutes &&
    (data.cookTimeMinutes < 0 ||
      data.cookTimeMinutes > RECIPE_CONSTANTS.TIME_LIMITS.MAX_COOK_TIME)
  ) {
    errors.push(
      `Cook time must be between 0 and ${RECIPE_CONSTANTS.TIME_LIMITS.MAX_COOK_TIME} minutes`,
    );
  }

  if (
    data.difficulty &&
    !RECIPE_CONSTANTS.DIFFICULTY_LEVELS.some((d) => d.value === data.difficulty)
  ) {
    errors.push("Invalid difficulty level");
  }

  if (data.ingredients?.length === 0) {
    errors.push("At least one ingredient is required");
  }

  if (data.instructions?.length === 0) {
    errors.push("At least one instruction is required");
  }

  return { isValid: errors.length === 0, errors };
}

export function transformFormDataToCreateData(formData: RecipeFormData) {
  return {
    title: formData.title,
    description: formData.description,
    servings: formData.servings,
    prepTimeMinutes: formData.prepTimeMinutes,
    cookTimeMinutes: formData.cookTimeMinutes,
    difficulty: formData.difficulty,
    cuisine: formData.cuisine,
    sourceUrl: formData.sourceUrl,
    sourceName: formData.sourceName,
    isPublic: formData.isPublic,
    ingredients: formData.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount ?? undefined,
      unit: ingredient.unit ?? undefined,
      notes: ingredient.notes ?? undefined,
      groupName: ingredient.groupName ?? undefined,
      isOptional: ingredient.isOptional ?? false,
    })),
    instructions: formData.instructions.map((instruction) => ({
      instruction: instruction.instruction,
      timeMinutes: instruction.timeMinutes ?? undefined,
      temperature: instruction.temperature ?? undefined,
      notes: instruction.notes ?? undefined,
      groupName: instruction.groupName ?? undefined,
    })),
    tags: formData.tags,
  };
}

export function transformCreateDataToFormData(
  createData: CreateRecipeData,
): RecipeFormData {
  return {
    title: createData.title,
    description: createData.description,
    servings: createData.servings,
    prepTimeMinutes: createData.prepTimeMinutes,
    cookTimeMinutes: createData.cookTimeMinutes,
    difficulty: createData.difficulty,
    cuisine: createData.cuisine,
    sourceUrl: createData.sourceUrl,
    sourceName: createData.sourceName,
    isPublic: createData.isPublic ?? false,
    ingredients: createData.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount ?? undefined,
      unit: ingredient.unit ?? undefined,
      notes: ingredient.notes ?? undefined,
      groupName: ingredient.groupName ?? undefined,
      isOptional: ingredient.isOptional,
    })),
    instructions: createData.instructions.map((instruction) => ({
      instruction: instruction.instruction,
      timeMinutes: instruction.timeMinutes ?? undefined,
      temperature: instruction.temperature ?? undefined,
      notes: instruction.notes ?? undefined,
      groupName: instruction.groupName ?? undefined,
    })),
    tags: createData.tags,
  };
}

export function transformFormDataToUpdateData(
  formData: RecipeFormData,
  recipeId: string,
) {
  return {
    id: recipeId,
    title: formData.title,
    description: formData.description,
    servings: formData.servings,
    prepTimeMinutes: formData.prepTimeMinutes,
    cookTimeMinutes: formData.cookTimeMinutes,
    difficulty: formData.difficulty,
    cuisine: formData.cuisine,
    sourceUrl: formData.sourceUrl,
    sourceName: formData.sourceName,
    isPublic: formData.isPublic,
    ingredients: formData.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount ?? undefined,
      unit: ingredient.unit ?? undefined,
      notes: ingredient.notes ?? undefined,
      groupName: ingredient.groupName ?? undefined,
      isOptional: ingredient.isOptional ?? false,
    })),
    instructions: formData.instructions.map((instruction) => ({
      instruction: instruction.instruction,
      timeMinutes: instruction.timeMinutes ?? undefined,
      temperature: instruction.temperature ?? undefined,
      notes: instruction.notes ?? undefined,
      groupName: instruction.groupName ?? undefined,
    })),
    tags: formData.tags,
  };
}
