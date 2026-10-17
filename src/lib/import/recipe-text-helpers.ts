import type { ParsedIngredient } from "@/lib/types/import-types";

const UNICODE_FRACTIONS = "½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞";
const SINGLE_QUANTITY = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\s*[${UNICODE_FRACTIONS}]|\\d+\\/\\d+|[${UNICODE_FRACTIONS}]|\\d+(?:[.,]\\d+)?)`;
const QUANTITY_PATTERN = new RegExp(
  `^(${SINGLE_QUANTITY}(?:\\s*(?:-|–|—|to)\\s*${SINGLE_QUANTITY})?)(?=\\s|[a-zA-Z(]|$)\\s*`,
);

// Longest names first so "fluid ounces" wins over "fl" and "tablespoons" over "t".
const UNIT_NAMES = [
  "fluid ounces",
  "fluid ounce",
  "tablespoons",
  "tablespoon",
  "teaspoons",
  "teaspoon",
  "kilograms",
  "kilogram",
  "milliliters",
  "milliliter",
  "millilitres",
  "millilitre",
  "packages",
  "package",
  "handfuls",
  "handful",
  "bunches",
  "bunch",
  "cloves",
  "clove",
  "ounces",
  "ounce",
  "pounds",
  "pound",
  "quarts",
  "quart",
  "gallons",
  "gallon",
  "liters",
  "liter",
  "litres",
  "litre",
  "pinches",
  "pinch",
  "dashes",
  "dash",
  "slices",
  "slice",
  "sticks",
  "stick",
  "sprigs",
  "sprig",
  "grams",
  "gram",
  "pints",
  "pint",
  "cans",
  "can",
  "cups",
  "cup",
  "tbsp",
  "tbs",
  "tbl",
  "tsp",
  "fl oz",
  "lbs",
  "lb",
  "oz",
  "kg",
  "ml",
  "qt",
  "pt",
  "g",
  "l",
  "T",
  "t",
];

const UNIT_PATTERN = new RegExp(
  `^(${UNIT_NAMES.map((unit) => unit.replace(" ", "\\s+")).join("|")})\\.?(?=\\s|$|,)\\s*(?:of\\s+)?`,
);

// "2 cups minus 2 tablespoons flour" or "1 cup plus 1 tbsp sugar".
const ADJUSTMENT_PATTERN = /^(minus|plus|less|\+)\s+/i;

function readAdjustment(rest: string): { text: string; rest: string } | null {
  const word = rest.match(ADJUSTMENT_PATTERN);
  if (!word) return null;
  let remaining = rest.slice(word[0].length);
  const quantity = remaining.match(QUANTITY_PATTERN);
  if (!quantity) return null;
  remaining = remaining.slice(quantity[0].length);
  const unit = remaining.match(UNIT_PATTERN);
  if (!unit || remaining.length <= unit[0].length) return null;
  remaining = remaining.slice(unit[0].length);
  const text = `${word[1].toLowerCase()} ${quantity[1].trim()} ${unit[1].replace(/\s+/g, " ")}`;
  return { text, rest: remaining };
}

const LEADING_MARKER_PATTERN =
  /^(?:[-*•·▪▢☐□◦‣⁃]+\s*|(?:step\s*)?\d+\s*[.):]\s+|\(\d+\)\s+)/i;

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[   ]/g, " ")
    .replace(/⁄/g, "/")
    .replace(/[ \t]+/g, " ");
}

export function stripListMarker(line: string): string {
  return line.replace(LEADING_MARKER_PATTERN, "").trim();
}

export function startsWithQuantity(line: string): boolean {
  return QUANTITY_PATTERN.test(stripListMarker(line));
}

export function parseIngredientLine(rawLine: string): ParsedIngredient | null {
  const line = stripListMarker(normalizeText(rawLine)).trim();
  if (line.length === 0) {
    return null;
  }

  const quantityMatch = line.match(QUANTITY_PATTERN);
  if (!quantityMatch) {
    return { name: line, quantity: null, unit: null };
  }

  const quantity = quantityMatch[1].replace(/\s+/g, " ").trim();
  let rest = line.slice(quantityMatch[0].length).trim();

  let packageSize: string | null = null;
  const packageMatch = rest.match(/^\(([^)]+)\)\s*/);
  if (packageMatch) {
    packageSize = packageMatch[1].trim();
    rest = rest.slice(packageMatch[0].length);
  }

  let unit: string | null = null;
  const unitMatch = rest.match(UNIT_PATTERN);
  if (unitMatch && rest.length > unitMatch[0].length) {
    unit = unitMatch[1].replace(/\s+/g, " ");
    rest = rest.slice(unitMatch[0].length);
  }

  // The adjustment can't be scaled with the main amount, so it's kept with
  // the name where the cook will still read it.
  const adjustment = unit ? readAdjustment(rest) : null;
  if (adjustment) {
    rest = adjustment.rest;
  }

  const baseName = packageSize
    ? `${rest.trim()} (${packageSize})`
    : rest.trim();
  const name =
    adjustment && baseName ? `${baseName}, ${adjustment.text}` : baseName;
  if (name.length === 0) {
    return { name: line, quantity: null, unit: null };
  }

  return { name, quantity, unit };
}

export function parseIsoDuration(duration: string): number | null {
  const match = duration
    .trim()
    .match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!match) {
    return parseDurationText(duration);
  }
  const days = parseInt(match[1] || "0", 10);
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);
  const seconds = parseFloat(match[4] || "0");
  const total = days * 1440 + hours * 60 + minutes + Math.round(seconds / 60);
  return total > 0 ? total : null;
}

function readNumber(value: string): number {
  return parseFloat(value.replace(",", "."));
}

export function parseDurationText(text: string): number | null {
  const hoursMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  const minutesMatch = text.match(/(\d+)\s*(?:minutes?|mins?|m)\b/i);
  const hours = hoursMatch ? readNumber(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  const total = Math.round(hours * 60 + minutes);
  if (total > 0) {
    return total;
  }
  const bare = text.trim().match(/^(\d+)$/);
  return bare ? parseInt(bare[1], 10) : null;
}

const STEP_TIME_PATTERN =
  /(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:[.,]\d+)?))?\s*(hours?|hrs?|minutes?|mins?)\b/i;

export function extractTimeMinutes(text: string): number | null {
  const match = text.match(STEP_TIME_PATTERN);
  if (!match) {
    return null;
  }
  const low = readNumber(match[1]);
  const high = match[2] ? readNumber(match[2]) : low;
  const value = Math.max(low, high);
  const minutes = /^h/i.test(match[3]) ? value * 60 : value;
  return minutes > 0 ? Math.round(minutes) : null;
}

export function extractTemperature(text: string): string | null {
  const degreeMatch = text.match(
    /(\d{2,3})\s*(?:°|º|degrees?)\s*([CF])\b|(\d{2,3})°/i,
  );
  if (degreeMatch) {
    if (degreeMatch[1] && degreeMatch[2]) {
      return `${degreeMatch[1]}°${degreeMatch[2].toUpperCase()}`;
    }
    return `${degreeMatch[3]}°`;
  }
  const heatMatch = text.match(
    /\b(low|medium[- ]low|medium[- ]high|medium|high)\s+heat\b/i,
  );
  return heatMatch ? `${heatMatch[1].toLowerCase()} heat` : null;
}

export function parseServings(text: string): number | null {
  const match = text.match(/(\d+)/);
  if (!match) {
    return null;
  }
  const servings = parseInt(match[1], 10);
  return servings > 0 && servings <= 100 ? servings : null;
}
