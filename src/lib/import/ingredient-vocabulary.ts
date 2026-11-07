const UNICODE_FRACTIONS = "½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞";

export const SINGLE_QUANTITY = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\s*[${UNICODE_FRACTIONS}]|\\d+\\/\\d+|[${UNICODE_FRACTIONS}]|\\d+(?:[.,]\\d+)?)`;

interface UnitGroup {
  canonical: string;
  forms: string[];
}

// Measures are stored in one spelling so a list doesn't mix "tsp" and
// "teaspoon". Counted units keep the word as written, because the display
// matches singular and plural to the scaled amount.
const MEASURE_UNITS: UnitGroup[] = [
  {
    canonical: "tbsp",
    forms: [
      "tablespoons",
      "tablespoon",
      "tablesp",
      "tbsps",
      "tblsp",
      "tbsp",
      "tbsn",
      "tbs",
      "tbl",
      "tb",
    ],
  },
  {
    canonical: "tsp",
    forms: ["teaspoons", "teaspoon", "teasp", "tspn", "tsps", "tsp", "ts"],
  },
  {
    canonical: "fl oz",
    forms: [
      "fluid ounces",
      "fluid ounce",
      "fl\\. oz",
      "fl\\.oz",
      "fl oz",
      "floz",
    ],
  },
  { canonical: "oz", forms: ["ounces", "ounce", "ozs", "oz"] },
  { canonical: "lb", forms: ["pounds", "pound", "lbs", "lb"] },
  {
    canonical: "kg",
    forms: ["kilograms", "kilogram", "kilos", "kilo", "kgs", "kg"],
  },
  { canonical: "g", forms: ["grams", "gram", "grm", "gms", "gm", "gr", "g"] },
  {
    canonical: "ml",
    forms: [
      "milliliters",
      "milliliter",
      "millilitres",
      "millilitre",
      "mls",
      "ml",
    ],
  },
  { canonical: "l", forms: ["liters", "liter", "litres", "litre", "l"] },
  { canonical: "dl", forms: ["deciliters", "deciliter", "dl"] },
  { canonical: "cl", forms: ["centiliters", "centiliter", "cl"] },
  { canonical: "qt", forms: ["quarts", "quart", "qt"] },
  { canonical: "pt", forms: ["pints", "pint", "pt"] },
  { canonical: "gal", forms: ["gallons", "gallon", "gal"] },
  { canonical: "cups", forms: ["cups"] },
  { canonical: "cup", forms: ["cup", "c"] },
];

// A size in front of one of these describes the package: "14 oz can tomatoes".
const CONTAINER_UNITS = [
  "packages",
  "package",
  "containers",
  "container",
  "envelopes",
  "envelope",
  "packets",
  "packet",
  "bottles",
  "bottle",
  "cartons",
  "carton",
  "loaves",
  "loaf",
  "boxes",
  "box",
  "bags",
  "bag",
  "cans",
  "can",
  "jars",
  "jar",
  "tins",
  "tin",
  "tubs",
  "tub",
  "packs",
  "pack",
  "pkgs",
  "pkg",
];

const COUNT_UNITS = [
  ...CONTAINER_UNITS,
  "handfuls",
  "handful",
  "bunches",
  "bunch",
  "cloves",
  "clove",
  "pinches",
  "pinch",
  "dashes",
  "dash",
  "splashes",
  "splash",
  "slices",
  "slice",
  "sticks",
  "stick",
  "sprigs",
  "sprig",
  "stalks",
  "stalk",
  "pieces",
  "piece",
  "fillets",
  "fillet",
  "strips",
  "strip",
  "sheets",
  "sheet",
  "scoops",
  "scoop",
  "knobs",
  "knob",
  "drops",
  "drop",
  "heads",
  "head",
  "ears",
  "ear",
  "ribs",
  "rib",
];

function byLongestFirst(forms: string[]): string[] {
  return [...forms].sort((a, b) => b.length - a.length);
}

function asPattern(form: string): string {
  return form.replace(/ /g, "\\s+");
}

const MEASURE_FORMS = byLongestFirst(
  MEASURE_UNITS.flatMap((group) => group.forms),
).map(asPattern);

const ALL_FORMS = byLongestFirst([
  ...MEASURE_UNITS.flatMap((group) => group.forms),
  ...COUNT_UNITS,
]).map(asPattern);

// Measures only, for sizes and second amounts. Excludes the bare "c" so a
// word starting with it can't pass as a cup.
export const MEASURE_UNIT_PATTERN = MEASURE_FORMS.filter(
  (form) => form !== "c",
).join("|");

export const CONTAINER_UNIT_PATTERN = byLongestFirst(CONTAINER_UNITS).join("|");

const UNIT_END = "\\.?(?=[\\s,/(+)]|$)\\s*(?:of\\s+)?";

// Cookbooks use a capital T for tablespoon and a lowercase t for teaspoon, so
// these two are the only spellings where case matters.
const SPOON_LETTER = new RegExp(`^(T|t)${UNIT_END}`);
const UNIT = new RegExp(`^(${ALL_FORMS.join("|")})${UNIT_END}`, "i");

const CANONICAL_BY_FORM = new Map<string, string>(
  MEASURE_UNITS.flatMap((group) =>
    group.forms.map((form): [string, string] => [
      form.replace(/\\/g, ""),
      group.canonical,
    ]),
  ),
);

export function canonicalUnit(unit: string): string {
  const lower = unit.toLowerCase().replace(/\s+/g, " ").replace(/\.$/, "");
  return CANONICAL_BY_FORM.get(lower) ?? lower;
}

export interface UnitMatch {
  unit: string;
  rest: string;
}

export function matchUnit(text: string): UnitMatch | null {
  const letter = text.match(SPOON_LETTER);
  if (letter) {
    return {
      unit: letter[1] === "T" ? "tbsp" : "tsp",
      rest: text.slice(letter[0].length),
    };
  }
  const match = text.match(UNIT);
  if (!match) return null;
  return {
    unit: canonicalUnit(match[1]),
    rest: text.slice(match[0].length),
  };
}

// A measure, for example "14 oz", "120g" or "1 1/2 cups".
export const MEASURE = `${SINGLE_QUANTITY}\\s*(?:${MEASURE_FORMS.join("|")})\\.?`;
