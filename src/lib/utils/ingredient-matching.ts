/**
 * Keys for lining up the same ingredient across recipes. The strict key keeps
 * every word that describes the ingredient; the loose key also drops size,
 * preparation and grade words and joins common synonyms. Words that change
 * what the ingredient is ("peanut" butter, egg "yolk", "brown" sugar) are never
 * dropped, so a missed match costs an extra row rather than a wrong one.
 */

const DESCRIPTORS = new Set([
  "large",
  "extra-large",
  "small",
  "medium",
  "jumbo",
  "fresh",
  "freshly",
  "finely",
  "coarsely",
  "roughly",
  "thinly",
  "chopped",
  "minced",
  "diced",
  "sliced",
  "grated",
  "shredded",
  "crushed",
  "peeled",
  "seeded",
  "softened",
  "melted",
  "cold",
  "chilled",
  "warm",
  "room-temperature",
  "unsalted",
  "salted",
  "packed",
  "firmly",
  "lightly",
  "light",
  "dark",
  "extra-virgin",
  "virgin",
  "kosher",
  "fine",
  "good-quality",
  "quality",
  "organic",
  "pure",
  "semisweet",
  "semi-sweet",
  "bittersweet",
  "boneless",
  "skinless",
  "can",
  "cans",
  "tin",
  "tins",
  "jar",
  "jars",
  "of",
  "a",
  "an",
  "the",
]);

const SYNONYMS: [RegExp, string][] = [
  [/\b(?:all[- ]purpose|plain|ap) flour\b/, "flour"],
  [
    /\b(?:icing|powdered|confectioners'?|confectioner's) sugar\b/,
    "powdered sugar",
  ],
  [/\b(?:white|granulated|caster|castor|superfine) sugar\b/, "sugar"],
  [/\b(?:scallions?|green onions?|spring onions?)\b/, "scallions"],
  [/\b(?:coriander leaf|coriander leaves|cilantro leaves)\b/, "cilantro"],
  [/\bcorn ?flour\b/, "cornstarch"],
  [/\b(?:bicarbonate of soda|bicarb soda|bicarb)\b/, "baking soda"],
  [/\b(?:double|heavy whipping|whipping) cream\b/, "heavy cream"],
  [/\baubergines?\b/, "eggplant"],
  [/\bcourgettes?\b/, "zucchini"],
  [/\b(?:sea|table) salt\b/, "salt"],
  [/\bvanilla(?! bean| pod)(?: extract| essence)?\b/, "vanilla extract"],
  [/\b(?:garlic cloves?|cloves? garlic)\b/, "garlic"],
  [/\bchocolate (?:chips|chunks|morsels|pieces)\b/, "chocolate"],
];

const SINGULAR_EXCEPTIONS = new Set([
  "asparagus",
  "couscous",
  "hummus",
  "molasses",
  "swiss",
  "grits",
  "cookies",
  "brownies",
]);

const IRREGULAR_SINGULARS: Record<string, string> = {
  leaves: "leaf",
  halves: "half",
  loaves: "loaf",
  knives: "knife",
};

export interface IngredientKeys {
  strict: string;
  loose: string;
  label: string;
}

function singular(word: string): string {
  if (SINGULAR_EXCEPTIONS.has(word)) return word;
  if (IRREGULAR_SINGULARS[word]) return IRREGULAR_SINGULARS[word];
  if (/[^aeiou]ies$/.test(word)) return `${word.slice(0, -3)}y`;
  if (/oes$/.test(word)) return word.slice(0, -2);
  if (/(?:ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (/[^su]s$/.test(word)) return word.slice(0, -1);
  return word;
}

function withSingularEnd(words: string[]): string {
  if (words.length === 0) return "";
  const last = words[words.length - 1];
  return [...words.slice(0, -1), singular(last)].join(" ");
}

function mainPhrase(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[“”"]/g, "")
    .split(/[,;:]/)[0]
    .replace(/\broom temperature\b/g, "room-temperature")
    .replace(/\bgood quality\b/g, "good-quality")
    .replace(/\bextra virgin\b/g, "extra-virgin")
    .replace(/\bextra large\b/g, "extra-large")
    .trim();
}

function phraseWords(phrase: string): string[] {
  return phrase
    .split(/\s+/)
    .map((word) => word.replace(/^[^a-z0-9]+|[^a-z0-9'-]+$/g, ""))
    .filter((word) => word.length > 0 && !/^\d/.test(word));
}

function firstChoice(words: string[]): string[] {
  const split = words.indexOf("or");
  if (split === -1) return words;
  const before = words.slice(0, split);
  return before.length > 0 ? before : words.slice(split + 1);
}

function looseWords(phrase: string): string[] {
  const kept = firstChoice(
    phraseWords(phrase).filter((word) => !DESCRIPTORS.has(word)),
  );
  const joined = SYNONYMS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    kept.join(" "),
  );
  return joined.split(/\s+/).filter(Boolean);
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function ingredientKeys(name: string): IngredientKeys {
  const phrase = mainPhrase(name);
  const strictWords = phraseWords(phrase);
  const loose = looseWords(phrase);
  const strict = withSingularEnd(strictWords);
  const looseKey = loose.length > 0 ? withSingularEnd(loose) : strict;
  const labelWords = loose.length > 0 ? loose : strictWords;

  return {
    strict: strict || name.trim().toLowerCase(),
    loose: looseKey || name.trim().toLowerCase(),
    label: capitalise(labelWords.join(" ") || name.trim()),
  };
}
