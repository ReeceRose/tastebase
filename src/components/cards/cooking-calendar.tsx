import Image from "next/image";
import type { CalendarDay } from "@/lib/types/journal-lookback-types";
import { cn } from "@/lib/utils";
import { dayToTimestamp } from "@/lib/utils/journal";
import { plural } from "@/lib/utils/journal-stats";
import { swatchClasses } from "@/lib/utils/swatches";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOT_LIMIT = 3;

interface CookingCalendarProps {
  weeks: CalendarDay[][];
  today: string;
}

interface DayContentProps {
  day: CalendarDay;
  today: string;
}

function describeDay(day: CalendarDay): string {
  const date = dayToTimestamp(day.day).toLocaleDateString("en-CA", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const made = day.recipes.map((recipe) => recipe.title).join(", ");
  if (made) return `${date}: ${made}`;
  if (day.cooks > 0) {
    return `${date}: cooked ${day.cooks} ${plural(day.cooks, "time", "times")}`;
  }
  if (day.entries > 0) {
    return `${date}: ${day.entries} ${plural(day.entries, "entry", "entries")}`;
  }
  return `${date}: nothing logged`;
}

function DayContent({ day, today }: DayContentProps) {
  const extra = day.recipes.length - DOT_LIMIT;
  return (
    <>
      {day.photo && (
        <>
          <Image
            src={`/api/recipes/images/${day.photo}`}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
            unoptimized
          />
          <span className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />
        </>
      )}
      <span
        className={cn(
          "relative text-meta font-extrabold tabular",
          day.photo && "text-white",
          day.day === today &&
            "grid size-7 place-items-center rounded-full bg-foreground text-background",
        )}
      >
        {parseInt(day.day.slice(8), 10)}
      </span>
      {day.recipes.length > 0 && (
        <span className="relative mt-auto flex flex-wrap items-center gap-1">
          {day.recipes.slice(0, DOT_LIMIT).map((recipe) => (
            <span
              key={recipe.id}
              className={cn(
                "size-2.5 rounded-full ring-2 ring-card sm:size-3",
                swatchClasses(recipe.swatch).bg,
              )}
            />
          ))}
          {extra > 0 && (
            <span
              className={cn(
                "text-caption font-bold",
                day.photo ? "text-white" : "text-muted-foreground",
              )}
            >
              +{extra}
            </span>
          )}
        </span>
      )}
    </>
  );
}

export function CookingCalendar({ weeks, today }: CookingCalendarProps) {
  return (
    <section className="rounded-tile bg-card p-4 sm:p-6">
      <h2 className="sr-only">Calendar</h2>
      <div
        aria-hidden
        className="mb-2 grid grid-cols-7 gap-1.5 text-center text-caption text-muted-foreground sm:gap-2"
      >
        {WEEKDAYS.map((weekday) => (
          <span key={weekday}>
            <span className="sm:hidden">{weekday.charAt(0)}</span>
            <span className="hidden sm:inline">{weekday}</span>
          </span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weeks.flat().map((day) => {
          const label = describeDay(day);
          const cellClass = cn(
            "relative flex aspect-square flex-col overflow-hidden rounded-[10px] p-1.5 sm:aspect-[5/4] sm:rounded-control sm:p-2.5",
            day.cooks > 0 || day.entries > 0
              ? "bg-muted"
              : "bg-muted/40 text-muted-foreground",
            day.day > today && "opacity-40",
          );
          if (!day.inMonth) {
            return <li key={day.day} aria-hidden className="invisible" />;
          }
          return (
            <li key={day.day}>
              {day.entries > 0 ? (
                <a
                  href={`#journal-${day.day}`}
                  title={label}
                  aria-label={label}
                  className={cn(
                    cellClass,
                    "outline-none hover:ring-2 hover:ring-foreground/40 focus-visible:ring-[3px] focus-visible:ring-ring",
                  )}
                >
                  <DayContent day={day} today={today} />
                </a>
              ) : (
                <div title={label} className={cellClass}>
                  <span className="sr-only">{label}</span>
                  <span aria-hidden className="contents">
                    <DayContent day={day} today={today} />
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
