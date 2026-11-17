export const TIME_ZONE_COOKIE = "tz";
export const DEFAULT_TIME_ZONE = "UTC";

export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(zone: string | null): string {
  return zone && isValidTimeZone(zone) ? zone : DEFAULT_TIME_ZONE;
}

// "YYYY-MM-DD" for the day a moment falls on in a time zone
export function dayKeyIn(date: Date, zone: string): string {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: zone });
}
