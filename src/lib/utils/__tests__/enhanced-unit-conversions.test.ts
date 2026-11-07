import { describe, expect, it } from "vitest";
import { MeasurementUnit } from "@/lib/types";
import { formatIngredientForDisplayEnhanced } from "@/lib/utils/enhanced-unit-conversions";
import { displayIngredientAmount } from "@/lib/utils/ingredient-scaling";

function toMetric(amount: string, unit: string) {
  const result = formatIngredientForDisplayEnhanced(
    amount,
    unit,
    MeasurementUnit.METRIC,
  );
  return `${result.amount} ${result.unit}`;
}

function toImperial(amount: string, unit: string) {
  const result = formatIngredientForDisplayEnhanced(
    amount,
    unit,
    MeasurementUnit.IMPERIAL,
  );
  return `${result.amount} ${result.unit}`;
}

function display(
  amount: string,
  unit: string,
  factor: number,
  system: MeasurementUnit | null,
) {
  const result = displayIngredientAmount(amount, unit, factor, system);
  return [result.amount, result.unit].filter(Boolean).join(" ");
}

describe("converting to metric", () => {
  it("uses round kitchen amounts", () => {
    expect(toMetric("1", "tsp")).toBe("5 ml");
    expect(toMetric("1/2", "tsp")).toBe("2.5 ml");
    expect(toMetric("3", "tbsp")).toBe("45 ml");
    expect(toMetric("1", "cup")).toBe("250 ml");
    expect(toMetric("4", "cups")).toBe("1 L");
    expect(toMetric("5", "cups")).toBe("1.25 L");
    expect(toMetric("8", "oz")).toBe("250 g");
    expect(toMetric("1", "lb")).toBe("450 g");
    expect(toMetric("3", "lb")).toBe("1.4 kg");
  });

  it("treats fractions the same however they are written", () => {
    expect(toMetric("1/4", "cup")).toBe("60 ml");
    expect(toMetric("¼", "cup")).toBe("60 ml");
    expect(toMetric("1/3", "cup")).toBe("80 ml");
    expect(toMetric("⅔", "cup")).toBe("160 ml");
    expect(toMetric("1 ½", "tbsp")).toBe("22.5 ml");
  });

  it("keeps T as a tablespoon and C as a cup", () => {
    expect(toMetric("1", "T")).toBe("15 ml");
    expect(toMetric("1", "t")).toBe("5 ml");
    expect(toMetric("1", "C")).toBe("250 ml");
    expect(toMetric("1", "c")).toBe("250 ml");
  });

  it("tidies metric amounts without changing them", () => {
    expect(toMetric("37", "g")).toBe("37 g");
    expect(toMetric("1200", "g")).toBe("1.2 kg");
    expect(toMetric("1000", "ml")).toBe("1 L");
    expect(toMetric("1", "L")).toBe("1 L");
    expect(toMetric("½", "L")).toBe("500 ml");
  });
});

describe("converting to imperial", () => {
  it("converts volume to the unit a cook would use", () => {
    expect(toImperial("5", "ml")).toBe("1 tsp");
    expect(toImperial("30", "ml")).toBe("2 tbsp");
    expect(toImperial("125", "ml")).toBe("½ cup");
    expect(toImperial("1", "L")).toBe("4 cup");
    expect(toImperial("1 ½", "L")).toBe("6 cup");
  });

  it("converts weight", () => {
    expect(toImperial("30", "g")).toBe("1 oz");
    expect(toImperial("800", "g")).toBe("1 ¾ lb");
    expect(toImperial("1.2", "kg")).toBe("2 ¾ lb");
  });

  it("leaves amounts already in imperial alone", () => {
    expect(toImperial("1/2", "tsp")).toBe("1/2 tsp");
    expect(toImperial("2", "cups")).toBe("2 cups");
  });
});

describe("amounts that can't be converted directly", () => {
  it("converts both ends of a range", () => {
    expect(toMetric("2-3", "tbsp")).toBe("30–45 ml");
    expect(toMetric("1 to 2", "cups")).toBe("250–500 ml");
    expect(toImperial("500-750", "g")).toBe("1–1 ¾ lb");
  });

  it("leaves text and counts as written", () => {
    expect(toMetric("to taste", "tsp")).toBe("to taste tsp");
    expect(toMetric("2 heaped", "tbsp")).toBe("2 heaped tbsp");
    expect(toMetric("3", "cloves")).toBe("3 cloves");
    expect(toImperial("2", "cans")).toBe("2 cans");
    expect(toMetric("2", "large")).toBe("2 large");
  });
});

describe("displayIngredientAmount", () => {
  const { METRIC, IMPERIAL } = MeasurementUnit;

  it("matches the unit to the amount", () => {
    expect(display("2", "cans", 0.5, IMPERIAL)).toBe("1 can");
    expect(display("4", "cups", 0.25, IMPERIAL)).toBe("1 cup");
    expect(display("1", "sprig", 3, IMPERIAL)).toBe("3 sprigs");
    expect(display("1", "cup", 1.5, IMPERIAL)).toBe("1 ½ cups");
    expect(display("1", "bunch", 2, null)).toBe("2 bunches");
  });

  it("uses the singular for a fraction of one", () => {
    expect(display("2", "cups", 0.25, IMPERIAL)).toBe("½ cup");
    expect(display("3", "cloves", 0.25, METRIC)).toBe("¾ clove");
  });

  it("goes by the top of a range", () => {
    expect(display("1-2", "cloves", 1, IMPERIAL)).toBe("1-2 cloves");
  });

  it("leaves units it doesn't know and abbreviations alone", () => {
    expect(display("2", "tbsp", 1, IMPERIAL)).toBe("2 tbsp");
    expect(display("2", "dollops", 0.5, IMPERIAL)).toBe("1 dollops");
    expect(display("a handful", "cups", 1, IMPERIAL)).toBe("a handful cups");
  });

  it("scales and converts together", () => {
    expect(display("1", "L", 1.5, IMPERIAL)).toBe("6 cups");
    expect(display("800", "g", 1.5, IMPERIAL)).toBe("2 ¾ lbs");
    expect(display("4", "cups", 1.25, METRIC)).toBe("1.25 L");
    expect(display("3", "tbsp", 1, METRIC)).toBe("45 ml");
  });
});
