/**
 * Enhanced unit conversion with more intuitive cooking-friendly conversions
 * Optimizes common kitchen measurements for better UX
 */

import { MeasurementUnit } from "@/lib/types";
import {
  convertToCanonical,
  formatAmount,
  getUnitCategory,
  parseAmount,
} from "@/lib/utils/unit-conversions";

// Enhanced conversion mappings for common cooking measurements
const COOKING_CONVERSIONS = {
  // Volume conversions - optimized for cooking intuition
  volume: {
    imperial_to_metric: {
      // Small measurements: direct to ml
      "1/4 tsp": { amount: "1.25", unit: "ml" },
      "1/2 tsp": { amount: "2.5", unit: "ml" },
      "1 tsp": { amount: "5", unit: "ml" },
      "2 tsp": { amount: "10", unit: "ml" },
      "1/2 tbsp": { amount: "7.5", unit: "ml" },
      "1 tbsp": { amount: "15", unit: "ml" },
      "2 tbsp": { amount: "30", unit: "ml" },
      "1/4 cup": { amount: "60", unit: "ml" },
      "1/3 cup": { amount: "80", unit: "ml" },
      "1/2 cup": { amount: "125", unit: "ml" },
      "2/3 cup": { amount: "160", unit: "ml" },
      "3/4 cup": { amount: "180", unit: "ml" },
      "1 cup": { amount: "250", unit: "ml" },
      "2 cups": { amount: "500", unit: "ml" },
      "3 cups": { amount: "750", unit: "ml" },
      "4 cups": { amount: "1", unit: "L" },
    },
    metric_to_imperial: {
      // Common metric amounts to nice imperial equivalents
      "5 ml": { amount: "1", unit: "tsp" },
      "15 ml": { amount: "1", unit: "tbsp" },
      "30 ml": { amount: "2", unit: "tbsp" },
      "60 ml": { amount: "1/4", unit: "cup" },
      "125 ml": { amount: "1/2", unit: "cup" },
      "250 ml": { amount: "1", unit: "cup" },
      "500 ml": { amount: "2", unit: "cups" },
      "1 L": { amount: "4", unit: "cups" },
    },
  },
  // Weight conversions - optimized for baking precision
  weight: {
    imperial_to_metric: {
      "1 oz": { amount: "30", unit: "g" },
      "2 oz": { amount: "60", unit: "g" },
      "4 oz": { amount: "125", unit: "g" },
      "8 oz": { amount: "250", unit: "g" },
      "12 oz": { amount: "375", unit: "g" },
      "1 lb": { amount: "450", unit: "g" },
      "2 lbs": { amount: "900", unit: "g" },
      "3 lbs": { amount: "1.4", unit: "kg" },
    },
    metric_to_imperial: {
      "30 g": { amount: "1", unit: "oz" },
      "125 g": { amount: "4", unit: "oz" },
      "250 g": { amount: "8", unit: "oz" },
      "450 g": { amount: "1", unit: "lb" },
      "500 g": { amount: "1.1", unit: "lbs" },
      "1 kg": { amount: "2.2", unit: "lbs" },
    },
  },
} as const;

/**
 * Get enhanced cooking-friendly conversion
 * Prioritizes common cooking measurements over mathematical precision
 */
export function getEnhancedConversion(
  amount: string,
  unit: string,
  targetSystem: MeasurementUnit,
): { amount: string; unit: string; isEnhanced: boolean } {
  const normalizedAmount = parseAmount(amount);
  const category = getUnitCategory(unit);

  if (!category || category === "count") {
    return { amount, unit, isEnhanced: false };
  }

  // Create lookup key for common conversions
  const lookupKey = `${amount} ${unit}`;

  if (category === "volume") {
    const conversions =
      targetSystem === MeasurementUnit.METRIC
        ? COOKING_CONVERSIONS.volume.imperial_to_metric
        : COOKING_CONVERSIONS.volume.metric_to_imperial;

    if (lookupKey in conversions) {
      const result = conversions[lookupKey as keyof typeof conversions] as {
        amount: string | number;
        unit: string;
      };
      return {
        amount:
          typeof result.amount === "string"
            ? result.amount
            : result.amount.toString(),
        unit: result.unit,
        isEnhanced: true,
      };
    }
  }

  if (category === "weight") {
    const conversions =
      targetSystem === MeasurementUnit.METRIC
        ? COOKING_CONVERSIONS.weight.imperial_to_metric
        : COOKING_CONVERSIONS.weight.metric_to_imperial;

    if (lookupKey in conversions) {
      const result = conversions[lookupKey as keyof typeof conversions] as {
        amount: string | number;
        unit: string;
      };
      return {
        amount:
          typeof result.amount === "string"
            ? result.amount
            : result.amount.toString(),
        unit: result.unit,
        isEnhanced: true,
      };
    }
  }

  // Fall back to mathematical conversion
  const canonical = convertToCanonical(normalizedAmount, unit);
  const _targetUnits =
    targetSystem === MeasurementUnit.METRIC
      ? { volume: "ml", weight: "g" }
      : { volume: "fl oz", weight: "oz" };

  if (category === "volume") {
    const ml = canonical.amount / 0.033814; // fl oz to ml
    if (targetSystem === MeasurementUnit.METRIC) {
      if (ml >= 1000) {
        return {
          amount: formatAmount(ml / 1000),
          unit: "L",
          isEnhanced: false,
        };
      }
      return {
        amount: Math.round(ml).toString(),
        unit: "ml",
        isEnhanced: false,
      };
    }
  }

  if (category === "weight") {
    const grams = canonical.amount / 0.035274; // oz to g
    if (targetSystem === MeasurementUnit.METRIC) {
      if (grams >= 1000) {
        return {
          amount: formatAmount(grams / 1000),
          unit: "kg",
          isEnhanced: false,
        };
      }
      return {
        amount: Math.round(grams).toString(),
        unit: "g",
        isEnhanced: false,
      };
    }
  }

  // Default fallback
  return { amount, unit, isEnhanced: false };
}

/**
 * Format ingredient with enhanced cooking-friendly conversions
 */
export function formatIngredientForDisplayEnhanced(
  amount: string,
  unit: string,
  userSystem: MeasurementUnit,
): { amount: string; unit: string; isEnhanced: boolean } {
  // Handle special cases that don't need conversion
  if (
    !amount ||
    amount.toLowerCase().includes("to taste") ||
    amount.toLowerCase().includes("for serving") ||
    amount.toLowerCase().includes("as needed") ||
    unit === "whole" ||
    unit === "small" ||
    unit === "medium" ||
    unit === "large"
  ) {
    return { amount: amount || "", unit: unit || "", isEnhanced: false };
  }

  // Try enhanced conversion first
  return getEnhancedConversion(amount, unit, userSystem);
}

/**
 * Get common cooking equivalents for educational purposes
 */
export function getCookingEquivalents(
  amount: string,
  unit: string,
): Array<{
  amount: string;
  unit: string;
  system: "imperial" | "metric";
  note?: string;
}> {
  const _equivalents = [];
  const key = `${amount} ${unit}`;

  // Add all relevant conversions for this measurement
  const commonEquivalents = {
    "1 tsp": [
      { amount: "5", unit: "ml", system: "metric" as const },
      { amount: "1/3", unit: "tbsp", system: "imperial" as const },
    ],
    "1 tbsp": [
      { amount: "15", unit: "ml", system: "metric" as const },
      { amount: "3", unit: "tsp", system: "imperial" as const },
    ],
    "1 cup": [
      { amount: "250", unit: "ml", system: "metric" as const },
      { amount: "16", unit: "tbsp", system: "imperial" as const },
      { amount: "8", unit: "fl oz", system: "imperial" as const },
    ],
    "1 lb": [
      { amount: "450", unit: "g", system: "metric" as const },
      { amount: "16", unit: "oz", system: "imperial" as const },
    ],
  };

  return commonEquivalents[key as keyof typeof commonEquivalents] || [];
}
