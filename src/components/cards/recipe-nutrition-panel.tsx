import { Panel } from "@/components/ui/panel";
import type { RecipeNutrition } from "@/lib/types/nutrition-types";
import {
  formatNutrient,
  hasNutrientValues,
  NUTRIENTS,
} from "@/lib/utils/nutrition";

interface RecipeNutritionPanelProps {
  nutrition: RecipeNutrition | null;
}

export function RecipeNutritionPanel({ nutrition }: RecipeNutritionPanelProps) {
  if (!nutrition || !hasNutrientValues(nutrition)) return null;

  const rows = NUTRIENTS.flatMap((nutrient) => {
    const value = formatNutrient(nutrition[nutrient.key], nutrient.unit);
    return value ? [{ key: nutrient.key, label: nutrient.label, value }] : [];
  });

  return (
    <Panel
      title="Nutrition"
      action={
        <span className="text-meta text-muted-foreground">
          {nutrition.servingSize
            ? `Per ${nutrition.servingSize}`
            : "Per serving"}
        </span>
      }
      className="p-5"
    >
      <dl className="space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-semibold tabular-nums">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
