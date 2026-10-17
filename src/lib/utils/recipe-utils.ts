import type {
  RecipeIngredient,
  RecipeInstruction,
} from "@/lib/types/recipe-types";

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
