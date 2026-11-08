import { parseIngredientList } from "@/lib/import/ingredient-list";
import {
  extractTemperature,
  extractTimeMinutes,
  stripListMarker,
} from "@/lib/import/recipe-text-helpers";
import { RecipeDifficulty, type RecipeSwatch } from "@/lib/types";
import type {
  CleanedEditorValues,
  EditorIngredient,
  EditorInstruction,
  RecipeEditorValues,
  RecipeFormData,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";
import {
  newStepKey,
  photoTagsForSave,
  photoTagsFromRecipe,
} from "@/lib/utils/photo-tags";
import { RECIPE_CONSTANTS } from "@/lib/utils/recipe-constants";

export function emptyIngredient(): EditorIngredient {
  return {
    name: "",
    amount: "",
    unit: "",
    notes: "",
    groupName: "",
    isOptional: false,
    linkedRecipeId: null,
    linkedRecipeTitle: null,
  };
}

export function emptyInstruction(): EditorInstruction {
  return {
    key: newStepKey(),
    instruction: "",
    timeMinutes: undefined,
    temperature: "",
    notes: "",
    groupName: "",
  };
}

export function emptyEditorValues(isPublic: boolean): RecipeEditorValues {
  return {
    title: "",
    description: "",
    servings: RECIPE_CONSTANTS.SERVING_LIMITS.DEFAULT_SERVINGS,
    prepTimeMinutes: undefined,
    cookTimeMinutes: undefined,
    difficulty: RecipeDifficulty.EASY,
    cuisine: "",
    sourceUrl: "",
    sourceName: "",
    videoUrl: "",
    isPublic,
    ingredients: [emptyIngredient(), emptyIngredient(), emptyIngredient()],
    instructions: [emptyInstruction(), emptyInstruction()],
    tags: [],
    photoTags: [],
    swatch: null,
  };
}

function positiveOrUndefined(
  value: number | null | undefined,
): number | undefined {
  return value && value > 0 ? value : undefined;
}

export function editorValuesFromImport(
  data: Partial<RecipeFormData>,
  isPublic: boolean,
): RecipeEditorValues {
  const base = emptyEditorValues(isPublic);
  return {
    ...base,
    ...data,
    prepTimeMinutes: positiveOrUndefined(data.prepTimeMinutes),
    cookTimeMinutes: positiveOrUndefined(data.cookTimeMinutes),
    isPublic,
    ingredients:
      data.ingredients && data.ingredients.length > 0
        ? data.ingredients
        : base.ingredients,
    instructions:
      data.instructions && data.instructions.length > 0
        ? data.instructions.map((instruction) => ({
            ...instruction,
            key: newStepKey(),
          }))
        : base.instructions,
    tags: data.tags ?? [],
    photoTags: [],
    swatch: null,
  };
}

export function editorValuesFromRecipe(
  recipe: RecipeWithRelations,
): RecipeEditorValues {
  return {
    title: recipe.title,
    description: recipe.description ?? "",
    servings: recipe.servings ?? undefined,
    prepTimeMinutes: positiveOrUndefined(recipe.prepTimeMinutes),
    cookTimeMinutes: positiveOrUndefined(recipe.cookTimeMinutes),
    difficulty: recipe.difficulty ?? undefined,
    cuisine: recipe.cuisine ?? "",
    sourceUrl: recipe.sourceUrl ?? "",
    sourceName: recipe.sourceName ?? "",
    videoUrl: recipe.videoUrl ?? "",
    isPublic: recipe.isPublic,
    ingredients: [...recipe.ingredients]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((ingredient) => ({
        name: ingredient.name,
        amount: ingredient.amount ?? "",
        unit: ingredient.unit ?? "",
        notes: ingredient.notes ?? "",
        groupName: ingredient.groupName ?? "",
        isOptional: ingredient.isOptional,
        linkedRecipeId: ingredient.linkedRecipe?.id ?? null,
        linkedRecipeTitle: ingredient.linkedRecipe?.title ?? null,
      })),
    instructions: [...recipe.instructions]
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((instruction) => ({
        key: instruction.id,
        instruction: instruction.instruction,
        timeMinutes: instruction.timeMinutes ?? undefined,
        temperature: instruction.temperature ?? "",
        notes: instruction.notes ?? "",
        groupName: instruction.groupName ?? "",
      })),
    tags: recipe.tags.map((tag) => tag.name),
    photoTags: photoTagsFromRecipe(recipe.images, recipe.instructions),
    swatch: (recipe.swatch as RecipeSwatch | null) ?? null,
  };
}

function trimOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function finiteOrUndefined(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function cleanEditorValues(
  values: RecipeEditorValues,
): CleanedEditorValues {
  const ingredientRows: number[] = [];
  const ingredients = values.ingredients.flatMap((ingredient, index) => {
    const name = ingredient.name.trim();
    const amount = trimOrUndefined(ingredient.amount);
    const unit = trimOrUndefined(ingredient.unit);
    if (!name && !amount && !unit) return [];
    ingredientRows.push(index);
    return [
      {
        name,
        amount,
        unit,
        notes: trimOrUndefined(ingredient.notes),
        groupName: trimOrUndefined(ingredient.groupName),
        isOptional: ingredient.isOptional,
        linkedRecipeId: ingredient.linkedRecipeId ?? null,
      },
    ];
  });

  const instructionRows: number[] = [];
  const instructions = values.instructions.flatMap((instruction, index) => {
    const text = instruction.instruction.trim();
    if (!text) return [];
    instructionRows.push(index);
    return [
      {
        key: instruction.key,
        instruction: text,
        timeMinutes: finiteOrUndefined(instruction.timeMinutes),
        temperature: trimOrUndefined(instruction.temperature),
        notes: trimOrUndefined(instruction.notes),
        groupName: trimOrUndefined(instruction.groupName),
      },
    ];
  });

  return {
    values: {
      ...values,
      title: values.title.trim(),
      description: trimOrUndefined(values.description),
      servings: finiteOrUndefined(values.servings),
      prepTimeMinutes: finiteOrUndefined(values.prepTimeMinutes),
      cookTimeMinutes: finiteOrUndefined(values.cookTimeMinutes),
      cuisine: trimOrUndefined(values.cuisine),
      sourceUrl: trimOrUndefined(values.sourceUrl),
      sourceName: trimOrUndefined(values.sourceName),
      videoUrl: trimOrUndefined(values.videoUrl),
      ingredients,
      instructions,
      tags: (values.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    },
    ingredientRows,
    instructionRows,
    photoTags: photoTagsForSave(values.photoTags, instructions),
  };
}

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parsePastedIngredients(text: string): EditorIngredient[] {
  return parseIngredientList(lines(text)).map((parsed) => ({
    name: parsed.name,
    amount: parsed.quantity ?? "",
    unit: parsed.unit ?? "",
    notes: (parsed.notes ?? "").slice(0, 200),
    groupName: parsed.groupName ?? "",
    isOptional: parsed.isOptional,
  }));
}

export function linkSearchFromIngredient(name: string): string {
  return name
    .replace(/\brecipes?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePastedSteps(text: string): EditorInstruction[] {
  return lines(text).map((line) => {
    const instruction = stripListMarker(line).replace(/^\d+[.)]\s*/, "");
    return {
      ...emptyInstruction(),
      instruction,
      timeMinutes: extractTimeMinutes(instruction) ?? undefined,
      temperature: extractTemperature(instruction) ?? "",
    };
  });
}

const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export function mimeTypeFor(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? "image/jpeg";
}
