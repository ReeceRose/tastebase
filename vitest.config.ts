import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    globals: true,
    css: true,
    include: [
      "src/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
    exclude: ["node_modules", ".next", "dist", "build"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules",
        "src/__tests__/setup.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "src/db/migrations/**",
        "src/db/seed.ts",
        ".next/**",
      ],
    },
    // Mock environment variables for testing
    env: {
      NODE_ENV: "test",
      SKIP_ENV_VALIDATION: "true",
      // Mock database URL for tests
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      // Mock public env vars
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      // Mock auth secret for encryption tests
      BETTER_AUTH_SECRET:
        "test-secret-key-that-is-at-least-32-characters-long-with-variety!@#123",
      BETTER_AUTH_URL: "http://localhost:3000",
      // Mock encryption secrets
      ENCRYPTION_SECRET:
        "test-encryption-key-32chars-long-with-variety-UpperLower123!@#$%",
      CURRENT_ENCRYPTION_VERSION: "1",
      // Mock Ollama URL
      OLLAMA_BASE_URL: "http://localhost:11434",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
