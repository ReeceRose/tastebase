import { describe, expect, it } from "vitest";
import { JournalEntryKind, JournalFilter } from "@/lib/types";
import type { JournalEntry } from "@/lib/types/journal-types";
import {
  dayToTimestamp,
  formatJournalDay,
  groupJournalByMonth,
  joinTitles,
  journalEntryHeading,
  parseJournalFilter,
  timestampToDay,
} from "@/lib/utils/journal";

function entry(day: string, overrides: Partial<JournalEntry> = {}) {
  return {
    id: day,
    kind: JournalEntryKind.COOKED,
    userId: "user-1",
    authorName: "Ree",
    recipes: [
      { recipeId: "lasagna", slug: "lasagna", title: "Lasagna", swatch: null },
    ],
    title: null,
    content: null,
    rating: null,
    isPrivate: false,
    happenedAt: dayToTimestamp(day),
    photos: [],
    ...overrides,
  } satisfies JournalEntry;
}

describe("journal dates", () => {
  it("round-trips a day", () => {
    expect(timestampToDay(dayToTimestamp("2026-03-09"))).toBe("2026-03-09");
  });

  it("names today and yesterday, then dates", () => {
    expect(formatJournalDay(dayToTimestamp("2026-11-15"), "2026-11-15")).toBe(
      "Today",
    );
    expect(formatJournalDay(dayToTimestamp("2026-11-14"), "2026-11-15")).toBe(
      "Yesterday",
    );
    expect(
      formatJournalDay(dayToTimestamp("2025-12-31"), "2026-11-15"),
    ).toContain("2025");
  });
});

describe("groupJournalByMonth", () => {
  it("groups newest-first entries by month", () => {
    const groups = groupJournalByMonth([
      entry("2026-11-02"),
      entry("2026-11-01"),
      entry("2026-10-31"),
    ]);
    expect(groups.map((group) => group.key)).toEqual(["2026-11", "2026-10"]);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[0].label).toBe("November 2026");
  });
});

describe("journal headings and filters", () => {
  it("heads a cook with its recipes", () => {
    expect(journalEntryHeading(entry("2026-11-01"))).toBe("Made Lasagna");
    const recipe = { recipeId: null, slug: null, swatch: null };
    expect(
      journalEntryHeading(
        entry("2026-11-01", {
          recipes: [
            { ...recipe, title: "Pizza" },
            { ...recipe, title: "Salad" },
            { ...recipe, title: "Gelato" },
          ],
        }),
      ),
    ).toBe("Made Pizza, Salad and Gelato");
    expect(journalEntryHeading(entry("2026-11-01", { recipes: [] }))).toBe(
      "Made something",
    );
  });

  it("joins titles", () => {
    expect(joinTitles([])).toBeNull();
    expect(joinTitles(["Pizza"])).toBe("Pizza");
    expect(joinTitles(["Pizza", "Salad"])).toBe("Pizza and Salad");
  });

  it("heads a note with its title", () => {
    expect(
      journalEntryHeading(
        entry("2026-11-01", { kind: JournalEntryKind.NOTE, title: "Menu" }),
      ),
    ).toBe("Menu");
  });

  it("falls back to everything for unknown filters", () => {
    expect(parseJournalFilter("notes")).toBe(JournalFilter.NOTES);
    expect(parseJournalFilter("nope")).toBe(JournalFilter.ALL);
    expect(parseJournalFilter(null)).toBe(JournalFilter.ALL);
  });
});
