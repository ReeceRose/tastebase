import { describe, expect, it } from "vitest";
import { cn, isNextRedirectError } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      expect(cn("px-2 py-1", "bg-blue-500")).toBe("px-2 py-1 bg-blue-500");
    });

    it("should handle conditional class names", () => {
      expect(cn("px-2", true && "py-1", false && "bg-red-500")).toBe(
        "px-2 py-1",
      );
    });

    it("should merge conflicting Tailwind classes", () => {
      expect(cn("px-2 px-4")).toBe("px-4");
    });

    it("should handle empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("")).toBe("");
      expect(cn(null, undefined)).toBe("");
    });
  });

  describe("isNextRedirectError", () => {
    it("should return true for Next.js redirect errors", () => {
      const redirectError = {
        digest: "NEXT_REDIRECT;replace;/dashboard",
      };
      expect(isNextRedirectError(redirectError)).toBe(true);
    });

    it("should return true for any error with NEXT_REDIRECT in digest", () => {
      const redirectError = {
        digest: "Some other info NEXT_REDIRECT more info",
      };
      expect(isNextRedirectError(redirectError)).toBe(true);
    });

    it("should return false for non-redirect errors", () => {
      const regularError = {
        message: "Regular error",
      };
      expect(isNextRedirectError(regularError)).toBe(false);
    });

    it("should return false for errors without digest", () => {
      const errorWithoutDigest = {
        message: "Error without digest",
      };
      expect(isNextRedirectError(errorWithoutDigest)).toBe(false);
    });

    it("should return false for null/undefined/primitives", () => {
      expect(isNextRedirectError(null)).toBe(false);
      expect(isNextRedirectError(undefined)).toBe(false);
      expect(isNextRedirectError("string error")).toBe(false);
      expect(isNextRedirectError(123)).toBe(false);
    });

    it("should return false for errors with non-string digest", () => {
      const errorWithNumberDigest = {
        digest: 123,
      };
      expect(isNextRedirectError(errorWithNumberDigest)).toBe(false);
    });
  });
});
