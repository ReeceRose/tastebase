"use server";

import { cookies } from "next/headers";
import { isValidTimeZone, TIME_ZONE_COOKIE } from "@/lib/utils/time-zone";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function rememberTimeZone(zone: string): Promise<void> {
  if (!isValidTimeZone(zone)) return;
  const store = await cookies();
  store.set(TIME_ZONE_COOKIE, zone, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
}
