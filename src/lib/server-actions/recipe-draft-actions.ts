"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { RecipeDifficulty, RecipeDraftInput } from "@/lib/types";

const logger = createOperationLogger("recipe-draft-actions");

export interface RecipeDraft {
  id: string;
  title: string;
  description: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  cuisine: string;
  sourceUrl: string;
  sourceName: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
    notes: string;
    groupName: string;
    isOptional: boolean;
  }>;
  instructions: Array<{
    instruction: string;
    timeMinutes: number;
    temperature: string;
    notes: string;
    groupName: string;
  }>;
  tags: string[];
  lastSaved: string;
}

export async function saveRecipeDraft(draftData: RecipeDraftInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const draftKey = `recipe-draft-${session.user.id}`;
    const draft: RecipeDraft = {
      ...draftData,
      id: `draft-${Date.now()}`,
      lastSaved: new Date().toISOString(),
    };

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }

    logger.info(
      { userId: session.user.id, draftId: draft.id },
      "Recipe draft saved successfully",
    );

    return { success: true, data: draft };
  } catch (error) {
    logError(logger, "Failed to save recipe draft", error);
    return { success: false, error: "Failed to save draft" };
  }
}

export async function getRecipeDraft() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const draftKey = `recipe-draft-${session.user.id}`;

    if (typeof localStorage !== "undefined") {
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        const draft = JSON.parse(draftData) as RecipeDraft;
        return { success: true, data: draft };
      }
    }

    return { success: true, data: null };
  } catch (error) {
    logError(logger, "Failed to get recipe draft", error);
    return { success: false, error: "Failed to get draft" };
  }
}

export async function clearRecipeDraft() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const draftKey = `recipe-draft-${session.user.id}`;

    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(draftKey);
    }

    logger.info(
      { userId: session.user.id },
      "Recipe draft cleared successfully",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to clear recipe draft", error);
    return { success: false, error: "Failed to clear draft" };
  }
}
