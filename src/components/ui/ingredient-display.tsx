/**
 * Ingredient display component with modern click-on-unit conversion interface
 */

"use client";

import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { User } from "@/db/schema.base";
import { useIngredientUnitToggle } from "@/hooks/use-ingredient-unit-toggle";
import { MeasurementUnit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatIngredientForDisplayEnhanced } from "@/lib/utils/enhanced-unit-conversions";
import { getUnitCategory } from "@/lib/utils/unit-conversions";

interface IngredientDisplayProps {
  id?: string;
  amount: string;
  unit: string;
  name: string;
  notes?: string;
  userPreferences?: Pick<User, "preferredWeightUnit" | "preferredVolumeUnit">;
  className?: string;
  showToggle?: boolean;
}

export function IngredientDisplay({
  id,
  amount,
  unit,
  name,
  notes,
  userPreferences,
  className,
  showToggle = false,
}: IngredientDisplayProps) {
  const toggleHook = useIngredientUnitToggle();
  const [_isHovered, setIsHovered] = useState(false);
  const userSystem = getUserSystem(userPreferences);

  // Generate a fallback ID if none provided
  const ingredientId =
    id || `${name}-${amount}-${unit}`.replace(/\s+/g, "-").toLowerCase();

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
  } = toggleHook.getIngredientDisplay(ingredientId, amount, unit, userSystem);

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

  const handleToggle = () => {
    if (canConvert) {
      toggleHook.toggleIngredient(ingredientId, userSystem);
    }
  };

  const unitDisplayText =
    displayUnit && displayUnit !== "whole" ? displayUnit : "";

  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      {showToggle && canConvert ? (
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
                  {previewResult.amount} {previewResult.unit}
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

interface IngredientListDisplayProps {
  ingredients: Array<{
    id?: string;
    name: string;
    amount: string;
    unit: string;
    notes?: string;
    groupName?: string;
    sortOrder: number;
    isOptional?: boolean;
  }>;
  userPreferences?: Pick<User, "preferredWeightUnit" | "preferredVolumeUnit">;
  className?: string;
  showToggles?: boolean;
  showResetButton?: boolean;
}

export function IngredientListDisplay({
  ingredients,
  userPreferences,
  className,
  showToggles = false,
  showResetButton = false,
}: IngredientListDisplayProps) {
  const toggleHook = useIngredientUnitToggle();

  // Group ingredients by groupName
  const groupedIngredients = ingredients.reduce(
    (groups, ingredient) => {
      const group = ingredient.groupName || "main";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(ingredient);
      return groups;
    },
    {} as Record<string, typeof ingredients>,
  );

  // Sort ingredients within each group by sortOrder
  Object.values(groupedIngredients).forEach((group) => {
    group.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  // Check if any ingredients have toggles
  const hasToggles =
    showToggles &&
    ingredients.some((ingredient) => {
      const ingredientId =
        ingredient.id ||
        `${ingredient.name}-${ingredient.amount}-${ingredient.unit}`
          .replace(/\s+/g, "-")
          .toLowerCase();
      const display = toggleHook.getIngredientDisplay(
        ingredientId,
        ingredient.amount,
        ingredient.unit,
        getUserSystem(userPreferences),
      );
      return display.isToggled;
    });

  return (
    <div className={className}>
      {showResetButton && hasToggles && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={toggleHook.resetAllIngredients}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60"
          >
            Reset All Units
          </button>
        </div>
      )}

      {Object.entries(groupedIngredients).map(
        ([groupName, groupIngredients]) => (
          <div key={groupName} className="mb-4">
            {groupName !== "main" && (
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                {groupName}
              </h4>
            )}
            <ul className="space-y-2">
              {groupIngredients.map((ingredient, index) => (
                <li
                  key={`${groupName}-${ingredient.id || ingredient.name}-${index}`}
                  className="flex items-start"
                >
                  <span className="text-muted-foreground mr-2">•</span>
                  <IngredientDisplay
                    id={ingredient.id}
                    amount={ingredient.amount}
                    unit={ingredient.unit}
                    name={ingredient.name}
                    notes={ingredient.notes}
                    userPreferences={userPreferences}
                    showToggle={showToggles}
                    className={cn(
                      "flex-1",
                      ingredient.isOptional ? "text-muted-foreground" : "",
                    )}
                  />
                  {ingredient.isOptional && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (optional)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </div>
  );
}

/**
 * Helper to determine user's measurement system preference
 */
function getUserSystem(
  userPreferences?: Pick<User, "preferredWeightUnit" | "preferredVolumeUnit">,
): MeasurementUnit {
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
