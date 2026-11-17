import type {
  JournalStatTile,
  MonthReviewTotals,
  YearReviewTotals,
} from "@/lib/types/journal-lookback-types";

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

function sharedTiles(totals: MonthReviewTotals): JournalStatTile[] {
  return [
    { label: plural(totals.cooks, "cook", "cooks"), value: totals.cooks },
    {
      label: plural(totals.recipes, "recipe", "different recipes"),
      value: totals.recipes,
    },
    {
      label: plural(totals.newRecipes, "new recipe", "new recipes"),
      value: totals.newRecipes,
    },
  ];
}

function keepsakeTiles(totals: MonthReviewTotals): JournalStatTile[] {
  return [
    { label: plural(totals.photos, "photo", "photos"), value: totals.photos },
    { label: plural(totals.notes, "note", "notes"), value: totals.notes },
  ];
}

export function yearStatTiles(totals: YearReviewTotals): JournalStatTile[] {
  return [
    ...sharedTiles(totals),
    {
      label: plural(totals.longestStreak, "day streak", "days in a row"),
      value: totals.longestStreak,
    },
    ...keepsakeTiles(totals),
  ];
}

export function monthStatTiles(totals: MonthReviewTotals): JournalStatTile[] {
  return [
    ...sharedTiles(totals),
    {
      label: plural(totals.cookingDays, "day cooking", "days cooking"),
      value: totals.cookingDays,
    },
    ...keepsakeTiles(totals),
  ];
}

// One line comparing a month's cooks with the month before
export function monthComparison(
  cooks: number,
  previousCooks: number,
  previousName: string,
): string {
  const difference = cooks - previousCooks;
  if (previousCooks === 0) {
    return cooks === 0 ? "" : `Nothing was logged in ${previousName}.`;
  }
  if (difference === 0) return `The same as ${previousName}.`;
  const amount = Math.abs(difference);
  return `${amount} ${plural(amount, "cook", "cooks")} ${difference > 0 ? "more" : "fewer"} than ${previousName}.`;
}
