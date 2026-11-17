"use client";

import { useEffect } from "react";
import { rememberTimeZone } from "@/lib/server-actions/time-zone-actions";
import { TIME_ZONE_COOKIE } from "@/lib/utils/time-zone";

export function TimeZoneCookie() {
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const saved = `${TIME_ZONE_COOKIE}=${encodeURIComponent(zone)}`;
    if (!zone || document.cookie.split("; ").includes(saved)) return;
    void rememberTimeZone(zone).catch(() => null);
  }, []);

  return null;
}
