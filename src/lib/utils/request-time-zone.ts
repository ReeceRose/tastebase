import { cookies } from "next/headers";
import { resolveTimeZone, TIME_ZONE_COOKIE } from "@/lib/utils/time-zone";

export async function getRequestTimeZone(): Promise<string> {
  const store = await cookies();
  return resolveTimeZone(store.get(TIME_ZONE_COOKIE)?.value ?? null);
}
