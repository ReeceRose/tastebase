import { and, or, type SQL, sql } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import {
  recipeIngredients,
  recipeInstructions,
  recipeNotes,
  recipes,
  recipeTagRelations,
  recipeTags,
} from "@/db/schema.recipes";

const MAX_SEARCH_TERMS = 12;
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "in",
  "of",
  "on",
  "or",
  "the",
  "with",
]);
const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

// Splits a query into the words a recipe has to contain. Punctuation on its own
// and filler words are dropped, so "mac & cheese" and "mac and cheese" both look
// for "mac" and "cheese". A query with nothing else left keeps what it has.
export function parseSearchTerms(query: string): string[] {
  const rawTerms = query.trim().split(/\s+/).filter(Boolean);
  const words = rawTerms
    .map((term) => term.replace(EDGE_PUNCTUATION, ""))
    .filter(Boolean);
  const meaningful = words.filter(
    (word) => !STOP_WORDS.has(word.toLowerCase()),
  );

  if (meaningful.length > 0) return meaningful.slice(0, MAX_SEARCH_TERMS);
  if (words.length > 0) return words.slice(0, MAX_SEARCH_TERMS);
  return rawTerms.slice(0, MAX_SEARCH_TERMS);
}

export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

export function contains(column: AnySQLiteColumn, pattern: string): SQL {
  return sql`${column} LIKE ${pattern} ESCAPE '\\'`;
}

// Drizzle types and() and or() as possibly undefined for an empty list, so
// these stand in for "always" and "never".
const ALWAYS = sql`1 = 1`;
const NEVER = sql`1 = 0`;

function recipeContainsTerm(term: string): SQL {
  const pattern = likePattern(term);
  const matches = or(
    contains(recipes.title, pattern),
    contains(recipes.description, pattern),
    contains(recipes.cuisine, pattern),
    contains(recipes.sourceName, pattern),
    contains(recipes.sourceUrl, pattern),
    sql`EXISTS (
      SELECT 1 FROM ${recipeIngredients}
      WHERE ${recipeIngredients.recipeId} = ${recipes.id}
      AND (${contains(recipeIngredients.name, pattern)} OR ${contains(recipeIngredients.notes, pattern)})
    )`,
    sql`EXISTS (
      SELECT 1 FROM ${recipeInstructions}
      WHERE ${recipeInstructions.recipeId} = ${recipes.id}
      AND ${contains(recipeInstructions.instruction, pattern)}
    )`,
    sql`EXISTS (
      SELECT 1 FROM ${recipeNotes}
      WHERE ${recipeNotes.recipeId} = ${recipes.id}
      AND ${contains(recipeNotes.content, pattern)}
    )`,
    sql`EXISTS (
      SELECT 1 FROM ${recipeTagRelations}
      INNER JOIN ${recipeTags} ON ${recipeTags.id} = ${recipeTagRelations.tagId}
      WHERE ${recipeTagRelations.recipeId} = ${recipes.id}
      AND ${contains(recipeTags.name, pattern)}
    )`,
  );
  return matches ?? NEVER;
}

// Every word has to appear somewhere on the recipe, in any order.
export function recipeMatchesTerms(terms: string[]): SQL | null {
  return terms.length > 0
    ? (and(...terms.map(recipeContainsTerm)) ?? null)
    : null;
}

// Sorts recipes with every word in the title ahead of the rest.
export function titleMatchRank(terms: string[]): SQL {
  const inTitle =
    and(...terms.map((term) => contains(recipes.title, likePattern(term)))) ??
    ALWAYS;
  return sql`CASE WHEN ${inTitle} THEN 0 ELSE 1 END`;
}
