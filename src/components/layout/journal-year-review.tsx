import Link from "next/link";
import { CookingHeatmap } from "@/components/cards/cooking-heatmap";
import { JournalStatTiles } from "@/components/cards/journal-stat-tiles";
import { MonthlyCooksChart } from "@/components/cards/monthly-cooks-chart";
import { JournalEntryFeed } from "@/components/lists/journal-entry-feed";
import { TopRecipesList } from "@/components/lists/top-recipes-list";
import { JournalYearNav } from "@/components/navigation/journal-year-nav";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getYearReview } from "@/lib/server-actions/journal-lookback-actions";
import { ButtonVariant } from "@/lib/types";
import { yearStatTiles } from "@/lib/utils/journal-stats";

interface JournalYearReviewProps {
  year: number;
  currentUserId: string;
}

export async function JournalYearReview({
  year,
  currentUserId,
}: JournalYearReviewProps) {
  const review = await getYearReview(year);

  if (!review) {
    return (
      <p role="alert" className="text-destructive">
        This year didn't load. Try again.
      </p>
    );
  }

  const { totals } = review;
  const empty = totals.cooks === 0 && totals.notes === 0 && totals.photos === 0;

  return (
    <div className="space-y-8">
      <JournalYearNav year={year} years={review.years} />

      {empty ? (
        <EmptyState
          title={`Nothing logged in ${year}`}
          description="Mark recipes as cooked or add journal entries, and this page fills in with your year."
          action={
            <Button variant={ButtonVariant.ACCENT} asChild>
              <Link href="/journal">Go to your journal</Link>
            </Button>
          }
        />
      ) : (
        <>
          <JournalStatTiles stats={yearStatTiles(totals)} />

          <CookingHeatmap
            year={year}
            weeks={review.weeks}
            busiestDay={review.busiestDay}
            cookingDays={totals.cookingDays}
          />

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <MonthlyCooksChart
              year={year}
              months={review.months}
              busiest={review.busiestMonth}
            />
            <section className="rounded-tile bg-card p-6">
              <h2 className="mb-3 text-heading">Most made</h2>
              {review.topRecipes.length > 0 ? (
                <TopRecipesList recipes={review.topRecipes} />
              ) : (
                <p className="text-muted-foreground">
                  No cooks logged this year.
                </p>
              )}
            </section>
          </div>

          {review.highlights.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-heading">Best of the year</h2>
              <JournalEntryFeed
                groups={[
                  {
                    key: `best-${year}`,
                    label: null,
                    entries: review.highlights,
                  },
                ]}
                currentUserId={currentUserId}
                showAuthor={false}
                showRecipe
                timeline={false}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
