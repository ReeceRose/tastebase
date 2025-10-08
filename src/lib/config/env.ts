import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

function calculateEntropy(text: string): number {
  const charCounts = new Map<string, number>();
  for (const char of text) {
    charCounts.set(char, (charCounts.get(char) || 0) + 1);
  }

  let entropy = 0;
  const textLength = text.length;
  for (const count of charCounts.values()) {
    const probability = count / textLength;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

function checkCharacterVariety(key: string): boolean {
  const hasUpperCase = /[A-Z]/.test(key);
  const hasLowerCase = /[a-z]/.test(key);
  const hasNumbers = /[0-9]/.test(key);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(key);

  const varietyScore = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChars,
  ].filter(Boolean).length;
  return varietyScore >= 3;
}

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_TELEMETRY: z.string().default("0"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
    ENCRYPTION_SECRET: z
      .string()
      .min(
        32,
        "ENCRYPTION_SECRET must be at least 32 characters for secure API key encryption",
      )
      .refine(
        (key) => {
          const entropy = calculateEntropy(key);
          const hasVariety = checkCharacterVariety(key);
          return entropy > 4.0 && hasVariety;
        },
        {
          message:
            "ENCRYPTION_SECRET must have good entropy and character variety (uppercase, lowercase, numbers, special chars)",
        },
      ),
    CURRENT_ENCRYPTION_VERSION: z.coerce.number().default(1),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // We use BETTER_AUTH_URL on both server and client
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtime (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_TELEMETRY: process.env.BETTER_AUTH_TELEMETRY,
    NODE_ENV: process.env.NODE_ENV,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
    CURRENT_ENCRYPTION_VERSION: process.env.CURRENT_ENCRYPTION_VERSION,
  },
  /**
   * Run `build` or `dev` with SKIP_ENV_VALIDATION to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
