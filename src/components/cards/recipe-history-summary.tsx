import { Star } from "lucide-react";
import type { RecipeHistory } from "@/lib/types/journal-lookback-types";
import { dayToTimestamp } from "@/lib/utils/journal";
import { formatElapsed } from "@/lib/utils/time-formatting";

interface RecipeHistorySummaryProps {
  history: RecipeHistory;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function ago(date: Date): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  return `${formatElapsed(new Date(date))} ago`;
}

function monthYear(date: Date): string {
  return new Date(date).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
  });
}

export function RecipeHistorySummary({ history }: RecipeHistorySummaryProps) {
  if (history.count === 0 || !history.firstAt || !history.lastAt) return null;

  const sentence =
    history.count === 1
      ? `You made this once, ${ago(history.lastAt)}.`
      : `You've made this ${history.count} times. First in ${monthYear(history.firstAt)}, last ${ago(history.lastAt)}.`;

  return (
    <div className="space-y-2 rounded-tile bg-card px-5 py-4">
      <p className="font-semibold">{sentence}</p>
      {history.ratings.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 text-meta text-muted-foreground">
          <span>Your ratings:</span>
          <ol className="flex flex-wrap items-center gap-1">
            {history.ratings.map((item, index) => (
              <li
                key={`rating-${item.entryId}`}
                className="flex items-center gap-1"
              >
                {index > 0 && <span aria-hidden>→</span>}
                <span
                  title={dayToTimestamp(item.day).toLocaleDateString("en-CA", {
                    timeZone: "UTC",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 font-extrabold text-foreground tabular"
                >
                  {item.rating}
                  <Star
                    aria-hidden
                    className="size-3 fill-accent text-accent"
                  />
                  <span className="sr-only"> stars</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
