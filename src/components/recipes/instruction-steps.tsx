"use client";

import { CheckCircle2, Clock, Thermometer } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TemperatureDisplay } from "@/components/ui/temperature-display";
import { TemperatureUnit } from "@/lib/types";
import type { RecipeInstruction } from "@/lib/types/recipe-types";
import { formatTime, groupInstructionsByGroup } from "@/lib/utils/recipe-utils";

/**
 * Parse instruction text and replace temperatures with interactive components
 */
function parseInstructionWithTemperatures(
  instruction: string,
  instructionId: string,
  showToggles: boolean,
  userTemperaturePreference: TemperatureUnit,
) {
  // Regex to match temperature patterns like 375°F, 190°C, 350 degrees F, etc.
  const tempRegex = /(\d+)\s*°?\s*([FC]|degrees?\s*[FC]?|fahrenheit|celsius)/gi;

  if (!showToggles) {
    return instruction;
  }

  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  let tempIndex = 0;

  // Find all temperature matches
  let match: RegExpExecArray | null = tempRegex.exec(instruction);
  while (match !== null) {
    const fullMatch = match[0];
    const temperature = match[1];
    const unit = match[2].toLowerCase();

    // Determine the unit
    let tempUnit = "°F"; // default
    if (unit.startsWith("c") || unit.includes("celsius")) {
      tempUnit = "°C";
    }

    const normalizedTemp = `${temperature}${tempUnit}`;

    // Add text before this temperature
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${tempIndex}`}>
          {instruction.slice(lastIndex, match.index)}
        </span>,
      );
    }

    // Add interactive temperature component
    parts.push(
      <TemperatureDisplay
        key={`temp-${instructionId}-${tempIndex}`}
        id={`temp-${instructionId}-${tempIndex}`}
        temperature={normalizedTemp}
        userPreference={userTemperaturePreference}
        showToggle={true}
        showUnit={true}
        className="inline"
      />,
    );

    lastIndex = match.index + fullMatch.length;
    tempIndex++;
    match = tempRegex.exec(instruction);
  }

  // Add remaining text after last temperature
  if (lastIndex < instruction.length) {
    parts.push(
      <span key={`text-${tempIndex}`}>{instruction.slice(lastIndex)}</span>,
    );
  }

  // If no temperatures found, return original text
  if (parts.length === 0) {
    return instruction;
  }

  return <>{parts}</>;
}

interface InstructionStepsProps {
  instructions: RecipeInstruction[];
  showCheckboxes?: boolean;
  showToggles?: boolean;
  userTemperaturePreference?: TemperatureUnit;
  className?: string;
}

export function InstructionSteps({
  instructions,
  showCheckboxes = true,
  showToggles = false,
  userTemperaturePreference = TemperatureUnit.FAHRENHEIT,
  className,
}: InstructionStepsProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const groupedInstructions = groupInstructionsByGroup(instructions);

  const toggleStep = (instructionId: string) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(instructionId)) {
        newSet.delete(instructionId);
      } else {
        newSet.add(instructionId);
      }
      return newSet;
    });
  };

  const completedCount = completedSteps.size;

  if (instructions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No instructions provided</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedInstructions).map(
          ([groupName, groupInstructions]) => (
            <div key={groupName}>
              {Object.keys(groupedInstructions).length > 1 && (
                <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  {groupName}
                </h4>
              )}

              <div className="space-y-4">
                {groupInstructions.map((instruction) => {
                  const isCompleted = completedSteps.has(instruction.id);

                  return (
                    <div key={instruction.id} className="flex gap-4 group">
                      {showCheckboxes && (
                        <div className="mt-1">
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => toggleStep(instruction.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </div>
                      )}

                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                            isCompleted
                              ? "bg-primary/60 text-primary-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            instruction.stepNumber
                          )}
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <p
                          className={`text-sm leading-relaxed transition-all duration-200 ${
                            isCompleted
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {parseInstructionWithTemperatures(
                            instruction.instruction,
                            instruction.id,
                            showToggles || false,
                            userTemperaturePreference ||
                              TemperatureUnit.FAHRENHEIT,
                          )}
                        </p>

                        {(instruction.timeMinutes ||
                          instruction.temperature ||
                          instruction.notes) && (
                          <div className="flex flex-wrap gap-2">
                            {instruction.timeMinutes && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(instruction.timeMinutes)}
                              </Badge>
                            )}

                            {instruction.temperature && (
                              <Badge variant="secondary" className="text-xs">
                                <Thermometer className="w-3 h-3 mr-1" />
                                {showToggles ? (
                                  <TemperatureDisplay
                                    id={instruction.id}
                                    temperature={instruction.temperature}
                                    userPreference={userTemperaturePreference}
                                    showToggle={true}
                                    showUnit={true}
                                  />
                                ) : (
                                  instruction.temperature
                                )}
                              </Badge>
                            )}
                          </div>
                        )}

                        {instruction.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            Note: {instruction.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ),
        )}

        {showCheckboxes && completedCount > 0 && (
          <div className="pt-3 border-t mt-4">
            <p className="text-sm text-muted-foreground">
              {completedCount} of {instructions.length} steps completed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
