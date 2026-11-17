import { CalendarDays, CalendarHeart, Images } from "lucide-react";
import Link from "next/link";
import { OnThisDayCard } from "@/components/cards/on-this-day-card";
import { RecipeRowList } from "@/components/lists/recipe-row-list";
import {
  getOldFavourites,
  getOnThisDay,
  getYearSnapshot,
} from "@/lib/server-actions/journal-lookback-actions";
import { monthName } from "@/lib/utils/journal-lookback";

interface LookbackSectionProps {
  currentUserId: string;
}

const OLD_FAVOURITE_LIMIT = 5;

export async function OnThisDaySection() {
  const { groups } = await getOnThisDay();
  if (groups.length === 0) return null;
  return <OnThisDayCard groups={groups} />;
}

export async function YearSnapshotSection() {
  const snapshot = await getYearSnapshot();
  if (!snapshot) return null;
  const linkClass =
    "flex min-h-11 items-center gap-2 rounded-control px-3 font-semibold outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring";

  return (
    <section className="rounded-tile bg-card p-6">
      <h2 className="text-meta text-muted-foreground">
        {snapshot.year} so far
      </h2>
      <p className="mt-1 text-heading tabular">
        {snapshot.cooks} {snapshot.cooks === 1 ? "cook" : "cooks"} ·{" "}
        {snapshot.recipes} {snapshot.recipes === 1 ? "recipe" : "recipes"}
      </p>
      <nav aria-label="Look back" className="-mx-3 mt-3">
        <Link href={`/journal/${snapshot.year}`} className={linkClass}>
          <CalendarHeart className="size-4" />
          Your year in the kitchen
        </Link>
        <Link
          href={`/journal/${snapshot.year}/${snapshot.month}`}
          className={linkClass}
        >
          <CalendarDays className="size-4" />
          {monthName(snapshot.year, snapshot.month, false)} so far
        </Link>
        <Link href="/journal/photos" className={linkClass}>
          <Images className="size-4" />
          Photo wall
        </Link>
      </nav>
    </section>
  );
}

export async function OldFavouritesSection({
  currentUserId,
}: LookbackSectionProps) {
  const recipes = await getOldFavourites(OLD_FAVOURITE_LIMIT);
  if (recipes.length === 0) return null;

  return (
    <section className="rounded-tile bg-card p-6">
      <h2 className="text-heading">You used to make these</h2>
      <p className="mt-1 mb-3 text-meta text-muted-foreground">
        Made a few times, but not lately.
      </p>
      <RecipeRowList
        recipes={recipes}
        currentUserId={currentUserId}
        showElapsed
      />
    </section>
  );
}
