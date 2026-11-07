import * as cheerio from "cheerio";
import { toGroupName } from "@/lib/import/ingredient-list";

// Structured data flattens ingredient sections, but the recipe plugins still
// show them on the page.
const HEADED_LISTS = [".tasty-recipes-ingredients", ".mv-create-ingredients"];

function fromWpRecipeMaker($: cheerio.CheerioAPI): (string | null)[] | null {
  const card = $(".wprm-recipe-container").first();
  if (card.length === 0) return null;
  const groups: (string | null)[] = [];
  card.find(".wprm-recipe-ingredient-group").each((_, element) => {
    const group = $(element);
    const name = toGroupName(
      group.find(".wprm-recipe-group-name").first().text(),
    );
    group.find("li.wprm-recipe-ingredient").each(() => {
      groups.push(name);
    });
  });
  return groups.length > 0 ? groups : null;
}

function fromHeadedList($: cheerio.CheerioAPI): (string | null)[] | null {
  for (const selector of HEADED_LISTS) {
    const container = $(selector).first();
    if (container.length === 0) continue;
    const groups: (string | null)[] = [];
    let name: string | null = null;
    container.find("h3, h4, h5, li").each((_, element) => {
      if (element.tagName === "li") {
        groups.push(name);
      } else {
        name = toGroupName($(element).text());
      }
    });
    if (groups.length > 0) return groups;
  }
  return null;
}

// One section name per ingredient line, or null when the page has no named
// sections or its card doesn't match the structured data line for line.
export function readCardIngredientGroups(
  html: string,
  expectedLines: number,
): (string | null)[] | null {
  const $ = cheerio.load(html);
  const groups = fromWpRecipeMaker($) ?? fromHeadedList($);
  if (!groups || groups.length !== expectedLines) return null;
  return groups.some((name) => name !== null) ? groups : null;
}
