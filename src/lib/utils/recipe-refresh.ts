import type { RecipeImportResult } from "@/lib/types/import-types";
import type { RecipeNutrition } from "@/lib/types/nutrition-types";
import {
  type AlignedPair,
  type RecipeRefreshPlan,
  RefreshChangeKind,
  type RefreshDetailValues,
  type RefreshFieldChange,
  type RefreshLineChange,
  RefreshSection,
} from "@/lib/types/recipe-refresh-types";
import type {
  EditorIngredient,
  EditorInstruction,
  EditorPhotoTag,
  RecipeEditorValues,
} from "@/lib/types/recipe-types";
import { alignLists } from "@/lib/utils/list-alignment";
import {
  cleanNutrition,
  emptyNutrition,
  formatNutrient,
  NUTRIENTS,
} from "@/lib/utils/nutrition";
import { newStepKey } from "@/lib/utils/photo-tags";
import { mapImportResultToFormData } from "@/lib/utils/recipe-import-mapping";

type DetailField = keyof RefreshDetailValues;

const DETAIL_LABELS: Record<DetailField, string> = {
  title: "Name",
  description: "Description",
  servings: "Serves",
  prepTimeMinutes: "Prep time",
  cookTimeMinutes: "Cook time",
  difficulty: "Difficulty",
  cuisine: "Cuisine",
};

const MINUTE_FIELDS = new Set<DetailField>([
  "prepTimeMinutes",
  "cookTimeMinutes",
]);

function clean(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function showDetail(
  field: DetailField,
  value: string | number | null | undefined,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  return MINUTE_FIELDS.has(field) ? `${value} min` : String(value);
}

export function ingredientText(ingredient: EditorIngredient): string {
  const main = [ingredient.amount, ingredient.unit, ingredient.name]
    .map(clean)
    .filter(Boolean)
    .join(" ");
  const notes = clean(ingredient.notes);
  return notes ? `${main}, ${notes}` : main;
}

function hasIngredient(ingredient: EditorIngredient): boolean {
  return Boolean(
    clean(ingredient.name) ||
      clean(ingredient.amount) ||
      clean(ingredient.unit),
  );
}

// Fields the source leaves out are left alone rather than cleared, so a
// missing cook time on the page doesn't wipe the one in Tastebase.
function importedDetails(result: RecipeImportResult): RefreshDetailValues {
  const { recipe } = result;
  const form = mapImportResultToFormData(result);
  const values: RefreshDetailValues = {};
  if (recipe.title) values.title = recipe.title;
  if (recipe.description) values.description = recipe.description;
  if (recipe.servings !== null) values.servings = form.servings;
  if (recipe.prepTime) values.prepTimeMinutes = recipe.prepTime;
  if (recipe.cookTime) values.cookTimeMinutes = recipe.cookTime;
  if (recipe.difficulty) values.difficulty = recipe.difficulty;
  if (recipe.cuisine) values.cuisine = recipe.cuisine;
  return values;
}

function detailChanges(
  current: RecipeEditorValues,
  imported: RefreshDetailValues,
): { changes: RefreshFieldChange[]; values: RefreshDetailValues } {
  const changes: RefreshFieldChange[] = [];
  const values: RefreshDetailValues = {};
  for (const field of Object.keys(DETAIL_LABELS) as DetailField[]) {
    const next = imported[field];
    if (next === undefined) continue;
    const before = showDetail(field, current[field]);
    const after = showDetail(field, next);
    if (clean(before) === clean(after)) continue;
    changes.push({ label: DETAIL_LABELS[field], before, after });
    Object.assign(values, { [field]: next });
  }
  return { changes, values };
}

function lineChanges(
  pairs: AlignedPair[],
  before: string[],
  after: string[],
): RefreshLineChange[] {
  return pairs.flatMap((pair): RefreshLineChange[] => {
    const old = pair.before === null ? null : before[pair.before];
    const next = pair.after === null ? null : after[pair.after];
    const id = `${pair.before ?? "none"}-${pair.after ?? "none"}`;
    if (old === null) {
      return [{ id, kind: RefreshChangeKind.ADDED, before: null, after: next }];
    }
    if (next === null) {
      return [
        { id, kind: RefreshChangeKind.REMOVED, before: old, after: null },
      ];
    }
    return clean(old) === clean(next)
      ? []
      : [{ id, kind: RefreshChangeKind.CHANGED, before: old, after: next }];
  });
}

// Ingredients that still match keep the recipe each one links to.
function mergeIngredients(
  current: EditorIngredient[],
  imported: EditorIngredient[],
): { merged: EditorIngredient[]; changes: RefreshLineChange[] } {
  const before = current.map(ingredientText);
  const after = imported.map(ingredientText);
  const pairs = alignLists(
    current.map((ingredient) => clean(ingredient.name)),
    imported.map((ingredient) => clean(ingredient.name)),
  );
  const merged: EditorIngredient[] = imported.map((ingredient) => ({
    ...ingredient,
    linkedRecipeId: null,
    linkedRecipeTitle: null,
  }));
  for (const pair of pairs) {
    if (pair.before === null || pair.after === null) continue;
    const old = current[pair.before];
    merged[pair.after].linkedRecipeId = old.linkedRecipeId ?? null;
    merged[pair.after].linkedRecipeTitle = old.linkedRecipeTitle ?? null;
  }
  return { merged, changes: lineChanges(pairs, before, after) };
}

// Steps that still match keep their key, so the photos and videos tagged on
// them stay put, and keep any note added in Tastebase.
function mergeInstructions(
  current: EditorInstruction[],
  imported: EditorInstruction[],
  photoTags: EditorPhotoTag[],
): {
  merged: EditorInstruction[];
  changes: RefreshLineChange[];
  detachedMedia: number;
} {
  const before = current.map((step) => clean(step.instruction));
  const after = imported.map((step) => clean(step.instruction));
  const pairs = alignLists(before, after);
  const merged: EditorInstruction[] = imported.map((step) => ({
    ...step,
    key: newStepKey(),
  }));
  for (const pair of pairs) {
    if (pair.before === null || pair.after === null) continue;
    const old = current[pair.before];
    const next = merged[pair.after];
    merged[pair.after] = {
      ...next,
      key: old.key,
      notes: old.notes,
      timeMinutes: next.timeMinutes ?? old.timeMinutes,
      temperature: next.temperature || old.temperature,
    };
  }

  const keptKeys = new Set(merged.map((step) => step.key));
  const stepTagged = photoTags.filter((tag) => tag.stepKey !== null);
  const media = new Set(stepTagged.map((tag) => tag.photo));
  const detachedMedia = [...media].filter((photo) =>
    stepTagged
      .filter((tag) => tag.photo === photo)
      .every((tag) => tag.stepKey === null || !keptKeys.has(tag.stepKey)),
  ).length;

  return { merged, changes: lineChanges(pairs, before, after), detachedMedia };
}

function nutritionChanges(
  current: RecipeNutrition,
  imported: RecipeNutrition | null,
): RefreshFieldChange[] {
  if (!imported) return [];
  const old = cleanNutrition(current) ?? emptyNutrition();
  const changes: RefreshFieldChange[] = [];
  if (clean(old.servingSize) !== clean(imported.servingSize)) {
    changes.push({
      label: "Serving size",
      before: old.servingSize,
      after: imported.servingSize,
    });
  }
  for (const nutrient of NUTRIENTS) {
    const before = formatNutrient(old[nutrient.key], nutrient.unit, true);
    const after = formatNutrient(imported[nutrient.key], nutrient.unit, true);
    if (before !== after) {
      changes.push({ label: nutrient.label, before, after });
    }
  }
  return changes;
}

export function buildRefreshPlan(
  current: RecipeEditorValues,
  result: RecipeImportResult,
): RecipeRefreshPlan {
  const form = mapImportResultToFormData(result);
  const details = detailChanges(current, importedDetails(result));
  const importedIngredients = form.ingredients ?? [];
  const importedSteps = form.instructions ?? [];
  const ingredients = mergeIngredients(
    current.ingredients.filter(hasIngredient),
    importedIngredients.map((ingredient) => ({
      ...ingredient,
      linkedRecipeId: null,
      linkedRecipeTitle: null,
    })),
  );
  const method = mergeInstructions(
    current.instructions.filter((step) => clean(step.instruction)),
    importedSteps.map((step) => ({ ...step, key: "" })),
    current.photoTags,
  );

  return {
    details: details.changes,
    detailValues: details.values,
    // A page the importer couldn't read a list from isn't a reason to
    // delete the one already here.
    ingredients: importedIngredients.length > 0 ? ingredients.changes : [],
    mergedIngredients: ingredients.merged,
    method: importedSteps.length > 0 ? method.changes : [],
    mergedInstructions: method.merged,
    detachedMedia: importedSteps.length > 0 ? method.detachedMedia : 0,
    nutrition: nutritionChanges(current.nutrition, result.recipe.nutrition),
    importedNutrition: result.recipe.nutrition,
  };
}

export function changedSections(plan: RecipeRefreshPlan): RefreshSection[] {
  return [
    plan.details.length > 0 ? RefreshSection.DETAILS : null,
    plan.ingredients.length > 0 ? RefreshSection.INGREDIENTS : null,
    plan.method.length > 0 ? RefreshSection.METHOD : null,
    plan.nutrition.length > 0 ? RefreshSection.NUTRITION : null,
  ].filter((section): section is RefreshSection => section !== null);
}

export function applyRefreshPlan(
  current: RecipeEditorValues,
  plan: RecipeRefreshPlan,
  sections: RefreshSection[],
): RecipeEditorValues {
  const chosen = new Set(sections);
  const next: RecipeEditorValues = { ...current };
  if (chosen.has(RefreshSection.DETAILS)) {
    Object.assign(next, plan.detailValues);
  }
  if (chosen.has(RefreshSection.INGREDIENTS) && plan.mergedIngredients.length) {
    next.ingredients = plan.mergedIngredients;
  }
  if (chosen.has(RefreshSection.METHOD) && plan.mergedInstructions.length) {
    next.instructions = plan.mergedInstructions;
    const keys = new Set(plan.mergedInstructions.map((step) => step.key));
    next.photoTags = current.photoTags.filter(
      (tag) => tag.stepKey === null || keys.has(tag.stepKey),
    );
  }
  if (chosen.has(RefreshSection.NUTRITION) && plan.importedNutrition) {
    next.nutrition = plan.importedNutrition;
  }
  return next;
}
