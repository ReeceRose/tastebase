/**
 * Recipe input normalization utilities
 * Converts user input to canonical imperial units before database storage
 */

import {
  convertToCanonical,
  normalizeUnit,
  parseAmount,
} from "@/lib/utils/unit-conversions";

export interface IngredientInput {
  name: string;
  amount: string;
  unit: string;
  notes?: string;
  groupName?: string;
  sortOrder: number;
  isOptional?: boolean;
}

export interface InstructionInput {
  stepNumber: number;
  instruction: string;
  timeMinutes?: number;
  temperature?: string;
  notes?: string;
  groupName?: string;
}

export interface NormalizedIngredient {
  name: string;
  amount: string;
  unit: string;
  notes?: string;
  groupName?: string;
  sortOrder: number;
  isOptional: boolean;
}

export interface NormalizedInstruction {
  stepNumber: number;
  instruction: string;
  timeMinutes?: number;
  temperature?: string;
  notes?: string;
  groupName?: string;
}

/**
 * Normalize ingredient input to canonical imperial units
 */
export function normalizeIngredientInput(
  ingredient: IngredientInput,
): NormalizedIngredient {
  // Handle special cases where amount is not numeric
  if (
    !ingredient.amount ||
    ingredient.amount.toLowerCase().includes("to taste") ||
    ingredient.amount.toLowerCase().includes("for serving") ||
    ingredient.amount.toLowerCase().includes("as needed")
  ) {
    return {
      name: ingredient.name.trim(),
      amount: ingredient.amount.trim(),
      unit: normalizeUnit(ingredient.unit || ""),
      notes: ingredient.notes?.trim() || undefined,
      groupName: ingredient.groupName?.trim() || undefined,
      sortOrder: ingredient.sortOrder,
      isOptional: ingredient.isOptional || false,
    };
  }

  // Parse and convert numeric amounts
  const numericAmount = parseAmount(ingredient.amount);

  if (numericAmount === 0) {
    return {
      name: ingredient.name.trim(),
      amount: ingredient.amount.trim(),
      unit: normalizeUnit(ingredient.unit || ""),
      notes: ingredient.notes?.trim() || undefined,
      groupName: ingredient.groupName?.trim() || undefined,
      sortOrder: ingredient.sortOrder,
      isOptional: ingredient.isOptional || false,
    };
  }

  // Convert to canonical units
  const canonical = convertToCanonical(numericAmount, ingredient.unit || "");

  return {
    name: ingredient.name.trim(),
    amount: canonical.amount.toString(),
    unit: canonical.unit,
    notes: ingredient.notes?.trim() || undefined,
    groupName: ingredient.groupName?.trim() || undefined,
    sortOrder: ingredient.sortOrder,
    isOptional: ingredient.isOptional || false,
  };
}

/**
 * Normalize instruction input, especially temperature values
 */
export function normalizeInstructionInput(
  instruction: InstructionInput,
): NormalizedInstruction {
  let normalizedTemp = instruction.temperature?.trim();

  // Convert temperature to canonical Fahrenheit if it's numeric
  if (normalizedTemp) {
    // Extract numeric temperature from strings like "350°F", "175°C", "medium heat"
    const tempMatch = normalizedTemp.match(/(\d+)°?\s*([CF])?/i);

    if (tempMatch) {
      const temp = parseFloat(tempMatch[1]);
      const unit = tempMatch[2]?.toUpperCase();

      if (unit === "C") {
        // Convert Celsius to Fahrenheit
        const fahrenheit = (temp * 9) / 5 + 32;
        normalizedTemp = `${Math.round(fahrenheit)}°F`;
      } else if (unit === "F" || !unit) {
        // Already Fahrenheit or assume Fahrenheit
        normalizedTemp = `${Math.round(temp)}°F`;
      }
    }
    // For non-numeric temperatures like "medium heat", keep as-is
  }

  return {
    stepNumber: instruction.stepNumber,
    instruction: instruction.instruction.trim(),
    timeMinutes: instruction.timeMinutes || undefined,
    temperature: normalizedTemp || undefined,
    notes: instruction.notes?.trim() || undefined,
    groupName: instruction.groupName?.trim() || undefined,
  };
}

/**
 * Normalize a complete recipe's ingredients and instructions
 */
export function normalizeRecipeInputs(
  ingredients: IngredientInput[],
  instructions: InstructionInput[],
): {
  ingredients: NormalizedIngredient[];
  instructions: NormalizedInstruction[];
} {
  return {
    ingredients: ingredients.map(normalizeIngredientInput),
    instructions: instructions.map(normalizeInstructionInput),
  };
}

/**
 * Validate ingredient input before normalization
 */
export function validateIngredientInput(ingredient: IngredientInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!ingredient.name?.trim()) {
    errors.push("Ingredient name is required");
  }

  if (!ingredient.amount?.trim()) {
    errors.push("Amount is required");
  } else {
    // Check if amount is parseable (unless it's a special phrase)
    const specialPhrases = ["to taste", "for serving", "as needed"];
    const isSpecialPhrase = specialPhrases.some((phrase) =>
      ingredient.amount.toLowerCase().includes(phrase),
    );

    if (!isSpecialPhrase) {
      const numericAmount = parseAmount(ingredient.amount);
      if (numericAmount <= 0) {
        errors.push(
          "Amount must be a positive number or special phrase like 'to taste'",
        );
      }
    }
  }

  if (ingredient.sortOrder < 1) {
    errors.push("Sort order must be positive");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate instruction input before normalization
 */
export function validateInstructionInput(instruction: InstructionInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!instruction.instruction?.trim()) {
    errors.push("Instruction text is required");
  }

  if (instruction.stepNumber < 1) {
    errors.push("Step number must be positive");
  }

  if (instruction.timeMinutes !== undefined && instruction.timeMinutes < 0) {
    errors.push("Time cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to detect if user input needs unit conversion
 */
export function needsConversion(amount: string, unit: string): boolean {
  const numericAmount = parseAmount(amount);
  if (numericAmount <= 0) return false;

  const canonical = convertToCanonical(numericAmount, unit);
  return (
    canonical.amount !== numericAmount || canonical.unit !== normalizeUnit(unit)
  );
}

/**
 * Preview what the conversion will look like for user feedback
 */
export function previewConversion(
  amount: string,
  unit: string,
): {
  original: string;
  converted: string;
  needsConversion: boolean;
} {
  const numericAmount = parseAmount(amount);

  if (numericAmount <= 0) {
    return {
      original: `${amount} ${unit}`.trim(),
      converted: `${amount} ${unit}`.trim(),
      needsConversion: false,
    };
  }

  const canonical = convertToCanonical(numericAmount, unit);
  const originalNormalized = `${amount} ${normalizeUnit(unit)}`.trim();
  const convertedNormalized = `${canonical.amount} ${canonical.unit}`.trim();

  return {
    original: originalNormalized,
    converted: convertedNormalized,
    needsConversion: originalNormalized !== convertedNormalized,
  };
}
