import { describe, expect, it } from "vitest";
import { monthComparison, monthStatTiles } from "@/lib/utils/journal-stats";

describe("monthComparison", () => {
  it("compares with the month before", () => {
    expect(monthComparison(8, 5, "October")).toBe("3 cooks more than October.");
    expect(monthComparison(4, 5, "October")).toBe("1 cook fewer than October.");
    expect(monthComparison(5, 5, "October")).toBe("The same as October.");
    expect(monthComparison(2, 0, "October")).toBe(
      "Nothing was logged in October.",
    );
  });
});

describe("monthStatTiles", () => {
  it("uses singular labels for one", () => {
    const tiles = monthStatTiles({
      cooks: 1,
      recipes: 1,
      newRecipes: 0,
      cookingDays: 1,
      photos: 2,
      notes: 0,
    });
    expect(tiles.map((tile) => tile.label)).toEqual([
      "cook",
      "recipe",
      "new recipes",
      "day cooking",
      "photos",
      "notes",
    ]);
  });
});
