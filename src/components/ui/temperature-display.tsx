/**
 * Temperature display component with modern click-on-unit conversion interface
 */

"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIngredientUnitToggle } from "@/hooks/use-ingredient-unit-toggle";
import { TemperatureUnit } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TemperatureDisplayProps {
  id?: string;
  temperature: string;
  userPreference?: TemperatureUnit;
  className?: string;
  showUnit?: boolean;
  showToggle?: boolean;
}

export function TemperatureDisplay({
  id,
  temperature,
  userPreference = TemperatureUnit.FAHRENHEIT,
  className,
  showUnit = true,
  showToggle = false,
}: TemperatureDisplayProps) {
  const toggleHook = useIngredientUnitToggle();
  const [_isHovered, setIsHovered] = useState(false);

  // Generate a fallback ID if none provided
  const tempId = id || `temp-${temperature}`.replace(/\s+/g, "-").toLowerCase();

  // Handle non-numeric temperatures (like "medium heat", "high heat")
  const numericMatch = temperature.match(/(\d+)/);
  const canConvert = Boolean(numericMatch);

  // Get display values and toggle state
  const { temperature: displayTemperature, isToggled } =
    toggleHook.getTemperatureDisplay(tempId, temperature, userPreference);

  // Get preview
  const previewSystem =
    userPreference === TemperatureUnit.FAHRENHEIT
      ? TemperatureUnit.CELSIUS
      : TemperatureUnit.FAHRENHEIT;

  const { temperature: previewTemperature } = toggleHook.getTemperatureDisplay(
    `preview-${tempId}`,
    temperature,
    isToggled ? userPreference : previewSystem,
  );

  const handleToggle = () => {
    if (canConvert) {
      toggleHook.toggleTemperature(tempId, userPreference);
    }
  };

  if (!canConvert || !showToggle) {
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

interface InstructionDisplayProps {
  id?: string;
  instruction: string;
  stepNumber: number;
  timeMinutes?: number;
  temperature?: string;
  notes?: string;
  userPreference?: TemperatureUnit;
  className?: string;
  showToggle?: boolean;
}

export function InstructionDisplay({
  id,
  instruction,
  stepNumber,
  timeMinutes,
  temperature,
  notes,
  userPreference = TemperatureUnit.FAHRENHEIT,
  className,
  showToggle = false,
}: InstructionDisplayProps) {
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium flex items-center justify-center">
          {stepNumber}
        </span>
        <div className="flex-1 space-y-2">
          <p className="text-sm leading-relaxed">{instruction}</p>

          {(timeMinutes || temperature) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {timeMinutes && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Time duration"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  {formatTime(timeMinutes)}
                </span>
              )}

              {temperature && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Temperature"
                  >
                    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
                  </svg>
                  <TemperatureDisplay
                    id={id ? `${id}-temp` : undefined}
                    temperature={temperature}
                    userPreference={userPreference}
                    showToggle={showToggle}
                  />
                </span>
              )}
            </div>
          )}

          {notes && (
            <p className="text-xs text-muted-foreground italic">💡 {notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface InstructionListDisplayProps {
  instructions: Array<{
    id?: string;
    stepNumber: number;
    instruction: string;
    timeMinutes?: number;
    temperature?: string;
    notes?: string;
    groupName?: string;
  }>;
  userPreference?: TemperatureUnit;
  className?: string;
  showToggles?: boolean;
  showResetButton?: boolean;
}

export function InstructionListDisplay({
  instructions,
  userPreference = TemperatureUnit.FAHRENHEIT,
  className,
  showToggles = false,
  showResetButton = false,
}: InstructionListDisplayProps) {
  const toggleHook = useIngredientUnitToggle();

  // Group instructions by groupName
  const groupedInstructions = instructions.reduce(
    (groups, instruction) => {
      const group = instruction.groupName || "main";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(instruction);
      return groups;
    },
    {} as Record<string, typeof instructions>,
  );

  // Sort instructions within each group by stepNumber
  Object.values(groupedInstructions).forEach((group) => {
    group.sort((a, b) => a.stepNumber - b.stepNumber);
  });

  // Check if any temperatures have toggles
  const hasToggles =
    showToggles &&
    instructions.some((instruction) => {
      if (!instruction.temperature) return false;
      const tempId = instruction.id
        ? `${instruction.id}-temp`
        : `temp-${instruction.temperature}`.replace(/\s+/g, "-").toLowerCase();
      const display = toggleHook.getTemperatureDisplay(
        tempId,
        instruction.temperature,
        userPreference,
      );
      return display.isToggled;
    });

  return (
    <div className={className}>
      {showResetButton && hasToggles && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={toggleHook.resetAllTemperatures}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60"
          >
            Reset Temperature Units
          </button>
        </div>
      )}

      {Object.entries(groupedInstructions).map(
        ([groupName, groupInstructions]) => (
          <div key={groupName} className="mb-6">
            {groupName !== "main" && (
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
                {groupName}
              </h4>
            )}
            <div className="space-y-4">
              {groupInstructions.map((instruction) => (
                <InstructionDisplay
                  key={instruction.id || instruction.stepNumber}
                  id={instruction.id}
                  instruction={instruction.instruction}
                  stepNumber={instruction.stepNumber}
                  timeMinutes={instruction.timeMinutes}
                  temperature={instruction.temperature}
                  notes={instruction.notes}
                  userPreference={userPreference}
                  showToggle={showToggles}
                />
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

/**
 * Helper to format time duration
 */
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}
