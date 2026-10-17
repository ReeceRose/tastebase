const LINK_PATTERN = /https?:\/\/[^\s<>"]+/i;

export interface SharedContent {
  url: string | null;
  text: string | null;
  title: string | null;
}

// Phones put a shared link in different places: Android apps often send it
// inside the text ("Try this! https://…") rather than as the url.
export function findSharedLink(shared: SharedContent): string | null {
  for (const value of [shared.url, shared.text, shared.title]) {
    const match = value?.match(LINK_PATTERN);
    if (!match) continue;
    const link = match[0].replace(/[).,!?;:'"]+$/, "");
    try {
      return new URL(link).toString();
    } catch {}
  }
  return null;
}
