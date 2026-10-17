import * as cheerio from "cheerio";
import { NOISE_SELECTORS } from "@/lib/import/html-to-text";
import { photoKey, sizeFromUrl } from "@/lib/utils/photo-suggestions";

const MAX_PHOTOS = 20;
const MIN_DECLARED_WIDTH = 400;
const JUNK_PATTERN =
  /(logo|avatar|icon|sprite|pixel|badge|placeholder|spinner|author|profile|headshot|emoji|banner|advert|tracking|\/cta\/|ebook)/i;
const EXTRA_NOISE = [
  "[class*='related']",
  "[class*='recirc']",
  "[class*='author']",
  "[class*='byline']",
  "[class*='promo']",
  "[class*='sponsored']",
  "[class*='shop']",
  "[class*='product']",
  "[class*='affiliate']",
].join(", ");
// Step photos usually sit in the post body around the recipe card, so search
// the whole article rather than just the card.
const PHOTO_CONTAINERS = [
  ".entry-content",
  ".post-content",
  ".article-content",
  ".article-body",
  "article",
  "main",
  "[role='main']",
];
const SHOP_IMAGE_HOSTS =
  /(^|\.)(media-amazon\.com|ssl-images-amazon\.com|scene7\.com|walmartimages\.com|shopify\.com)$/i;
const SHARE_SITES = new Set([
  "pinterest.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
]);
const MAX_ASPECT = 3;
const LAZY_ATTRIBUTES = [
  "data-src",
  "data-lazy-src",
  "data-original",
  "data-hi-res-src",
  "src",
];

function largestFromSrcset(srcset: string | undefined): string | null {
  if (!srcset) return null;
  let best: { url: string; size: number } | null = null;
  for (const entry of srcset.split(/,\s+/)) {
    const [url, descriptor = ""] = entry.trim().split(/\s+/);
    const size = Number.parseFloat(descriptor) || 0;
    if (url && (!best || size > best.size)) {
      best = { url, size };
    }
  }
  return best?.url ?? null;
}

function absolute(value: string | null, base: string): string | null {
  if (!value || value.startsWith("data:")) return null;
  try {
    const url = new URL(value, base);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function siteOf(hostname: string): string {
  return hostname.split(".").slice(-2).join(".");
}

function isLikelyPhoto(url: string, pageUrl: string): boolean {
  const { origin, hostname, pathname } = new URL(url);
  const page = new URL(pageUrl);
  if (origin === page.origin && pathname === page.pathname) {
    return false;
  }
  if (SHOP_IMAGE_HOSTS.test(hostname)) {
    return false;
  }
  const size = sizeFromUrl(url);
  if (
    size &&
    size.height > 0 &&
    Math.max(size.width / size.height, size.height / size.width) > MAX_ASPECT
  ) {
    return false;
  }
  return !/\.(svg|gif|ico)$/i.test(pathname) && !JUNK_PATTERN.test(pathname);
}

// Product photos in shopping roundups link out to the shop.
function linksOffSite(href: string | undefined, pageUrl: string): boolean {
  if (!href) return false;
  try {
    const site = siteOf(new URL(href, pageUrl).hostname);
    return !SHARE_SITES.has(site) && site !== siteOf(new URL(pageUrl).hostname);
  } catch {
    return false;
  }
}

// Finds photos in the recipe content, skipping navigation, ads, author
// photos and anything declared too small to be a food photo.
export function findPagePhotos(
  html: string,
  pageUrl: string,
  leadingUrls: string[],
): string[] {
  const $ = cheerio.load(html);
  $(NOISE_SELECTORS).not("img").remove();
  $(EXTRA_NOISE).remove();

  const contentSelector =
    PHOTO_CONTAINERS.find(
      (selector) => $(selector).first().find("img").length,
    ) ?? "body";
  const found: string[] = [...leadingUrls];

  $(contentSelector)
    .first()
    .find("img, picture source")
    .each((_, element) => {
      const node = $(element);
      if (linksOffSite(node.closest("a").attr("href"), pageUrl)) {
        return;
      }
      const declaredWidth = Number.parseInt(node.attr("width") ?? "", 10);
      if (!Number.isNaN(declaredWidth) && declaredWidth < MIN_DECLARED_WIDTH) {
        return;
      }
      const candidate =
        largestFromSrcset(node.attr("data-srcset") ?? node.attr("srcset")) ??
        LAZY_ATTRIBUTES.map((name) => node.attr(name)).find(Boolean) ??
        null;
      const url = absolute(candidate, pageUrl);
      if (url && isLikelyPhoto(url, pageUrl)) {
        found.push(url);
      }
    });

  const seen = new Set<string>();
  return found
    .filter((url) => {
      const key = photoKey(url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_PHOTOS);
}
