const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|mc_|ref$|campaign)/i;

// Compares recipe links the way people think of them: the same page with or
// without www, a trailing slash, a #fragment or tracking parameters.
export function normalizeSourceUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const params = [...url.searchParams.entries()]
      .filter(([key]) => !TRACKING_PARAM.test(key))
      .sort(([a], [b]) => a.localeCompare(b));
    const query = new URLSearchParams(params).toString();
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.replace(/\/+$/, "");
    return `${host}${path}${query ? `?${query}` : ""}`;
  } catch {
    return null;
  }
}
