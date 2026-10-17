import { and, desc, eq, like } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import { recipes } from "@/db/schema.recipes";
import { visibleTo } from "@/lib/search/recipe-summaries";
import type { SavedRecipeMatch } from "@/lib/types/import-types";
import { normalizeSourceUrl } from "@/lib/utils/source-url";

const MAX_CANDIDATES = 20;

// Finds a recipe the user can see that was imported from the same page.
// Their own copy wins over someone else's. LIKE narrows the search (its
// wildcards in the path only widen it); the exact match is done here.
export async function findSavedRecipe(
  userId: string,
  sourceUrl: string,
): Promise<SavedRecipeMatch | null> {
  const target = normalizeSourceUrl(sourceUrl);
  if (!target) return null;

  const { pathname } = new URL(sourceUrl);
  const pathPart = pathname.replace(/\/+$/, "") || "/";
  const rows = await db
    .select({
      slug: recipes.slug,
      title: recipes.title,
      sourceUrl: recipes.sourceUrl,
      userId: recipes.userId,
      createdAt: recipes.createdAt,
      savedBy: users.name,
    })
    .from(recipes)
    .innerJoin(users, eq(users.id, recipes.userId))
    .where(and(visibleTo(userId), like(recipes.sourceUrl, `%${pathPart}%`)))
    .orderBy(desc(recipes.createdAt))
    .limit(MAX_CANDIDATES);

  const matches = rows.filter(
    (row) => normalizeSourceUrl(row.sourceUrl) === target,
  );
  const match =
    matches.find((row) => row.userId === userId) ?? matches[0] ?? null;
  if (!match) return null;

  return {
    slug: match.slug,
    title: match.title,
    savedBy: match.savedBy,
    isOwn: match.userId === userId,
    savedAt: match.createdAt,
  };
}
