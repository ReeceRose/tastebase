import { describe, expect, it } from "vitest";
import {
  extractTemperature,
  extractTimeMinutes,
  parseDurationText,
  parseIsoDuration,
} from "@/lib/import/recipe-text-helpers";

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
