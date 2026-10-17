import { describe, expect, it } from "vitest";
import { TemperatureUnit } from "@/lib/types";
import {
  convertTemperaturesInText,
  parseQuantity,
  scaleAmount,
  servingsFactor,
} from "@/lib/utils/ingredient-scaling";

describe("parseQuantity", () => {
  it("reads whole numbers, decimals and fractions", () => {
    expect(parseQuantity("2")).toBe(2);
    expect(parseQuantity("1.5")).toBe(1.5);
    expect(parseQuantity("1,5")).toBe(1.5);
    expect(parseQuantity("1/2")).toBe(0.5);
    expect(parseQuantity("1 1/2")).toBe(1.5);
  });

  it("reads unicode fractions", () => {
    expect(parseQuantity("½")).toBe(0.5);
    expect(parseQuantity("1½")).toBe(1.5);
    expect(parseQuantity("1 ¾")).toBe(1.75);
  });

  it("rejects text and zero denominators", () => {
    expect(parseQuantity("a pinch")).toBeNull();
    expect(parseQuantity("1/0")).toBeNull();
  });
});

describe("scaleAmount", () => {
  it("leaves amounts alone at 1x", () => {
    expect(scaleAmount("1 1/2", 1)).toBe("1 1/2");
  });

  it("doubles and halves simple amounts", () => {
    expect(scaleAmount("2", 2)).toBe("4");
    expect(scaleAmount("1/2", 2)).toBe("1");
    expect(scaleAmount("3", 0.5)).toBe("1 ½");
    expect(scaleAmount("400", 0.5)).toBe("200");
  });

  it("scales ranges", () => {
    expect(scaleAmount("2-3", 2)).toBe("4–6");
    expect(scaleAmount("1 to 2", 2)).toBe("2–4");
  });

  it("keeps trailing words", () => {
    expect(scaleAmount("2 large", 2)).toBe("4 large");
  });

  it("does not scale non-numeric amounts", () => {
    expect(scaleAmount("to taste", 2)).toBe("to taste");
    expect(scaleAmount("a handful", 3)).toBe("a handful");
    expect(scaleAmount(null, 2)).toBe("");
  });
});

describe("servingsFactor", () => {
  it("computes the ratio between target and original servings", () => {
    expect(servingsFactor(4, 8)).toBe(2);
    expect(servingsFactor(4, 2)).toBe(0.5);
  });

  it("falls back to 1 when servings are unknown", () => {
    expect(servingsFactor(null, 6)).toBe(1);
    expect(servingsFactor(0, 6)).toBe(1);
  });
});

describe("convertTemperaturesInText", () => {
  it("converts temperatures mentioned in a step", () => {
    expect(
      convertTemperaturesInText(
        "Bake at 350°F for 20 minutes",
        TemperatureUnit.CELSIUS,
      ),
    ).toBe("Bake at 177°C for 20 minutes");
  });

  it("leaves matching units and plain numbers alone", () => {
    expect(
      convertTemperaturesInText("Heat to 200°C", TemperatureUnit.CELSIUS),
    ).toBe("Heat to 200°C");
    expect(
      convertTemperaturesInText(
        "Simmer for 350 seconds",
        TemperatureUnit.CELSIUS,
      ),
    ).toBe("Simmer for 350 seconds");
  });
});
