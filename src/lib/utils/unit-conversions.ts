/**
 * Shared unit helpers: normalizing unit names, formatting amounts and
 * converting temperatures
 */

import { TemperatureUnit } from "@/lib/types";

/**
 * Normalize unit string - handles case, spacing, punctuation variations
 */
export function normalizeUnit(unit: string): string {
  if (!unit) return "";

  // Cookbooks use a capital T for tablespoon and a lowercase t for teaspoon
  if (unit.trim() === "T") return "tbsp";

  // Remove extra spaces, convert to lowercase, remove periods
  const normalized = unit.trim().toLowerCase().replace(/\./g, "");

  // Handle common variations
  const variations: Record<string, string> = {
    tsp: "tsp",
    t: "tsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    tbsp: "tbsp",
    tbl: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    "fl oz": "fl oz",
    floz: "fl oz",
    "fluid ounce": "fl oz",
    "fluid ounces": "fl oz",
    cup: "cup",
    cups: "cup",
    c: "cup",
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
    celsius: "°C",
    centigrade: "°C",
  };

  return variations[normalized] || normalized;
}

/**
 * Convert temperature between Fahrenheit and Celsius
 */
function convertTemperature(
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
