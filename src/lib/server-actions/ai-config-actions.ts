"use server";

import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  aiModelPresets,
  aiProviderConfigurations,
  aiTaskHistory,
} from "@/db/schema.ai";
import {
  getDefaultModelForProvider,
  validateProvider,
} from "@/lib/ai/providers";
import { auth } from "@/lib/auth/auth";
import { safeDecrypt, safeEncrypt } from "@/lib/crypto/encryption";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  AIProvider,
  type AIProviderConfig,
  type AITask,
  ImageProcessingMethod,
} from "@/lib/types";

const logger = createOperationLogger("ai-config-actions");

export async function getUserAIConfig(userId?: string) {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const targetUserId = userId || session.user.id;

    // Only allow users to access their own config
    if (targetUserId !== session.user.id) {
      return { success: false, error: "Access denied" };
    }

    const configs = await db
      .select()
      .from(aiProviderConfigurations)
      .where(eq(aiProviderConfigurations.userId, targetUserId))
      .orderBy(desc(aiProviderConfigurations.createdAt));

    // Decrypt API keys for the response
    const decryptedConfigs = await Promise.all(
      configs.map(async (config) => {
        const decryptedApiKey = config.encryptedApiKey
          ? await safeDecrypt(config.encryptedApiKey)
          : null;

        return {
          ...config,
          apiKey: decryptedApiKey,
          encryptedApiKey: undefined, // Don't send encrypted data to client
        };
      }),
    );

    const activeConfig = decryptedConfigs.find((config) => config.isActive);

    logger.info(
      {
        userId: targetUserId,
        configCount: decryptedConfigs.length,
        activeProvider: activeConfig?.provider,
      },
      "Retrieved user AI configuration",
    );

    return {
      success: true,
      data: {
        configurations: decryptedConfigs,
        activeConfiguration: activeConfig,
      },
    };
  } catch (error) {
    logError(logger, "Failed to get user AI config", error as Error);
    return { success: false, error: "Failed to retrieve AI configuration" };
  }
}

export async function saveAIProviderConfig(config: {
  provider: AIProvider;
  apiKey?: string;
  modelName?: string;
  maxTokens?: number;
  temperature?: number;
  taskSpecificTokenLimits?: string;
  enabledTasks?: string;
  ollamaHost?: string;
  imageProcessingMethod?: ImageProcessingMethod;
  isActive?: boolean;
}) {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Encrypt API key if provided
    const encryptedApiKey = config.apiKey
      ? await safeEncrypt(config.apiKey)
      : null;

    // If this config is being set as active, deactivate others
    if (config.isActive) {
      await db
        .update(aiProviderConfigurations)
        .set({ isActive: false })
        .where(eq(aiProviderConfigurations.userId, session.user.id));
    }

    const configData = {
      id: nanoid(),
      userId: session.user.id,
      provider: config.provider,
      encryptedApiKey,
      modelName:
        config.modelName || getDefaultModelForProvider(config.provider),
      maxTokens: config.maxTokens || 4000,
      taskSpecificTokenLimits: config.taskSpecificTokenLimits,
      temperature: config.temperature || 0.7,
      enabledTasks: config.enabledTasks || "recipe-parsing",
      ollamaHost: config.ollamaHost || "http://localhost:11434",
      imageProcessingMethod:
        config.imageProcessingMethod || ImageProcessingMethod.AUTO,
      isActive: config.isActive ?? true,
    };

    await db.insert(aiProviderConfigurations).values(configData);

    logger.info(
      {
        userId: session.user.id,
        provider: config.provider,
        isActive: config.isActive,
      },
      "Saved AI provider configuration",
    );

    return { success: true, data: configData };
  } catch (error) {
    logError(logger, "Failed to save AI config", error as Error, {
      provider: config.provider,
    });
    return { success: false, error: "Failed to save AI configuration" };
  }
}

export async function updateAIProviderConfig(
  configId: string,
  updates: {
    apiKey?: string;
    modelName?: string;
    maxTokens?: number;
    temperature?: number;
    taskSpecificTokenLimits?: string;
    enabledTasks?: string;
    ollamaHost?: string;
    imageProcessingMethod?: ImageProcessingMethod;
    isActive?: boolean;
  },
) {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const existingConfig = await db
      .select()
      .from(aiProviderConfigurations)
      .where(
        and(
          eq(aiProviderConfigurations.id, configId),
          eq(aiProviderConfigurations.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existingConfig.length === 0) {
      return { success: false, error: "Configuration not found" };
    }

    // Encrypt API key if provided
    const encryptedApiKey = updates.apiKey
      ? await safeEncrypt(updates.apiKey)
      : undefined;

    // If this config is being set as active, deactivate others
    if (updates.isActive) {
      await db
        .update(aiProviderConfigurations)
        .set({ isActive: false })
        .where(eq(aiProviderConfigurations.userId, session.user.id));
    }

    const updateData: typeof updates & { encryptedApiKey?: string | null } = {
      ...updates,
    };

    if (encryptedApiKey !== undefined) {
      updateData.encryptedApiKey = encryptedApiKey;
      delete updateData.apiKey;
    }

    await db
      .update(aiProviderConfigurations)
      .set(updateData)
      .where(eq(aiProviderConfigurations.id, configId));

    logger.info(
      {
        userId: session.user.id,
        configId,
        updates: Object.keys(updates),
      },
      "Updated AI provider configuration",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to update AI config", error as Error, {
      configId,
    });
    return { success: false, error: "Failed to update AI configuration" };
  }
}

export async function deleteAIProviderConfig(configId: string) {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    await db
      .delete(aiProviderConfigurations)
      .where(
        and(
          eq(aiProviderConfigurations.id, configId),
          eq(aiProviderConfigurations.userId, session.user.id),
        ),
      );

    logger.info(
      {
        userId: session.user.id,
        configId,
      },
      "Deleted AI provider configuration",
    );

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to delete AI config", error as Error, {
      configId,
    });
    return { success: false, error: "Failed to delete AI configuration" };
  }
}

export async function validateAIProvider(config: AIProviderConfig) {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const validation = await validateProvider(config);

    logger.info(
      {
        userId: session.user.id,
        provider: config.provider,
        valid: validation.valid,
      },
      "Validated AI provider",
    );

    return { success: true, data: validation };
  } catch (error) {
    logError(logger, "Failed to validate AI provider", error as Error, {
      provider: config.provider,
    });
    return { success: false, error: "Failed to validate AI provider" };
  }
}

export async function recordAITaskUsage(data: {
  taskType: AITask;
  provider: AIProvider;
  inputTokens?: number;
  outputTokens?: number;
  success: boolean;
  errorMessage?: string;
  responseTime?: number;
}) {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Don't log task history for disabled provider
    if (data.provider === AIProvider.NONE) {
      return { success: true };
    }

    await db.insert(aiTaskHistory).values({
      id: nanoid(),
      userId: session.user.id,
      taskType: data.taskType,
      provider: data.provider,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      success: data.success,
      errorMessage: data.errorMessage,
      responseTime: data.responseTime,
    });

    return { success: true };
  } catch (error) {
    logError(logger, "Failed to record AI task usage", error as Error);
    return { success: false, error: "Failed to record usage" };
  }
}

export async function getAIUsageStats(days = 30) {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const stats = await db
      .select()
      .from(aiTaskHistory)
      .where(eq(aiTaskHistory.userId, session.user.id))
      .orderBy(desc(aiTaskHistory.createdAt))
      .limit(1000);

    const summary = {
      totalTasks: stats.length,
      successfulTasks: stats.filter((s) => s.success).length,
      failedTasks: stats.filter((s) => !s.success).length,
      totalInputTokens: stats.reduce((sum, s) => sum + (s.inputTokens || 0), 0),
      totalOutputTokens: stats.reduce(
        (sum, s) => sum + (s.outputTokens || 0),
        0,
      ),
      averageResponseTime:
        stats.reduce((sum, s) => sum + (s.responseTime || 0), 0) / stats.length,
      tasksByType: stats.reduce(
        (acc, s) => {
          acc[s.taskType] = (acc[s.taskType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      tasksByProvider: stats.reduce(
        (acc, s) => {
          acc[s.provider] = (acc[s.provider] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    return { success: true, data: { stats, summary } };
  } catch (error) {
    logError(logger, "Failed to get AI usage stats", error as Error);
    return { success: false, error: "Failed to retrieve usage statistics" };
  }
}

export async function getAvailableModels() {
  try {
    const models = await db.select().from(aiModelPresets);

    return { success: true, data: models };
  } catch (error) {
    logError(logger, "Failed to get available models", error as Error);
    return { success: false, error: "Failed to retrieve available models" };
  }
}

export async function checkAIEnabledAction(userId?: string) {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const targetUserId = userId || session.user.id;

    // Get the user's AI configuration
    const result = await getUserAIConfig(targetUserId);

    if (!result.success || !result.data) {
      return { success: true, data: false };
    }

    const isEnabled =
      result.data.activeConfiguration !== null &&
      result.data.activeConfiguration !== undefined &&
      result.data.activeConfiguration.provider !== AIProvider.NONE;

    return { success: true, data: isEnabled };
  } catch (error) {
    logError(logger, "Failed to check AI enabled status", error as Error);
    return { success: false, error: "Failed to check AI status" };
  }
}

export async function getActiveAIConfigAction(userId?: string) {
  try {
    const userHeaders = await headers();
    const session = await auth.api.getSession({ headers: userHeaders });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const targetUserId = userId || session.user.id;

    // Get the user's AI configuration
    const result = await getUserAIConfig(targetUserId);

    if (!result.success || !result.data) {
      return { success: true, data: null };
    }

    return { success: true, data: result.data.activeConfiguration };
  } catch (error) {
    logError(logger, "Failed to get active AI config", error as Error);
    return { success: false, error: "Failed to get AI configuration" };
  }
}

export async function getAIConfig() {
  return getActiveAIConfigAction();
}
