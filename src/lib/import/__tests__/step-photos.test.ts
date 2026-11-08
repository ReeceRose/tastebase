import { describe, expect, it } from "vitest";
import { matchStepPhotos } from "@/lib/import/step-photos";
import type { ParsedInstruction } from "@/lib/types/import-types";

function steps(...texts: string[]): ParsedInstruction[] {
  return texts.map((instruction, index) => ({
    step: index + 1,
    instruction,
    timeMinutes: null,
    temperature: null,
    groupName: null,
  }));
}

describe("matchStepPhotos", () => {
  const instructions = steps(
    "Heat the oil in a large skillet over medium heat.",
    "Add the onion and cook until soft, about 5 minutes.",
    "Stir in the rice and toast for 2 minutes.",
  );

  it("matches photos to steps by their text", () => {
    expect(
      matchStepPhotos(
        [
          {
            url: "https://a.com/2.jpg",
            text: "Add the onion and cook until soft, about 5 minutes.",
          },
          {
            url: "https://a.com/1.jpg",
            text: "Heat the oil in a large skillet over medium heat",
          },
        ],
        instructions,
      ),
    ).toEqual([
      { url: "https://a.com/2.jpg", stepNumber: 2 },
      { url: "https://a.com/1.jpg", stepNumber: 1 },
    ]);
  });

  it("matches a step the importer cleaned up", () => {
    expect(
      matchStepPhotos(
        [
          {
            url: "https://a.com/3.jpg",
            text: "Step 3: Stir in the rice and toast for 2 minutes. Don't let it burn!",
          },
        ],
        instructions,
      ),
    ).toEqual([{ url: "https://a.com/3.jpg", stepNumber: 3 }]);
  });

  it("leaves photos untagged when no step matches", () => {
    expect(
      matchStepPhotos(
        [
          { url: "https://a.com/x.jpg", text: "Serve with lime wedges." },
          { url: "https://a.com/section.jpg", text: "" },
          { url: "https://a.com/short.jpg", text: "Rice" },
        ],
        instructions,
      ),
    ).toEqual([]);
  });
});
