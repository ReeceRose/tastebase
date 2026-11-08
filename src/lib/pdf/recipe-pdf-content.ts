import { pdfText } from "@/lib/pdf/recipe-pdf-text";
import { PhotoRole, RecipeDifficulty } from "@/lib/types";
import type {
  RecipePdfContent,
  RecipePdfFact,
  RecipePdfIngredientGroup,
  RecipePdfStepGroup,
  RecipePdfUnits,
} from "@/lib/types/recipe-pdf-types";
import type {
  RecipeImage,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";
import {
  convertTemperaturesInText,
  displayIngredientAmount,
} from "@/lib/utils/ingredient-scaling";
import { photosForStep, photosWithRole } from "@/lib/utils/photo-tags";
import {
  groupIngredientsByGroup,
  groupInstructionsByGroup,
} from "@/lib/utils/recipe-utils";
import { resolveSwatch } from "@/lib/utils/swatches";
import { formatTotalTime } from "@/lib/utils/time-formatting";
import { formatTemperatureForDisplay } from "@/lib/utils/unit-conversions";

const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  [RecipeDifficulty.EASY]: "Easy",
  [RecipeDifficulty.MEDIUM]: "Medium",
  [RecipeDifficulty.HARD]: "Takes effort",
};

const WEB_URL = /^https?:\/\//i;

function buildFacts(recipe: RecipeWithRelations): RecipePdfFact[] {
  return [
    { label: "Prep", value: formatTotalTime(recipe.prepTimeMinutes) },
    { label: "Cook", value: formatTotalTime(recipe.cookTimeMinutes) },
    {
      label: "Serves",
      value: recipe.servings ? String(recipe.servings) : null,
    },
    {
      label: "Difficulty",
      value: recipe.difficulty ? DIFFICULTY_LABELS[recipe.difficulty] : null,
    },
  ].filter((fact): fact is RecipePdfFact => Boolean(fact.value));
}

function buildIngredientGroups(
  recipe: RecipeWithRelations,
  units: RecipePdfUnits,
  includedRecipeIds: Set<string>,
): RecipePdfIngredientGroup[] {
  const groups = Object.entries(
    groupIngredientsByGroup([...recipe.ingredients]),
  );
  return groups.map(([groupName, items]) => ({
    name: groups.length > 1 ? pdfText(groupName) : null,
    items: items.map((ingredient) => {
      const { amount, unit, name } = displayIngredientAmount(
        ingredient.amount,
        ingredient.unit,
        1,
        units.measurementSystem,
        ingredient.name,
      );
      const linked = ingredient.linkedRecipe;
      const details = [
        ingredient.notes ? pdfText(ingredient.notes) : null,
        ingredient.isOptional ? "optional" : null,
        linked && includedRecipeIds.has(linked.id)
          ? `see ${pdfText(linked.title)}`
          : null,
      ].filter(Boolean);
      return {
        id: ingredient.id,
        quantity: pdfText([amount, unit].filter(Boolean).join(" ")),
        name: pdfText(name),
        detail: details.length > 0 ? details.join(", ") : null,
      };
    }),
  }));
}

function buildStepGroups(
  recipe: RecipeWithRelations,
  units: RecipePdfUnits,
): RecipePdfStepGroup[] {
  const groups = Object.entries(
    groupInstructionsByGroup([...recipe.instructions]),
  );
  let stepIndex = 0;
  return groups.map(([groupName, steps]) => ({
    name: groups.length > 1 ? pdfText(groupName) : null,
    steps: steps.map((step) => {
      stepIndex += 1;
      const temperature = step.temperature
        ? formatTemperatureForDisplay(step.temperature, units.temperatureUnit)
        : null;
      return {
        id: step.id,
        number: stepIndex,
        text: pdfText(
          convertTemperaturesInText(step.instruction, units.temperatureUnit),
        ),
        facts: [formatTotalTime(step.timeMinutes), temperature]
          .filter((fact): fact is string => Boolean(fact))
          .map(pdfText),
        notes: step.notes ? pdfText(step.notes) : null,
        photos: photosForStep(recipe.images, step.stepNumber).map(
          (image) => image.filename,
        ),
      };
    }),
  }));
}

function filenames(images: RecipeImage[]): string[] {
  return images.map((image) => image.filename);
}

export function buildRecipePdfContent(
  recipe: RecipeWithRelations,
  units: RecipePdfUnits,
  includedRecipeIds: Set<string> = new Set(),
): RecipePdfContent {
  const stepCount = recipe.instructions.length;
  const total = formatTotalTime(
    (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0),
  );
  const mainPhoto =
    recipe.images.find((image) => image.isHero) ?? recipe.images[0] ?? null;
  const ingredientPhotos = photosWithRole(recipe.images, PhotoRole.INGREDIENTS);
  const placed = new Set([
    mainPhoto?.id,
    ...ingredientPhotos.map((image) => image.id),
    ...recipe.images
      .filter(
        (image) =>
          image.photoRole === PhotoRole.STEP &&
          recipe.instructions.some((step) =>
            image.stepNumbers.includes(step.stepNumber),
          ),
      )
      .map((image) => image.id),
  ]);

  return {
    id: recipe.id,
    title: pdfText(recipe.title),
    description: recipe.description ? pdfText(recipe.description) : null,
    author: pdfText(recipe.author.name),
    swatch: resolveSwatch(recipe.id, recipe.swatch),
    facts: buildFacts(recipe),
    methodSummary:
      [
        stepCount > 0
          ? `${stepCount} ${stepCount === 1 ? "step" : "steps"}`
          : null,
        total,
      ]
        .filter(Boolean)
        .join(" · ") || null,
    ingredientGroups: buildIngredientGroups(recipe, units, includedRecipeIds),
    stepGroups: buildStepGroups(recipe, units),
    sourceName: recipe.sourceName ? pdfText(recipe.sourceName) : null,
    sourceUrl:
      recipe.sourceUrl && WEB_URL.test(recipe.sourceUrl)
        ? recipe.sourceUrl
        : null,
    mainPhoto: mainPhoto?.filename ?? null,
    ingredientPhotos: filenames(ingredientPhotos),
    otherPhotos: filenames(
      recipe.images.filter((image) => !placed.has(image.id)),
    ),
  };
}

export function recipePdfPhotoFilenames(content: RecipePdfContent): string[] {
  return [
    ...(content.mainPhoto ? [content.mainPhoto] : []),
    ...content.ingredientPhotos,
    ...content.stepGroups.flatMap((group) =>
      group.steps.flatMap((step) => step.photos),
    ),
    ...content.otherPhotos,
  ];
}

export function splitIngredientColumns(
  groups: RecipePdfIngredientGroup[],
): RecipePdfIngredientGroup[][] {
  const lines = groups.reduce(
    (sum, group) => sum + group.items.length + (group.name ? 1 : 0),
    0,
  );
  const target = Math.ceil(lines / 2);
  const left: RecipePdfIngredientGroup[] = [];
  const right: RecipePdfIngredientGroup[] = [];
  let used = 0;

  for (const group of groups) {
    const header = group.name ? 1 : 0;
    const room = target - used - header;
    if (room <= 0) {
      right.push(group);
      continue;
    }
    const kept = group.items.slice(0, room);
    const rest = group.items.slice(room);
    left.push({ name: group.name, items: kept });
    used += header + kept.length;
    if (rest.length > 0) right.push({ name: null, items: rest });
  }

  return [left, right];
}
