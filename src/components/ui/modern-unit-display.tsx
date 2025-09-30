/**
 * Modern unit display with intuitive click-on-unit interaction
 * Implements best practices for unit conversion UX
 */

"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIngredientUnitToggle } from "@/hooks/use-ingredient-unit-toggle";
import { MeasurementUnit, TemperatureUnit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatIngredientForDisplayEnhanced } from "@/lib/utils/enhanced-unit-conversions";
import { getUnitCategory } from "@/lib/utils/unit-conversions";

interface ModernIngredientDisplayProps {
  id: string;
  amount: string;
  unit: string;
  name: string;
  notes?: string;
  userPreferences?: {
    preferredWeightUnit?: MeasurementUnit;
    preferredVolumeUnit?: MeasurementUnit;
  };
  className?: string;
}

export function ModernIngredientDisplay({
  id,
  amount,
  unit,
  name,
  notes,
  userPreferences,
  className,
}: ModernIngredientDisplayProps) {
  const toggleHook = useIngredientUnitToggle();
  const [_isHovered, setIsHovered] = useState(false);

  const userSystem = getUserSystem(userPreferences);

  // Check if this ingredient can be converted
  const canConvert = useMemo(() => {
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
      return false;
    }

    const unitCategory = getUnitCategory(unit);
    return unitCategory && unitCategory !== "count";
  }, [amount, unit]);

  // Get display values and toggle state
  const {
    amount: displayAmount,
    unit: displayUnit,
    isToggled,
  } = toggleHook.getIngredientDisplay(id, amount, unit, userSystem);

  // Get preview of what conversion would show
  const previewSystem =
    userSystem === MeasurementUnit.IMPERIAL
      ? MeasurementUnit.METRIC
      : MeasurementUnit.IMPERIAL;

  const previewResult = formatIngredientForDisplayEnhanced(
    amount,
    unit,
    isToggled ? userSystem : previewSystem,
  );
  const previewAmount = previewResult.amount;
  const previewUnit = previewResult.unit;

  const handleToggle = () => {
    if (canConvert) {
      toggleHook.toggleIngredient(id, userSystem);
    }
  };

  const unitDisplayText =
    displayUnit && displayUnit !== "whole" ? displayUnit : "";

  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      {canConvert ? (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleToggle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                  "font-medium transition-all duration-200 rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5",
                  "hover:bg-primary/10 hover:text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  "active:scale-95",
                  isToggled && "text-primary bg-primary/5 shadow-sm",
                  "cursor-pointer select-none",
                )}
              >
                {displayAmount && `${displayAmount} `}
                {unitDisplayText}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="text-xs font-medium bg-background border shadow-lg"
              sideOffset={8}
            >
              <div className="flex flex-col gap-1">
                <div className="text-muted-foreground">
                  {isToggled ? "Converted from" : "Click to convert to"}
                </div>
                <div className="text-foreground font-semibold">
                  {previewAmount} {previewUnit}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="font-medium text-foreground">
          {displayAmount && `${displayAmount} `}
          {unitDisplayText}
        </span>
      )}

      <span className="font-medium text-foreground ml-1">{name}</span>

      {notes && (
        <span className="text-muted-foreground text-sm ml-2">({notes})</span>
      )}
    </span>
  );
}

interface ModernTemperatureDisplayProps {
  id: string;
  temperature: string;
  userPreference?: TemperatureUnit;
  className?: string;
  showUnit?: boolean;
}

export function ModernTemperatureDisplay({
  id,
  temperature,
  userPreference = TemperatureUnit.FAHRENHEIT,
  className,
  showUnit = true,
}: ModernTemperatureDisplayProps) {
  const toggleHook = useIngredientUnitToggle();
  const [_isHovered, setIsHovered] = useState(false);

  // Handle non-numeric temperatures
  const numericMatch = temperature.match(/(\d+)/);
  const canConvert = Boolean(numericMatch);

  // Get display values and toggle state
  const { temperature: displayTemperature, isToggled } =
    toggleHook.getTemperatureDisplay(id, temperature, userPreference);

  // Get preview
  const previewSystem =
    userPreference === TemperatureUnit.FAHRENHEIT
      ? TemperatureUnit.CELSIUS
      : TemperatureUnit.FAHRENHEIT;

  const { temperature: previewTemperature } = toggleHook.getTemperatureDisplay(
    `preview-${id}`,
    temperature,
    isToggled ? userPreference : previewSystem,
  );

  const handleToggle = () => {
    if (canConvert) {
      toggleHook.toggleTemperature(id, userPreference);
    }
  };

  if (!canConvert) {
    return (
      <span className={className}>
        {showUnit
          ? displayTemperature
          : displayTemperature.replace(/°[FC]/, "")}
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "transition-all duration-200 rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5",
              "hover:bg-primary/10 hover:text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              "active:scale-95",
              isToggled && "text-primary bg-primary/5 shadow-sm",
              "cursor-pointer select-none font-medium",
              className,
            )}
          >
            {showUnit
              ? displayTemperature
              : displayTemperature.replace(/°[FC]/, "")}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-xs font-medium bg-background border shadow-lg"
          sideOffset={8}
        >
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground">
              {isToggled ? "Converted from" : "Click to convert to"}
            </div>
            <div className="text-foreground font-semibold">
              {previewTemperature}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ModernUnitResetProps {
  onResetIngredients: () => void;
  onResetTemperatures: () => void;
  hasToggledIngredients: boolean;
  hasToggledTemperatures: boolean;
  className?: string;
}

export function ModernUnitReset({
  onResetIngredients,
  onResetTemperatures,
  hasToggledIngredients,
  hasToggledTemperatures,
  className,
}: ModernUnitResetProps) {
  const hasAnyToggles = hasToggledIngredients || hasToggledTemperatures;

  if (!hasAnyToggles) return null;

  const handleResetAll = () => {
    onResetIngredients();
    onResetTemperatures();
  };

  return (
    <div className={cn("flex justify-end gap-2", className)}>
      {hasToggledIngredients && hasToggledTemperatures ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          className="h-8 px-3 text-xs border-dashed hover:bg-muted/50"
        >
          <RotateCcw className="h-3 w-3 mr-1.5" />
          Reset All Units
        </Button>
      ) : (
        <>
          {hasToggledIngredients && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetIngredients}
              className="h-8 px-3 text-xs border-dashed hover:bg-muted/50"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Reset Ingredient Units
            </Button>
          )}
          {hasToggledTemperatures && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetTemperatures}
              className="h-8 px-3 text-xs border-dashed hover:bg-muted/50"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Reset Temperature Units
            </Button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Helper to determine user's measurement system preference
 */
function getUserSystem(userPreferences?: {
  preferredWeightUnit?: MeasurementUnit;
  preferredVolumeUnit?: MeasurementUnit;
}): MeasurementUnit {
  if (!userPreferences) return MeasurementUnit.IMPERIAL;

  // If either weight or volume preference is metric, show metric
  if (
    userPreferences.preferredWeightUnit === MeasurementUnit.METRIC ||
    userPreferences.preferredVolumeUnit === MeasurementUnit.METRIC
  ) {
    return MeasurementUnit.METRIC;
  }

  return MeasurementUnit.IMPERIAL;
}
