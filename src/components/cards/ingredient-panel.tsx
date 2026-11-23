"use client";

import { useState } from "react";
import { ServingsStepper } from "@/components/forms/servings-stepper";
import { IngredientList } from "@/components/recipes/ingredient-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useIngredientTicks } from "@/hooks/use-ingredient-ticks";
import { useServingsScale } from "@/hooks/use-servings-scale";
import { MeasurementUnit } from "@/lib/types";
import type { RecipeIngredient } from "@/lib/types/recipe-types";

interface IngredientPanelProps {
  recipeId: string;
  ingredients: RecipeIngredient[];
  servings: number | null;
  preferredSystem: MeasurementUnit;
}

const UNIT_OPTIONS = [
  { value: MeasurementUnit.METRIC, label: "Metric" },
  { value: MeasurementUnit.IMPERIAL, label: "Imperial" },
];

export function IngredientPanel({
  recipeId,
  ingredients,
  servings,
  preferredSystem,
}: IngredientPanelProps) {
  const scale = useServingsScale(servings);
  const { ticked, toggle, reset } = useIngredientTicks(recipeId);
  const [system, setSystem] = useState<MeasurementUnit>(preferredSystem);

  return (
    <section
      aria-labelledby="ingredients-title"
      className="rounded-tile bg-card p-5 sm:p-6"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="ingredients-title" className="text-heading">
          Ingredients
        </h2>
        {scale.canScale && (
          <ServingsStepper
            servings={scale.servings}
            onDecrease={scale.decrease}
            onIncrease={scale.increase}
          />
        )}
      </div>

      {scale.isScaled && (
        <p
          role="note"
          className="mb-4 rounded-control bg-background px-4 py-3 text-meta"
        >
          <span className="font-extrabold">
            Scaled from {scale.original} to {scale.servings} servings.
          </span>{" "}
          Amounts are simply multiplied, so check seasoning, pan size and
          cooking times. Amounts in the method aren't scaled.
        </p>
      )}

      {ingredients.length === 0 ? (
        <p className="text-muted-foreground">No ingredients listed yet.</p>
      ) : (
        <IngredientList
          ingredients={ingredients}
          factor={scale.factor}
          system={system}
          ticked={ticked}
          onToggle={toggle}
        />
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-background pt-4">
        <SegmentedControl
          label="Units"
          options={UNIT_OPTIONS}
          value={system}
          onValueChange={(value) => setSystem(value as MeasurementUnit)}
          className="h-9"
        />
        <div className="flex gap-3 text-meta">
          {scale.isScaled && (
            <button
              type="button"
              onClick={scale.reset}
              className="underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              Back to {scale.original}
            </button>
          )}
          {ticked.size > 0 && (
            <button
              type="button"
              onClick={reset}
              className="underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              Untick all
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
