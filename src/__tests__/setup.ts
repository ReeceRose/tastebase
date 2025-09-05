import "@testing-library/jest-dom";
import "vitest-canvas-mock";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

// Mock Next.js specific modules
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/test-path",
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: () => new Map(),
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock environment variables
// Mock environment variables
// @ts-expect-error - Setting NODE_ENV for test environment
process.env.NODE_ENV = "test";
process.env.SKIP_ENV_VALIDATION = "true";

// Mock database - will be overridden in individual tests as needed
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Setup MSW for API mocking
const server = setupServer();

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// Clean up after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
});

// Global test utilities
global.testUtils = {
  // Helper to create mock user
  mockUser: (overrides = {}) => ({
    id: "test_user_id",
    email: "test@example.com",
    name: "Test User",
    subscriptionStatus: "none",
    subscriptionPlan: null,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  // Helper to create mock organization
  mockOrganization: (overrides = {}) => ({
    id: "test_org_id",
    name: "Test Organization",
    slug: "test-org",
    subscriptionStatus: "none",
    subscriptionPlan: null,
    memberLimit: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  // Helper to wait for async operations
  waitFor: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// Extend global namespace for TypeScript
declare global {
  var testUtils: {
    mockUser: (overrides?: Record<string, unknown>) => unknown;
    mockOrganization: (overrides?: Record<string, unknown>) => unknown;
    waitFor: (ms: number) => Promise<void>;
  };
}

export { server };
