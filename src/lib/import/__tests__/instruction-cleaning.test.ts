import { describe, expect, it } from "vitest";
import {
  tidySteps,
  toParsedInstructions,
} from "@/lib/import/instruction-cleaning";

function steps(...lines: string[]) {
  return lines.map((text) => ({ text, groupName: null }));
}

describe("tidySteps", () => {
  it.each([
    ["Enjoy!"],
    ["enjoy"],
    ["Serve and enjoy."],
    ["Bon appétit!"],
    ["Gather all the ingredients."],
    ["Gather your ingredients"],
    ["Tried this recipe? Let us know"],
  ])("drops the filler step %s", (line) => {
    expect(tidySteps(steps("Mix well.", line))).toHaveLength(1);
  });

  it("keeps real steps that mention enjoying", () => {
    expect(tidySteps(steps("Enjoy warm with butter."))).toHaveLength(1);
  });

  it("removes step numbers", () => {
    expect(
      tidySteps(steps("Step 1: Mix.", "2. Bake.", "Step 3 Cool.")).map(
        (step) => step.text,
      ),
    ).toEqual(["Mix.", "Bake.", "Cool."]);
  });

  it("splits numbered steps written as one block", () => {
    expect(
      tidySteps(steps("1. Mix the batter. 2. Bake until set. 3. Cool it.")).map(
        (step) => step.text,
      ),
    ).toEqual(["Mix the batter.", "Bake until set.", "Cool it."]);
  });

  it("leaves numbers inside a step alone", () => {
    expect(
      tidySteps(steps("Bake at 350 for 20 minutes. Cool for 10 more.")),
    ).toHaveLength(1);
  });

  it("uses heading lines as sections", () => {
    expect(tidySteps(steps("For the sauce:", "Simmer the stock."))).toEqual([
      { text: "Simmer the stock.", groupName: "For the sauce" },
    ]);
  });
});

describe("toParsedInstructions", () => {
  it("numbers what's left and reads times and temperatures", () => {
    expect(
      toParsedInstructions(steps("Bake at 350°F for 20 minutes.", "Enjoy!")),
    ).toEqual([
      {
        step: 1,
        instruction: "Bake at 350°F for 20 minutes.",
        timeMinutes: 20,
        temperature: "350°F",
        groupName: null,
      },
    ]);
  });
});
