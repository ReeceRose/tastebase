"use server";

import { headers } from "next/headers";
import { getActiveAIConfig } from "@/lib/ai/config";
import { modelSupportsVision } from "@/lib/ai/models";
import { getProviderDisplayName } from "@/lib/ai/providers";
import { auth } from "@/lib/auth/auth";
import { PageFetchError, parseImportUrl } from "@/lib/import/fetch-page";
import {
  attachImportedPhoto,
  saveSuggestedPhoto,
} from "@/lib/import/import-image";
import {
  importRecipeFromImage,
  importRecipeFromPage,
  importRecipeFromText,
  importRecipeFromUrl,
} from "@/lib/import/import-recipe";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { findSavedRecipe } from "@/lib/search/saved-recipe-lookup";
import type { ServerActionResult } from "@/lib/server-actions/utils";
import { ImageProcessingMethod } from "@/lib/types/ai-types";
import type {
  CapturedPage,
  PhotoSuggestion,
  RecipeImportCapabilities,
  RecipeImportResult,
  SavedRecipeMatch,
} from "@/lib/types/import-types";
import type { PendingImage } from "@/lib/types/recipe-types";

const logger = createOperationLogger("recipe-import-actions");

const MAX_TEXT_LENGTH = 100000;
const MAX_PAGE_HTML_LENGTH = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 9.5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function requireUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

export async function getRecipeImportCapabilitiesAction(): Promise<
  ServerActionResult<RecipeImportCapabilities>
> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const config = await getActiveAIConfig(userId);
  return {
    success: true,
    data: {
      aiConfigured: config !== null,
      visionAvailable:
        config !== null &&
        config.modelName !== null &&
        config.imageProcessingMethod !== ImageProcessingMethod.OCR &&
        modelSupportsVision(config.provider, config.modelName),
      providerName: config ? getProviderDisplayName(config.provider) : null,
      imageProcessingMethod:
        config?.imageProcessingMethod ?? ImageProcessingMethod.AUTO,
    },
  };
}

export async function importRecipeFromUrlAction(
  url: string,
): Promise<ServerActionResult<RecipeImportResult>> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const result = await importRecipeFromUrl(
      url,
      await getActiveAIConfig(userId),
    );
    return { success: true, data: await attachImportedPhoto(result, null) };
  } catch (error) {
    if (error instanceof PageFetchError) {
      return { success: false, error: error.message };
    }
    logError(logger, "URL import failed", error, { userId });
    return {
      success: false,
      error:
        "Couldn't import from that link. Try pasting the recipe text instead.",
    };
  }
}

export async function importRecipeFromPageAction(
  page: CapturedPage,
): Promise<ServerActionResult<RecipeImportResult>> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }
  if (page.html.length > MAX_PAGE_HTML_LENGTH) {
    return { success: false, error: "The page is too large to import" };
  }

  try {
    const pageUrl = parseImportUrl(page.url).toString();
    const result = await importRecipeFromPage(
      { url: pageUrl, html: page.html },
      await getActiveAIConfig(userId),
    );
    return {
      success: true,
      data: await attachImportedPhoto(result, page.image),
    };
  } catch (error) {
    if (error instanceof PageFetchError) {
      return { success: false, error: error.message };
    }
    logError(logger, "Extension page import failed", error, { userId });
    return {
      success: false,
      error: "Couldn't read a recipe from that page. Try pasting the text.",
    };
  }
}

export async function importRecipeFromTextAction(
  text: string,
  forceAI: boolean,
): Promise<ServerActionResult<RecipeImportResult>> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { success: false, error: "Paste some recipe text first" };
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { success: false, error: "That text is too long to import" };
  }

  const aiConfig = await getActiveAIConfig(userId);
  if (forceAI && !aiConfig) {
    return {
      success: false,
      error: "Set up an AI provider in Settings to use AI cleanup",
    };
  }

  try {
    const result = await importRecipeFromText(trimmed, aiConfig, forceAI);
    return { success: true, data: result };
  } catch (error) {
    logError(logger, "Text import failed", error, { userId });
    return { success: false, error: "Couldn't parse that text" };
  }
}

export async function importRecipeFromImageAction(
  formData: FormData,
): Promise<ServerActionResult<RecipeImportResult>> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return { success: false, error: "Choose an image to import" };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: "Use a JPEG, PNG or WebP image" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, error: "Images must be smaller than 9.5 MB" };
  }

  try {
    const image = Buffer.from(await file.arrayBuffer());
    const result = await importRecipeFromImage(
      image,
      file.type,
      await getActiveAIConfig(userId),
    );
    return { success: true, data: result };
  } catch (error) {
    logError(logger, "Image import failed", error, { userId });
    return { success: false, error: "Couldn't read a recipe from that image" };
  }
}

export async function importSuggestedPhotoAction(
  photo: PhotoSuggestion,
): Promise<ServerActionResult<PendingImage>> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  try {
    parseImportUrl(photo.url);
    const image = await saveSuggestedPhoto(photo);
    if (!image) {
      return { success: false, error: "That image is too small to use" };
    }
    return { success: true, data: image };
  } catch (error) {
    if (error instanceof PageFetchError) {
      return { success: false, error: "That photo couldn't be downloaded" };
    }
    logError(logger, "Suggested photo import failed", error, { userId });
    return { success: false, error: "That photo couldn't be added" };
  }
}

export async function findSavedRecipeAction(
  sourceUrl: string,
): Promise<ServerActionResult<SavedRecipeMatch | null>> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }
  try {
    return { success: true, data: await findSavedRecipe(userId, sourceUrl) };
  } catch (error) {
    logError(logger, "Saved recipe lookup failed", error, { userId });
    return { success: false, error: "Couldn't check for saved copies" };
  }
}
