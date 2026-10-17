import type { MeasurementUnit, TemperatureUnit } from "@/lib/types";
import { formatIngredientForDisplayEnhanced } from "@/lib/utils/enhanced-unit-conversions";
import {
  formatAmount,
  formatTemperatureForDisplay,
} from "@/lib/utils/unit-conversions";

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 1 / 2,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅕": 1 / 5,
  "⅖": 2 / 5,
  "⅗": 3 / 5,
  "⅘": 4 / 5,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

const UNICODE_CLASS = Object.keys(UNICODE_FRACTIONS).join("");
const QUANTITY = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+\\s*[${UNICODE_CLASS}]|[${UNICODE_CLASS}]|\\d+(?:[.,]\\d+)?)`;
const RANGE_PATTERN = new RegExp(
  `^(${QUANTITY})\\s*(?:-|–|to)\\s*(${QUANTITY})(.*)$`,
  "i",
);
const SINGLE_PATTERN = new RegExp(`^(${QUANTITY})(.*)$`);

export function parseQuantity(raw: string): number | null {
  const value = raw.trim().replace(",", ".");
  if (!value) return null;

  const mixed = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[3]);
    if (denominator === 0) return null;
    return Number(mixed[1]) + Number(mixed[2]) / denominator;
  }

  const fraction = value.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? null : Number(fraction[1]) / denominator;
  }

  const unicode = value.match(new RegExp(`^(\\d*)\\s*([${UNICODE_CLASS}])$`));
  if (unicode) {
    const whole = unicode[1] ? Number(unicode[1]) : 0;
    return whole + UNICODE_FRACTIONS[unicode[2]];
  }

  const decimal = Number(value);
  return Number.isFinite(decimal) ? decimal : null;
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
): DisplayAmount {
  const scaled = scaleAmount(amount, factor);
  const baseUnit = unit?.trim() ?? "";
  if (!system || !scaled || !baseUnit) {
    return { amount: scaled, unit: baseUnit };
  }
  const converted = formatIngredientForDisplayEnhanced(
    scaled,
    baseUnit,
    system,
  );
  return { amount: converted.amount, unit: converted.unit };
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
