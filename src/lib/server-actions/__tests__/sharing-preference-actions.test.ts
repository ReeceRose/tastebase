// @vitest-environment node
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  getDefaultRecipeIsPublic,
  updateDefaultRecipeIsPublic,
} from "@/lib/server-actions/sharing-preference-actions";

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

describe("default recipe sharing preference", () => {
  beforeEach(async () => {
    await db.delete(users);
    await insertUser("user-1");
    await insertUser("user-2");
  });

  it("starts shared so existing households see no change", async () => {
    expect(await getDefaultRecipeIsPublic()).toBe(true);
  });

  it("reads back a new choice straight away", async () => {
    const result = await updateDefaultRecipeIsPublic(false);

    expect(result).toEqual({ success: true, data: false });
    expect(await getDefaultRecipeIsPublic()).toBe(false);
  });

  it("only changes the signed-in person's preference", async () => {
    await updateDefaultRecipeIsPublic(false);

    const [other] = await db
      .select({ value: users.defaultRecipeIsPublic })
      .from(users)
      .where(eq(users.id, "user-2"));
    expect(other.value).toBe(true);
  });
});
