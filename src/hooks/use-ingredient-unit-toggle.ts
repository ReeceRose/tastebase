/**
 * Hook for managing per-ingredient unit conversion toggles
 * Allows users to temporarily switch individual ingredients between imperial/metric
 * without affecting their global unit preferences
 */

"use client";

import { useCallback, useState } from "react";
import { MeasurementUnit, TemperatureUnit } from "@/lib/types";
import { formatIngredientForDisplayEnhanced } from "@/lib/utils/enhanced-unit-conversions";
import {
  formatTemperatureForDisplay,
  getUnitCategory,
} from "@/lib/utils/unit-conversions";

interface IngredientToggleState {
  [key: string]: MeasurementUnit;
}

interface TemperatureToggleState {
  [key: string]: TemperatureUnit;
}

interface UseIngredientUnitToggleResult {
  // Ingredient toggles
  getIngredientDisplay: (
    id: string,
    amount: string,
    unit: string,
    userPreference: MeasurementUnit,
  ) => { amount: string; unit: string; isToggled: boolean };
  toggleIngredient: (id: string, userPreference: MeasurementUnit) => void;
  resetIngredient: (id: string) => void;
  resetAllIngredients: () => void;

  // Temperature toggles
  getTemperatureDisplay: (
    id: string,
    temperature: string,
    userPreference: TemperatureUnit,
  ) => { temperature: string; isToggled: boolean };
  toggleTemperature: (id: string, userPreference: TemperatureUnit) => void;
  resetTemperature: (id: string) => void;
  resetAllTemperatures: () => void;

  // Global reset
  resetAll: () => void;
}

export function useIngredientUnitToggle(): UseIngredientUnitToggleResult {
  const [ingredientToggles, setIngredientToggles] =
    useState<IngredientToggleState>({});
  const [temperatureToggles, setTemperatureToggles] =
    useState<TemperatureToggleState>({});

  const getIngredientDisplay = useCallback(
    (
      id: string,
      amount: string,
      unit: string,
      userPreference: MeasurementUnit,
    ) => {
      const toggledSystem = ingredientToggles[id];
      const displaySystem = toggledSystem || userPreference;
      const isToggled =
        toggledSystem !== undefined && toggledSystem !== userPreference;

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
        return {
          amount: amount || "",
          unit: unit || "",
          isToggled: false,
        };
      }

      // Check if this unit can be converted
      const unitCategory = getUnitCategory(unit);
      if (!unitCategory || unitCategory === "count") {
        return {
          amount: amount || "",
          unit: unit || "",
          isToggled: false,
        };
      }

      const converted = formatIngredientForDisplayEnhanced(
        amount,
        unit,
        displaySystem,
      );

      return {
        amount: converted.amount,
        unit: converted.unit,
        isToggled,
      };
    },
    [ingredientToggles],
  );

  const toggleIngredient = useCallback(
    (id: string, userPreference: MeasurementUnit) => {
      setIngredientToggles((prev) => {
        const current = prev[id] || userPreference;
        const newSystem =
          current === MeasurementUnit.IMPERIAL
            ? MeasurementUnit.METRIC
            : MeasurementUnit.IMPERIAL;

        // If toggling back to user preference, remove from state
        if (newSystem === userPreference) {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        }

        return {
          ...prev,
          [id]: newSystem,
        };
      });
    },
    [],
  );

  const resetIngredient = useCallback((id: string) => {
    setIngredientToggles((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  }, []);

  const resetAllIngredients = useCallback(() => {
    setIngredientToggles({});
  }, []);

  const getTemperatureDisplay = useCallback(
    (id: string, temperature: string, userPreference: TemperatureUnit) => {
      const toggledSystem = temperatureToggles[id];
      const displaySystem = toggledSystem || userPreference;
      const isToggled =
        toggledSystem !== undefined && toggledSystem !== userPreference;

      // Handle non-numeric temperatures
      const numericMatch = temperature.match(/(\d+)/);
      if (!numericMatch) {
        return {
          temperature,
          isToggled: false,
        };
      }

      const converted = formatTemperatureForDisplay(temperature, displaySystem);

      return {
        temperature: converted,
        isToggled,
      };
    },
    [temperatureToggles],
  );

  const toggleTemperature = useCallback(
    (id: string, userPreference: TemperatureUnit) => {
      setTemperatureToggles((prev) => {
        const current = prev[id] || userPreference;
        const newSystem =
          current === TemperatureUnit.FAHRENHEIT
            ? TemperatureUnit.CELSIUS
            : TemperatureUnit.FAHRENHEIT;

        // If toggling back to user preference, remove from state
        if (newSystem === userPreference) {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        }

        return {
          ...prev,
          [id]: newSystem,
        };
      });
    },
    [],
  );

  const resetTemperature = useCallback((id: string) => {
    setTemperatureToggles((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  }, []);

  const resetAllTemperatures = useCallback(() => {
    setTemperatureToggles({});
  }, []);

  const resetAll = useCallback(() => {
    resetAllIngredients();
    resetAllTemperatures();
  }, [resetAllIngredients, resetAllTemperatures]);

  return {
    getIngredientDisplay,
    toggleIngredient,
    resetIngredient,
    resetAllIngredients,
    getTemperatureDisplay,
    toggleTemperature,
    resetTemperature,
    resetAllTemperatures,
    resetAll,
  };
}
