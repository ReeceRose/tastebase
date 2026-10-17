import { describe, expect, it } from "vitest";
import {
  LibraryScope,
  LibrarySort,
  LibraryVisibility,
  RecipeDifficulty,
  ViewMode,
} from "@/lib/types";
import {
  hasActiveFilters,
  libraryParamsToQuery,
  parseLibraryParams,
} from "@/lib/utils/library-params";

describe("parseLibraryParams", () => {
  it("returns defaults for an empty query", () => {
    const filters = parseLibraryParams({});
    expect(filters).toEqual({
      scope: LibraryScope.ALL,
      query: null,
      authorId: null,
      difficulty: null,
      cuisine: null,
      tags: [],
      maxTime: null,
      sort: null,
      visibility: LibraryVisibility.ALL,
      view: ViewMode.CARDS,
      page: 1,
    });
    expect(hasActiveFilters(filters)).toBe(false);
  });

  it("reads the quick-pick parameters", () => {
    expect(parseLibraryParams({ maxTime: "30" }).maxTime).toBe(30);
    expect(parseLibraryParams({ sort: "rating" }).sort).toBe(
      LibrarySort.RATING,
    );
    expect(parseLibraryParams({ difficulty: "easy" }).difficulty).toBe(
      RecipeDifficulty.EASY,
    );
  });

  it("maps legacy sort values", () => {
    expect(parseLibraryParams({ sort: "averageRating" }).sort).toBe(
      LibrarySort.RATING,
    );
    expect(parseLibraryParams({ sort: "createdAt" }).sort).toBe(
      LibrarySort.NEWEST,
    );
  });

  it("ignores invalid values", () => {
    const filters = parseLibraryParams({
      difficulty: "impossible",
      maxTime: "-5",
      sort: "random",
      show: "everyone",
      page: "zero",
    });
    expect(filters.difficulty).toBeNull();
    expect(filters.maxTime).toBeNull();
    expect(filters.sort).toBeNull();
    expect(filters.visibility).toBe(LibraryVisibility.ALL);
    expect(filters.page).toBe(1);
  });

  it("combines tags and tag parameters without duplicates", () => {
    expect(
      parseLibraryParams({ tags: "pantry, vegan", tag: "vegan" }).tags,
    ).toEqual(["pantry", "vegan"]);
  });

  it("round-trips through the query string", () => {
    const filters = parseLibraryParams({
      q: "chickpeas",
      author: "user-1",
      maxTime: "45",
      sort: "quickest",
      show: "private",
      view: "list",
      page: "2",
    });
    const again = parseLibraryParams(
      Object.fromEntries(new URLSearchParams(libraryParamsToQuery(filters))),
    );
    expect(again).toEqual(filters);
    expect(hasActiveFilters(filters)).toBe(true);
  });
});
