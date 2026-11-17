import { describe, expect, it } from "vitest";
import {
  addDays,
  buildHeatmap,
  buildMonthCalendar,
  busiestMonth,
  countByMonth,
  countCooksByDay,
  heatLevel,
  longestStreak,
  monthCookRange,
  monthDays,
  monthName,
  parseJournalMonth,
  parseJournalYear,
  sameDayLastMonth,
  shiftMonth,
  yearsAgoLabel,
} from "@/lib/utils/journal-lookback";
import { dayKeyIn, resolveTimeZone } from "@/lib/utils/time-zone";

describe("days and time zones", () => {
  it("puts an evening cook in Toronto on the local day", () => {
    const cookedAt = new Date("2026-11-14T00:30:00.000Z");
    expect(dayKeyIn(cookedAt, "America/Toronto")).toBe("2026-11-13");
    expect(dayKeyIn(cookedAt, "UTC")).toBe("2026-11-14");
  });

  it("falls back to UTC for a bad zone", () => {
    expect(resolveTimeZone("Not/AZone")).toBe("UTC");
    expect(resolveTimeZone(null)).toBe("UTC");
    expect(resolveTimeZone("Europe/Paris")).toBe("Europe/Paris");
  });

  it("adds days across months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("cook counts", () => {
  const cooks = [
    { recipeId: "a", cookedAt: new Date("2026-01-05T18:00:00Z") },
    { recipeId: "b", cookedAt: new Date("2026-01-05T19:00:00Z") },
    { recipeId: "a", cookedAt: new Date("2026-03-10T18:00:00Z") },
    { recipeId: "a", cookedAt: new Date("2025-12-31T18:00:00Z") },
  ];

  it("counts cooks per day inside the year only", () => {
    const counts = countCooksByDay(cooks, "UTC", 2026);
    expect([...counts]).toEqual([
      ["2026-01-05", 2],
      ["2026-03-10", 1],
    ]);
  });

  it("totals months and finds the busiest", () => {
    const months = countByMonth(countCooksByDay(cooks, "UTC", 2026), 2026);
    expect(months.map((month) => month.count)).toEqual([
      2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(busiestMonth(months)?.label).toBe("Jan");
    expect(busiestMonth(countByMonth(new Map(), 2026))).toBeNull();
  });

  it("scales heat levels to the busiest day", () => {
    expect(heatLevel(0, 4)).toBe(0);
    expect(heatLevel(1, 4)).toBe(1);
    expect(heatLevel(4, 4)).toBe(4);
    expect(heatLevel(1, 10)).toBe(1);
  });
});

describe("buildHeatmap", () => {
  it("lays the year out in Sunday-first weeks", () => {
    const weeks = buildHeatmap(2026, new Map([["2026-01-01", 3]]));
    expect(weeks[0].key).toBe("2025-12-28");
    expect(weeks[0].days[0].inYear).toBe(false);
    expect(weeks[0].days[4]).toEqual({
      day: "2026-01-01",
      count: 3,
      inYear: true,
    });
    expect(weeks.at(-1)?.days.some((day) => day.day === "2026-12-31")).toBe(
      true,
    );
    expect(weeks.filter((week) => week.monthLabel).length).toBe(12);
  });
});

describe("streaks and dates", () => {
  it("finds the longest run of days", () => {
    expect(
      longestStreak([
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-07",
        "2026-01-08",
      ]),
    ).toBe(3);
    expect(longestStreak([])).toBe(0);
  });

  it("finds the same day last month when it exists", () => {
    expect(sameDayLastMonth("2026-11-15")).toBe("2026-10-15");
    expect(sameDayLastMonth("2026-01-10")).toBe("2025-12-10");
    expect(sameDayLastMonth("2026-03-31")).toBeNull();
  });

  it("labels years ago", () => {
    expect(yearsAgoLabel("2025-11-15", "2026-11-15")).toBe("A year ago");
    expect(yearsAgoLabel("2023-11-15", "2026-11-15")).toBe("3 years ago");
  });

  it("only accepts sensible years in the URL", () => {
    expect(parseJournalYear("2026")).toBe(2026);
    expect(parseJournalYear("26")).toBeNull();
    expect(parseJournalYear("9999")).toBeNull();
  });
});

describe("months", () => {
  it("parses month numbers", () => {
    expect(parseJournalMonth("11")).toBe(11);
    expect(parseJournalMonth("03")).toBe(3);
    expect(parseJournalMonth("0")).toBeNull();
    expect(parseJournalMonth("13")).toBeNull();
    expect(parseJournalMonth("nov")).toBeNull();
  });

  it("steps across years", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("lists every day of the month", () => {
    expect(monthDays(2024, 2)).toHaveLength(29);
    expect(monthDays(2026, 11).at(-1)).toBe("2026-11-30");
  });

  it("lays out a Sunday-first calendar", () => {
    const weeks = buildMonthCalendar(2026, 11);
    expect(weeks[0][0]).toBe("2026-11-01");
    expect(weeks).toHaveLength(5);
    expect(weeks.at(-1)?.at(-1)).toBe("2026-12-05");
  });

  it("spans the month before for comparisons", () => {
    const [from, to] = monthCookRange(2026, 1);
    expect(from.toISOString()).toBe("2025-11-30T00:00:00.000Z");
    expect(to.toISOString()).toBe("2026-02-02T00:00:00.000Z");
  });

  it("names months", () => {
    expect(monthName(2026, 11, true)).toBe("November 2026");
    expect(monthName(2026, 11, false)).toBe("November");
  });
});
