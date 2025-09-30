"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  recipeIngredients,
  recipeInstructions,
  recipes,
} from "@/db/schema.recipes";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  type CreateIngredientInput,
  type CreateInstructionInput,
  createIngredientSchema,
  createInstructionSchema,
  type UpdateIngredientInput,
  type UpdateInstructionInput,
  updateIngredientSchema,
  updateInstructionSchema,
} from "@/lib/validations/recipe-schemas";

const logger = createOperationLogger("recipe-component-actions");

// Ingredient CRUD Actions
export async function addRecipeIngredient(rawData: CreateIngredientInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = createIngredientSchema.parse(rawData);

    // Verify recipe ownership
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

    // Get the next sort order
    const maxSortOrder = await db
      .select({ maxOrder: recipeIngredients.sortOrder })
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, validatedData.recipeId))
      .orderBy(recipeIngredients.sortOrder)
      .limit(1);

    const nextSortOrder = (maxSortOrder[0]?.maxOrder || 0) + 1;

    const [ingredient] = await db
      .insert(recipeIngredients)
      .values({
        id: nanoid(),
        recipeId: validatedData.recipeId,
        name: validatedData.name,
        amount: validatedData.amount,
        unit: validatedData.unit,
        notes: validatedData.notes,
        groupName: validatedData.groupName,
        sortOrder: nextSortOrder,
        isOptional: validatedData.isOptional,
      })
      .returning();

    // Update recipe timestamp
    await db
      .update(recipes)
      .set({ updatedAt: new Date() })
      .where(eq(recipes.id, validatedData.recipeId));

    logger.info(
      {
        ingredientId: ingredient.id,
        recipeId: validatedData.recipeId,
        userId: session.user.id,
      },
      "Recipe ingredient added successfully",
    );
    return { success: true, data: ingredient };
  } catch (error) {
    logError(logger, "Failed to add recipe ingredient", error);
    return { success: false, error: "Failed to add recipe ingredient" };
  }
}

export async function updateRecipeIngredient(rawData: UpdateIngredientInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = updateIngredientSchema.parse(rawData);
    const { id: ingredientId, ...updateData } = validatedData;

    if (!ingredientId) {
      return { success: false, error: "Ingredient ID is required" };
    }

    // Verify ingredient exists and user owns the recipe
    const existingIngredient = await db
      .select({
        ingredient: recipeIngredients,
        recipe: recipes,
      })
      .from(recipeIngredients)
      .innerJoin(recipes, eq(recipeIngredients.recipeId, recipes.id))
      .where(
        and(
          eq(recipeIngredients.id, ingredientId),
          eq(recipes.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existingIngredient.length) {
      return { success: false, error: "Ingredient not found" };
    }

    const [updatedIngredient] = await db
      .update(recipeIngredients)
      .set(updateData)
      .where(eq(recipeIngredients.id, ingredientId))
      .returning();

    // Update recipe timestamp
    await db
      .update(recipes)
      .set({ updatedAt: new Date() })
      .where(eq(recipes.id, existingIngredient[0].ingredient.recipeId));

    logger.info(
      { ingredientId, userId: session.user.id },
      "Recipe ingredient updated successfully",
    );
    return { success: true, data: updatedIngredient };
  } catch (error) {
    logError(logger, "Failed to update recipe ingredient", error);
    return { success: false, error: "Failed to update recipe ingredient" };
  }
}

export async function removeRecipeIngredient(ingredientId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify ingredient exists and user owns the recipe
    const existingIngredient = await db
      .select({
        ingredient: recipeIngredients,
        recipe: recipes,
      })
      .from(recipeIngredients)
      .innerJoin(recipes, eq(recipeIngredients.recipeId, recipes.id))
      .where(
        and(
          eq(recipeIngredients.id, ingredientId),
          eq(recipes.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existingIngredient.length) {
      return { success: false, error: "Ingredient not found" };
    }

    const recipeId = existingIngredient[0].ingredient.recipeId;

    await db
      .delete(recipeIngredients)
      .where(eq(recipeIngredients.id, ingredientId));

    // Update recipe timestamp
    await db
      .update(recipes)
      .set({ updatedAt: new Date() })
      .where(eq(recipes.id, recipeId));

    logger.info(
      { ingredientId, recipeId, userId: session.user.id },
      "Recipe ingredient removed successfully",
    );
    return { success: true };
  } catch (error) {
    logError(logger, "Failed to remove recipe ingredient", error, {
      ingredientId,
    });
    return { success: false, error: "Failed to remove recipe ingredient" };
  }
}

export async function reorderRecipeIngredients(
  recipeId: string,
  ingredientOrder: { id: string; sortOrder: number }[],
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify recipe ownership
    const recipeExists = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, session.user.id)))
      .limit(1);

    if (!recipeExists.length) {
      return { success: false, error: "Recipe not found" };
    }

    // Update sort orders in transaction
    await db.transaction(async (tx) => {
      for (const { id, sortOrder } of ingredientOrder) {
        await tx
          .update(recipeIngredients)
          .set({ sortOrder })
          .where(
            and(
              eq(recipeIngredients.id, id),
              eq(recipeIngredients.recipeId, recipeId),
            ),
          );
      }

      // Update recipe timestamp
      await tx
        .update(recipes)
        .set({ updatedAt: new Date() })
        .where(eq(recipes.id, recipeId));
    });

    logger.info(
      { recipeId, userId: session.user.id },
      "Recipe ingredients reordered successfully",
    );
    return { success: true };
  } catch (error) {
    logError(logger, "Failed to reorder recipe ingredients", error, {
      recipeId,
    });
    return { success: false, error: "Failed to reorder recipe ingredients" };
  }
}

// Instruction CRUD Actions
export async function addRecipeInstruction(rawData: CreateInstructionInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = createInstructionSchema.parse(rawData);

    // Verify recipe ownership
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

    // Get the next step number
    const maxStepNumber = await db
      .select({ maxStep: recipeInstructions.stepNumber })
      .from(recipeInstructions)
      .where(eq(recipeInstructions.recipeId, validatedData.recipeId))
      .orderBy(recipeInstructions.stepNumber)
      .limit(1);

    const nextStepNumber = (maxStepNumber[0]?.maxStep || 0) + 1;

    const [instruction] = await db
      .insert(recipeInstructions)
      .values({
        id: nanoid(),
        recipeId: validatedData.recipeId,
        stepNumber: nextStepNumber,
        instruction: validatedData.instruction,
        timeMinutes: validatedData.timeMinutes,
        temperature: validatedData.temperature,
        notes: validatedData.notes,
        groupName: validatedData.groupName,
      })
      .returning();

    // Update recipe timestamp
    await db
      .update(recipes)
      .set({ updatedAt: new Date() })
      .where(eq(recipes.id, validatedData.recipeId));

    logger.info(
      {
        instructionId: instruction.id,
        recipeId: validatedData.recipeId,
        userId: session.user.id,
      },
      "Recipe instruction added successfully",
    );
    return { success: true, data: instruction };
  } catch (error) {
    logError(logger, "Failed to add recipe instruction", error);
    return { success: false, error: "Failed to add recipe instruction" };
  }
}

export async function updateRecipeInstruction(rawData: UpdateInstructionInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = updateInstructionSchema.parse(rawData);
    const { id: instructionId, ...updateData } = validatedData;

    if (!instructionId) {
      return { success: false, error: "Instruction ID is required" };
    }

    // Verify instruction exists and user owns the recipe
    const existingInstruction = await db
      .select({
        instruction: recipeInstructions,
        recipe: recipes,
      })
      .from(recipeInstructions)
      .innerJoin(recipes, eq(recipeInstructions.recipeId, recipes.id))
      .where(
        and(
          eq(recipeInstructions.id, instructionId),
          eq(recipes.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existingInstruction.length) {
      return { success: false, error: "Instruction not found" };
    }

    const [updatedInstruction] = await db
      .update(recipeInstructions)
      .set(updateData)
      .where(eq(recipeInstructions.id, instructionId))
      .returning();

    // Update recipe timestamp
    await db
      .update(recipes)
      .set({ updatedAt: new Date() })
      .where(eq(recipes.id, existingInstruction[0].instruction.recipeId));

    logger.info(
      { instructionId, userId: session.user.id },
      "Recipe instruction updated successfully",
    );
    return { success: true, data: updatedInstruction };
  } catch (error) {
    logError(logger, "Failed to update recipe instruction", error);
    return { success: false, error: "Failed to update recipe instruction" };
  }
}

export async function removeRecipeInstruction(instructionId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify instruction exists and user owns the recipe
    const existingInstruction = await db
      .select({
        instruction: recipeInstructions,
        recipe: recipes,
      })
      .from(recipeInstructions)
      .innerJoin(recipes, eq(recipeInstructions.recipeId, recipes.id))
      .where(
        and(
          eq(recipeInstructions.id, instructionId),
          eq(recipes.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existingInstruction.length) {
      return { success: false, error: "Instruction not found" };
    }

    const recipeId = existingInstruction[0].instruction.recipeId;

    await db
      .delete(recipeInstructions)
      .where(eq(recipeInstructions.id, instructionId));

    // Update recipe timestamp
    await db
      .update(recipes)
      .set({ updatedAt: new Date() })
      .where(eq(recipes.id, recipeId));

    logger.info(
      { instructionId, recipeId, userId: session.user.id },
      "Recipe instruction removed successfully",
    );
    return { success: true };
  } catch (error) {
    logError(logger, "Failed to remove recipe instruction", error, {
      instructionId,
    });
    return { success: false, error: "Failed to remove recipe instruction" };
  }
}

export async function reorderRecipeInstructions(
  recipeId: string,
  instructionOrder: { id: string; stepNumber: number }[],
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Verify recipe ownership
    const recipeExists = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, session.user.id)))
      .limit(1);

    if (!recipeExists.length) {
      return { success: false, error: "Recipe not found" };
    }

    // Update step numbers in transaction
    await db.transaction(async (tx) => {
      for (const { id, stepNumber } of instructionOrder) {
        await tx
          .update(recipeInstructions)
          .set({ stepNumber })
          .where(
            and(
              eq(recipeInstructions.id, id),
              eq(recipeInstructions.recipeId, recipeId),
            ),
          );
      }

      // Update recipe timestamp
      await tx
        .update(recipes)
        .set({ updatedAt: new Date() })
        .where(eq(recipes.id, recipeId));
    });

    logger.info(
      { recipeId, userId: session.user.id },
      "Recipe instructions reordered successfully",
    );
    return { success: true };
  } catch (error) {
    logError(logger, "Failed to reorder recipe instructions", error, {
      recipeId,
    });
    return { success: false, error: "Failed to reorder recipe instructions" };
  }
}
