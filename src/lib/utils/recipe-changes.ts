import { RecipeChangeType } from "@/lib/types";
import type {
  ComparableIngredient,
  ComparableInstruction,
  ComparableRecipeFields,
  RecipeChangeInput,
  RecipeChangeSummary,
} from "@/lib/types/recipe-types";

const DETAIL_FIELDS: (keyof ComparableRecipeFields)[] = [
  "description",
  "servings",
  "prepTimeMinutes",
  "cookTimeMinutes",
  "difficulty",
  "cuisine",
  "sourceUrl",
  "sourceName",
  "swatch",
  "isPublic",
];

const CHANGE_LABELS: Record<RecipeChangeType, string> = {
  [RecipeChangeType.TITLE]: "the name",
  [RecipeChangeType.INGREDIENTS]: "the ingredients",
  [RecipeChangeType.INSTRUCTIONS]: "the method",
  [RecipeChangeType.METADATA]: "the details",
  [RecipeChangeType.IMAGES]: "the photos",
  [RecipeChangeType.MAJOR]: "the recipe",
};

function normalize(value: string | number | boolean | null | undefined) {
  if (value === undefined || value === "") return null;
  return typeof value === "string" ? value.trim() || null : value;
}

function ingredientKey(ingredient: ComparableIngredient): string {
  return JSON.stringify([
    normalize(ingredient.name),
    normalize(ingredient.amount),
    normalize(ingredient.unit),
    normalize(ingredient.notes),
    normalize(ingredient.groupName),
    Boolean(ingredient.isOptional),
  ]);
}

function instructionKey(instruction: ComparableInstruction): string {
  return JSON.stringify([
    normalize(instruction.instruction),
    normalize(instruction.timeMinutes),
    normalize(instruction.temperature),
    normalize(instruction.notes),
    normalize(instruction.groupName),
  ]);
}

function listChanged<T>(
  before: T[],
  after: T[] | null,
  key: (item: T) => string,
): boolean {
  if (after === null) return false;
  if (before.length !== after.length) return true;
  return before.some((item, index) => key(item) !== key(after[index]));
}

function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

export function describeRecipeChanges(
  input: RecipeChangeInput,
): RecipeChangeSummary | null {
  const changed: RecipeChangeType[] = [];

  if (
    input.after.title !== undefined &&
    normalize(input.after.title) !== normalize(input.before.title)
  ) {
    changed.push(RecipeChangeType.TITLE);
  }
  if (
    listChanged(input.ingredientsBefore, input.ingredientsAfter, ingredientKey)
  ) {
    changed.push(RecipeChangeType.INGREDIENTS);
  }
  if (
    listChanged(
      input.instructionsBefore,
      input.instructionsAfter,
      instructionKey,
    )
  ) {
    changed.push(RecipeChangeType.INSTRUCTIONS);
  }
  if (
    DETAIL_FIELDS.some(
      (field) =>
        normalize(input.after[field]) !== normalize(input.before[field]),
    )
  ) {
    changed.push(RecipeChangeType.METADATA);
  }

  if (changed.length === 0) return null;

  const description = `Updated ${joinLabels(changed.map((type) => CHANGE_LABELS[type]))}`;
  return {
    type: changed.length === 1 ? changed[0] : RecipeChangeType.MAJOR,
    description,
  };
}
