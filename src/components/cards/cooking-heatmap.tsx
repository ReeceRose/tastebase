import type { HeatmapWeek } from "@/lib/types/journal-lookback-types";
import { cn } from "@/lib/utils";
import { dayToTimestamp } from "@/lib/utils/journal";
import { HEAT_LEVELS, heatLevel } from "@/lib/utils/journal-lookback";

const LEVEL_CLASSES = [
  "bg-muted",
  "bg-swatch-leek/30",
  "bg-swatch-leek/55",
  "bg-swatch-leek/80",
  "bg-swatch-leek",
];

const WEEKDAY_LABELS = [
  { key: "sun", label: "" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "" },
];

interface CookingHeatmapProps {
  year: number;
  weeks: HeatmapWeek[];
  busiestDay: number;
  cookingDays: number;
}

function describeDay(day: string, count: number): string {
  const date = dayToTimestamp(day).toLocaleDateString("en-CA", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (count === 0) return `${date}: nothing logged`;
  return `${date}: cooked ${count === 1 ? "once" : `${count} times`}`;
}

export function CookingHeatmap({
  year,
  weeks,
  busiestDay,
  cookingDays,
}: CookingHeatmapProps) {
  return (
    <section className="rounded-tile bg-card p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-heading">Cooking days</h2>
        <p className="text-meta text-muted-foreground">
          {cookingDays} {cookingDays === 1 ? "day" : "days"} in {year}
        </p>
      </div>
      <div className="overflow-x-auto pb-2">
        <div
          role="img"
          aria-label={`Cooked on ${cookingDays} days in ${year}. The busiest day had ${busiestDay} cooks.`}
          className="grid min-w-[560px] grid-flow-col grid-rows-[auto_repeat(7,auto)] gap-[3px] sm:gap-1"
          style={{
            gridTemplateColumns: `auto repeat(${weeks.length}, minmax(0, 1fr))`,
          }}
        >
          <span />
          {WEEKDAY_LABELS.map(({ key, label }) => (
            <span
              key={`heatmap-weekday-${key}`}
              className="flex items-center pr-2 text-caption leading-none text-muted-foreground"
            >
              {label}
            </span>
          ))}
          {weeks.map((week) => [
            <span
              key={`${week.key}-month`}
              className="relative h-5 text-caption whitespace-nowrap text-muted-foreground"
            >
              {week.monthLabel && (
                <span className="absolute left-0">{week.monthLabel}</span>
              )}
            </span>,
            ...week.days.map((day) => (
              <span
                key={day.day}
                title={day.inYear ? describeDay(day.day, day.count) : ""}
                className={cn(
                  "aspect-square w-full rounded-[3px] sm:rounded-[4px]",
                  day.inYear
                    ? LEVEL_CLASSES[heatLevel(day.count, busiestDay)]
                    : "invisible",
                )}
              />
            )),
          ])}
        </div>
      </div>
      <div
        aria-hidden
        className="mt-2 flex items-center justify-end gap-[3px] text-caption text-muted-foreground"
      >
        <span className="mr-1">Less</span>
        {LEVEL_CLASSES.slice(0, HEAT_LEVELS + 1).map((level) => (
          <span key={level} className={cn("size-3 rounded-[3px]", level)} />
        ))}
        <span className="ml-1">More</span>
      </div>
    </section>
  );
}
