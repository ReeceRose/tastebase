import { describe, expect, it } from "vitest";
import {
  formatElapsed,
  formatRelativeDay,
  formatTotalTime,
} from "@/lib/utils/time-formatting";

describe("formatTotalTime", () => {
  it("formats minutes and hours compactly", () => {
    expect(formatTotalTime(30)).toBe("30 min");
    expect(formatTotalTime(60)).toBe("1 h");
    expect(formatTotalTime(70)).toBe("1 h 10");
    expect(formatTotalTime(200)).toBe("3 h 20");
  });

  it("returns null for missing or zero times", () => {
    expect(formatTotalTime(null)).toBeNull();
    expect(formatTotalTime(0)).toBeNull();
  });
});

describe("formatRelativeDay", () => {
  const now = new Date(2026, 9, 14, 18, 0);

  it("uses Today and Yesterday", () => {
    expect(formatRelativeDay(new Date(2026, 9, 14, 8, 0), now)).toBe("Today");
    expect(formatRelativeDay(new Date(2026, 9, 13, 23, 0), now)).toBe(
      "Yesterday",
    );
  });

  it("uses the weekday within a week", () => {
    expect(formatRelativeDay(new Date(2026, 9, 12), now)).toBe("Mon");
  });

  it("uses month and day after a week, adding the year when different", () => {
    expect(formatRelativeDay(new Date(2026, 8, 2), now)).toBe("Sep 2");
    expect(formatRelativeDay(new Date(2025, 8, 2), now)).toBe("Sep 2, 2025");
  });
});

describe("formatElapsed", () => {
  const now = new Date(2026, 9, 14);

  it("scales from days to years", () => {
    expect(formatElapsed(new Date(2026, 9, 10), now)).toBe("4 days");
    expect(formatElapsed(new Date(2026, 8, 1), now)).toBe("6 weeks");
    expect(formatElapsed(new Date(2026, 4, 1), now)).toBe("5 months");
    expect(formatElapsed(new Date(2024, 9, 1), now)).toBe("2 years");
  });
});
