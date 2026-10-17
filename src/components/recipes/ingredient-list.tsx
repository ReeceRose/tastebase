"use client";

import { Check } from "lucide-react";
import type { MeasurementUnit } from "@/lib/types";
import type { RecipeIngredient } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { displayIngredientAmount } from "@/lib/utils/ingredient-scaling";
import { groupIngredientsByGroup } from "@/lib/utils/recipe-utils";

interface IngredientListProps {
  ingredients: RecipeIngredient[];
  factor: number;
  system: MeasurementUnit | null;
  ticked: Set<string>;
  onToggle: (ingredientId: string) => void;
  large?: boolean;
}

export function IngredientList({
  ingredients,
  factor,
  system,
  ticked,
  onToggle,
  large = false,
}: IngredientListProps) {
  const groups = Object.entries(groupIngredientsByGroup([...ingredients]));
  const showGroupNames = groups.length > 1;

  return (
    <div className="space-y-5">
      {groups.map(([groupName, items]) => (
        <div key={groupName}>
          {showGroupNames && (
            <h3 className="mb-1 text-meta text-muted-foreground">
              {groupName}
            </h3>
          )}
          <ul className="divide-y-2 divide-background">
            {items.map((ingredient) => {
              const done = ticked.has(ingredient.id);
              const { amount, unit } = displayIngredientAmount(
                ingredient.amount,
                ingredient.unit,
                factor,
                system,
              );
              const quantity = [amount, unit].filter(Boolean).join(" ");

              return (
                <li key={ingredient.id}>
                  <label
                    className={cn(
                      "grid w-full cursor-pointer grid-cols-[22px_minmax(64px,auto)_1fr] items-start gap-x-3 rounded-sm py-2.5 text-left transition-opacity duration-150 has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring",
                      large ? "text-lead" : "text-body",
                      done && "opacity-45",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => onToggle(ingredient.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 grid size-5 place-items-center rounded-[7px] border-2 transition-colors duration-150",
                        done
                          ? "border-swatch-herb bg-swatch-herb text-swatch-herb-fg"
                          : "border-foreground",
                      )}
                    >
                      {done && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="font-extrabold tabular">
                      {quantity || "—"}
                    </span>
                    <span className={cn(done && "line-through decoration-2")}>
                      {ingredient.name}
                      {ingredient.notes && (
                        <span className="text-muted-foreground">
                          , {ingredient.notes}
                        </span>
                      )}
                      {ingredient.isOptional && (
                        <span className="text-muted-foreground">
                          {" "}
                          (optional)
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
