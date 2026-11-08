import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  getKeyboardShortcutSettings,
  updateKeyboardShortcutSettings,
} from "@/lib/server-actions/keyboard-shortcut-actions";
import { KeyboardShortcutAction } from "@/lib/types";

vi.mock("@/db", async () => {
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const schema = await import("@/db/schema");

  const testDb = drizzle(new Database(":memory:"), { schema });
  migrate(testDb, { migrationsFolder: "./src/db/migrations" });
  return { db: testDb };
});

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: async () => ({ user: { id: "user-1" } }),
    },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const insertUser = (id: string) =>
  db.insert(users).values({ id, name: id, email: `${id}@example.com` });

describe("keyboard shortcut settings", () => {
  const custom = {
    enabled: true,
    bindings: { [KeyboardShortcutAction.EDIT_RECIPE]: "shift+e" },
  };

  beforeEach(async () => {
    await db.delete(users);
    await insertUser("user-1");
    await insertUser("user-2");
  });

  it("starts off", async () => {
    expect(await getKeyboardShortcutSettings()).toEqual({
      enabled: false,
      bindings: {},
    });
  });

  it("reads back a saved choice", async () => {
    const result = await updateKeyboardShortcutSettings(custom);

    expect(result).toEqual({ success: true, data: custom });
    expect(await getKeyboardShortcutSettings()).toEqual(custom);
  });

  it("refuses a clashing set and keeps what was saved", async () => {
    await updateKeyboardShortcutSettings(custom);

    const result = await updateKeyboardShortcutSettings({
      enabled: true,
      bindings: { [KeyboardShortcutAction.EDIT_RECIPE]: "c" },
    });

    expect(result.success).toBe(false);
    expect(await getKeyboardShortcutSettings()).toEqual(custom);
  });

  it("only changes the signed-in person's shortcuts", async () => {
    await updateKeyboardShortcutSettings(custom);

    const [other] = await db
      .select({ value: users.keyboardShortcuts })
      .from(users)
      .where(eq(users.id, "user-2"));
    expect(other.value).toBeNull();
  });
});
