import * as cheerio from "cheerio";

export interface PageText {
  title: string | null;
  siteName: string | null;
  imageUrl: string | null;
  text: string;
}

export const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "form",
  "nav",
  "header",
  "footer",
  "aside",
  "[role='navigation']",
  "[aria-hidden='true']",
  "#comments",
  ".comments",
  ".comment-list",
  ".advertisement",
  ".ads",
  ".ad",
  ".sidebar",
  ".share",
  ".social",
  ".newsletter",
  ".wprm-recipe-rating",
  ".wprm-call-to-action",
].join(", ");

// Recipe card containers from the common WordPress recipe plugins, then
// generic fallbacks. The first one with enough text is used.
const CONTENT_SELECTORS = [
  ".wprm-recipe-container",
  ".wprm-recipe",
  ".tasty-recipes",
  ".mv-create-card",
  ".recipe-card",
  "[itemtype*='schema.org/Recipe']",
  "[itemtype*='schema.org/recipe']",
  ".recipe",
  "article",
  "main",
  "body",
];

const BLOCK_ELEMENTS =
  "p, div, li, h1, h2, h3, h4, h5, h6, tr, section, article, ul, ol, dt, dd, blockquote, figcaption";

const MIN_CONTENT_LENGTH = 200;

function readMeta($: cheerio.CheerioAPI, property: string): string | null {
  const value = $(`meta[property='${property}'], meta[name='${property}']`)
    .first()
    .attr("content");
  return value?.trim() || null;
}

export function htmlToText(html: string): PageText {
  const $ = cheerio.load(html);

  const title =
    readMeta($, "og:title") ||
    $("h1").first().text().trim() ||
    $("title").first().text().trim() ||
    null;
  const siteName = readMeta($, "og:site_name");
  const imageUrl =
    readMeta($, "og:image") ||
    readMeta($, "og:image:url") ||
    readMeta($, "twitter:image");

  $(NOISE_SELECTORS).remove();

  const contentSelector =
    CONTENT_SELECTORS.find(
      (selector) =>
        $(selector).first().text().trim().length >= MIN_CONTENT_LENGTH,
    ) ?? "body";
  const container = $(contentSelector).first();

  container.find("br").replaceWith("\n");
  container.find(BLOCK_ELEMENTS).each((_, element) => {
    $(element).prepend("\n").append("\n");
  });

  const text = container
    .text()
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return { title, siteName, imageUrl, text };
}

export function stripHtml(value: string): string {
  if (!/[<&]/.test(value)) {
    return value.trim();
  }
  const $ = cheerio.load(`<div>${value}</div>`);
  $("br").replaceWith("\n");
  return $("div").first().text().trim();
}
