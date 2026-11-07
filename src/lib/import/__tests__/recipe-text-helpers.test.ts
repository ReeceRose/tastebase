import { describe, expect, it } from "vitest";
import {
  extractTemperature,
  extractTimeMinutes,
  parseDurationText,
  parseIngredientLine,
  parseIngredientLines,
  parseIsoDuration,
} from "@/lib/import/recipe-text-helpers";

describe("parseIngredientLines", () => {
  it("splits two ingredients joined on one line", () => {
    expect(
      parseIngredientLines(
        "1 tablespoon grated lemon zest plus 3/4 cup (180 ml) fresh lemon juice, plus additional zest for serving",
      ),
    ).toEqual([
      { quantity: "1", unit: "tablespoon", name: "grated lemon zest" },
      {
        quantity: "3/4",
        unit: "cup",
        name: "fresh lemon juice, plus additional zest for serving",
      },
    ]);
    expect(
      parseIngredientLines(
        "1 cup flour plus 2 tbsp cornstarch plus 1 tsp salt",
      ).map((item) => item.name),
    ).toEqual(["flour", "cornstarch", "salt"]);
  });

  it.each([
    ["1 cup plus 1 tbsp sugar", "sugar, plus 1 tbsp"],
    ["1 cup (200 g) plus 1 tbsp sugar", "sugar, plus 1 tbsp"],
    ["1 cup sugar plus 1 tbsp more", "sugar plus 1 tbsp more"],
    ["2 cups flour plus 2 tbsp for dusting", "flour plus 2 tbsp for dusting"],
    ["1 tbsp oil (plus 1 tsp butter)", "oil (plus 1 tsp butter)"],
    ["1 cup milk plus cream", "milk plus cream"],
    ["salt plus 1 tsp pepper", "salt plus 1 tsp pepper"],
  ])("keeps %s as one ingredient", (line, name) => {
    const parsed = parseIngredientLines(line);
    expect(parsed.map((item) => item.name)).toEqual([name]);
  });

  it("returns nothing for blank lines", () => {
    expect(parseIngredientLines("   ")).toEqual([]);
  });
});

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

  it.each([
    [
      "1 1/2 tbsp extra virgin oil ((or butter))",
      "1 1/2",
      "tbsp",
      "extra virgin oil (or butter)",
    ],
    ["1  garlic clove (, minced)", "1", null, "garlic clove, minced"],
    [
      "1/2  onion (, finely chopped (white, brown, yellow))",
      "1/2",
      null,
      "onion, finely chopped (white, brown, yellow)",
    ],
    [
      "1 1/2 cups long grain white rice (, uncooked (Note 1))",
      "1 1/2",
      "cups",
      "long grain white rice, uncooked",
    ],
    [
      "1  large lemon ((1 tsp zest + 3 - 4 tbsp lemon juice))",
      "1",
      null,
      "large lemon (1 tsp zest + 3 - 4 tbsp lemon juice)",
    ],
    ["2 cups stock ((Note 2))", "2", "cups", "stock"],
    ["1 cup rice (see note 3)", "1", "cup", "rice"],
  ])("tidies WP Recipe Maker notes in %s", (line, quantity, unit, name) => {
    expect(parseIngredientLine(line)).toEqual({ quantity, unit, name });
  });

  it.each([
    [
      "2/3 cup (160 ml) sweetened condensed milk",
      "2/3",
      "cup",
      "sweetened condensed milk",
    ],
    ["1/2 teaspoon (4g) baking soda", "1/2", "teaspoon", "baking soda"],
    [
      "5 tablespoons (75ml) olive oil, or duck fat",
      "5",
      "tablespoons",
      "olive oil, or duck fat",
    ],
    [
      "4 pounds (about 2kg) potatoes, peeled",
      "4",
      "pounds",
      "potatoes, peeled",
    ],
    ["1 cup (8 oz; 225 g) butter", "1", "cup", "butter"],
    ["1 cup (160 mL) milk", "1", "cup", "milk"],
    [
      "1 cup (200 g) sugar plus 1 tbsp more",
      "1",
      "cup",
      "sugar plus 1 tbsp more",
    ],
    ["1 cup (200 g) plus 1 tbsp sugar", "1", "cup", "sugar, plus 1 tbsp"],
  ])("drops the repeated measure in %s", (line, quantity, unit, name) => {
    expect(parseIngredientLine(line)).toEqual({ quantity, unit, name });
  });

  it("moves other notes after the unit to the end of the name", () => {
    expect(parseIngredientLine("1 cup (packed) brown sugar")?.name).toBe(
      "brown sugar (packed)",
    );
    expect(parseIngredientLine("2 tbsp (optional) capers, drained")?.name).toBe(
      "capers, drained (optional)",
    );
  });

  it("keeps a bracket that is all there is to the name", () => {
    expect(parseIngredientLine("1 cup (milk)")?.name).toBe("(milk)");
    expect(parseIngredientLine("1 cup (160 ml)")?.name).toBe("(160 ml)");
  });

  it("removes references to footnotes with or without a number", () => {
    expect(parseIngredientLine("1 cup rice (see note)")?.name).toBe("rice");
    expect(parseIngredientLine("1 cup rice (notes)")?.name).toBe("rice");
    expect(parseIngredientLine("1 cup rice (note)")?.name).toBe("rice");
  });

  it("leaves ordinary and unbalanced brackets alone", () => {
    expect(parseIngredientLine("1 cup milk (whole)")?.name).toBe(
      "milk (whole)",
    );
    expect(parseIngredientLine("1 cup milk (, warm) plus (cold)")?.name).toBe(
      "milk (, warm) plus (cold)",
    );
    expect(parseIngredientLine("1 cup Notes 5 blend")?.name).toBe(
      "Notes 5 blend",
    );
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
