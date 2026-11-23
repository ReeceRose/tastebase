"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";
import {
  EditorField,
  EditorSectionCard,
} from "@/components/forms/recipe-editor/editor-field";
import { Input } from "@/components/ui/input";
import { EditorSection } from "@/lib/types";
import { NutrientUnit } from "@/lib/types/nutrition-types";
import type { RecipeEditorValues } from "@/lib/types/recipe-types";
import { numberOrNull } from "@/lib/utils/form-values";
import { NUTRIENTS } from "@/lib/utils/nutrition";

const textOrNull = (value: string | null) => value?.trim() || null;

export function EditorNutrition() {
  const baseId = useId();
  const servingSizeId = useId();
  const {
    register,
    formState: { errors },
  } = useFormContext<RecipeEditorValues>();

  return (
    <EditorSectionCard
      id={EditorSection.NUTRITION}
      title="Nutrition"
      description="Per serving. Filled in when the recipe's page lists it; leave it blank if you don't track it."
    >
      <div className="space-y-5">
        <EditorField
          id={servingSizeId}
          label="Serving size"
          error={errors.nutrition?.servingSize?.message}
          className="max-w-sm"
        >
          <Input
            id={servingSizeId}
            {...register("nutrition.servingSize", { setValueAs: textOrNull })}
            placeholder="1 bowl"
          />
        </EditorField>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {NUTRIENTS.map((nutrient) => {
            const id = `${baseId}-${nutrient.key}`;
            return (
              <EditorField
                key={nutrient.key}
                id={id}
                label={
                  nutrient.unit === NutrientUnit.KCAL
                    ? nutrient.label
                    : `${nutrient.label} (${nutrient.unit})`
                }
                error={errors.nutrition?.[nutrient.key]?.message}
              >
                <Input
                  id={id}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  {...register(`nutrition.${nutrient.key}`, {
                    setValueAs: numberOrNull,
                  })}
                />
              </EditorField>
            );
          })}
        </div>
      </div>
    </EditorSectionCard>
  );
}
