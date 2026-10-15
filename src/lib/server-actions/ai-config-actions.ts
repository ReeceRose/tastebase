"use server";

import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import {
  type AIProviderConfiguration,
  aiProviderConfigurations,
} from "@/db/schema.ai";
import { requiresApiKey, testProviderConnection } from "@/lib/ai/providers";
import { auth } from "@/lib/auth/auth";
import { safeDecrypt, safeEncrypt } from "@/lib/crypto/encryption";
import { maskApiKey } from "@/lib/crypto/utils";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import type { ServerActionResult } from "@/lib/server-actions/utils";
import {
  AIProvider,
  type AIProviderSettings,
  type AIProviderSettingsInput,
  DEFAULT_OLLAMA_HOST,
  ImageProcessingMethod,
  type ProviderConnectionResult,
} from "@/lib/types/ai-types";

const logger = createOperationLogger("ai-config-actions");

const settingsInputSchema = z.object({
  provider: z.enum([
    AIProvider.OPENAI,
    AIProvider.ANTHROPIC,
    AIProvider.GOOGLE,
    AIProvider.OLLAMA,
  ]),
  apiKey: z.string().trim().max(500).nullable(),
  modelName: z.string().trim().max(200).nullable(),
  ollamaHost: z
    .string()
    .trim()
    .url()
    .refine((value) => /^https?:\/\//.test(value), "Use an http or https URL")
    .nullable(),
  imageProcessingMethod: z.enum([
    ImageProcessingMethod.AUTO,
    ImageProcessingMethod.AI_VISION,
    ImageProcessingMethod.OCR,
  ]),
  isActive: z.boolean(),
});

async function requireUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

async function toSettings(
  row: AIProviderConfiguration,
): Promise<AIProviderSettings> {
  const apiKey = await safeDecrypt(row.encryptedApiKey);
  return {
    id: row.id,
    provider: row.provider,
    modelName: row.modelName,
    ollamaHost: row.ollamaHost,
    imageProcessingMethod:
      row.imageProcessingMethod ?? ImageProcessingMethod.AUTO,
    isActive: row.isActive,
    hasApiKey: apiKey !== null,
    maskedApiKey: apiKey ? maskApiKey(apiKey) : null,
    createdAt: row.createdAt,
  };
}

async function findOwnedConfig(
  userId: string,
  configId: string,
): Promise<AIProviderConfiguration | null> {
  const [row] = await db
    .select()
    .from(aiProviderConfigurations)
    .where(
      and(
        eq(aiProviderConfigurations.id, configId),
        eq(aiProviderConfigurations.userId, userId),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function deactivateOtherConfigs(userId: string): Promise<void> {
  await db
    .update(aiProviderConfigurations)
    .set({ isActive: false })
    .where(eq(aiProviderConfigurations.userId, userId));
}

function normalizeInput(input: AIProviderSettingsInput) {
  const parsed = settingsInputSchema.safeParse(input);
  if (!parsed.success) {
    return null;
  }
  const data = parsed.data;
  return {
    ...data,
    apiKey: data.apiKey || null,
    modelName: data.modelName || null,
    ollamaHost:
      data.provider === AIProvider.OLLAMA
        ? data.ollamaHost || DEFAULT_OLLAMA_HOST
        : null,
  };
}

export async function getAISettingsAction(): Promise<
  ServerActionResult<AIProviderSettings[]>
> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const rows = await db
      .select()
      .from(aiProviderConfigurations)
      .where(eq(aiProviderConfigurations.userId, userId))
      .orderBy(desc(aiProviderConfigurations.createdAt));
    return { success: true, data: await Promise.all(rows.map(toSettings)) };
  } catch (error) {
    logError(logger, "Failed to load AI settings", error, { userId });
    return { success: false, error: "Failed to load AI settings" };
  }
}

export async function saveAIProviderSettingsAction(
  configId: string | null,
  input: AIProviderSettingsInput,
): Promise<ServerActionResult<AIProviderSettings>> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const data = normalizeInput(input);
  if (!data) {
    return {
      success: false,
      error: "Check the provider settings and try again",
    };
  }

  try {
    const existing = configId ? await findOwnedConfig(userId, configId) : null;
    if (configId && !existing) {
      return { success: false, error: "Configuration not found" };
    }

    const encryptedApiKey = data.apiKey
      ? await safeEncrypt(data.apiKey)
      : (existing?.encryptedApiKey ?? null);

    if (requiresApiKey(data.provider) && !encryptedApiKey) {
      return { success: false, error: "An API key is required" };
    }

    if (data.isActive) {
      await deactivateOtherConfigs(userId);
    }

    const values = {
      provider: data.provider,
      encryptedApiKey: requiresApiKey(data.provider) ? encryptedApiKey : null,
      modelName: data.modelName,
      ollamaHost: data.ollamaHost,
      imageProcessingMethod: data.imageProcessingMethod,
      isActive: data.isActive,
    };

    const id = existing?.id ?? nanoid();
    if (existing) {
      await db
        .update(aiProviderConfigurations)
        .set(values)
        .where(eq(aiProviderConfigurations.id, id));
    } else {
      await db
        .insert(aiProviderConfigurations)
        .values({ id, userId, ...values });
    }

    const saved = await findOwnedConfig(userId, id);
    if (!saved) {
      return { success: false, error: "Failed to save AI settings" };
    }

    logger.info(
      { userId, provider: data.provider, isActive: data.isActive },
      existing
        ? "Updated AI provider settings"
        : "Created AI provider settings",
    );
    return { success: true, data: await toSettings(saved) };
  } catch (error) {
    logError(logger, "Failed to save AI settings", error, { userId });
    return { success: false, error: "Failed to save AI settings" };
  }
}

export async function setActiveAIProviderAction(
  configId: string | null,
): Promise<ServerActionResult<null>> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    if (configId && !(await findOwnedConfig(userId, configId))) {
      return { success: false, error: "Configuration not found" };
    }
    await deactivateOtherConfigs(userId);
    if (configId) {
      await db
        .update(aiProviderConfigurations)
        .set({ isActive: true })
        .where(eq(aiProviderConfigurations.id, configId));
    }
    return { success: true, data: null };
  } catch (error) {
    logError(logger, "Failed to change active AI provider", error, { userId });
    return { success: false, error: "Failed to change the active provider" };
  }
}

export async function deleteAIProviderSettingsAction(
  configId: string,
): Promise<ServerActionResult<null>> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await db
      .delete(aiProviderConfigurations)
      .where(
        and(
          eq(aiProviderConfigurations.id, configId),
          eq(aiProviderConfigurations.userId, userId),
        ),
      );
    return { success: true, data: null };
  } catch (error) {
    logError(logger, "Failed to delete AI settings", error, { userId });
    return { success: false, error: "Failed to delete AI settings" };
  }
}

export async function testAIProviderAction(
  configId: string | null,
  input: AIProviderSettingsInput,
): Promise<ServerActionResult<ProviderConnectionResult>> {
  const userId = await requireUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const data = normalizeInput(input);
  if (!data) {
    return {
      success: false,
      error: "Check the provider settings and try again",
    };
  }

  const existing = configId ? await findOwnedConfig(userId, configId) : null;
  const apiKey =
    data.apiKey ?? (await safeDecrypt(existing?.encryptedApiKey ?? null));

  const result = await testProviderConnection({
    provider: data.provider,
    apiKey,
    modelName: data.modelName,
    ollamaHost: data.ollamaHost,
    imageProcessingMethod: data.imageProcessingMethod,
  });
  return { success: true, data: result };
}
