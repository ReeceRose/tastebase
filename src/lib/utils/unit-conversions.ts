/**
 * Comprehensive unit conversion library for recipe ingredients and temperatures
 * All data is stored in canonical imperial units and converted for display
 */

import { MeasurementUnit, TemperatureUnit } from "@/lib/types";

// Canonical storage units (what we store in the database)
export const CANONICAL_UNITS = {
  volume: "fl oz",
  weight: "oz",
  temperature: "°F",
  count: "whole",
} as const;

// Unit categories and their variations
export const UNIT_CATEGORIES = {
  volume: [
    // Imperial volume
    "tsp",
    "teaspoon",
    "teaspoons",
    "t",
    "tbsp",
    "tablespoon",
    "tablespoons",
    "T",
    "tbl",
    "fl oz",
    "fluid ounce",
    "fluid ounces",
    "fl. oz.",
    "fl.oz.",
    "cup",
    "cups",
    "c",
    "C",
    "pt",
    "pint",
    "pints",
    "qt",
    "quart",
    "quarts",
    "gal",
    "gallon",
    "gallons",
    // Metric volume
    "ml",
    "milliliter",
    "milliliters",
    "mL",
    "ML",
    "l",
    "liter",
    "liters",
    "litre",
    "litres",
    "L",
  ],
  weight: [
    // Imperial weight
    "oz",
    "ounce",
    "ounces",
    "oz.",
    "lb",
    "pound",
    "pounds",
    "lbs",
    "lbs.",
    "#",
    // Metric weight
    "g",
    "gram",
    "grams",
    "gr",
    "kg",
    "kilogram",
    "kilograms",
    "kilo",
    "kilos",
  ],
  temperature: [
    "°F",
    "°f",
    "f",
    "F",
    "fahrenheit",
    "Fahrenheit",
    "°C",
    "°c",
    "c",
    "C",
    "celsius",
    "Celsius",
    "centigrade",
  ],
  count: [
    "whole",
    "piece",
    "pieces",
    "item",
    "items",
    "slice",
    "slices",
    "clove",
    "cloves",
    "head",
    "heads",
    "can",
    "cans",
    "package",
    "packages",
    "pkg",
    "pkgs",
    "bunch",
    "bunches",
    "sprig",
    "sprigs",
    "stalk",
    "stalks",
    "small",
    "medium",
    "large",
    "extra large",
    "xl",
  ],
} as const;

// Conversion factors to canonical imperial units
export const CONVERSION_FACTORS = {
  volume: {
    // Imperial to fl oz
    tsp: 1 / 6,
    teaspoon: 1 / 6,
    teaspoons: 1 / 6,
    t: 1 / 6,
    tbsp: 0.5,
    tablespoon: 0.5,
    tablespoons: 0.5,
    T: 0.5,
    tbl: 0.5,
    "fl oz": 1,
    "fluid ounce": 1,
    "fluid ounces": 1,
    "fl. oz.": 1,
    "fl.oz.": 1,
    cup: 8,
    cups: 8,
    c: 8,
    C: 8,
    pt: 16,
    pint: 16,
    pints: 16,
    qt: 32,
    quart: 32,
    quarts: 32,
    gal: 128,
    gallon: 128,
    gallons: 128,
    // Metric to fl oz
    ml: 0.033814,
    milliliter: 0.033814,
    milliliters: 0.033814,
    mL: 0.033814,
    ML: 0.033814,
    l: 33.814,
    liter: 33.814,
    liters: 33.814,
    litre: 33.814,
    litres: 33.814,
    L: 33.814,
  },
  weight: {
    // Imperial to oz
    oz: 1,
    ounce: 1,
    ounces: 1,
    "oz.": 1,
    lb: 16,
    pound: 16,
    pounds: 16,
    lbs: 16,
    "lbs.": 16,
    "#": 16,
    // Metric to oz
    g: 0.035274,
    gram: 0.035274,
    grams: 0.035274,
    gr: 0.035274,
    kg: 35.274,
    kilogram: 35.274,
    kilograms: 35.274,
    kilo: 35.274,
    kilos: 35.274,
  },
} as const;

// Display unit preferences based on user settings
export const DISPLAY_UNITS = {
  imperial: {
    volume: {
      tiny: "tsp", // < 0.5 fl oz
      small: "tbsp", // 0.5 - 2 fl oz
      medium: "fl oz", // 2 - 8 fl oz
      large: "cup", // 8+ fl oz
      huge: "qt", // 32+ fl oz
    },
    weight: {
      small: "oz", // < 16 oz
      large: "lb", // 16+ oz
    },
    temperature: "°F",
  },
  metric: {
    volume: {
      tiny: "ml", // < 15 ml
      small: "ml", // 15 - 60 ml
      medium: "ml", // 60 - 250 ml
      large: "ml", // 250 - 1000 ml
      huge: "l", // 1000+ ml
    },
    weight: {
      small: "g", // < 500 g
      large: "kg", // 500+ g
    },
    temperature: "°C",
  },
} as const;

/**
 * Normalize unit string - handles case, spacing, punctuation variations
 */
export function normalizeUnit(unit: string): string {
  if (!unit) return "";

  // Remove extra spaces, convert to lowercase, remove periods
  const normalized = unit.trim().toLowerCase().replace(/\./g, "");

  // Handle common variations
  const variations: Record<string, string> = {
    tsp: "tsp",
    t: "tsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    tbsp: "tbsp",
    T: "tbsp",
    tbl: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    "fl oz": "fl oz",
    floz: "fl oz",
    "fluid ounce": "fl oz",
    "fluid ounces": "fl oz",
    cup: "cup",
    cups: "cup",
    pint: "pt",
    pints: "pt",
    pt: "pt",
    quart: "qt",
    quarts: "qt",
    qt: "qt",
    gallon: "gal",
    gallons: "gal",
    gal: "gal",
    ml: "ml",
    milliliter: "ml",
    milliliters: "ml",
    liter: "l",
    liters: "l",
    litre: "l",
    litres: "l",
    l: "l",
    oz: "oz",
    ounce: "oz",
    ounces: "oz",
    pound: "lb",
    pounds: "lb",
    lb: "lb",
    lbs: "lb",
    "#": "lb",
    gram: "g",
    grams: "g",
    g: "g",
    gr: "g",
    kilogram: "kg",
    kilograms: "kg",
    kg: "kg",
    kilo: "kg",
    kilos: "kg",
    "°f": "°F",
    f: "°F",
    fahrenheit: "°F",
    "°c": "°C",
    c: "°C",
    celsius: "°C",
    centigrade: "°C",
  };

  return variations[normalized] || normalized;
}

/**
 * Parse amount string - handles fractions, decimals, ranges
 */
export function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === "") return 0;

  const cleaned = amountStr.trim();

  // Handle ranges like "2-3" or "2 to 3" - take the average
  if (cleaned.includes("-") || cleaned.includes(" to ")) {
    const rangeParts = cleaned.split(/[-\s]+to\s+/);
    if (rangeParts.length === 2) {
      const start = parseAmount(rangeParts[0]);
      const end = parseAmount(rangeParts[1]);
      return (start + end) / 2;
    }
  }

  // Handle mixed numbers like "1 1/2" or "1½"
  const mixedMatch = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const numerator = parseInt(mixedMatch[2], 10);
    const denominator = parseInt(mixedMatch[3], 10);
    return whole + numerator / denominator;
  }

  // Handle fractions like "1/2" or "3/4"
  const fractionMatch = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    return numerator / denominator;
  }

  // Handle unicode fractions
  const unicodeFractions: Record<string, number> = {
    "½": 0.5,
    "⅓": 1 / 3,
    "⅔": 2 / 3,
    "¼": 0.25,
    "¾": 0.75,
    "⅕": 0.2,
    "⅖": 0.4,
    "⅗": 0.6,
    "⅘": 0.8,
    "⅙": 1 / 6,
    "⅚": 5 / 6,
    "⅐": 1 / 7,
    "⅛": 0.125,
    "⅜": 0.375,
    "⅝": 0.625,
    "⅞": 0.875,
  };

  for (const [unicode, value] of Object.entries(unicodeFractions)) {
    if (cleaned.includes(unicode)) {
      const parts = cleaned.split(unicode);
      const whole = parts[0] ? parseFloat(parts[0]) : 0;
      return whole + value;
    }
  }

  // Handle regular decimals
  const decimal = parseFloat(cleaned);
  return Number.isNaN(decimal) ? 0 : decimal;
}

/**
 * Get unit category for a given unit
 */
export function getUnitCategory(
  unit: string,
): keyof typeof UNIT_CATEGORIES | null {
  const normalized = normalizeUnit(unit);

  for (const [category, units] of Object.entries(UNIT_CATEGORIES)) {
    if (units.some((u) => normalizeUnit(u) === normalized)) {
      return category as keyof typeof UNIT_CATEGORIES;
    }
  }

  return null;
}

/**
 * Convert any unit to canonical imperial storage unit
 */
export function convertToCanonical(
  amount: number,
  unit: string,
): { amount: number; unit: string } {
  const normalized = normalizeUnit(unit);
  const category = getUnitCategory(normalized);

  if (!category || category === "count") {
    return { amount, unit: normalized };
  }

  if (category === "temperature") {
    const temp = convertTemperature(amount, normalized, "°F");
    return { amount: Math.round(temp), unit: "°F" };
  }

  const categoryFactors =
    CONVERSION_FACTORS[category as keyof typeof CONVERSION_FACTORS];
  const factor = categoryFactors?.[
    normalized as keyof typeof categoryFactors
  ] as number;

  if (!factor) {
    return { amount, unit: normalized };
  }

  const canonicalUnit =
    CANONICAL_UNITS[category as keyof typeof CANONICAL_UNITS];
  const convertedAmount = amount * factor;

  return {
    amount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
    unit: canonicalUnit,
  };
}

/**
 * Convert temperature between Fahrenheit and Celsius
 */
export function convertTemperature(
  temp: number,
  fromUnit: string,
  toUnit: string,
): number {
  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);

  if (normalizedFrom === normalizedTo) return temp;

  if (normalizedFrom === "°F" && normalizedTo === "°C") {
    return ((temp - 32) * 5) / 9;
  }

  if (normalizedFrom === "°C" && normalizedTo === "°F") {
    return (temp * 9) / 5 + 32;
  }

  return temp;
}

/**
 * Get the best display unit based on amount and user preferences
 */
export function getBestDisplayUnit(
  amount: number,
  canonicalUnit: string,
  userSystem: MeasurementUnit,
): { amount: number; unit: string } {
  const category = getUnitCategory(canonicalUnit);

  if (!category || category === "count" || category === "temperature") {
    return { amount, unit: canonicalUnit };
  }

  const displayUnits =
    DISPLAY_UNITS[userSystem][category as keyof typeof DISPLAY_UNITS.imperial];

  if (category === "weight") {
    const units = displayUnits as typeof DISPLAY_UNITS.imperial.weight;

    if (userSystem === MeasurementUnit.IMPERIAL) {
      // Convert from oz to best imperial unit
      if (amount >= 16) {
        return {
          amount: Math.round((amount / 16) * 100) / 100,
          unit: units.large,
        };
      }
      return { amount, unit: units.small };
    } else {
      // Convert from oz to best metric unit
      const grams = amount / 0.035274;
      if (grams >= 500) {
        return {
          amount: Math.round((grams / 1000) * 100) / 100,
          unit: units.large,
        };
      }
      return { amount: Math.round(grams * 10) / 10, unit: units.small };
    }
  }

  if (category === "volume") {
    const units = displayUnits as typeof DISPLAY_UNITS.imperial.volume;

    if (userSystem === MeasurementUnit.IMPERIAL) {
      // Convert from fl oz to best imperial unit
      if (amount >= 32)
        return {
          amount: Math.round((amount / 32) * 100) / 100,
          unit: units.huge,
        };
      if (amount >= 8)
        return {
          amount: Math.round((amount / 8) * 100) / 100,
          unit: units.large,
        };
      if (amount >= 2) return { amount, unit: units.medium };
      if (amount >= 0.5) return { amount: amount * 2, unit: units.small };
      return { amount: amount * 6, unit: units.tiny };
    } else {
      // Convert from fl oz to best metric unit
      const ml = amount / 0.033814;
      if (ml >= 1000) {
        return {
          amount: Math.round((ml / 1000) * 100) / 100,
          unit: units.huge,
        };
      }
      return { amount: Math.round(ml), unit: units.large };
    }
  }

  return { amount, unit: canonicalUnit };
}

/**
 * Format amount with proper precision and readability
 */
export function formatAmount(amount: number): string {
  if (amount === 0) return "0";

  // Handle very small amounts
  if (amount < 0.01) return amount.toFixed(3);

  // Handle amounts less than 1
  if (amount < 1) {
    // Try to convert to common fractions
    const commonFractions = [
      [0.125, "⅛"],
      [0.25, "¼"],
      [0.333, "⅓"],
      [0.375, "⅜"],
      [0.5, "½"],
      [0.625, "⅝"],
      [0.667, "⅔"],
      [0.75, "¾"],
      [0.875, "⅞"],
    ];

    for (const [decimal, fraction] of commonFractions) {
      if (Math.abs(amount - (decimal as number)) < 0.01) {
        return fraction as string;
      }
    }

    return amount.toFixed(2).replace(/\.?0+$/, "");
  }

  // Handle mixed numbers
  if (amount > 1 && amount % 1 !== 0) {
    const whole = Math.floor(amount);
    const fraction = amount - whole;

    const commonFractions = [
      [0.125, "⅛"],
      [0.25, "¼"],
      [0.333, "⅓"],
      [0.375, "⅜"],
      [0.5, "½"],
      [0.625, "⅝"],
      [0.667, "⅔"],
      [0.75, "¾"],
      [0.875, "⅞"],
    ];

    for (const [decimal, frac] of commonFractions) {
      if (Math.abs(fraction - (decimal as number)) < 0.01) {
        return `${whole} ${frac as string}`;
      }
    }
  }

  // Round to reasonable precision
  if (amount >= 100) return Math.round(amount).toString();
  if (amount >= 10) return (Math.round(amount * 10) / 10).toString();
  return (Math.round(amount * 100) / 100).toString().replace(/\.?0+$/, "");
}

/**
 * Complete ingredient formatting with user preferences
 */
export function formatIngredientForDisplay(
  amount: string,
  unit: string,
  userSystem: MeasurementUnit,
): { amount: string; unit: string } {
  const numericAmount = parseAmount(amount);
  const canonical = convertToCanonical(numericAmount, unit);
  const display = getBestDisplayUnit(
    canonical.amount,
    canonical.unit,
    userSystem,
  );

  return {
    amount: formatAmount(display.amount),
    unit: display.unit,
  };
}

/**
 * Temperature formatting with user preferences
 */
export function formatTemperatureForDisplay(
  temperature: string,
  userPreference: TemperatureUnit,
): string {
  const temp = parseFloat(temperature);
  if (Number.isNaN(temp)) return temperature;

  // Determine the source unit from the temperature string
  let sourceUnit = "°F"; // Default assumption for numeric-only temperatures
  if (temperature.includes("°C") || temperature.includes("C")) {
    sourceUnit = "°C";
  } else if (temperature.includes("°F") || temperature.includes("F")) {
    sourceUnit = "°F";
  }

  const targetUnit =
    userPreference === TemperatureUnit.FAHRENHEIT ? "°F" : "°C";

  // Only convert if the units are different
  if (sourceUnit === targetUnit) {
    return `${Math.round(temp)}${targetUnit}`;
  }

  const converted = convertTemperature(temp, sourceUnit, targetUnit);
  return `${Math.round(converted)}${targetUnit}`;
}
