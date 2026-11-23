import { PhotoStrip } from "@/components/recipes/photo-strip";
import type { TemperatureUnit } from "@/lib/types";
import type {
  CompareColumn,
  CompareRecipe,
} from "@/lib/types/recipe-compare-types";
import { cn } from "@/lib/utils";
import { compareGrid } from "@/lib/utils/compare-layout";
import { convertTemperaturesInText } from "@/lib/utils/ingredient-scaling";
import { photosForStep } from "@/lib/utils/photo-tags";
import { groupInstructionsByGroup } from "@/lib/utils/recipe-utils";
import { swatchClasses } from "@/lib/utils/swatches";

interface CompareMethodColumnsProps {
  items: CompareRecipe[];
  columns: CompareColumn[];
  temperatureUnit: TemperatureUnit;
}

function MethodColumn({
  item,
  column,
  temperatureUnit,
}: {
  item: CompareRecipe;
  column: CompareColumn;
  temperatureUnit: TemperatureUnit;
}) {
  const classes = swatchClasses(column.swatch);
  const groups = Object.entries(
    groupInstructionsByGroup([...item.recipe.instructions]),
  );
  const showGroupNames = groups.length > 1;
  const numbers = new Map(
    groups
      .flatMap(([, steps]) => steps)
      .map((step, index) => [step.id, index + 1]),
  );

  return (
    <section aria-label={column.title} className="min-w-0 space-y-4">
      <h3 className="sr-only">{column.title}</h3>
      {groups.length === 0 && (
        <p className="text-muted-foreground">No method written down.</p>
      )}
      {groups.map(([groupName, steps]) => (
        <div key={groupName}>
          {showGroupNames && (
            <h4 className="mb-2 text-meta text-muted-foreground">
              {groupName}
            </h4>
          )}
          <ol className="space-y-3">
            {steps.map((step) => (
              <li key={step.id} className="flex gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-extrabold tabular",
                    classes.bg,
                    classes.fg,
                  )}
                >
                  {numbers.get(step.id)}
                </span>
                <div className="min-w-0 space-y-2">
                  <p className="text-meta leading-relaxed">
                    {convertTemperaturesInText(
                      step.instruction,
                      temperatureUnit,
                    )}
                  </p>
                  <PhotoStrip
                    images={photosForStep(item.recipe.images, step.stepNumber)}
                    title={`${item.recipe.title}, step ${numbers.get(step.id)}`}
                    minimum={1}
                    label={`Photos for step ${numbers.get(step.id)}`}
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

export function CompareMethodColumns({
  items,
  columns,
  temperatureUnit,
}: CompareMethodColumnsProps) {
  return (
    <section aria-labelledby="compare-method-title" className="space-y-3">
      <h2
        id="compare-method-title"
        className="sticky left-0 w-fit px-1 text-heading"
      >
        Method
      </h2>
      <div className="rounded-tile bg-card p-5">
        <div
          className={cn(
            "grid items-start gap-x-6 gap-y-4",
            compareGrid(columns.length),
          )}
        >
          <span aria-hidden className="hidden lg:block" />
          {items.map((item, index) => (
            <MethodColumn
              key={item.recipe.id}
              item={item}
              column={columns[index]}
              temperatureUnit={temperatureUnit}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
