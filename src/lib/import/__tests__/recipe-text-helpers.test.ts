import { describe, expect, it } from "vitest";
import {
  extractTemperature,
  extractTimeMinutes,
  parseDurationText,
  parseIngredientLine,
  parseIsoDuration,
} from "@/lib/import/recipe-text-helpers";

describe("parseIngredientLine", () => {
  it.each([
    ["2 cups all-purpose flour", "2", "cups", "all-purpose flour"],
    ["1 1/2 tsp salt", "1 1/2", "tsp", "salt"],
    ["½ cup sugar", "½", "cup", "sugar"],
    ["1½ tablespoons olive oil", "1½", "tablespoons", "olive oil"],
    ["2-3 cloves garlic, minced", "2-3", "cloves", "garlic, minced"],
    ["200g butter", "200", "g", "butter"],
    ["3 eggs", "3", null, "eggs"],
    ["- 1 lb ground beef", "1", "lb", "ground beef"],
    ["▢ 4 tbsp. soy sauce", "4", "tbsp", "soy sauce"],
    ["2 fl oz cream", "2", "fl oz", "cream"],
    ["1 cup of milk", "1", "cup", "milk"],
  ])("parses %s", (line, quantity, unit, name) => {
    expect(parseIngredientLine(line)).toEqual({ quantity, unit, name });
  });

  it("keeps package sizes with the ingredient name", () => {
    expect(parseIngredientLine("1 (14 oz) can diced tomatoes")).toEqual({
      quantity: "1",
      unit: "can",
      name: "diced tomatoes (14 oz)",
    });
  });

  it.each([
    [
      "2 cups minus 2 tablespoons cake flour (8 ½ ounces)",
      "2",
      "cups",
      "cake flour (8 ½ ounces), minus 2 tablespoons",
    ],
    ["1 cup plus 1 tbsp sugar", "1", "cup", "sugar, plus 1 tbsp"],
  ])("keeps a %s adjustment with the name", (line, quantity, unit, name) => {
    expect(parseIngredientLine(line)).toEqual({ quantity, unit, name });
  });

  it("returns lines without a quantity as the name", () => {
    expect(parseIngredientLine("Salt and pepper to taste")).toEqual({
      quantity: null,
      unit: null,
      name: "Salt and pepper to taste",
    });
  });

  it("does not treat a word starting with a unit letter as a unit", () => {
    expect(parseIngredientLine("2 large tomatoes")).toEqual({
      quantity: "2",
      unit: null,
      name: "large tomatoes",
    });
  });

  it("returns null for blank lines", () => {
    expect(parseIngredientLine("   ")).toBeNull();
  });
});

describe("durations", () => {
  it.each([
    ["PT15M", 15],
    ["PT1H30M", 90],
    ["P0DT2H", 120],
    ["PT90S", 2],
  ])("parses ISO 8601 duration %s", (duration, minutes) => {
    expect(parseIsoDuration(duration)).toBe(minutes);
  });

  it("falls back to free text for non-ISO durations", () => {
    expect(parseIsoDuration("1 hour 15 minutes")).toBe(75);
  });

  it.each([
    ["15 minutes", 15],
    ["1 hr 20 mins", 80],
    ["1.5 hours", 90],
    ["45", 45],
  ])("parses free-text duration %s", (text, minutes) => {
    expect(parseDurationText(text)).toBe(minutes);
  });

  it("returns null when there is no duration", () => {
    expect(parseDurationText("until golden")).toBeNull();
  });
});

describe("step details", () => {
  it("uses the higher end of a time range", () => {
    expect(extractTimeMinutes("Bake for 25-30 minutes until golden.")).toBe(30);
  });

  it("converts hours to minutes", () => {
    expect(extractTimeMinutes("Simmer for 2 hours.")).toBe(120);
  });

  it("returns null when no time is mentioned", () => {
    expect(extractTimeMinutes("Season to taste.")).toBeNull();
  });

  it("reads oven temperatures with units", () => {
    expect(extractTemperature("Preheat the oven to 350°F.")).toBe("350°F");
    expect(extractTemperature("Heat to 180 degrees C")).toBe("180°C");
  });

  it("reads stovetop heat levels", () => {
    expect(extractTemperature("Cook over medium-high heat.")).toBe(
      "medium-high heat",
    );
  });

  it("does not guess a unit when none is given", () => {
    expect(extractTemperature("Bake at 200° until set.")).toBe("200°");
  });
});
