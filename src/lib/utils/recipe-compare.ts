import { type MeasurementUnit, RecipeDifficulty } from "@/lib/types";
import type {
  ComparableAmount,
  CompareCell,
  CompareFact,
  CompareRecipe,
  CompareRow,
} from "@/lib/types/recipe-compare-types";
import type {
  RecipeIngredient,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";
import { gramsPerCup } from "@/lib/utils/ingredient-densities";
import { ingredientKeys } from "@/lib/utils/ingredient-matching";
import { findMeasureNote } from "@/lib/utils/ingredient-notes";
import { displayIngredientAmount } from "@/lib/utils/ingredient-scaling";
import {
  parseQuantity,
  parseRange,
  QUANTITY_PATTERN,
} from "@/lib/utils/quantity-parsing";
import { formatTotalTime } from "@/lib/utils/time-formatting";
import { normalizeUnit } from "@/lib/utils/unit-conversions";

export const MAX_COMPARE_RECIPES = 4;
const DIFFERENT_SPREAD = 1.25;
const SAME_SPREAD = 1.1;

const GRAMS: Record<string, number> = { g: 1, kg: 1000, oz: 28.35, lb: 453.6 };
const MILLILITRES: Record<string, number> = {
  tsp: 5,
  tbsp: 15,
  "fl oz": 30,
  cup: 250,
  pt: 500,
  qt: 1000,
  gal: 4000,
  ml: 1,
  l: 1000,
};

const LEADING_RANGE = new RegExp(
  `^(${QUANTITY_PATTERN})\\s*(?:-|–|to)\\s*(${QUANTITY_PATTERN})`,
  "i",
);
const LEADING_SINGLE = new RegExp(`^(${QUANTITY_PATTERN})`);

const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  [RecipeDifficulty.EASY]: "Easy",
  [RecipeDifficulty.MEDIUM]: "Medium",
  [RecipeDifficulty.HARD]: "Takes effort",
};

export function parseCompareSlugs(raw: string | string[] | null): string[] {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const slugs = values
    .flatMap((value) => value.split(","))
    .map((slug) => slug.trim())
    .filter(Boolean);
  return [...new Set(slugs)].slice(0, MAX_COMPARE_RECIPES);
}

export function compareHref(slugs: string[]): string {
  if (slugs.length === 0) return "/recipes/compare";
  return `/recipes/compare?r=${slugs.map(encodeURIComponent).join(",")}`;
}

function leadingQuantity(amount: string | null): number | null {
  const text = amount?.trim() ?? "";
  if (!text) return null;
  const range = text.match(LEADING_RANGE);
  if (range) {
    const span = parseRange(`${range[1]}-${range[2]}`);
    return span ? (span.low + span.high) / 2 : null;
  }
  const single = text.match(LEADING_SINGLE);
  return single ? parseQuantity(single[1]) : null;
}

function authorWeight(name: string): number | null {
  const weight = findMeasureNote(name)?.measures.find(
    (measure) => GRAMS[normalizeUnit(measure.unit)],
  );
  return weight ? weight.quantity * GRAMS[normalizeUnit(weight.unit)] : null;
}

export function comparableAmount(
  amount: string | null,
  unit: string | null,
  name: string,
  factor: number,
): ComparableAmount | null {
  const quantity = leadingQuantity(amount);
  if (quantity === null || quantity <= 0) return null;
  const scaled = quantity * factor;
  const normalized = normalizeUnit(unit ?? "");

  if (GRAMS[normalized]) {
    return {
      weight: scaled * GRAMS[normalized],
      volume: null,
      count: null,
      countUnit: "",
    };
  }
  if (MILLILITRES[normalized]) {
    const millilitres = scaled * MILLILITRES[normalized];
    const cupWeight = gramsPerCup(name);
    const noteWeight = authorWeight(name);
    return {
      weight: cupWeight
        ? (millilitres / MILLILITRES.cup) * cupWeight
        : noteWeight !== null
          ? noteWeight * factor
          : null,
      volume: millilitres,
      count: null,
      countUnit: "",
    };
  }
  return {
    weight: null,
    volume: null,
    count: scaled,
    countUnit: ingredientKeys(normalized).strict,
  };
}

function rowValues(cells: CompareCell[]): number[] | null {
  const amounts = cells.map((cell) => cell.amount);
  if (amounts.some((amount) => amount === null)) return null;
  const known = amounts as ComparableAmount[];
  if (known.every((amount) => amount.weight !== null)) {
    return known.map((amount) => amount.weight as number);
  }
  if (known.every((amount) => amount.volume !== null)) {
    return known.map((amount) => amount.volume as number);
  }
  const unit = known[0].countUnit;
  if (
    known.every((amount) => amount.count !== null && amount.countUnit === unit)
  ) {
    return known.map((amount) => amount.count as number);
  }
  return null;
}

function finishRow(row: CompareRow): CompareRow {
  const filled = row.cells.filter((cell): cell is CompareCell => cell !== null);
  const inAll = filled.length === row.cells.length;
  const values = filled.length > 1 ? rowValues(filled) : null;
  const largest = values ? Math.max(...values) : 0;
  const smallest = values ? Math.min(...values) : 0;
  const spread = values && smallest > 0 ? largest / smallest : null;
  const sameText =
    new Set(filled.map((cell) => cell.quantity.toLowerCase())).size === 1;

  let index = 0;
  const cells = row.cells.map((cell) => {
    if (!cell) return null;
    const value = values ? values[index] : null;
    index += 1;
    return {
      ...cell,
      share: value !== null && largest > 0 ? value / largest : null,
    };
  });

  return {
    ...row,
    cells,
    inAll,
    spread,
    agrees: inAll && (spread !== null ? spread < SAME_SPREAD : sameText),
  };
}

function cellFor(
  ingredient: RecipeIngredient,
  label: string,
  factor: number,
  system: MeasurementUnit | null,
): CompareCell {
  const shown = displayIngredientAmount(
    ingredient.amount,
    ingredient.unit,
    factor,
    system,
    ingredient.name,
  );
  const quantity = [shown.amount, shown.unit].filter(Boolean).join(" ");
  const writtenName =
    shown.name.trim().toLowerCase() === label.toLowerCase()
      ? null
      : shown.name.trim();
  const detail = [
    writtenName,
    ingredient.notes?.trim() || null,
    ingredient.isOptional ? "optional" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    ingredient,
    quantity,
    detail: detail || null,
    amount: comparableAmount(
      ingredient.amount,
      ingredient.unit,
      ingredient.name,
      factor,
    ),
    share: null,
  };
}

export function buildCompareRows(
  recipes: RecipeWithRelations[],
  factors: number[],
  system: MeasurementUnit | null,
): CompareRow[] {
  const rows: CompareRow[] = [];

  recipes.forEach((recipe, column) => {
    for (const ingredient of recipe.ingredients) {
      if (!ingredient.name?.trim()) continue;
      const keys = ingredientKeys(ingredient.name);
      const open = rows.filter((row) => row.cells[column] === null);
      const row =
        open.find((candidate) => candidate.strict === keys.strict) ??
        open.find((candidate) => candidate.loose === keys.loose);
      const target: CompareRow = row ?? {
        id: `${column}-${ingredient.id}`,
        label: keys.label,
        strict: keys.strict,
        loose: keys.loose,
        cells: recipes.map(() => null),
        inAll: false,
        spread: null,
        agrees: false,
      };
      if (!row) rows.push(target);
      target.cells[column] = cellFor(
        ingredient,
        target.label,
        factors[column] ?? 1,
        system,
      );
    }
  });

  return rows.map(finishRow);
}

export function spreadCaption(spread: number | null): string | null {
  if (spread === null || spread < DIFFERENT_SPREAD) return null;
  const times =
    spread < 2 ? (Math.round(spread * 10) / 10).toFixed(1) : Math.round(spread);
  return `Up to ${times}× more`;
}

function cookedText(count: number): string {
  if (count === 0) return "Never";
  if (count === 1) return "Once";
  return `${count} times`;
}

function fact(
  label: string,
  values: (string | null)[],
  numbers: (number | null)[] | null,
  bestLabel: string | null,
  lowerIsBetter: boolean,
): CompareFact {
  const known = (numbers ?? []).filter(
    (value): value is number => value !== null,
  );
  const best =
    known.length > 1 && new Set(known).size > 1
      ? lowerIsBetter
        ? Math.min(...known)
        : Math.max(...known)
      : null;

  return {
    label,
    bestLabel: best === null ? null : bestLabel,
    cells: values.map((value, index) => ({
      value,
      best: best !== null && numbers?.[index] === best,
    })),
  };
}

function minutesOrNull(minutes: number): number | null {
  return minutes > 0 ? minutes : null;
}

export function compareFacts(items: CompareRecipe[]): CompareFact[] {
  const recipes = items.map((item) => item.recipe);
  const totals = recipes.map((recipe) =>
    minutesOrNull(
      (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0),
    ),
  );
  const ingredientCounts = recipes.map(
    (recipe) =>
      recipe.ingredients.filter((ingredient) => ingredient.name?.trim()).length,
  );
  const stepCounts = recipes.map((recipe) => recipe.instructions.length);
  const ratings = items.map((item) => item.averageRating);

  const facts = [
    fact("Total time", totals.map(formatTotalTime), totals, "quickest", true),
    fact(
      "Prep",
      recipes.map((recipe) => formatTotalTime(recipe.prepTimeMinutes)),
      null,
      null,
      true,
    ),
    fact(
      "Cook",
      recipes.map((recipe) => formatTotalTime(recipe.cookTimeMinutes)),
      null,
      null,
      true,
    ),
    fact(
      "Written for",
      recipes.map((recipe) =>
        recipe.servings ? `${recipe.servings} servings` : null,
      ),
      null,
      null,
      true,
    ),
    fact(
      "Difficulty",
      recipes.map((recipe) =>
        recipe.difficulty ? DIFFICULTY_LABELS[recipe.difficulty] : null,
      ),
      null,
      null,
      true,
    ),
    fact(
      "Ingredients",
      ingredientCounts.map(String),
      ingredientCounts,
      "fewest",
      true,
    ),
    fact(
      "Steps",
      stepCounts.map((count) => (count > 0 ? String(count) : null)),
      stepCounts.map((count) => (count > 0 ? count : null)),
      "fewest",
      true,
    ),
    fact(
      "Rating",
      ratings.map((rating) => (rating ? `${rating.toFixed(1)} ★` : null)),
      ratings,
      "top rated",
      false,
    ),
    fact(
      "Cooked",
      items.map((item) => cookedText(item.cooks.count)),
      null,
      null,
      false,
    ),
  ];

  return facts.filter((row) => row.cells.some((cell) => cell.value !== null));
}
