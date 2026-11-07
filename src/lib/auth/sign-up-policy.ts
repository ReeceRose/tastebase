import { count } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import { env } from "@/lib/config/env";

export const SIGN_UPS_CLOSED_MESSAGE =
  "Sign-ups are closed on this Tastebase. Ask whoever runs it to open them.";

export async function areSignUpsOpen(): Promise<boolean> {
  if (env.ALLOW_SIGN_UPS === "true") return true;
  const [row] = await db.select({ value: count() }).from(users);
  return row.value === 0;
}
