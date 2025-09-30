"use server";

import { and, asc, desc, eq, count as sqlCount } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import type { RecipeCollectionInsert } from "@/db/schema.recipes";
import {
  recipeCollectionItems,
  recipeCollections,
  recipes,
} from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("recipe-collections-actions");

// Validation schemas
const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  icon: z.string().max(50).optional(),
});

const updateCollectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  icon: z.string().max(50).optional(),
});

export async function createCollection(
  rawData: z.infer<typeof createCollectionSchema>,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = createCollectionSchema.parse(rawData);

    // Get next sort order
    const existingCollections = await db
      .select({ sortOrder: recipeCollections.sortOrder })
      .from(recipeCollections)
      .where(eq(recipeCollections.userId, session.user.id))
      .orderBy(desc(recipeCollections.sortOrder))
      .limit(1);

    const nextSortOrder =
      existingCollections.length > 0 ? existingCollections[0].sortOrder + 1 : 0;

    const [collection] = await db
      .insert(recipeCollections)
      .values({
        id: nanoid(),
        userId: session.user.id,
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color,
        icon: validatedData.icon,
        isDefault: false,
        sortOrder: nextSortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info(
      { collectionId: collection.id, userId: session.user.id },
      "Collection created successfully",
    );

    return { success: true, data: collection };
  } catch (error) {
    logError(logger, "Failed to create collection", error);
    return { success: false, error: "Failed to create collection" };
  }
}

export async function getUserCollections() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const collections = await db
      .select({
        collection: recipeCollections,
        recipeCount: sqlCount(recipeCollectionItems.id),
      })
      .from(recipeCollections)
      .leftJoin(
        recipeCollectionItems,
        eq(recipeCollections.id, recipeCollectionItems.collectionId),
      )
      .where(eq(recipeCollections.userId, session.user.id))
      .groupBy(recipeCollections.id)
      .orderBy(asc(recipeCollections.sortOrder), asc(recipeCollections.name));

    return { success: true, data: collections };
  } catch (error) {
    logError(logger, "Failed to get user collections", error);
    return { success: false, error: "Failed to get collections" };
  }
}

export async function updateCollection(
  rawData: z.infer<typeof updateCollectionSchema>,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = updateCollectionSchema.parse(rawData);

    // Verify collection belongs to user
    const existingCollection = await db
      .select()
      .from(recipeCollections)
      .where(
        and(
          eq(recipeCollections.id, validatedData.id),
          eq(recipeCollections.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existingCollection.length) {
      return { success: false, error: "Collection not found" };
    }

    const updateData: Partial<RecipeCollectionInsert> = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.color !== undefined)
      updateData.color = validatedData.color;
    if (validatedData.icon !== undefined) updateData.icon = validatedData.icon;

    const [collection] = await db
      .update(recipeCollections)
      .set(updateData)
      .where(eq(recipeCollections.id, validatedData.id))
      .returning();

    logger.info(
      { collectionId: validatedData.id, userId: session.user.id },
      "Collection updated successfully",
    );

    return { success: true, data: collection };
  } catch (error) {
    logError(logger, "Failed to update collection", error);
    return { success: false, error: "Failed to update collection" };
  }
}

export async function deleteCollection(collectionId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify collection belongs to user and is not default
    const collection = await db
      .select()
      .from(recipeCollections)
      .where(
        and(
          eq(recipeCollections.id, collectionId),
          eq(recipeCollections.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!collection.length) {
      return { success: false, error: "Collection not found" };
    }

    if (collection[0].isDefault) {
      return { success: false, error: "Cannot delete default collection" };
    }

    // Delete all items first, then the collection
    await db.transaction(async (tx) => {
      await tx
        .delete(recipeCollectionItems)
        .where(eq(recipeCollectionItems.collectionId, collectionId));

      await tx
        .delete(recipeCollections)
        .where(eq(recipeCollections.id, collectionId));
    });

    logger.info(
      { collectionId, userId: session.user.id },
      "Collection deleted successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to delete collection", error);
    return { success: false, error: "Failed to delete collection" };
  }
}

export async function addRecipeToCollection(
  collectionId: string,
  recipeId: string,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify collection belongs to user
    const collection = await db
      .select()
      .from(recipeCollections)
      .where(
        and(
          eq(recipeCollections.id, collectionId),
          eq(recipeCollections.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!collection.length) {
      return { success: false, error: "Collection not found" };
    }

    // Verify recipe exists and belongs to user
    const recipe = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, session.user.id)))
      .limit(1);

    if (!recipe.length) {
      return { success: false, error: "Recipe not found" };
    }

    // Check if already in collection
    const existing = await db
      .select()
      .from(recipeCollectionItems)
      .where(
        and(
          eq(recipeCollectionItems.collectionId, collectionId),
          eq(recipeCollectionItems.recipeId, recipeId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Recipe already in collection" };
    }

    // Get next sort order within collection
    const existingItems = await db
      .select({ sortOrder: recipeCollectionItems.sortOrder })
      .from(recipeCollectionItems)
      .where(eq(recipeCollectionItems.collectionId, collectionId))
      .orderBy(desc(recipeCollectionItems.sortOrder))
      .limit(1);

    const nextSortOrder =
      existingItems.length > 0 ? existingItems[0].sortOrder + 1 : 0;

    const [item] = await db
      .insert(recipeCollectionItems)
      .values({
        id: nanoid(),
        collectionId,
        recipeId,
        addedAt: new Date(),
        sortOrder: nextSortOrder,
      })
      .returning();

    logger.info(
      { collectionId, recipeId, userId: session.user.id },
      "Recipe added to collection successfully",
    );

    return { success: true, data: item };
  } catch (error) {
    logError(logger, "Failed to add recipe to collection", error);
    return { success: false, error: "Failed to add recipe to collection" };
  }
}

export async function removeRecipeFromCollection(
  collectionId: string,
  recipeId: string,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify collection belongs to user
    const collection = await db
      .select()
      .from(recipeCollections)
      .where(
        and(
          eq(recipeCollections.id, collectionId),
          eq(recipeCollections.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!collection.length) {
      return { success: false, error: "Collection not found" };
    }

    const result = await db
      .delete(recipeCollectionItems)
      .where(
        and(
          eq(recipeCollectionItems.collectionId, collectionId),
          eq(recipeCollectionItems.recipeId, recipeId),
        ),
      );

    if (result.changes === 0) {
      return { success: false, error: "Recipe not found in collection" };
    }

    logger.info(
      { collectionId, recipeId, userId: session.user.id },
      "Recipe removed from collection successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to remove recipe from collection", error);
    return { success: false, error: "Failed to remove recipe from collection" };
  }
}

export async function getCollectionRecipes(collectionId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify collection belongs to user
    const collection = await db
      .select()
      .from(recipeCollections)
      .where(
        and(
          eq(recipeCollections.id, collectionId),
          eq(recipeCollections.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!collection.length) {
      return { success: false, error: "Collection not found" };
    }

    const collectionRecipes = await db
      .select({
        recipe: recipes,
        addedAt: recipeCollectionItems.addedAt,
        sortOrder: recipeCollectionItems.sortOrder,
      })
      .from(recipeCollectionItems)
      .innerJoin(recipes, eq(recipeCollectionItems.recipeId, recipes.id))
      .where(eq(recipeCollectionItems.collectionId, collectionId))
      .orderBy(
        asc(recipeCollectionItems.sortOrder),
        desc(recipeCollectionItems.addedAt),
      );

    return {
      success: true,
      data: {
        collection: collection[0],
        recipes: collectionRecipes,
      },
    };
  } catch (error) {
    logError(logger, "Failed to get collection recipes", error);
    return { success: false, error: "Failed to get collection recipes" };
  }
}

export async function reorderCollectionItems(
  collectionId: string,
  itemIds: string[],
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify collection belongs to user
    const collection = await db
      .select()
      .from(recipeCollections)
      .where(
        and(
          eq(recipeCollections.id, collectionId),
          eq(recipeCollections.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!collection.length) {
      return { success: false, error: "Collection not found" };
    }

    await db.transaction(async (tx) => {
      for (let i = 0; i < itemIds.length; i++) {
        await tx
          .update(recipeCollectionItems)
          .set({ sortOrder: i })
          .where(
            and(
              eq(recipeCollectionItems.id, itemIds[i]),
              eq(recipeCollectionItems.collectionId, collectionId),
            ),
          );
      }
    });

    logger.info(
      { collectionId, userId: session.user.id },
      "Collection items reordered successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to reorder collection items", error);
    return { success: false, error: "Failed to reorder collection items" };
  }
}
