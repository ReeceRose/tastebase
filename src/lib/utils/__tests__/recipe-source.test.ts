import { describe, expect, it } from "vitest";
import { recipeSourceKey } from "@/lib/utils/recipe-source";

describe("recipeSourceKey", () => {
  it("uses the domain of the source link without www", () => {
    expect(
      recipeSourceKey("https://www.SeriousEats.com/pan-pizza", "Serious Eats"),
    ).toBe("seriouseats.com");
    expect(
      recipeSourceKey("https://cooking.nytimes.com/recipes/1", "NYT Cooking"),
    ).toBe("cooking.nytimes.com");
  });

  it("falls back to the typed source name", () => {
    expect(recipeSourceKey(null, "  Grandma's cookbook ")).toBe(
      "Grandma's cookbook",
    );
    expect(recipeSourceKey("not a url", "Grandma")).toBe("Grandma");
  });

  it("returns null when there is no source", () => {
    expect(recipeSourceKey(null, null)).toBeNull();
    expect(recipeSourceKey("", "  ")).toBeNull();
  });
});
