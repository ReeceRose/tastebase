import { describe, expect, it } from "vitest";
import { normalizeSourceUrl } from "@/lib/utils/source-url";

describe("normalizeSourceUrl", () => {
  it("treats the same page with cosmetic differences as one link", () => {
    const expected = "seriouseats.com/whipped-lemonade-recipe-11985587";
    for (const url of [
      "https://www.seriouseats.com/whipped-lemonade-recipe-11985587",
      "http://seriouseats.com/whipped-lemonade-recipe-11985587/",
      "https://www.SeriousEats.com/whipped-lemonade-recipe-11985587?utm_source=x&fbclid=y#recipe",
    ]) {
      expect(normalizeSourceUrl(url)).toBe(expected);
    }
  });

  it("keeps query parameters that pick a different page", () => {
    expect(normalizeSourceUrl("https://example.com/r?id=2&b=1")).toBe(
      "example.com/r?b=1&id=2",
    );
    expect(normalizeSourceUrl("https://example.com/r?id=2")).not.toBe(
      normalizeSourceUrl("https://example.com/r?id=3"),
    );
  });

  it("ignores things that aren't web links", () => {
    expect(normalizeSourceUrl("not a url")).toBeNull();
    expect(normalizeSourceUrl(null)).toBeNull();
  });
});
