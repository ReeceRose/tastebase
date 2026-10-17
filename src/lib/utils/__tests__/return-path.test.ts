import { describe, expect, it } from "vitest";
import { safeReturnPath } from "@/lib/utils/return-path";

describe("safeReturnPath", () => {
  it("keeps paths inside Tastebase", () => {
    expect(safeReturnPath("/recipes/new?from=extension")).toBe(
      "/recipes/new?from=extension",
    );
  });

  it("falls back to home for anything else", () => {
    for (const value of [
      null,
      "",
      "https://evil.example.com",
      "//evil.example.com",
      "/\\evil.example.com",
      "/auth/sign-in",
    ]) {
      expect(safeReturnPath(value)).toBe("/");
    }
  });
});
