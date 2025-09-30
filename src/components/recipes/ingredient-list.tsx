"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { IngredientDisplay } from "@/components/ui/ingredient-display";
import type { User } from "@/db/schema.base";
import type { RecipeIngredient } from "@/lib/types/recipe-types";
import {
  formatIngredientAmount,
  groupIngredientsByGroup,
} from "@/lib/utils/recipe-utils";

interface IngredientListProps {
  ingredients: RecipeIngredient[];
  showCheckboxes?: boolean;
  showToggles?: boolean;
  userPreferences?: Pick<User, "preferredWeightUnit" | "preferredVolumeUnit">;
  className?: string;
}

export function IngredientList({
  ingredients,
  showCheckboxes = false,
  showToggles = false,
  userPreferences,
  className,
}: IngredientListProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
    new Set(),
  );
  const groupedIngredients = groupIngredientsByGroup(ingredients);

  const toggleIngredient = (ingredientId: string) => {
    setCheckedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  const checkedCount = checkedIngredients.size;

  if (ingredients.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No ingredients listed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Ingredients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedIngredients).map(
          ([groupName, groupIngredients]) => (
            <div key={groupName}>
              {Object.keys(groupedIngredients).length > 1 && (
                <h4 className="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                  {groupName}
                </h4>
              )}

              <div className="space-y-3">
                {groupIngredients.map((ingredient) => {
                  const isChecked = checkedIngredients.has(ingredient.id);

                  return (
                    <div
                      key={ingredient.id}
                      className="flex items-start gap-3 group"
                    >
                      {showCheckboxes && (
                        <div className="mt-0.5">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() =>
                              toggleIngredient(ingredient.id)
                            }
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          {showToggles ? (
                            <IngredientDisplay
                              id={ingredient.id}
                              amount={ingredient.amount || ""}
                              unit={ingredient.unit || ""}
                              name={ingredient.name}
                              notes={ingredient.notes || undefined}
                              userPreferences={userPreferences}
                              showToggle={true}
                              className={`text-sm leading-relaxed transition-all duration-200 ${
                                isChecked
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            />
                          ) : (
                            <span
                              className={`text-sm leading-relaxed transition-all duration-200 ${
                                isChecked
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {formatIngredientAmount(ingredient)}
                            </span>
                          )}

                          {ingredient.isOptional && (
                            <Badge variant="outline" className="text-xs">
                              optional
                            </Badge>
                          )}
                        </div>

                        {ingredient.notes && !showToggles && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {ingredient.notes}
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

        {showCheckboxes && checkedCount > 0 && (
          <div className="pt-3 border-t mt-4">
            <p className="text-sm text-muted-foreground">
              {checkedCount} of {ingredients.length} ingredients checked
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
