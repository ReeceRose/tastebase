import { describe, expect, it } from "vitest";
import { RecipeSwatch } from "@/lib/types";
import {
  hashString,
  isDarkSwatch,
  isRecipeSwatch,
  memberSwatch,
  resolveSwatch,
  SWATCH_CLASSES,
  SWATCH_ORDER,
  stepSwatch,
  swatchFor,
} from "@/lib/utils/swatches";

describe("swatches", () => {
  it("maps every swatch to static Tailwind classes", () => {
    for (const swatch of Object.values(RecipeSwatch)) {
      const classes = SWATCH_CLASSES[swatch];
      expect(classes.bg).toBe(`bg-swatch-${swatch}`);
      expect(classes.fg).toBe(`text-swatch-${swatch}-fg`);
      expect(classes.deep).toBe(`bg-swatch-${swatch}-deep`);
    }
  });

  it("includes every swatch exactly once in the order", () => {
    expect(new Set(SWATCH_ORDER).size).toBe(Object.values(RecipeSwatch).length);
  });

  it("hashes deterministically", () => {
    expect(hashString("recipe-123")).toBe(hashString("recipe-123"));
    expect(hashString("a")).not.toBe(hashString("b"));
  });

  it("gives a recipe the same swatch every time", () => {
    const id = "f3b0c2a4-7a0e-4f5d-9d0f-2a1c3e5b7d90";
    expect(swatchFor(id)).toBe(swatchFor(id));
  });

  it("spreads ids across all swatches", () => {
    const seen = new Set<RecipeSwatch>();
    for (let i = 0; i < 200; i++) {
      seen.add(swatchFor(`recipe-${i}`));
    }
    expect(seen.size).toBe(SWATCH_ORDER.length);
  });

  it("prefers a stored swatch and falls back to the hash", () => {
    expect(resolveSwatch("any", RecipeSwatch.SKY)).toBe(RecipeSwatch.SKY);
    expect(resolveSwatch("any", null)).toBe(swatchFor("any"));
    expect(resolveSwatch("any", "#ff0000")).toBe(swatchFor("any"));
  });

  it("validates swatch values", () => {
    expect(isRecipeSwatch("tomato")).toBe(true);
    expect(isRecipeSwatch("blue")).toBe(false);
    expect(isRecipeSwatch(null)).toBe(false);
  });

  it("keeps member colours independent from recipe colours with the same id", () => {
    const ids = Array.from({ length: 50 }, (_, i) => `id-${i}`);
    const differs = ids.some((id) => memberSwatch(id) !== swatchFor(id));
    expect(differs).toBe(true);
  });

  it("cycles step swatches from the recipe swatch", () => {
    expect(stepSwatch(RecipeSwatch.TOMATO, 0)).toBe(RecipeSwatch.TOMATO);
    expect(stepSwatch(RecipeSwatch.HERB, 1)).toBe(SWATCH_ORDER[0]);
  });

  it("marks swatches that use white text as dark", () => {
    expect(isDarkSwatch(RecipeSwatch.AUBERGINE)).toBe(true);
    expect(isDarkSwatch(RecipeSwatch.TURMERIC)).toBe(false);
  });
});
