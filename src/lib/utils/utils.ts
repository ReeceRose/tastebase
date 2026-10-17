import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "hero",
        "display",
        "title",
        "heading",
        "tile",
        "lead",
        "body",
        "meta",
        "caption",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if an error is a Next.js redirect error
 * This is useful for avoiding treating redirects as errors in client-side error handling
 */
export function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorObj = error as Record<string, unknown>;
  return (
    "digest" in errorObj &&
    typeof errorObj.digest === "string" &&
    errorObj.digest.includes("NEXT_REDIRECT")
  );
}
