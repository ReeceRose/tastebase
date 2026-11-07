const YOUTUBE_ID = /^[\w-]{11}$/;
const VIMEO_ID = /^\d+$/;

function parseUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/")[1] ?? "";
    return YOUTUBE_ID.test(id) ? id : null;
  }
  if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && YOUTUBE_ID.test(fromQuery)) return fromQuery;

  const [, kind, id] = url.pathname.split("/");
  if (["embed", "shorts", "live", "v"].includes(kind ?? "") && id) {
    return YOUTUBE_ID.test(id) ? id : null;
  }
  return null;
}

function youtubeStart(url: URL): number | null {
  const raw = url.searchParams.get("t") ?? url.searchParams.get("start");
  if (!raw) return null;
  const match = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!match) return null;
  const [, h, m, s] = match;
  const seconds =
    parseInt(h ?? "0", 10) * 3600 +
    parseInt(m ?? "0", 10) * 60 +
    parseInt(s ?? "0", 10);
  return seconds > 0 ? seconds : null;
}

function vimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  const id = url.pathname
    .split("/")
    .filter(Boolean)
    .find((part) => VIMEO_ID.test(part));
  return id ?? null;
}

export function videoEmbedUrl(value: string | null): string | null {
  if (!value) return null;
  const url = parseUrl(value);
  if (!url) return null;

  const youtube = youtubeId(url);
  if (youtube) {
    const start = youtubeStart(url);
    const query = start ? `?start=${start}` : "";
    return `https://www.youtube-nocookie.com/embed/${youtube}${query}`;
  }

  const vimeo = vimeoId(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo}`;

  return null;
}

export function safeVideoLink(value: string | null): string | null {
  if (!value) return null;
  return parseUrl(value)?.toString() ?? null;
}
