import { describe, expect, it } from "vitest";
import { findSharedLink } from "@/lib/utils/shared-link";

describe("findSharedLink", () => {
  it("uses the shared url when there is one", () => {
    expect(
      findSharedLink({
        url: "https://cooking.nytimes.com/recipes/1015819",
        text: null,
        title: "Cookies",
      }),
    ).toBe("https://cooking.nytimes.com/recipes/1015819");
  });

  it("finds a link inside shared text", () => {
    expect(
      findSharedLink({
        url: null,
        text: "Making this tonight! https://www.recipetineats.com/chicken-chasseur/.",
        title: null,
      }),
    ).toBe("https://www.recipetineats.com/chicken-chasseur/");
  });

  it("returns null when nothing shared is a link", () => {
    expect(
      findSharedLink({ url: null, text: "Grandma's soup", title: "Soup" }),
    ).toBeNull();
  });
});
