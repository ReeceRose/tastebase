import { beforeEach, describe, expect, it, vi } from "vitest";
import { areSignUpsOpen } from "@/lib/auth/sign-up-policy";

const mocks = vi.hoisted(() => ({
  env: { ALLOW_SIGN_UPS: "true" },
  userCount: 0,
}));

vi.mock("@/lib/config/env", () => ({ env: mocks.env }));
vi.mock("@/db/schema.base", () => ({ users: {} }));
vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: async () => [{ value: mocks.userCount }],
    }),
  },
}));

describe("areSignUpsOpen", () => {
  beforeEach(() => {
    mocks.env.ALLOW_SIGN_UPS = "true";
    mocks.userCount = 3;
  });

  it("is open by default", async () => {
    await expect(areSignUpsOpen()).resolves.toBe(true);
  });

  it("is closed once there are accounts", async () => {
    mocks.env.ALLOW_SIGN_UPS = "false";
    await expect(areSignUpsOpen()).resolves.toBe(false);
  });

  it("lets the first person in even when closed", async () => {
    mocks.env.ALLOW_SIGN_UPS = "false";
    mocks.userCount = 0;
    await expect(areSignUpsOpen()).resolves.toBe(true);
  });
});
