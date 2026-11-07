"use server";

import { and, count, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema.base";
import {
  recipeImages,
  recipeIngredients,
  recipeInstructions,
  recipeModifications,
  recipeNotes,
  recipes,
  recipeTagRelations,
  recipeTags,
} from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { RecipeWithRelations } from "@/lib/types/recipe-types";
import { describeRecipeChanges } from "@/lib/utils/recipe-changes";
import {
  addRecipeSlugSuffix,
  generateRecipeSlug,
} from "@/lib/utils/recipe-utils";
import {
  type CreateRecipeInput,
  createRecipeNoteSchema,
  createRecipeSchema,
  createRecipeWithSlugSchema,
  type UpdateRecipeInput,
  updateRecipeNoteSchema,
  updateRecipeSchema,
} from "@/lib/validations/recipe-schemas";

const logger = createOperationLogger("recipe-actions");

async function generateUniqueSlug(
  title: string,
  ignoreRecipeId: string | null = null,
): Promise<string> {
  const baseSlug = generateRecipeSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.slug, slug))
      .limit(1);

    if (existing.length === 0 || existing[0].id === ignoreRecipeId) {
      return slug;
    }

    slug = addRecipeSlugSuffix(baseSlug, counter);
    counter++;
  }
}

type RecipeTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function saveRecipeTags(
  tx: RecipeTransaction,
  recipeId: string,
  tags: string[],
) {
  for (const tagName of tags) {
    const [existingTag] = tx
      .select({ id: recipeTags.id })
      .from(recipeTags)
      .where(eq(recipeTags.name, tagName))
      .limit(1)
      .all();
    const tagId = existingTag?.id ?? nanoid();

    if (!existingTag) {
      tx.insert(recipeTags)
        .values({ id: tagId, name: tagName, createdAt: new Date() })
        .run();
    }

    tx.insert(recipeTagRelations)
      .values({ recipeId, tagId })
      .onConflictDoNothing()
      .run();
  }
}

export async function createRecipe(rawData: CreateRecipeInput) {
  logger.info({ rawData }, "Creating new recipe");

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }
    const userId = session.user.id;

    const validatedData = createRecipeSchema.parse(rawData);
    const recipeId = nanoid();
    const slug = await generateUniqueSlug(validatedData.title);
    const completeData = createRecipeWithSlugSchema.parse({
      ...validatedData,
      slug,
    });

    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      console.error("❌ User not found in database:", userId);
      return { success: false, error: "User not found in database" };
    }

    const now = new Date();
    const recipe = {
      id: recipeId,
      slug: completeData.slug,
      userId,
      title: validatedData.title,
      description: validatedData.description,
      servings: validatedData.servings,
      prepTimeMinutes: validatedData.prepTimeMinutes,
      cookTimeMinutes: validatedData.cookTimeMinutes,
      difficulty: validatedData.difficulty,
      cuisine: validatedData.cuisine,
      swatch: validatedData.swatch ?? null,
      sourceUrl: validatedData.sourceUrl,
      sourceName: validatedData.sourceName,
      videoUrl: validatedData.videoUrl,
      isPublic: validatedData.isPublic,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    db.transaction((tx) => {
      tx.insert(recipes).values(recipe).run();

      if (validatedData.ingredients?.length) {
        tx.insert(recipeIngredients)
          .values(
            validatedData.ingredients.map((ingredient, index: number) => ({
              id: nanoid(),
              recipeId,
              name: ingredient.name,
              amount: ingredient.amount,
              unit: ingredient.unit,
              notes: ingredient.notes,
              groupName: ingredient.groupName,
              sortOrder: index,
              isOptional: ingredient.isOptional,
            })),
          )
          .run();
      }

      if (validatedData.instructions?.length) {
        tx.insert(recipeInstructions)
          .values(
            validatedData.instructions.map((instruction, index: number) => ({
              id: nanoid(),
              recipeId,
              stepNumber: index + 1,
              instruction: instruction.instruction,
              timeMinutes: instruction.timeMinutes || null,
              temperature: instruction.temperature || null,
              notes: null,
              groupName: null,
            })),
          )
          .run();
      }

      if (validatedData.tags?.length) {
        saveRecipeTags(tx, recipeId, validatedData.tags);
      }
    });

    logger.info({ recipeId, userId }, "Recipe created successfully");
    revalidatePath("/", "layout");
    return { success: true, data: recipe };
  } catch (error) {
    console.error("💥 Database error:", error);

    logError(logger, "Failed to create recipe", error);

    // Check for specific database errors
    if (error && typeof error === "object" && "code" in error) {
      switch (error.code) {
        case "SQLITE_CONSTRAINT_FOREIGNKEY":
          console.error(
            "❌ Foreign key constraint failed - likely user doesn't exist in database",
          );
          return {
            success: false,
            error: "Database relationship error - user not found",
          };
        case "SQLITE_CONSTRAINT_UNIQUE":
          console.error("❌ Unique constraint failed - slug already exists");
          return {
            success: false,
            error: "Recipe with this title already exists",
          };
        default:
          console.error("❌ Database constraint error:", error.code);
          return { success: false, error: `Database error: ${error.code}` };
      }
    }

    return { success: false, error: "Failed to create recipe" };
  }
}

export async function getRecipeBySlug(
  slug: string,
): Promise<{ success: boolean; data?: RecipeWithRelations; error?: string }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const recipe = await db
      .select({ recipe: recipes, authorName: users.name })
      .from(recipes)
      .innerJoin(users, eq(recipes.userId, users.id))
      .where(
        and(
          eq(recipes.slug, slug),
          eq(recipes.isArchived, false),
          or(
            eq(recipes.userId, session.user.id), // User's own recipes
            eq(recipes.isPublic, true), // Public recipes from other users
          ),
        ),
      )
      .limit(1);

    if (!recipe.length) {
      return { success: false, error: "Recipe not found" };
    }

    const recipeId = recipe[0].recipe.id;
    const [ingredients, instructions, images, notes, tagRelations] =
      await Promise.all([
        db
          .select()
          .from(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, recipeId)),
        db
          .select()
          .from(recipeInstructions)
          .where(eq(recipeInstructions.recipeId, recipeId)),
        db
          .select()
          .from(recipeImages)
          .where(eq(recipeImages.recipeId, recipeId)),
        db
          .select({ note: recipeNotes, authorName: users.name })
          .from(recipeNotes)
          .innerJoin(users, eq(recipeNotes.userId, users.id))
          .where(
            and(
              eq(recipeNotes.recipeId, recipeId),
              or(
                eq(recipeNotes.userId, session.user.id),
                eq(recipeNotes.isPrivate, false),
              ),
            ),
          ),
        db
          .select({ tag: recipeTags })
          .from(recipeTagRelations)
          .innerJoin(recipeTags, eq(recipeTagRelations.tagId, recipeTags.id))
          .where(eq(recipeTagRelations.recipeId, recipeId)),
      ]);

    const recipeWithRelations: RecipeWithRelations = {
      ...recipe[0].recipe,
      author: { id: recipe[0].recipe.userId, name: recipe[0].authorName },
      ingredients: ingredients.sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      ),
      instructions: instructions.sort(
        (a, b) => (a.stepNumber || 0) - (b.stepNumber || 0),
      ),
      images: images.sort(
        (a, b) =>
          Number(b.isHero) - Number(a.isHero) ||
          (a.sortOrder || 0) - (b.sortOrder || 0),
      ),
      notes: notes
        .map((row) => ({ ...row.note, authorName: row.authorName }))
        .sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        }),
      tags: tagRelations.map((tr) => tr.tag),
    };

    return { success: true, data: recipeWithRelations };
  } catch (error) {
    logError(logger, "Failed to get recipe by slug", error, { slug });
    return { success: false, error: "Failed to get recipe" };
  }
}

export async function updateRecipe(rawData: UpdateRecipeInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = updateRecipeSchema.parse(rawData);
    const {
      id: recipeId,
      ingredients,
      instructions,
      tags,
      ...recipeData
    } = validatedData;

    if (!recipeId) {
      return { success: false, error: "Recipe ID is required" };
    }

    const [existingRecipe] = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, session.user.id)))
      .limit(1);

    if (!existingRecipe) {
      return { success: false, error: "Recipe not found" };
    }

    const [previousIngredients, previousInstructions] = await Promise.all([
      db
        .select()
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipeId)),
      db
        .select()
        .from(recipeInstructions)
        .where(eq(recipeInstructions.recipeId, recipeId)),
    ]);

    const titleChanged =
      recipeData.title !== undefined &&
      recipeData.title !== existingRecipe.title;
    const slug = titleChanged
      ? await generateUniqueSlug(
          recipeData.title ?? existingRecipe.title,
          recipeId,
        )
      : existingRecipe.slug;

    const changes = describeRecipeChanges({
      before: existingRecipe,
      after: recipeData,
      ingredientsBefore: previousIngredients,
      ingredientsAfter: ingredients ?? null,
      instructionsBefore: previousInstructions,
      instructionsAfter: instructions ?? null,
    });

    const updatedRecipe = db.transaction((tx) => {
      const updateData = {
        title: recipeData.title ?? existingRecipe.title,
        slug,
        description: recipeData.description ?? null,
        servings: recipeData.servings ?? null,
        prepTimeMinutes: recipeData.prepTimeMinutes ?? null,
        cookTimeMinutes: recipeData.cookTimeMinutes ?? null,
        difficulty: recipeData.difficulty ?? null,
        cuisine: recipeData.cuisine ?? null,
        sourceUrl: recipeData.sourceUrl ?? null,
        sourceName: recipeData.sourceName ?? null,
        videoUrl: recipeData.videoUrl ?? null,
        swatch: recipeData.swatch ?? null,
        isPublic: recipeData.isPublic ?? existingRecipe.isPublic,
        updatedAt: new Date(),
      };

      const [updated] = tx
        .update(recipes)
        .set(updateData)
        .where(eq(recipes.id, recipeId))
        .returning()
        .all();

      if (ingredients) {
        tx.delete(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, recipeId))
          .run();
        if (ingredients.length > 0) {
          tx.insert(recipeIngredients)
            .values(
              ingredients.map((ingredient, index) => ({
                id: nanoid(),
                recipeId,
                name: ingredient.name,
                amount: ingredient.amount,
                unit: ingredient.unit,
                notes: ingredient.notes,
                groupName: ingredient.groupName,
                sortOrder: index,
                isOptional: ingredient.isOptional,
              })),
            )
            .run();
        }
      }

      if (instructions) {
        tx.delete(recipeInstructions)
          .where(eq(recipeInstructions.recipeId, recipeId))
          .run();
        if (instructions.length > 0) {
          tx.insert(recipeInstructions)
            .values(
              instructions.map((instruction, index) => ({
                id: nanoid(),
                recipeId,
                stepNumber: index + 1,
                instruction: instruction.instruction,
                timeMinutes: instruction.timeMinutes || null,
                temperature: instruction.temperature || null,
                notes: instruction.notes || null,
                groupName: instruction.groupName || null,
              })),
            )
            .run();
        }
      }

      if (tags) {
        tx.delete(recipeTagRelations)
          .where(eq(recipeTagRelations.recipeId, recipeId))
          .run();
        saveRecipeTags(tx, recipeId, tags);
      }

      if (changes) {
        const [{ value: previousVersions }] = tx
          .select({ value: count() })
          .from(recipeModifications)
          .where(eq(recipeModifications.recipeId, recipeId))
          .all();
        tx.insert(recipeModifications)
          .values({
            id: nanoid(),
            recipeId,
            userId: session.user.id,
            changeType: changes.type,
            changeDescription: changes.description,
            versionNumber: previousVersions + 1,
            createdAt: new Date(),
          })
          .run();
      }

      return updated;
    });

    logger.info(
      { recipeId, userId: session.user.id, change: changes?.type ?? null },
      "Recipe updated successfully",
    );
    return { success: true, data: updatedRecipe };
  } catch (error) {
    logError(logger, "Failed to update recipe", error);
    return { success: false, error: "Failed to update recipe" };
  }
}

export async function deleteRecipe(recipeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const existingRecipe = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, session.user.id)))
      .limit(1);

    if (!existingRecipe.length) {
      return { success: false, error: "Recipe not found" };
    }

    // Get all images associated with this recipe BEFORE deleting
    const imagesToDelete = await db
      .select({ filename: recipeImages.filename })
      .from(recipeImages)
      .where(eq(recipeImages.recipeId, recipeId));

    db.transaction((tx) => {
      tx.delete(recipeTagRelations)
        .where(eq(recipeTagRelations.recipeId, recipeId))
        .run();
      tx.delete(recipeNotes).where(eq(recipeNotes.recipeId, recipeId)).run();
      tx.delete(recipeImages).where(eq(recipeImages.recipeId, recipeId)).run();
      tx.delete(recipeInstructions)
        .where(eq(recipeInstructions.recipeId, recipeId))
        .run();
      tx.delete(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipeId))
        .run();
      tx.delete(recipes).where(eq(recipes.id, recipeId)).run();
    });

    // Clean up image files AFTER database transaction completes
    if (imagesToDelete.length > 0) {
      const { deleteRecipeImage } = await import("@/lib/file-storage");

      // Delete files sequentially to avoid dangling promises
      for (const image of imagesToDelete) {
        try {
          await deleteRecipeImage(image.filename);
        } catch (error) {
          logger.warn(
            { recipeId, filename: image.filename, error },
            "Failed to delete recipe image file during recipe deletion",
          );
        }
      }
    }

    logger.info(
      { recipeId, userId: session.user.id, imageCount: imagesToDelete.length },
      "Recipe deleted successfully",
    );
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    logError(logger, "Failed to delete recipe", error, { recipeId });
    return { success: false, error: "Failed to delete recipe" };
  }
}

export async function addRecipeNote(rawData: unknown) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = createRecipeNoteSchema.parse(rawData);

    const recipeExists = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(
        and(
          eq(recipes.id, validatedData.recipeId),
          eq(recipes.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!recipeExists.length) {
      return { success: false, error: "Recipe not found" };
    }

    const [note] = await db
      .insert(recipeNotes)
      .values({
        id: nanoid(),
        recipeId: validatedData.recipeId,
        userId: session.user.id,
        content: validatedData.content,
        rating: validatedData.rating,
        isPrivate: validatedData.isPrivate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info(
      {
        noteId: note.id,
        recipeId: validatedData.recipeId,
        userId: session.user.id,
      },
      "Recipe note added successfully",
    );
    return { success: true, data: note };
  } catch (error) {
    logError(logger, "Failed to add recipe note", error);
    return { success: false, error: "Failed to add recipe note" };
  }
}

export async function updateRecipeNote(rawData: unknown) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = updateRecipeNoteSchema.parse(rawData);
    const { id: noteId, ...updateData } = validatedData;

    if (!noteId) {
      return { success: false, error: "Note ID is required" };
    }

    const existingNote = await db
      .select({ id: recipeNotes.id })
      .from(recipeNotes)
      .where(
        and(
          eq(recipeNotes.id, noteId),
          eq(recipeNotes.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existingNote.length) {
      return { success: false, error: "Note not found" };
    }

    const [updatedNote] = await db
      .update(recipeNotes)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(recipeNotes.id, noteId))
      .returning();

    logger.info(
      { noteId, userId: session.user.id },
      "Recipe note updated successfully",
    );
    return { success: true, data: updatedNote };
  } catch (error) {
    logError(logger, "Failed to update recipe note", error);
    return { success: false, error: "Failed to update recipe note" };
  }
}

export async function deleteRecipeNote(noteId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const existingNote = await db
      .select({ id: recipeNotes.id })
      .from(recipeNotes)
      .where(
        and(
          eq(recipeNotes.id, noteId),
          eq(recipeNotes.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existingNote.length) {
      return { success: false, error: "Note not found" };
    }

    await db.delete(recipeNotes).where(eq(recipeNotes.id, noteId));

    logger.info(
      { noteId, userId: session.user.id },
      "Recipe note deleted successfully",
    );
    return { success: true };
  } catch (error) {
    logError(logger, "Failed to delete recipe note", error, { noteId });
    return { success: false, error: "Failed to delete recipe note" };
  }
}
