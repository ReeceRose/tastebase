import type { MeasurementUnit, TemperatureUnit } from "@/lib/types";
import { formatIngredientForDisplayEnhanced } from "@/lib/utils/enhanced-unit-conversions";
import {
  parseQuantity,
  parseRange,
  QUANTITY_PATTERN,
} from "@/lib/utils/quantity-parsing";
import {
  formatAmount,
  formatTemperatureForDisplay,
} from "@/lib/utils/unit-conversions";

export { parseQuantity };

const RANGE_PATTERN = new RegExp(
  `^(${QUANTITY_PATTERN})\\s*(?:-|–|to)\\s*(${QUANTITY_PATTERN})(.*)$`,
  "i",
);
const SINGLE_PATTERN = new RegExp(`^(${QUANTITY_PATTERN})(.*)$`);

const UNIT_FORMS: [string, string][] = [
  ["bag", "bags"],
  ["bottle", "bottles"],
  ["box", "boxes"],
  ["bulb", "bulbs"],
  ["bunch", "bunches"],
  ["can", "cans"],
  ["clove", "cloves"],
  ["cup", "cups"],
  ["dash", "dashes"],
  ["ear", "ears"],
  ["fillet", "fillets"],
  ["gallon", "gallons"],
  ["gram", "grams"],
  ["handful", "handfuls"],
  ["head", "heads"],
  ["item", "items"],
  ["jar", "jars"],
  ["kilogram", "kilograms"],
  ["lb", "lbs"],
  ["leaf", "leaves"],
  ["liter", "liters"],
  ["litre", "litres"],
  ["milliliter", "milliliters"],
  ["millilitre", "millilitres"],
  ["ounce", "ounces"],
  ["package", "packages"],
  ["piece", "pieces"],
  ["pinch", "pinches"],
  ["pint", "pints"],
  ["pkg", "pkgs"],
  ["pound", "pounds"],
  ["quart", "quarts"],
  ["rib", "ribs"],
  ["slice", "slices"],
  ["sprig", "sprigs"],
  ["stalk", "stalks"],
  ["stick", "sticks"],
  ["strip", "strips"],
  ["tablespoon", "tablespoons"],
  ["teaspoon", "teaspoons"],
];

function matchUnitToAmount(amount: string, unit: string): string {
  const quantity = parseRange(amount)?.high ?? parseQuantity(amount);
  if (quantity === null) return unit;
  const lower = unit.toLowerCase();
  const forms = UNIT_FORMS.find((pair) => pair.includes(lower));
  if (!forms) return unit;
  return quantity > 1 ? forms[1] : forms[0];
}

function scaleQuantity(raw: string, factor: number): string {
  const parsed = parseQuantity(raw);
  return parsed === null ? raw : formatAmount(parsed * factor);
}

export function scaleAmount(amount: string | null, factor: number): string {
  if (!amount) return "";
  const trimmed = amount.trim();
  if (factor === 1 || !trimmed) return trimmed;

  const range = trimmed.match(RANGE_PATTERN);
  if (range) {
    return `${scaleQuantity(range[1], factor)}–${scaleQuantity(range[2], factor)}${range[3]}`;
  }

  const single = trimmed.match(SINGLE_PATTERN);
  if (single) {
    return `${scaleQuantity(single[1], factor)}${single[2]}`;
  }

  return trimmed;
}

export function servingsFactor(
  original: number | null,
  target: number,
): number {
  if (!original || original <= 0 || target <= 0) return 1;
  return target / original;
}

export interface DisplayAmount {
  amount: string;
  unit: string;
}

export function displayIngredientAmount(
  amount: string | null,
  unit: string | null,
  factor: number,
  system: MeasurementUnit | null,
  name: string | null = null,
): DisplayAmount {
  const scaled = scaleAmount(amount, factor);
  const baseUnit = unit?.trim() ?? "";
  if (!scaled || !baseUnit) {
    return { amount: scaled, unit: baseUnit };
  }
  const converted = system
    ? formatIngredientForDisplayEnhanced(scaled, baseUnit, system, name)
    : { amount: scaled, unit: baseUnit };
  return {
    amount: converted.amount,
    unit: matchUnitToAmount(converted.amount, converted.unit),
  };
}

const TEMPERATURE_IN_TEXT = /(\d{2,3})\s?°\s?([FC])\b/g;

export function convertTemperaturesInText(
  text: string,
  unit: TemperatureUnit,
): string {
  return text.replace(
    TEMPERATURE_IN_TEXT,
    (_match, value: string, scale: string) =>
      formatTemperatureForDisplay(`${value}°${scale}`, unit),
  );
}
