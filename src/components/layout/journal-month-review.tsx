import Link from "next/link";
import { CookingCalendar } from "@/components/cards/cooking-calendar";
import { JournalStatTiles } from "@/components/cards/journal-stat-tiles";
import { JournalEntryFeed } from "@/components/lists/journal-entry-feed";
import { RecipeRowList } from "@/components/lists/recipe-row-list";
import { TopRecipesList } from "@/components/lists/top-recipes-list";
import { JournalMonthNav } from "@/components/navigation/journal-month-nav";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getMonthReview } from "@/lib/server-actions/journal-month-actions";
import { ButtonVariant } from "@/lib/types";
import type { MonthReview } from "@/lib/types/journal-lookback-types";
import type { JournalGroup } from "@/lib/types/journal-types";
import { timestampToDay } from "@/lib/utils/journal";
import { monthName, shiftMonth } from "@/lib/utils/journal-lookback";
import {
  monthComparison,
  monthStatTiles,
  plural,
} from "@/lib/utils/journal-stats";

interface JournalMonthReviewProps {
  year: number;
  month: number;
  currentUserId: string;
}

function groupByDay(review: MonthReview): JournalGroup[] {
  const groups: JournalGroup[] = [];
  for (const entry of review.entries) {
    const day = timestampToDay(entry.happenedAt);
    const group = groups.at(-1);
    if (group?.key === day) {
      group.entries.push(entry);
      continue;
    }
    groups.push({
      key: day,
      label: entry.happenedAt.toLocaleDateString("en-CA", {
        timeZone: "UTC",
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      entries: [entry],
    });
  }
  return groups;
}

function summary(review: MonthReview): string {
  const { cooks, cookingDays } = review.totals;
  const previous = shiftMonth(review.year, review.month, -1);
  const comparison = monthComparison(
    cooks,
    review.previousCooks,
    monthName(previous.year, previous.month, previous.year !== review.year),
  );
  if (cooks === 0) return "No cooks logged, just notes and photos.";
  return `You cooked ${cooks} ${plural(cooks, "time", "times")} across ${cookingDays} ${plural(cookingDays, "day", "days")}. ${comparison}`;
}

export async function JournalMonthReview({
  year,
  month,
  currentUserId,
}: JournalMonthReviewProps) {
  const review = await getMonthReview(year, month);

  if (!review) {
    return (
      <p role="alert" className="text-destructive">
        This month didn't load. Try again.
      </p>
    );
  }

  const { totals } = review;
  const name = monthName(year, month, false);
  const empty = totals.cooks === 0 && review.entries.length === 0;

  return (
    <div className="space-y-8">
      <JournalMonthNav year={year} older={review.older} newer={review.newer} />

      {empty ? (
        <EmptyState
          title={`Nothing logged in ${name}`}
          description="Mark recipes as cooked or add journal entries, and this page fills in with your month."
          action={
            <Button variant={ButtonVariant.ACCENT} asChild>
              <Link href="/journal">Go to your journal</Link>
            </Button>
          }
        />
      ) : (
        <>
          <p className="max-w-[60ch] text-lead text-muted-foreground">
            {summary(review)}
          </p>

          <JournalStatTiles stats={monthStatTiles(totals)} />

          <CookingCalendar weeks={review.weeks} today={review.today} />

          {(review.topRecipes.length > 0 || review.firstTries.length > 0) && (
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
              {review.topRecipes.length > 0 && (
                <section className="rounded-tile bg-card p-6">
                  <h2 className="mb-3 text-heading">Most made</h2>
                  <TopRecipesList recipes={review.topRecipes} />
                </section>
              )}
              {review.firstTries.length > 0 && (
                <section className="rounded-tile bg-card p-6">
                  <h2 className="text-heading">First tries</h2>
                  <p className="mt-1 mb-3 text-meta text-muted-foreground">
                    Made for the first time in {name}.
                  </p>
                  <RecipeRowList
                    recipes={review.firstTries}
                    currentUserId={currentUserId}
                  />
                </section>
              )}
            </div>
          )}

          {review.entries.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-heading">Everything from {name}</h2>
              <JournalEntryFeed
                groups={groupByDay(review)}
                currentUserId={currentUserId}
                showAuthor={false}
                showRecipe
                timeline
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
