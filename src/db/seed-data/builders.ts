import type {
  SeedIngredient,
  SeedIngredientGroup,
  SeedInstruction,
} from "@/lib/types/seed-types";

export const SERIOUS_EATS = "Serious Eats";

// Ingredient helper: amount, unit, name, then optional prep notes
export function ingredient(
  amount: string | null,
  unit: string | null,
  name: string,
  notes: string | null = null,
): SeedIngredient {
  return { amount, unit, name, notes, isOptional: false };
}

export function optional(
  amount: string | null,
  unit: string | null,
  name: string,
  notes: string | null = null,
): SeedIngredient {
  return { amount, unit, name, notes, isOptional: true };
}

export function group(
  name: string | null,
  items: SeedIngredient[],
): SeedIngredientGroup {
  return { name, items };
}

export function step(
  instruction: string,
  timeMinutes: number | null = null,
  temperature: string | null = null,
): SeedInstruction {
  return { instruction, timeMinutes, temperature };
}
