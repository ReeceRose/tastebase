/**
 * React hook for managing user preferences in components
 */

import { useMemo } from "react";
import {
  MeasurementUnit,
  TemperatureUnit,
  type UserMeasurementPreferences,
  type UserPreferencesDisplay,
  type UserPreferencesSubset,
  type UserTemperaturePreference,
} from "@/lib/types";
import {
  getUserDisplayPreferences,
  getUserPreferencesWithFallback,
  type UserDisplayPreferences,
} from "@/lib/utils/user-preferences";

/**
 * Hook to get user preferences with computed display preferences
 */
export function useUserPreferences(
  user?: UserPreferencesSubset | null,
): UserDisplayPreferences {
  return useMemo(() => {
    const preferences = getUserPreferencesWithFallback(user);
    return getUserDisplayPreferences(preferences);
  }, [user]);
}

/**
 * Hook to get specific preference values for forms
 */
export function usePreferenceFormValues(user?: UserPreferencesSubset | null) {
  return useMemo(() => {
    const preferences = getUserPreferencesWithFallback(user);
    return {
      temperatureUnit: preferences.preferredTemperatureUnit,
      weightUnit: preferences.preferredWeightUnit,
      volumeUnit: preferences.preferredVolumeUnit,
    };
  }, [user]);
}

/**
 * Hook to determine if the user prefers metric system
 */
export function useIsMetricUser(
  user?: UserMeasurementPreferences | null,
): boolean {
  return useMemo(() => {
    if (!user) return false;
    return (
      user.preferredWeightUnit === MeasurementUnit.METRIC ||
      user.preferredVolumeUnit === MeasurementUnit.METRIC
    );
  }, [user]);
}

/**
 * Hook to get temperature preference specifically
 */
export function useTemperaturePreference(
  user?: UserTemperaturePreference | null,
): TemperatureUnit {
  return useMemo(() => {
    const temp = user?.preferredTemperatureUnit;
    return temp === TemperatureUnit.CELSIUS
      ? TemperatureUnit.CELSIUS
      : TemperatureUnit.FAHRENHEIT;
  }, [user]);
}

/**
 * Hook to get measurement system preference
 */
export function useMeasurementSystem(
  user?: UserMeasurementPreferences | null,
): MeasurementUnit {
  return useMemo(() => {
    if (!user) return MeasurementUnit.IMPERIAL;

    if (
      user.preferredWeightUnit === MeasurementUnit.METRIC ||
      user.preferredVolumeUnit === MeasurementUnit.METRIC
    ) {
      return MeasurementUnit.METRIC;
    }

    return MeasurementUnit.IMPERIAL;
  }, [user]);
}

/**
 * Hook to get all preferences for ingredient display
 */
export function useIngredientPreferences(
  user?: UserMeasurementPreferences | null,
): UserPreferencesDisplay & {
  measurementSystem: MeasurementUnit;
} {
  return useMemo(() => {
    const weightUnit = user?.preferredWeightUnit || MeasurementUnit.IMPERIAL;
    const volumeUnit = user?.preferredVolumeUnit || MeasurementUnit.IMPERIAL;
    const measurementSystem =
      weightUnit === MeasurementUnit.METRIC ||
      volumeUnit === MeasurementUnit.METRIC
        ? MeasurementUnit.METRIC
        : MeasurementUnit.IMPERIAL;

    return {
      preferredWeightUnit: weightUnit,
      preferredVolumeUnit: volumeUnit,
      measurementSystem,
    };
  }, [user]);
}
