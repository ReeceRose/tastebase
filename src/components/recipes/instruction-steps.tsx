import type { RecipeSwatch, TemperatureUnit } from "@/lib/types";
import type { RecipeInstruction } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { convertTemperaturesInText } from "@/lib/utils/ingredient-scaling";
import { groupInstructionsByGroup } from "@/lib/utils/recipe-utils";
import { stepSwatch, swatchClasses } from "@/lib/utils/swatches";
import { formatTotalTime } from "@/lib/utils/time-formatting";
import { formatTemperatureForDisplay } from "@/lib/utils/unit-conversions";

interface InstructionStepsProps {
  instructions: RecipeInstruction[];
  swatch: RecipeSwatch;
  temperatureUnit: TemperatureUnit;
}

export function InstructionSteps({
  instructions,
  swatch,
  temperatureUnit,
}: InstructionStepsProps) {
  if (instructions.length === 0) {
    return (
      <p className="rounded-tile bg-card p-6 text-muted-foreground">
        No steps written down yet.
      </p>
    );
  }

  const groups = Object.entries(groupInstructionsByGroup([...instructions]));
  const showGroupNames = groups.length > 1;
  let stepIndex = 0;

  return (
    <div className="space-y-6">
      {groups.map(([groupName, steps]) => (
        <div key={groupName} className="space-y-2.5">
          {showGroupNames && (
            <h3 className="text-meta text-muted-foreground">{groupName}</h3>
          )}
          <ol className="space-y-2.5">
            {steps.map((step) => {
              const index = stepIndex++;
              const disc = swatchClasses(stepSwatch(swatch, index));
              const time = formatTotalTime(step.timeMinutes);
              const temperature = step.temperature
                ? formatTemperatureForDisplay(step.temperature, temperatureUnit)
                : null;

              return (
                <li
                  key={step.id}
                  className="grid grid-cols-[44px_1fr] gap-4 rounded-tile bg-card p-4 sm:p-5"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-11 place-items-center rounded-full text-lg font-extrabold",
                      disc.bg,
                      disc.fg,
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 self-center">
                    <span className="sr-only">Step {index + 1}. </span>
                    <p className="text-lead leading-snug">
                      {convertTemperaturesInText(
                        step.instruction,
                        temperatureUnit,
                      )}
                    </p>
                    {(time || temperature || step.notes) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-meta">
                        {time && (
                          <span className="rounded-full bg-background px-3 py-1 tabular">
                            {time}
                          </span>
                        )}
                        {temperature && (
                          <span className="rounded-full bg-background px-3 py-1 tabular">
                            {temperature}
                          </span>
                        )}
                        {step.notes && (
                          <span className="font-normal text-muted-foreground">
                            {step.notes}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
