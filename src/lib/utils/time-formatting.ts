export function formatTotalTime(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest}`;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

export function formatRelativeDay(date: Date, now: Date = new Date()): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) {
    return date.toLocaleDateString("en-CA", { weekday: "short" });
  }
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatElapsed(date: Date, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - date.getTime()) / DAY_MS);
  if (days < 14) return days <= 1 ? "1 day" : `${days} days`;
  if (days < 60) return `${Math.floor(days / 7)} weeks`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year" : `${years} years`;
}
