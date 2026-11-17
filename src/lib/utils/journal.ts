import { JournalEntryKind, JournalFilter } from "@/lib/types";
import type { JournalEntry, JournalGroup } from "@/lib/types/journal-types";

export const JOURNAL_TITLE_MAX = 120;
export const JOURNAL_CONTENT_MAX = 5000;
export const JOURNAL_PHOTO_MAX = 12;
export const JOURNAL_RECIPE_MAX = 10;
export const JOURNAL_PAGE_SIZE = 300;
export const RECIPE_JOURNAL_LIMIT = 30;
export const JOURNAL_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const JOURNAL_PHOTO_MAX_BYTES = 9.5 * 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;

// Entries are dated by day, not time. Noon UTC keeps the stored day the same
// wherever the server and the people reading it are.
export function dayToTimestamp(day: string): Date {
  return new Date(`${day}T12:00:00.000Z`);
}

export function timestampToDay(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

export function localDay(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatJournalDay(date: Date, today: string): string {
  const day = timestampToDay(date);
  if (day === today) return "Today";
  const yesterday = new Date(dayToTimestamp(today).getTime() - DAY_MS);
  if (day === timestampToDay(yesterday)) return "Yesterday";
  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

export function groupJournalByMonth(entries: JournalEntry[]): JournalGroup[] {
  const groups: JournalGroup[] = [];
  for (const entry of entries) {
    const key = timestampToDay(entry.happenedAt).slice(0, 7);
    const current = groups.at(-1);
    if (current?.key === key) {
      current.entries.push(entry);
      continue;
    }
    groups.push({
      key,
      label: new Date(entry.happenedAt).toLocaleDateString("en-CA", {
        timeZone: "UTC",
        month: "long",
        year: "numeric",
      }),
      entries: [entry],
    });
  }
  return groups;
}

export function parseJournalFilter(value: string | null): JournalFilter {
  return (
    Object.values(JournalFilter).find((filter) => filter === value) ??
    JournalFilter.ALL
  );
}

export function journalFilterKind(
  filter: JournalFilter,
): JournalEntryKind | null {
  if (filter === JournalFilter.COOKED) return JournalEntryKind.COOKED;
  if (filter === JournalFilter.NOTES) return JournalEntryKind.NOTE;
  return null;
}

export function toJournalEntryKind(value: string): JournalEntryKind {
  return value === JournalEntryKind.COOKED
    ? JournalEntryKind.COOKED
    : JournalEntryKind.NOTE;
}

// "Pizza", "Pizza and salad", "Pizza, salad and bread"
export function joinTitles(titles: string[]): string | null {
  if (titles.length === 0) return null;
  if (titles.length === 1) return titles[0];
  return `${titles.slice(0, -1).join(", ")} and ${titles.at(-1)}`;
}

export function journalRecipeTitles(entry: JournalEntry): string | null {
  return joinTitles(entry.recipes.map((recipe) => recipe.title));
}

export function cookedHeading(titles: string | null): string {
  return titles ? `Made ${titles}` : "Made something";
}

export function journalEntryHeading(entry: JournalEntry): string | null {
  if (entry.kind === JournalEntryKind.COOKED) {
    return cookedHeading(journalRecipeTitles(entry));
  }
  return entry.title;
}
