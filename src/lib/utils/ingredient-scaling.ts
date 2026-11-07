import { MeasurementUnit, type TemperatureUnit } from "@/lib/types";
import { formatIngredientForDisplayEnhanced } from "@/lib/utils/enhanced-unit-conversions";
import {
  findAdjustment,
  findMeasureNote,
  isMeasuringUnit,
  isMetricUnit,
  type MeasureNote,
  type NoteMeasure,
} from "@/lib/utils/ingredient-notes";
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
  ["carton", "cartons"],
  ["clove", "cloves"],
  ["container", "containers"],
  ["cup", "cups"],
  ["dash", "dashes"],
  ["drop", "drops"],
  ["ear", "ears"],
  ["envelope", "envelopes"],
  ["fillet", "fillets"],
  ["gallon", "gallons"],
  ["gram", "grams"],
  ["handful", "handfuls"],
  ["head", "heads"],
  ["item", "items"],
  ["jar", "jars"],
  ["kilogram", "kilograms"],
  ["knob", "knobs"],
  ["lb", "lbs"],
  ["leaf", "leaves"],
  ["liter", "liters"],
  ["loaf", "loaves"],
  ["litre", "litres"],
  ["milliliter", "milliliters"],
  ["millilitre", "millilitres"],
  ["ounce", "ounces"],
  ["pack", "packs"],
  ["package", "packages"],
  ["packet", "packets"],
  ["piece", "pieces"],
  ["pinch", "pinches"],
  ["pint", "pints"],
  ["pkg", "pkgs"],
  ["pound", "pounds"],
  ["quart", "quarts"],
  ["rib", "ribs"],
  ["scoop", "scoops"],
  ["sheet", "sheets"],
  ["slice", "slices"],
  ["splash", "splashes"],
  ["sprig", "sprigs"],
  ["stalk", "stalks"],
  ["stick", "sticks"],
  ["strip", "strips"],
  ["tablespoon", "tablespoons"],
  ["teaspoon", "teaspoons"],
  ["tin", "tins"],
  ["tub", "tubs"],
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
  name: string;
}

function formatMeasure(measure: NoteMeasure, factor: number): string {
  const amount = formatAmount(measure.quantity * factor);
  return `${amount} ${matchUnitToAmount(amount, measure.unit)}`;
}

function withoutNote(name: string, note: MeasureNote): string {
  return `${name.slice(0, note.start).trimEnd()}${name.slice(note.end)}`;
}

function scaleAdjustmentInName(name: string, factor: number): string {
  const adjustment = findAdjustment(name);
  if (!adjustment) return name;
  const amount = formatAmount(adjustment.quantity * factor);
  const unit = matchUnitToAmount(amount, adjustment.unit);
  return `${name.slice(0, adjustment.start)}, ${adjustment.word} ${amount} ${unit}`;
}

// The author's measure in the reader's system beats a conversion. It's the
// total amount, so an adjustment to the cups or spoons no longer applies.
function authorMeasureFor(
  note: MeasureNote,
  unit: string,
  system: MeasurementUnit | null,
): NoteMeasure | null {
  if (system === MeasurementUnit.METRIC) {
    if (isMetricUnit(unit)) return null;
    return (
      note.measures.find((measure) => measure.isMetric) ??
      note.measures.find((measure) => measure.isImperialWeight) ??
      null
    );
  }
  if (system === MeasurementUnit.IMPERIAL && isMetricUnit(unit)) {
    return note.measures.find((measure) => !measure.isMetric) ?? null;
  }
  return null;
}

function noteInName(
  name: string,
  note: MeasureNote,
  factor: number,
  system: MeasurementUnit | null,
): string {
  const wanted = system
    ? note.measures.filter(
        (measure) => measure.isMetric === (system === MeasurementUnit.METRIC),
      )
    : [];
  const shown = wanted.length > 0 ? wanted : note.measures;
  const text = shown.map((measure) => formatMeasure(measure, factor));
  return `${name.slice(0, note.start)} (${text.join("; ")})${name.slice(note.end)}`;
}

// Shows every amount the same way: "1 1/2" as "1 ½". Fractions without a
// symbol, such as 1/16, stay as written.
function tidyFraction(amount: string): string {
  const quantity = parseQuantity(amount);
  if (quantity === null) return amount;
  const tidied = formatAmount(quantity);
  return tidied.includes(".") && amount.includes("/") ? amount : tidied;
}

export function displayIngredientAmount(
  amount: string | null,
  unit: string | null,
  factor: number,
  system: MeasurementUnit | null,
  name: string | null = null,
): DisplayAmount {
  const scaled = tidyFraction(scaleAmount(amount, factor));
  const baseUnit = unit?.trim() ?? "";
  const baseName = name ?? "";
  if (!scaled || !baseUnit) {
    return { amount: scaled, unit: baseUnit, name: baseName };
  }

  const isPlainAmount =
    parseQuantity(scaled) !== null || parseRange(scaled) !== null;
  const note =
    isPlainAmount && isMeasuringUnit(baseUnit)
      ? findMeasureNote(baseName)
      : null;
  const authorMeasure = note ? authorMeasureFor(note, baseUnit, system) : null;

  if (note && authorMeasure && system) {
    const adjustment = findAdjustment(baseName);
    const trimmed = adjustment ? baseName.slice(0, adjustment.start) : baseName;
    const converted = formatIngredientForDisplayEnhanced(
      formatAmount(authorMeasure.quantity * factor),
      authorMeasure.unit,
      system,
    );
    return {
      amount: converted.amount,
      unit: matchUnitToAmount(converted.amount, converted.unit),
      name: withoutNote(trimmed, note),
    };
  }

  const shownName = scaleAdjustmentInName(
    note ? noteInName(baseName, note, factor, system) : baseName,
    factor,
  );
  const converted = system
    ? formatIngredientForDisplayEnhanced(scaled, baseUnit, system, shownName)
    : { amount: scaled, unit: baseUnit };
  return {
    amount: converted.amount,
    unit: matchUnitToAmount(converted.amount, converted.unit),
    name: shownName,
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
