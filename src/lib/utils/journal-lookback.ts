import type {
  CookMoment,
  HeatmapWeek,
  MonthCount,
  MonthRef,
  WallMonth,
  WallPhoto,
} from "@/lib/types/journal-lookback-types";
import { dayKeyIn } from "@/lib/utils/time-zone";

const DAY_MS = 24 * 60 * 60 * 1000;
export const OLD_FAVOURITE_GAP_DAYS = 45;
export const OLD_FAVOURITE_MIN_COOKS = 2;
export const WALL_PHOTO_LIMIT = 600;
export const TOP_RECIPE_COUNT = 5;
export const HIGHLIGHT_COUNT = 3;
export const HEAT_LEVELS = 4;

function dayToUtc(day: string): number {
  return Date.parse(`${day}T00:00:00.000Z`);
}

function utcToDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function addDays(day: string, amount: number): string {
  return utcToDay(dayToUtc(day) + amount * DAY_MS);
}

export function countCooksByDay(
  cooks: CookMoment[],
  zone: string,
  year: number,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const cook of cooks) {
    const day = dayKeyIn(cook.cookedAt, zone);
    if (!day.startsWith(`${year}-`)) continue;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return counts;
}

export function buildHeatmap(
  year: number,
  counts: Map<string, number>,
): HeatmapWeek[] {
  const first = `${year}-01-01`;
  const last = `${year}-12-31`;
  const start = addDays(first, -new Date(dayToUtc(first)).getUTCDay());
  const weeks: HeatmapWeek[] = [];
  for (let weekStart = start; weekStart <= last; ) {
    const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
      const day = addDays(weekStart, offset);
      return {
        day,
        count: counts.get(day) ?? 0,
        inYear: day.startsWith(`${year}-`),
      };
    });
    const firstOfMonth = days.find(
      (item) => item.inYear && item.day.endsWith("-01"),
    );
    weeks.push({
      key: weekStart,
      monthLabel: firstOfMonth
        ? new Date(dayToUtc(firstOfMonth.day)).toLocaleDateString("en-CA", {
            timeZone: "UTC",
            month: "short",
          })
        : null,
      days,
    });
    weekStart = addDays(weekStart, 7);
  }
  return weeks;
}

export function heatLevel(count: number, busiest: number): number {
  if (count === 0 || busiest === 0) return 0;
  return Math.max(1, Math.ceil((count / busiest) * HEAT_LEVELS));
}

export function countByMonth(
  counts: Map<string, number>,
  year: number,
): MonthCount[] {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((month) => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    let count = 0;
    for (const [day, value] of counts) {
      if (day.startsWith(prefix)) count += value;
    }
    return {
      month,
      label: new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-CA", {
        timeZone: "UTC",
        month: "short",
      }),
      count,
    };
  });
}

export function busiestMonth(months: MonthCount[]): MonthCount | null {
  return months.reduce<MonthCount | null>(
    (best, month) =>
      month.count > 0 && (!best || month.count > best.count) ? month : best,
    null,
  );
}

export function longestStreak(days: string[]): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of sorted) {
    run = previous && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

// The same day last month, or null when last month was too short to have it
export function sameDayLastMonth(today: string): string | null {
  const [year, month, day] = today.split("-").map((part) => parseInt(part, 10));
  const target = new Date(Date.UTC(year, month - 2, day));
  return target.getUTCDate() === day ? utcToDay(target.getTime()) : null;
}

export function yearsAgoLabel(day: string, today: string): string {
  const years = parseInt(today.slice(0, 4), 10) - parseInt(day.slice(0, 4), 10);
  return years === 1 ? "A year ago" : `${years} years ago`;
}

export function rankCounts<T>(items: T[]): [T, number][] {
  const counts = new Map<T, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

const EARLIEST_YEAR = 1900;

export function parseJournalYear(value: string): number | null {
  if (!/^\d{4}$/.test(value)) return null;
  const year = parseInt(value, 10);
  const latest = new Date().getUTCFullYear() + 1;
  return year >= EARLIEST_YEAR && year <= latest ? year : null;
}

export function groupPhotosByMonth(photos: WallPhoto[]): WallMonth[] {
  const months: WallMonth[] = [];
  for (const photo of photos) {
    const key = new Date(photo.happenedAt).toISOString().slice(0, 7);
    const current = months.at(-1);
    if (current?.key === key) {
      current.photos.push(photo);
      continue;
    }
    months.push({
      key,
      label: new Date(photo.happenedAt).toLocaleDateString("en-CA", {
        timeZone: "UTC",
        month: "long",
        year: "numeric",
      }),
      photos: [photo],
    });
  }
  return months;
}

export function parseJournalMonth(value: string): number | null {
  if (!/^\d{1,2}$/.test(value)) return null;
  const month = parseInt(value, 10);
  return month >= 1 && month <= 12 ? month : null;
}

export function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-`;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): MonthRef {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function monthName(
  year: number,
  month: number,
  withYear: boolean,
): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-CA", {
    timeZone: "UTC",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function monthDays(year: number, month: number): string[] {
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const first = `${monthPrefix(year, month)}01`;
  return Array.from({ length }, (_, i) => addDays(first, i));
}

// Covers the month before too, padded a day each side for any time zone
export function monthCookRange(year: number, month: number): [Date, Date] {
  const previous = shiftMonth(year, month, -1);
  const start = `${monthPrefix(previous.year, previous.month)}01`;
  const end = monthDays(year, month).at(-1) ?? start;
  return [
    new Date(dayToUtc(addDays(start, -1))),
    new Date(dayToUtc(addDays(end, 2))),
  ];
}

export function buildMonthCalendar(year: number, month: number): string[][] {
  const days = monthDays(year, month);
  const first = days[0];
  const last = days.at(-1) ?? first;
  const start = addDays(first, -new Date(dayToUtc(first)).getUTCDay());
  const weeks: string[][] = [];
  for (let weekStart = start; weekStart <= last; ) {
    weeks.push(
      [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(weekStart, offset)),
    );
    weekStart = addDays(weekStart, 7);
  }
  return weeks;
}
