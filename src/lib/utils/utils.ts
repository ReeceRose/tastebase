import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

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

/**
 * Date formatting utilities using consistent formats across the application
 */
export const dateUtils = {
  /**
   * Format date as "Jan 1, 2024"
   */
  formatShortDate: (date: Date | string | number) => {
    return format(new Date(date), "MMM d, yyyy");
  },

  /**
   * Format date as "January 1, 2024"
   */
  formatLongDate: (date: Date | string | number) => {
    return format(new Date(date), "MMMM d, yyyy");
  },

  /**
   * Format date as "Jan 1, 2024 at 3:30 PM"
   */
  formatShortDateTime: (date: Date | string | number) => {
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  },

  /**
   * Format date as "January 1, 2024 at 3:30 PM"
   */
  formatLongDateTime: (date: Date | string | number) => {
    return format(new Date(date), "MMMM d, yyyy 'at' h:mm a");
  },
};

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  } else {
    return format(past, "MMM d, yyyy");
  }
}
