/**
 * Imports real recipe pages through the app's own pipeline and reports what
 * went wrong. It needs the network, so it isn't part of the test suite.
 *
 *   pnpm run import:survey               every page in import-survey-urls.json
 *   pnpm run import:survey -- --sample 50
 *   pnpm run import:survey -- --json results.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchRecipePage } from "@/lib/import/fetch-page";
import { findIngredientIssues } from "@/lib/import/import-quality";
import { importRecipeFromPage } from "@/lib/import/import-recipe";
import {
  type RecipeImportResult,
  RecipeImportSource,
} from "@/lib/types/import-types";

const DELAY_MS = 500;

interface SurveyRow {
  url: string;
  host: string;
  error: string | null;
  result: RecipeImportResult | null;
}

function option(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

async function surveyHost(host: string, urls: string[]): Promise<SurveyRow[]> {
  const rows: SurveyRow[] = [];
  for (const url of urls) {
    try {
      const result = importRecipeFromPage(await fetchRecipePage(url));
      rows.push({ url, host, error: null, result });
    } catch (error) {
      rows.push({ url, host, error: String(error), result: null });
    }
    await new Promise((done) => setTimeout(done, DELAY_MS));
  }
  return rows;
}

function report(rows: SurveyRow[]): void {
  const imported = rows.flatMap((row) => (row.result ? [row.result] : []));
  const bySource = new Map<string, number>();
  for (const { source, recipe } of imported) {
    const label = recipe.ingredients.length > 0 ? source : "rejected";
    bySource.set(label, (bySource.get(label) ?? 0) + 1);
  }
  const issues = new Map<string, string[]>();
  let ingredientCount = 0;
  for (const { recipe } of imported) {
    for (const ingredient of recipe.ingredients) {
      ingredientCount += 1;
      for (const issue of findIngredientIssues(ingredient)) {
        issues.set(issue, [...(issues.get(issue) ?? []), ingredient.name]);
      }
    }
  }

  console.log(`Pages: ${rows.length}, failed to fetch: ${rows.length - imported.length}`);
  console.log(`Sources: ${JSON.stringify(Object.fromEntries(bySource))}`);
  console.log(`Ingredient rows: ${ingredientCount}`);
  for (const [issue, names] of issues) {
    console.log(`  ${issue}: ${names.length}`);
    for (const name of names.slice(0, 5)) console.log(`    ${name}`);
  }
  console.log("Parsed from page text:");
  for (const row of rows) {
    const result = row.result;
    if (
      result?.source === RecipeImportSource.TEXT_PARSER &&
      result.recipe.ingredients.length > 0
    ) {
      console.log(`  ${result.confidence} ${result.recipe.title} ${row.url}`);
    }
  }
  console.log("Rejected as not a recipe:");
  for (const row of rows) {
    if (row.result && row.result.recipe.ingredients.length === 0) {
      console.log(`  ${row.result.recipe.title} ${row.url}`);
    }
  }
}

async function main(): Promise<void> {
  const list: string[] = JSON.parse(
    readFileSync(resolve("scripts/import-survey-urls.json"), "utf8"),
  );
  const sample = option("--sample");
  const urls = sample
    ? [...list].sort(() => Math.random() - 0.5).slice(0, parseInt(sample, 10))
    : list;

  const hosts = new Map<string, string[]>();
  for (const url of urls) {
    hosts.set(hostOf(url), [...(hosts.get(hostOf(url)) ?? []), url]);
  }
  const rows = (
    await Promise.all(
      [...hosts].map(([host, hostUrls]) => surveyHost(host, hostUrls)),
    )
  ).flat();

  report(rows);
  const jsonPath = option("--json");
  if (jsonPath) writeFileSync(jsonPath, JSON.stringify(rows, null, 1));
}

main();
