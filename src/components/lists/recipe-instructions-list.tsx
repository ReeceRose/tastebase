"use client";

import { ChefHat, Clock, Thermometer } from "lucide-react";
import { useState } from "react";
import { RecipeInstructionsListSkeleton } from "@/components/skeletons/recipe-instructions-list-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { RecipeInstruction } from "@/lib/types/recipe-types";
import { formatTime, groupInstructionsByGroup } from "@/lib/utils/recipe-utils";

interface RecipeInstructionsListProps {
  instructions: RecipeInstruction[];
  showCheckboxes?: boolean;
  showGroupHeadings?: boolean;
  className?: string;
  loading?: boolean;
}

export function RecipeInstructionsList({
  instructions,
  showCheckboxes = true,
  showGroupHeadings = true,
  className,
  loading = false,
}: RecipeInstructionsListProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

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

  const toggleAllSteps = () => {
    if (completedSteps.size === instructions.length) {
      setCompletedSteps(new Set());
    } else {
      setCompletedSteps(new Set(instructions.map((inst) => inst.id)));
    }
  };

  const groupedInstructions = showGroupHeadings
    ? groupInstructionsByGroup(instructions)
    : { Instructions: instructions };

  const allCompleted = completedSteps.size === instructions.length;
  const someCompleted = completedSteps.size > 0;

  if (loading) {
    return (
      <div className={className}>
        <RecipeInstructionsListSkeleton
          showCheckboxes={showCheckboxes}
          instructionCount={instructions.length || 5}
        />
      </div>
    );
  }

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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Instructions
            <Badge variant="secondary" className="text-xs">
              {instructions.length} steps
            </Badge>
          </CardTitle>

          {showCheckboxes && instructions.length > 1 && (
            <Button variant="outline" size="sm" onClick={toggleAllSteps}>
              {allCompleted ? "Reset All" : "Complete All"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {Object.entries(groupedInstructions).map(
          ([groupName, groupInstructions]) => (
            <div key={groupName}>
              {showGroupHeadings &&
                Object.keys(groupedInstructions).length > 1 && (
                  <h4 className="font-medium text-sm text-muted-foreground mb-4 uppercase tracking-wide">
                    {groupName}
                  </h4>
                )}

              <div className="space-y-4">
                {groupInstructions.map((instruction, index) => {
                  const isCompleted = completedSteps.has(instruction.id);
                  const stepNumber = instruction.stepNumber || index + 1;

                  return (
                    <div key={instruction.id} className="flex gap-4 group">
                      <div className="flex-shrink-0 flex flex-col items-center">
                        {showCheckboxes ? (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => toggleStep(instruction.id)}
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {stepNumber}
                          </div>
                        )}

                        {index < groupInstructions.length - 1 && (
                          <div className="w-px bg-border mt-2 flex-1 min-h-[20px]"></div>
                        )}
                      </div>

                      <div
                        className={`flex-1 pb-4 ${isCompleted ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-sm text-muted-foreground">
                            Step {stepNumber}
                          </span>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {instruction.timeMinutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatTime(instruction.timeMinutes)}
                                </span>
                              </div>
                            )}

                            {instruction.temperature && (
                              <div className="flex items-center gap-1">
                                <Thermometer className="h-3 w-3" />
                                <span>{instruction.temperature}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <p
                          className={`text-sm leading-relaxed ${isCompleted ? "line-through" : ""}`}
                        >
                          {instruction.instruction}
                        </p>

                        {instruction.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            💡 {instruction.notes}
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

        {someCompleted && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                {completedSteps.size} of {instructions.length} steps completed
              </p>

              <div className="flex items-center gap-2">
                <div className="w-20 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(completedSteps.size / instructions.length) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="text-xs font-medium">
                  {Math.round(
                    (completedSteps.size / instructions.length) * 100,
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
