/**
 * Reads the extra measures recipes keep in an ingredient's name: an author's
 * exact weight, as in "sugar (4 2/3 ounces; 132 g)", or an adjustment to the
 * amount, as in "flour, minus 2 tablespoons".
 */

import { parseQuantity, QUANTITY_PATTERN } from "@/lib/utils/quantity-parsing";
import { normalizeUnit } from "@/lib/utils/unit-conversions";

const METRIC_UNITS = new Set(["g", "kg", "ml", "l"]);
const IMPERIAL_UNITS = new Set([
  "oz",
  "lb",
  "tsp",
  "tbsp",
  "fl oz",
  "cup",
  "pt",
  "qt",
  "gal",
]);
const IMPERIAL_WEIGHTS = new Set(["oz", "lb"]);

const BRACKET = /\s*\(([^()]+)\)/g;
// A slash between digits belongs to a fraction: "4 2/3 oz" against "3 oz/85 g".
const NOTE_SEPARATOR = /\s*;\s*|\s*,\s*|\s+or\s+|(?<!\d)\/\s*|\s*\/(?!\d)/i;
const MEASURE = new RegExp(
  `^(?:about\\s+|approx\\.?\\s+|~\\s*)?(${QUANTITY_PATTERN})\\s*([a-z][a-z. ]*?)\\.?$`,
  "i",
);
const ADJUSTMENT = new RegExp(
  `,\\s*(minus|plus|less)\\s+(${QUANTITY_PATTERN})\\s+([^,()]+)$`,
  "i",
);

export interface NoteMeasure {
  quantity: number;
  unit: string;
  isMetric: boolean;
  isImperialWeight: boolean;
}

export interface MeasureNote {
  start: number;
  end: number;
  measures: NoteMeasure[];
}

export interface NameAdjustment {
  start: number;
  word: string;
  quantity: number;
  unit: string;
}

export function isMetricUnit(unit: string): boolean {
  return METRIC_UNITS.has(normalizeUnit(unit));
}

// Cans and cloves don't count: "2 cans tomatoes (14 oz)" means 14 oz each.
export function isMeasuringUnit(unit: string): boolean {
  const normalized = normalizeUnit(unit);
  return METRIC_UNITS.has(normalized) || IMPERIAL_UNITS.has(normalized);
}

function readMeasure(text: string): NoteMeasure | null {
  const match = text.trim().match(MEASURE);
  if (!match) return null;
  const quantity = parseQuantity(match[1]);
  const unit = match[2].trim();
  if (quantity === null || !isMeasuringUnit(unit)) return null;
  const normalized = normalizeUnit(unit);
  return {
    quantity,
    unit,
    isMetric: METRIC_UNITS.has(normalized),
    isImperialWeight: IMPERIAL_WEIGHTS.has(normalized),
  };
}

export function findMeasureNote(name: string): MeasureNote | null {
  for (const match of name.matchAll(BRACKET)) {
    const parts = match[1].split(NOTE_SEPARATOR);
    const measures = parts.flatMap((part) => {
      const measure = readMeasure(part);
      return measure ? [measure] : [];
    });
    if (measures.length === parts.length) {
      const start = match.index ?? 0;
      return { start, end: start + match[0].length, measures };
    }
  }
  return null;
}

export function findAdjustment(name: string): NameAdjustment | null {
  const match = name.match(ADJUSTMENT);
  const quantity = match ? parseQuantity(match[2]) : null;
  if (!match || quantity === null) return null;
  return {
    start: match.index ?? 0,
    word: match[1].toLowerCase(),
    quantity,
    unit: match[3].trim(),
  };
}
