/**
 * User preferences utilities and hooks for recipe display
 */

import {
  MeasurementUnit,
  TemperatureUnit,
  type UserPreferencesSubset,
} from "@/lib/types";

export type UserPreferences = UserPreferencesSubset;

/**
 * Get user's measurement system preference based on their unit preferences
 */
function getUserMeasurementSystem(
  preferences: UserPreferences,
): MeasurementUnit {
  // If either weight or volume preference is metric, consider the user metric-preferred
  if (
    preferences.preferredWeightUnit === MeasurementUnit.METRIC ||
    preferences.preferredVolumeUnit === MeasurementUnit.METRIC
  ) {
    return MeasurementUnit.METRIC;
  }

  return MeasurementUnit.IMPERIAL;
}

/**
 * Default preferences for new users or when preferences are not available
 */
const defaultUserPreferences: UserPreferences = {
  preferredTemperatureUnit: TemperatureUnit.FAHRENHEIT,
  preferredWeightUnit: MeasurementUnit.IMPERIAL,
  preferredVolumeUnit: MeasurementUnit.IMPERIAL,
};

/**
 * Validate user preference values
 */
export function validateUserPreferences(
  preferences: Partial<UserPreferences>,
): {
  isValid: boolean;
  errors: string[];
  sanitized: UserPreferences;
} {
  const errors: string[] = [];
  const sanitized: UserPreferences = { ...defaultUserPreferences };

  // Validate temperature unit
  if (preferences.preferredTemperatureUnit) {
    if (
      Object.values(TemperatureUnit).includes(
        preferences.preferredTemperatureUnit as TemperatureUnit,
      )
    ) {
      sanitized.preferredTemperatureUnit = preferences.preferredTemperatureUnit;
    } else {
      errors.push("Invalid temperature unit preference");
    }
  }

  // Validate weight unit
  if (preferences.preferredWeightUnit) {
    if (
      Object.values(MeasurementUnit).includes(
        preferences.preferredWeightUnit as MeasurementUnit,
      )
    ) {
      sanitized.preferredWeightUnit = preferences.preferredWeightUnit;
    } else {
      errors.push("Invalid weight unit preference");
    }
  }

  // Validate volume unit
  if (preferences.preferredVolumeUnit) {
    if (
      Object.values(MeasurementUnit).includes(
        preferences.preferredVolumeUnit as MeasurementUnit,
      )
    ) {
      sanitized.preferredVolumeUnit = preferences.preferredVolumeUnit;
    } else {
      errors.push("Invalid volume unit preference");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Get user preferences with fallback to defaults
 */
export function getUserPreferencesWithFallback(
  user?: UserPreferencesSubset | null,
): UserPreferences {
  if (!user) return defaultUserPreferences;

  return {
    preferredTemperatureUnit:
      user.preferredTemperatureUnit ||
      defaultUserPreferences.preferredTemperatureUnit,
    preferredWeightUnit:
      user.preferredWeightUnit || defaultUserPreferences.preferredWeightUnit,
    preferredVolumeUnit:
      user.preferredVolumeUnit || defaultUserPreferences.preferredVolumeUnit,
  };
}

/**
 * Get example conversions for preference settings UI
 */
export function getPreferenceExamples(preferences: UserPreferences) {
  const system = getUserMeasurementSystem(preferences);

  return {
    temperature: {
      imperial: "350°F",
      metric: "175°C",
      user:
        preferences.preferredTemperatureUnit === TemperatureUnit.FAHRENHEIT
          ? "350°F"
          : "175°C",
    },
    weight: {
      imperial: "8 oz",
      metric: "225 g",
      user: system === MeasurementUnit.IMPERIAL ? "8 oz" : "225 g",
    },
    volume: {
      imperial: "1 cup",
      metric: "240 ml",
      user: system === MeasurementUnit.IMPERIAL ? "1 cup" : "240 ml",
    },
  };
}
