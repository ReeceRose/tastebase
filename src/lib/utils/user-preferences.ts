/**
 * User preferences utilities and hooks for recipe display
 */

import {
  MeasurementUnit,
  TemperatureUnit,
  type UserPreferencesSubset,
} from "@/lib/types";

export type UserPreferences = UserPreferencesSubset;

export interface UserDisplayPreferences extends UserPreferences {
  measurementSystem: MeasurementUnit;
}

/**
 * Get user's measurement system preference based on their unit preferences
 */
export function getUserMeasurementSystem(
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
 * Get enhanced display preferences including derived measurement system
 */
export function getUserDisplayPreferences(
  preferences: UserPreferences,
): UserDisplayPreferences {
  return {
    ...preferences,
    measurementSystem: getUserMeasurementSystem(preferences),
  };
}

/**
 * Default preferences for new users or when preferences are not available
 */
export const defaultUserPreferences: UserPreferences = {
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
 * Check if user has customized their preferences from defaults
 */
export function hasCustomPreferences(preferences: UserPreferences): boolean {
  return (
    preferences.preferredTemperatureUnit !==
      defaultUserPreferences.preferredTemperatureUnit ||
    preferences.preferredWeightUnit !==
      defaultUserPreferences.preferredWeightUnit ||
    preferences.preferredVolumeUnit !==
      defaultUserPreferences.preferredVolumeUnit
  );
}

/**
 * Get human-readable preference labels for UI display
 */
export function getPreferenceLabels(preferences: UserPreferences) {
  return {
    temperature:
      preferences.preferredTemperatureUnit === TemperatureUnit.FAHRENHEIT
        ? "Fahrenheit (°F)"
        : "Celsius (°C)",
    weight:
      preferences.preferredWeightUnit === MeasurementUnit.IMPERIAL
        ? "Imperial (oz, lbs)"
        : "Metric (g, kg)",
    volume:
      preferences.preferredVolumeUnit === MeasurementUnit.IMPERIAL
        ? "Imperial (tsp, cups)"
        : "Metric (ml, L)",
    system:
      getUserMeasurementSystem(preferences) === MeasurementUnit.IMPERIAL
        ? "Imperial System"
        : "Metric System",
  };
}

/**
 * Smart preference suggestions based on user's location/browser
 */
export function suggestPreferencesFromLocale(): UserPreferences {
  // Try to detect user's locale preferences
  if (typeof window !== "undefined") {
    const locale = navigator.language || "en-US";

    // Countries that primarily use metric system
    const metricCountries = [
      "CA",
      "GB",
      "AU",
      "DE",
      "FR",
      "IT",
      "ES",
      "NL",
      "SE",
      "NO",
      "DK",
    ];
    const country = locale.split("-")[1];

    if (country && metricCountries.includes(country)) {
      return {
        preferredTemperatureUnit: TemperatureUnit.CELSIUS,
        preferredWeightUnit: MeasurementUnit.METRIC,
        preferredVolumeUnit: MeasurementUnit.METRIC,
      };
    }
  }

  // Default to imperial (US standard)
  return defaultUserPreferences;
}

/**
 * Convert preference values for form inputs
 */
export function preferencesToFormValues(preferences: UserPreferences) {
  return {
    temperatureUnit: preferences.preferredTemperatureUnit,
    weightUnit: preferences.preferredWeightUnit,
    volumeUnit: preferences.preferredVolumeUnit,
  };
}

/**
 * Convert form values back to preference format
 */
export function formValuesToPreferences(formValues: {
  temperatureUnit: string;
  weightUnit: string;
  volumeUnit: string;
}): UserPreferences {
  return {
    preferredTemperatureUnit: formValues.temperatureUnit as TemperatureUnit,
    preferredWeightUnit: formValues.weightUnit as MeasurementUnit,
    preferredVolumeUnit: formValues.volumeUnit as MeasurementUnit,
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
