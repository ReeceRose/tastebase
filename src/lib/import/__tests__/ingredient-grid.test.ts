import { describe, expect, it } from "vitest";
import { parseIngredientLine } from "@/lib/import/ingredient-parser";

// Every combination of the ways recipes write each part of a line. One
// pattern change that breaks a combination shows up here, even if no real
// line in the fixtures happens to use it.

interface Part {
  text: string;
  expected: string | null;
}

const AMOUNTS: Part[] = [
  { text: "2", expected: "2" },
  { text: "1 1/2", expected: "1 1/2" },
  { text: "1 and 1/2", expected: "1 1/2" },
  { text: "1-1/2", expected: "1 1/2" },
  { text: "½", expected: "½" },
  { text: "1½", expected: "1½" },
  { text: "0.5", expected: "0.5" },
  { text: "1-2", expected: "1-2" },
  { text: "1/4-1/2", expected: "1/4-1/2" },
  { text: "2 to 3", expected: "2 to 3" },
];

const UNITS: Part[] = [
  { text: "cups", expected: "cups" },
  { text: "Tbsp", expected: "tbsp" },
  { text: "Tbsp.", expected: "tbsp" },
  { text: "tablespoons", expected: "tbsp" },
  { text: "tsp", expected: "tsp" },
  { text: "teaspoon", expected: "tsp" },
  { text: "g", expected: "g" },
  { text: "grams", expected: "g" },
  { text: "oz", expected: "oz" },
  { text: "lbs", expected: "lb" },
  { text: "ml", expected: "ml" },
  { text: "fl oz", expected: "fl oz" },
  { text: "cloves", expected: "cloves" },
  { text: "", expected: null },
];

const NAMES = ["flour", "extra-virgin olive oil", "boneless, skinless chicken"];

const SECOND_MEASURES: Part[] = [
  { text: "", expected: null },
  { text: " (120 g)", expected: "120 g" },
  { text: " / 120 g", expected: "120 g" },
];

const NOTES: Part[] = [
  { text: "", expected: null },
  { text: ", divided", expected: "divided" },
  { text: ", finely chopped", expected: "finely chopped" },
  { text: " (packed)", expected: "packed" },
  { text: " (, minced)", expected: "minced" },
  { text: ", plus more for serving", expected: "plus more for serving" },
];

const cases = AMOUNTS.flatMap((amount) =>
  UNITS.flatMap((unit) =>
    NAMES.flatMap((name) =>
      SECOND_MEASURES.flatMap((measure) =>
        NOTES.map((note) => ({ amount, unit, name, measure, note })),
      ),
    ),
  ),
).filter(({ unit, measure }) => unit.text !== "" || measure.text === "");

describe("every combination of amount, unit, name, measure and note", () => {
  it("covers thousands of lines", () => {
    expect(cases.length).toBeGreaterThan(5000);
  });

  it("reads each part back exactly", () => {
    const failures: string[] = [];
    for (const { amount, unit, name, measure, note } of cases) {
      const words = [amount.text, unit.text, name].filter(Boolean).join(" ");
      const line = unit.text
        ? `${amount.text} ${unit.text}${measure.text} ${name}${note.text}`
        : `${words}${note.text}`;
      const parsed = parseIngredientLine(line);
      const expectedName = measure.expected
        ? `${name} (${measure.expected})`
        : name;
      const ok =
        parsed?.quantity === amount.expected &&
        parsed?.unit === unit.expected &&
        parsed?.name === expectedName &&
        parsed?.notes === note.expected;
      if (!ok) {
        failures.push(
          `${line}  =>  ${parsed?.quantity} | ${parsed?.unit} | ${parsed?.name} | ${parsed?.notes}`,
        );
      }
    }
    expect(failures.slice(0, 25), `${failures.length} failed`).toEqual([]);
  });
});
