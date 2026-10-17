"use server";

import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  recipeCollectionItems,
  recipeCollections,
  recipeFavorites,
  recipes,
} from "@/db/schema.recipes";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { visibleTo } from "@/lib/search/recipe-summaries";
import { getAuthenticatedUser } from "@/lib/server-actions/base";
import type { ServerActionResult } from "@/lib/server-actions/utils";
import { RecipeSwatch } from "@/lib/types";
import type {
  RecipeListDetail,
  RecipeListInput,
  RecipeListOption,
  RecipeListTileData,
} from "@/lib/types/recipe-types";
import { isNextRedirectError } from "@/lib/utils";
import { isRecipeSwatch, resolveSwatch } from "@/lib/utils/swatches";

const logger = createOperationLogger("recipe-list-actions");

const MAX_NAME_LENGTH = 60;
const PREVIEW_TITLES = 3;
const LIST_ID_PATTERN = /^[A-Za-z0-9_-]{21}$/;
const NAME_ERROR = `Give the list a name under ${MAX_NAME_LENGTH} characters`;

function cleanSwatch(swatch: string | null): RecipeSwatch | null {
  return isRecipeSwatch(swatch) ? swatch : null;
}

function cleanName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.length > MAX_NAME_LENGTH) return null;
  return trimmed;
}

async function findOwnedList(listId: string, userId: string) {
  const [list] = await db
    .select({
      id: recipeCollections.id,
      name: recipeCollections.name,
      color: recipeCollections.color,
    })
    .from(recipeCollections)
    .where(
      and(
        eq(recipeCollections.id, listId),
        eq(recipeCollections.userId, userId),
      ),
    )
    .limit(1);
  return list ?? null;
}

export async function getRecipeLists(): Promise<RecipeListTileData[]> {
  try {
    const user = await getAuthenticatedUser();
    const lists = await db
      .select({
        id: recipeCollections.id,
        name: recipeCollections.name,
        color: recipeCollections.color,
      })
      .from(recipeCollections)
      .where(eq(recipeCollections.userId, user.id))
      .orderBy(asc(recipeCollections.sortOrder), asc(recipeCollections.name));

    if (lists.length === 0) return [];

    const items = await db
      .select({
        listId: recipeCollectionItems.collectionId,
        title: recipes.title,
      })
      .from(recipeCollectionItems)
      .innerJoin(recipes, eq(recipeCollectionItems.recipeId, recipes.id))
      .where(
        and(
          visibleTo(user.id),
          inArray(
            recipeCollectionItems.collectionId,
            lists.map((list) => list.id),
          ),
        ),
      )
      .orderBy(desc(recipeCollectionItems.addedAt));

    const counts = new Map<string, number>();
    const titles = new Map<string, string[]>();
    for (const item of items) {
      counts.set(item.listId, (counts.get(item.listId) ?? 0) + 1);
      const listTitles = titles.get(item.listId) ?? [];
      if (listTitles.length < PREVIEW_TITLES) listTitles.push(item.title);
      titles.set(item.listId, listTitles);
    }

    return lists.map((list) => ({
      id: list.id,
      href: `/recipes/lists/${list.id}`,
      name: list.name,
      swatch: resolveSwatch(list.id, list.color),
      recipeCount: counts.get(list.id) ?? 0,
      previewTitles: titles.get(list.id) ?? [],
    }));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load recipe lists", error);
    return [];
  }
}

export async function getFavouritesTile(): Promise<RecipeListTileData> {
  const tile: RecipeListTileData = {
    id: "favourites",
    href: "/recipes/favourites",
    name: "Favourites",
    swatch: RecipeSwatch.TOMATO,
    recipeCount: 0,
    previewTitles: [],
  };
  try {
    const user = await getAuthenticatedUser();
    const rows = await db
      .select({ title: recipes.title })
      .from(recipeFavorites)
      .innerJoin(recipes, eq(recipeFavorites.recipeId, recipes.id))
      .where(and(eq(recipeFavorites.userId, user.id), visibleTo(user.id)))
      .orderBy(desc(recipeFavorites.favoritedAt));
    return {
      ...tile,
      recipeCount: rows.length,
      previewTitles: rows.slice(0, PREVIEW_TITLES).map((row) => row.title),
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load favourites tile", error);
    return tile;
  }
}

export async function getRecipeList(
  listId: string,
): Promise<RecipeListDetail | null> {
  try {
    const user = await getAuthenticatedUser();
    const list = await findOwnedList(listId, user.id);
    if (!list) return null;
    return {
      id: list.id,
      name: list.name,
      swatch: resolveSwatch(list.id, list.color),
      chosenSwatch: cleanSwatch(list.color),
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load recipe list", error, { listId });
    return null;
  }
}

export async function getRecipeListOptions(
  recipeId: string,
): Promise<RecipeListOption[]> {
  try {
    const user = await getAuthenticatedUser();
    const [lists, memberships] = await Promise.all([
      db
        .select({
          id: recipeCollections.id,
          name: recipeCollections.name,
          color: recipeCollections.color,
        })
        .from(recipeCollections)
        .where(eq(recipeCollections.userId, user.id))
        .orderBy(asc(recipeCollections.sortOrder), asc(recipeCollections.name)),
      db
        .select({ listId: recipeCollectionItems.collectionId })
        .from(recipeCollectionItems)
        .innerJoin(
          recipeCollections,
          eq(recipeCollectionItems.collectionId, recipeCollections.id),
        )
        .where(
          and(
            eq(recipeCollectionItems.recipeId, recipeId),
            eq(recipeCollections.userId, user.id),
          ),
        ),
    ]);

    const included = new Set(memberships.map((row) => row.listId));
    return lists.map((list) => ({
      id: list.id,
      name: list.name,
      swatch: resolveSwatch(list.id, list.color),
      chosenSwatch: cleanSwatch(list.color),
      containsRecipe: included.has(list.id),
    }));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to load list options", error, { recipeId });
    return [];
  }
}

export async function getRecipeListRecipeIds(
  listId: string,
): Promise<string[]> {
  const user = await getAuthenticatedUser();
  const rows = await db
    .select({ recipeId: recipeCollectionItems.recipeId })
    .from(recipeCollectionItems)
    .innerJoin(
      recipeCollections,
      eq(recipeCollectionItems.collectionId, recipeCollections.id),
    )
    .where(
      and(
        eq(recipeCollectionItems.collectionId, listId),
        eq(recipeCollections.userId, user.id),
      ),
    );
  return rows.map((row) => row.recipeId);
}

export async function createRecipeList(
  id: string,
  input: RecipeListInput,
  recipeId: string | null,
): Promise<ServerActionResult<RecipeListOption>> {
  try {
    const user = await getAuthenticatedUser();
    const name = cleanName(input.name);
    if (!name) return { success: false, error: NAME_ERROR };
    if (!LIST_ID_PATTERN.test(id)) {
      return { success: false, error: "Couldn't create that list" };
    }
    const swatch = cleanSwatch(input.swatch);

    if (recipeId) {
      const [recipe] = await db
        .select({ id: recipes.id })
        .from(recipes)
        .where(and(eq(recipes.id, recipeId), visibleTo(user.id)))
        .limit(1);
      if (!recipe) return { success: false, error: "Recipe not found" };
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(recipeCollections)
      .where(eq(recipeCollections.userId, user.id));

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.insert(recipeCollections).values({
        id,
        userId: user.id,
        name,
        color: swatch,
        sortOrder: total,
        createdAt: now,
        updatedAt: now,
      });
      if (recipeId) {
        await tx
          .insert(recipeCollectionItems)
          .values({ id: nanoid(), collectionId: id, recipeId, addedAt: now });
      }
    });

    logger.info({ listId: id, userId: user.id }, "Recipe list created");
    revalidatePath("/recipes/lists");

    return {
      success: true,
      data: {
        id,
        name,
        swatch: resolveSwatch(id, swatch),
        chosenSwatch: swatch,
        containsRecipe: Boolean(recipeId),
      },
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to create recipe list", error);
    return { success: false, error: "Couldn't create that list" };
  }
}

export async function updateRecipeList(
  listId: string,
  input: RecipeListInput,
): Promise<ServerActionResult<null>> {
  try {
    const user = await getAuthenticatedUser();
    const name = cleanName(input.name);
    if (!name) return { success: false, error: NAME_ERROR };

    const list = await findOwnedList(listId, user.id);
    if (!list) return { success: false, error: "List not found" };

    await db
      .update(recipeCollections)
      .set({ name, color: cleanSwatch(input.swatch), updatedAt: new Date() })
      .where(eq(recipeCollections.id, listId));

    revalidatePath("/recipes/lists");
    revalidatePath(`/recipes/lists/${listId}`);
    return { success: true, data: null };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to update recipe list", error, { listId });
    return { success: false, error: "Couldn't save that list" };
  }
}

export async function deleteRecipeList(
  listId: string,
): Promise<ServerActionResult<null>> {
  try {
    const user = await getAuthenticatedUser();
    const list = await findOwnedList(listId, user.id);
    if (!list) return { success: false, error: "List not found" };

    await db.transaction(async (tx) => {
      await tx
        .delete(recipeCollectionItems)
        .where(eq(recipeCollectionItems.collectionId, listId));
      await tx
        .delete(recipeCollections)
        .where(eq(recipeCollections.id, listId));
    });

    logger.info({ listId, userId: user.id }, "Recipe list deleted");
    revalidatePath("/recipes/lists");
    return { success: true, data: null };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to delete recipe list", error, { listId });
    return { success: false, error: "Couldn't delete that list" };
  }
}

export async function setRecipeInList(
  listId: string,
  recipeId: string,
  included: boolean,
): Promise<ServerActionResult<null>> {
  try {
    const user = await getAuthenticatedUser();
    const list = await findOwnedList(listId, user.id);
    if (!list) return { success: false, error: "List not found" };

    const itemWhere = and(
      eq(recipeCollectionItems.collectionId, listId),
      eq(recipeCollectionItems.recipeId, recipeId),
    );

    if (!included) {
      await db.delete(recipeCollectionItems).where(itemWhere);
    } else {
      const [recipe] = await db
        .select({ id: recipes.id })
        .from(recipes)
        .where(and(eq(recipes.id, recipeId), visibleTo(user.id)))
        .limit(1);
      if (!recipe) return { success: false, error: "Recipe not found" };

      const [existing] = await db
        .select({ id: recipeCollectionItems.id })
        .from(recipeCollectionItems)
        .where(itemWhere)
        .limit(1);
      if (!existing) {
        await db.insert(recipeCollectionItems).values({
          id: nanoid(),
          collectionId: listId,
          recipeId,
          addedAt: new Date(),
        });
      }
    }

    revalidatePath("/recipes/lists");
    revalidatePath(`/recipes/lists/${listId}`);
    return { success: true, data: null };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    logError(logger, "Failed to update recipe list", error, {
      listId,
      recipeId,
    });
    return { success: false, error: "Couldn't update that list" };
  }
}
