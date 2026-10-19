// The source a recipe is filed under in the library: the website's domain
// when there is a link, otherwise whatever name was typed in.
export function recipeSourceKey(
  sourceUrl: string | null,
  sourceName: string | null,
): string | null {
  if (sourceUrl) {
    try {
      const host = new URL(sourceUrl.trim()).hostname
        .toLowerCase()
        .replace(/^www\./, "");
      if (host) return host;
    } catch {}
  }
  const name = sourceName?.trim();
  return name ? name : null;
}
