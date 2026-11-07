/**
 * Converts ingredient amounts between metric and imperial using kitchen
 * measures (a 250 ml cup, a 15 ml tablespoon) and amounts a cook would measure.
 */

import { MeasurementUnit } from "@/lib/types";
import { gramsPerCup } from "@/lib/utils/ingredient-densities";
import { parseQuantity, parseRange } from "@/lib/utils/quantity-parsing";
import { formatAmount, normalizeUnit } from "@/lib/utils/unit-conversions";

const MILLILITRES: Record<string, number> = {
  "fl oz": 30,
  cup: 250,
  pt: 500,
  qt: 1000,
  gal: 4000,
  ml: 1,
  l: 1000,
};

const GRAMS: Record<string, number> = {
  oz: 28.35,
  lb: 453.6,
  g: 1,
  kg: 1000,
};

const METRIC_UNITS = new Set(["ml", "l", "g", "kg"]);

const KITCHEN_MILLILITRES: [number, number][] = [
  [250 / 4, 60],
  [250 / 3, 80],
  [(250 * 2) / 3, 160],
  [(250 * 3) / 4, 180],
];

const KITCHEN_GRAMS: [number, number][] = [
  [28.35, 30],
  [56.7, 60],
  [113.4, 125],
  [226.8, 250],
  [340.2, 375],
  [453.6, 450],
  [907.2, 900],
  [1360.8, 1400],
];

const QUARTERS = [0, 1 / 4, 1 / 2, 3 / 4, 1];
const QUARTERS_AND_THIRDS = [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1];
const EIGHTHS = [0, 1 / 8, 1 / 4, 3 / 8, 1 / 2, 5 / 8, 3 / 4, 7 / 8, 1];

interface DisplayUnit {
  label: string;
  size: number;
  steps: number[];
}

function snap(value: number, steps: number[]): number {
  const whole = Math.floor(value);
  const part = value - whole;
  const nearest = steps.reduce((best, step) =>
    Math.abs(step - part) < Math.abs(best - part) ? step : best,
  );
  return whole + nearest || steps[1];
}

function roundMetric(value: number): number {
  const step = value < 5 ? 0.25 : value < 25 ? 0.5 : value < 100 ? 5 : 10;
  return Math.max(Math.round(value / step) * step, step);
}

function metricText(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function kitchenMetric(base: number, table: [number, number][]): number {
  const match = table.find(([exact]) => Math.abs(exact - base) < 0.5);
  return match ? match[1] : roundMetric(base);
}

function imperialVolumeUnit(millilitres: number): DisplayUnit {
  if (millilitres < 15) {
    return { label: "tsp", size: 5, steps: EIGHTHS };
  }
  if (millilitres < 60) {
    return { label: "tbsp", size: 15, steps: QUARTERS };
  }
  return { label: "cup", size: 250, steps: QUARTERS_AND_THIRDS };
}

function imperialWeightUnit(grams: number): DisplayUnit {
  if (grams < 425) {
    return { label: "oz", size: 28.35, steps: QUARTERS };
  }
  return { label: "lb", size: 453.6, steps: QUARTERS };
}

function convertToImperial(
  bases: number[],
  isVolume: boolean,
): { amounts: string[]; unit: string } {
  const largest = Math.max(...bases);
  const unit = isVolume
    ? imperialVolumeUnit(largest)
    : imperialWeightUnit(largest);
  return {
    amounts: bases.map((base) =>
      formatAmount(snap(base / unit.size, unit.steps)),
    ),
    unit: unit.label,
  };
}

function convertToMetric(
  bases: number[],
  isVolume: boolean,
  fromMetric: boolean,
): { amounts: string[]; unit: string } {
  const table = isVolume ? KITCHEN_MILLILITRES : KITCHEN_GRAMS;
  const values = bases.map((base) =>
    fromMetric ? base : kitchenMetric(base, table),
  );
  const large = Math.max(...values) >= 1000;
  const size = large ? 1000 : 1;
  const unit = isVolume ? (large ? "L" : "ml") : large ? "kg" : "g";
  return {
    amounts: values.map((value) => metricText(value / size)),
    unit,
  };
}

function roundGrams(value: number): number {
  return value < 100 ? roundMetric(value) : Math.round(value / 5) * 5;
}

/**
 * Format an ingredient amount for the reader's measurement system. Solids
 * measured by volume become grams when the ingredient's weight is known, since
 * nobody measures rice in millilitres. Amounts already in that system,
 * teaspoons and tablespoons (kitchens use them in both systems), counts and
 * anything that isn't a plain number (such as "to taste") are returned as
 * written.
 */
export function formatIngredientForDisplayEnhanced(
  amount: string,
  unit: string,
  userSystem: MeasurementUnit,
  ingredientName: string | null = null,
): { amount: string; unit: string } {
  const unchanged = { amount, unit };
  const normalized = normalizeUnit(unit);
  const size = MILLILITRES[normalized] ?? GRAMS[normalized];
  if (!size) return unchanged;

  const range = parseRange(amount);
  const single = range ? null : parseQuantity(amount);
  if (!range && single === null) return unchanged;

  const fromMetric = METRIC_UNITS.has(normalized);
  const wantsMetric = userSystem === MeasurementUnit.METRIC;
  if (!wantsMetric && !fromMetric) return unchanged;

  const quantities = range ? [range.low, range.high] : [single ?? 0];
  const bases = quantities.map((quantity) => quantity * size);
  const isVolume = normalized in MILLILITRES;
  const cupWeight =
    wantsMetric && isVolume && !fromMetric ? gramsPerCup(ingredientName) : null;
  const converted = cupWeight
    ? convertToMetric(
        bases.map((base) => roundGrams((base / MILLILITRES.cup) * cupWeight)),
        false,
        true,
      )
    : wantsMetric
      ? convertToMetric(bases, isVolume, fromMetric)
      : convertToImperial(bases, isVolume);

  return {
    amount: converted.amounts.join("–"),
    unit: converted.unit,
  };
}
