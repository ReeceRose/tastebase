import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { sessions, users } from "@/db/schema.base";
import { auth } from "@/lib/auth/auth";

vi.mock("@/db", async () => {
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const schema = await import("@/db/schema");

  const testDb = drizzle(new Database(":memory:"), { schema });
  migrate(testDb, { migrationsFolder: "./src/db/migrations" });
  return { db: testDb };
});

const signUp = async () => {
  const { headers, response } = await auth.api.signUpEmail({
    body: {
      email: "cook@example.com",
      password: "correct-horse-battery",
      name: "Cook",
    },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return { userId: response.user.id, headers: new Headers({ cookie }) };
};

describe("session freshness", () => {
  beforeEach(async () => {
    await db.delete(users);
  });

  it("returns a preference saved after sign-in", async () => {
    const { userId, headers } = await signUp();
    await auth.api.getSession({ headers });

    await db
      .update(users)
      .set({ preferredTemperatureUnit: "celsius" })
      .where(eq(users.id, userId));

    const session = await auth.api.getSession({ headers });
    expect(session?.user.preferredTemperatureUnit).toBe("celsius");
  });

  it("rejects a session as soon as it is revoked", async () => {
    const { userId, headers } = await signUp();
    expect(await auth.api.getSession({ headers })).not.toBeNull();

    await db.delete(sessions).where(eq(sessions.userId, userId));

    expect(await auth.api.getSession({ headers })).toBeNull();
  });
});
