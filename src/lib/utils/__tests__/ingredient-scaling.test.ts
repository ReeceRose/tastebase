import { describe, expect, it } from "vitest";
import { MeasurementUnit, TemperatureUnit } from "@/lib/types";
import {
  convertTemperaturesInText,
  displayIngredientAmount,
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

describe("measures kept in an ingredient's name", () => {
  const { METRIC, IMPERIAL } = MeasurementUnit;
  const SUGAR = "granulated sugar (4 2/3 ounces; 132 g)";
  const show = (
    amount: string,
    unit: string,
    name: string,
    factor: number,
    system: MeasurementUnit | null,
  ) => {
    const result = displayIngredientAmount(amount, unit, factor, system, name);
    return `${result.amount} ${result.unit} | ${result.name}`;
  };

  it("uses the author's metric weight as the amount", () => {
    expect(show("2/3", "cup", SUGAR, 1, METRIC)).toBe(
      "132 g | granulated sugar",
    );
    expect(show("2/3", "cup", SUGAR, 2, METRIC)).toBe(
      "264 g | granulated sugar",
    );
    expect(
      show("4", "cups", "ice cubes (15 1/2 ounces; 439 g), divided", 1, METRIC),
    ).toBe("439 g | ice cubes, divided");
    expect(show("1", "tbsp", "butter (14 g)", 1, METRIC)).toBe("14 g | butter");
    expect(show("1", "cup", "milk (240 ml)", 1, METRIC)).toBe("240 ml | milk");
    expect(show("10", "cups", "flour (1250 g)", 1, METRIC)).toBe(
      "1.25 kg | flour",
    );
  });

  it("converts the author's weight when it isn't in metric", () => {
    expect(show("1", "cup", "flour (8 oz)", 1, METRIC)).toBe("225 g | flour");
  });

  it("keeps cups in imperial and scales the weight beside them", () => {
    expect(show("2/3", "cup", SUGAR, 1, IMPERIAL)).toBe(
      "⅔ cup | granulated sugar (4 ⅔ ounces)",
    );
    expect(show("2/3", "cup", SUGAR, 2, IMPERIAL)).toBe(
      "1 ⅓ cups | granulated sugar (9 ⅓ ounces)",
    );
    expect(show("1", "cup", "flour (125 g)", 2, IMPERIAL)).toBe(
      "2 cups | flour (250 g)",
    );
  });

  it("uses the author's cups for an imperial reader of a metric recipe", () => {
    expect(show("125", "g", "flour (1 cup)", 1, IMPERIAL)).toBe(
      "1 cup | flour",
    );
  });

  it("scales the whole note when no system is chosen", () => {
    expect(show("2/3", "cup", SUGAR, 2, null)).toBe(
      "1 ⅓ cups | granulated sugar (9 ⅓ ounces; 264 g)",
    );
  });

  it("drops an adjustment when the weight already includes it", () => {
    expect(
      show(
        "2",
        "cups",
        "cake flour (8 ½ ounces), minus 2 tablespoons",
        1,
        METRIC,
      ),
    ).toBe("240 g | cake flour");
  });

  it("scales adjustments with the amount", () => {
    expect(show("1", "cup", "sugar, plus 1 tbsp", 2, IMPERIAL)).toBe(
      "2 cups | sugar, plus 2 tbsp",
    );
    expect(show("1", "cup", "sugar, plus 1 tablespoon", 2, IMPERIAL)).toBe(
      "2 cups | sugar, plus 2 tablespoons",
    );
    expect(
      show(
        "2",
        "cups",
        "cake flour (8 ½ ounces), minus 2 tablespoons",
        0.5,
        IMPERIAL,
      ),
    ).toBe("1 cup | cake flour (4 ¼ ounces), minus 1 tablespoon");
  });

  it("leaves package sizes and ordinary notes alone", () => {
    expect(show("2", "cans", "diced tomatoes (14 oz)", 2, METRIC)).toBe(
      "4 cans | diced tomatoes (14 oz)",
    );
    expect(show("1", "cup", "milk (whole)", 2, IMPERIAL)).toBe(
      "2 cups | milk (whole)",
    );
    expect(show("1", "cup", "tomatoes (14 oz can)", 1, METRIC)).toBe(
      "250 ml | tomatoes (14 oz can)",
    );
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
