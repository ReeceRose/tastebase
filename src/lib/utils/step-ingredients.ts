import type { RecipeIngredient } from "@/lib/types/recipe-types";

// Words that describe an ingredient rather than name it
const DESCRIPTORS = new Set([
  "about",
  "bought",
  "bunch",
  "can",
  "cans",
  "chopped",
  "chuck",
  "clove",
  "cloves",
  "cold",
  "cubed",
  "diced",
  "dried",
  "extra",
  "finely",
  "fresh",
  "freshly",
  "good",
  "grated",
  "ground",
  "handful",
  "homemade",
  "hot",
  "large",
  "leaves",
  "low",
  "medium",
  "minced",
  "of",
  "packed",
  "packet",
  "packets",
  "peeled",
  "picked",
  "pieces",
  "pinch",
  "plain",
  "quality",
  "roughly",
  "salted",
  "sliced",
  "slices",
  "small",
  "sodium",
  "softened",
  "sprigs",
  "stick",
  "sticks",
  "store",
  "the",
  "thinly",
  "unflavored",
  "unflavoured",
  "unsalted",
  "virgin",
  "warm",
  "whole",
]);

// Too generic to match on their own: "the sauce" is usually the dish, not soy sauce
const GENERIC_HEADS = new Set(["juice", "mixture", "paste", "powder", "sauce"]);

const WHOLE_LIST_CUE = /\b(?:all (?:of )?(?:the )?ingredients|everything)\b/;
const GROUP_CUE = /\b(?:everything|all|ingredients)\b/;
const GROUP_PREFIX = /^(?:for (?:the )?|to )/;

interface IngredientKeys {
  ingredient: RecipeIngredient;
  phrases: string[][];
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

function nameAlternatives(name: string): string[][] {
  const base = name.replace(/\([^)]*\)/g, " ").split(",")[0] ?? "";
  return base
    .toLowerCase()
    .split(/\s+(?:and|or|&)\s+/)
    .map((part) => words(part).filter((word) => !DESCRIPTORS.has(word)))
    .filter((part) => part.length > 0);
}

function wordForms(word: string): string[] {
  const forms = [word, `${word}s`, `${word}es`];
  if (word.endsWith("es")) forms.push(word.slice(0, -2));
  if (word.endsWith("s")) forms.push(word.slice(0, -1));
  return forms;
}

function containsPhrase(text: string[], phrase: string[]): boolean {
  const last = phrase.length - 1;
  for (let start = 0; start + last < text.length; start++) {
    const matches = phrase.every((word, offset) =>
      offset === last
        ? wordForms(word).includes(text[start + offset])
        : text[start + offset] === word,
    );
    if (matches) return true;
  }
  return false;
}

// Every trailing run of words: "red bell pepper" -> "red bell pepper", "bell pepper", "pepper"
function suffixes(phrase: string[]): string[][] {
  return phrase.map((_, index) => phrase.slice(index));
}

function groupKeyword(groupName: string | null): string[] | null {
  if (!groupName) return null;
  const keyword = words(groupName.toLowerCase().replace(GROUP_PREFIX, ""));
  return keyword.length > 0 ? keyword : null;
}

function isUniqueMatch(
  suffix: string[],
  full: boolean,
  owners: Map<string, Set<string>>,
): boolean {
  if (full) return true;
  const id = suffix.join(" ");
  if (suffix.length === 1 && GENERIC_HEADS.has(id)) return false;
  return owners.get(id)?.size === 1;
}

function matchByName(
  text: string[],
  keys: IngredientKeys[],
  hasSections: boolean,
): RecipeIngredient[] {
  const owners = new Map<string, Set<string>>();
  const nameCounts = new Map<string, number>();
  for (const key of keys) {
    const name = key.ingredient.name;
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    for (const phrase of key.phrases) {
      for (const suffix of suffixes(phrase)) {
        const id = suffix.join(" ");
        owners.set(id, (owners.get(id) ?? new Set()).add(name));
      }
    }
  }

  const sure: RecipeIngredient[] = [];
  const unsure: RecipeIngredient[] = [];
  for (const key of keys) {
    const found = key.phrases
      .flatMap((phrase) =>
        suffixes(phrase).map((suffix) => ({
          suffix,
          full: suffix.length === phrase.length,
        })),
      )
      .filter(({ suffix }) => containsPhrase(text, suffix));
    if (found.length === 0) continue;

    const unique = found.some(({ suffix, full }) =>
      isUniqueMatch(suffix, full, owners),
    );
    (unique ? sure : unsure).push(key.ingredient);
  }

  // Sections this step clearly works in, judged by names that appear only once
  const context = new Set(
    sure
      .filter((item) => nameCounts.get(item.name) === 1)
      .map((item) => item.groupName),
  );
  const inContext = (item: RecipeIngredient) => context.has(item.groupName);

  // "Heat the oil" when oil is listed twice: keep the one from the section this step is using, or neither
  const kept = sure.filter(
    (item) => nameCounts.get(item.name) === 1 || inContext(item),
  );

  // "The peppers" could be bell or black pepper; only trust it inside a section the step already uses
  return hasSections ? [...kept, ...unsure.filter(inContext)] : kept;
}

/**
 * Works out which ingredients each step uses by matching ingredient and
 * section names in the step text. Returns one list per step, in recipe order.
 */
export function matchStepIngredients(
  steps: string[],
  ingredients: RecipeIngredient[],
): RecipeIngredient[][] {
  const ordered = [...ingredients].sort((a, b) => a.sortOrder - b.sortOrder);
  const keys = ordered
    .map((ingredient) => ({
      ingredient,
      phrases: nameAlternatives(ingredient.name),
    }))
    .filter((key) => key.phrases.length > 0);
  const groupNames = [...new Set(ordered.map((item) => item.groupName))];
  const mentionedGroups = new Set<string | null>();

  return steps.map((step) => {
    const text = words(step);
    const lower = step.toLowerCase();
    const picked = new Set<string>();

    for (const groupName of groupNames) {
      const keyword = groupKeyword(groupName);
      if (!keyword || !containsPhrase(text, keyword)) continue;
      const firstMention = !mentionedGroups.has(groupName);
      mentionedGroups.add(groupName);
      if (firstMention && GROUP_CUE.test(lower)) {
        for (const item of ordered) {
          if (item.groupName === groupName) picked.add(item.id);
        }
      }
    }

    if (picked.size === 0 && WHOLE_LIST_CUE.test(lower)) {
      return ordered;
    }

    for (const item of matchByName(text, keys, groupNames.length > 1)) {
      picked.add(item.id);
    }
    return ordered.filter((item) => picked.has(item.id));
  });
}
