import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import type { FetchedPage } from "@/lib/types/import-types";

const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; Tastebase/1.0; self-hosted recipe manager)";

export class PageFetchError extends Error {}

// Addresses a self-hosted server must never fetch on a user's behalf:
// loopback, private networks, link-local (cloud metadata), CGNAT, multicast.
const blockedAddresses = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
}

export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) {
    return true;
  }
  if (family === 6) {
    const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) {
      return blockedAddresses.check(mapped[1], "ipv4");
    }
    return blockedAddresses.check(address, "ipv6");
  }
  return blockedAddresses.check(address, "ipv4");
}

export function parseImportUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new PageFetchError("That doesn't look like a valid web address");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new PageFetchError("Only http and https links can be imported");
  }
  if (url.username || url.password) {
    throw new PageFetchError(
      "Links with embedded credentials aren't supported",
    );
  }
  return url;
}

async function assertPublicHost(url: URL): Promise<void> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [hostname]
    : (await lookup(hostname, { all: true, verbatim: true })).map(
        (entry) => entry.address,
      );

  if (addresses.length === 0 || addresses.some(isBlockedAddress)) {
    throw new PageFetchError(
      "Tastebase can't import from local or private network addresses",
    );
  }
}

async function readLimitedBytes(
  response: Response,
  maxBytes: number,
  tooLargeMessage: string,
): Promise<Buffer> {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    throw new PageFetchError(tooLargeMessage);
  }
  if (!response.body) {
    return Buffer.alloc(0);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new PageFetchError(tooLargeMessage);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

interface PublicResponse {
  url: URL;
  response: Response;
}

// Follows redirects by hand so every hop is checked against private networks.
async function fetchPublic(
  input: string,
  accept: string,
): Promise<PublicResponse> {
  let url = parseImportUrl(input);
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    await assertPublicHost(url);

    const response = await fetch(url, {
      redirect: "manual",
      signal,
      headers: { "User-Agent": USER_AGENT, Accept: accept },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new PageFetchError("The page redirected without a destination");
      }
      url = parseImportUrl(new URL(location, url).toString());
      continue;
    }

    return { url, response };
  }

  throw new PageFetchError("The page redirected too many times");
}

export async function fetchRecipePage(input: string): Promise<FetchedPage> {
  const { url, response } = await fetchPublic(
    input,
    "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  );

  if (
    response.status === 401 ||
    response.status === 402 ||
    response.status === 403
  ) {
    throw new PageFetchError(
      "This site blocks automated imports or needs a login or subscription. Use the Save to Tastebase browser extension on the recipe page, or copy the text and paste it instead.",
    );
  }
  if (!response.ok) {
    throw new PageFetchError(`The site returned HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html")) {
    throw new PageFetchError("That link doesn't point to a web page");
  }

  const html = await readLimitedBytes(
    response,
    MAX_HTML_BYTES,
    "The page is too large to import",
  );
  return { url: url.toString(), html: new TextDecoder().decode(html) };
}

export async function fetchRecipeImage(input: string): Promise<Buffer> {
  const { response } = await fetchPublic(
    input,
    "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
  );
  if (!response.ok) {
    throw new PageFetchError(`The image returned HTTP ${response.status}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new PageFetchError("That link doesn't point to an image");
  }
  return readLimitedBytes(response, MAX_IMAGE_BYTES, "The image is too large");
}
