import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiProviderConfigurations } from "@/db/schema.ai";
import { resolveModelName } from "@/lib/ai/models";
import { safeDecrypt } from "@/lib/crypto/encryption";
import { createOperationLogger } from "@/lib/logging/logger";
import {
  AIProvider,
  type AIProviderConfig,
  DEFAULT_OLLAMA_HOST,
  ImageProcessingMethod,
} from "@/lib/types/ai-types";

const logger = createOperationLogger("ai-config");

// Server-only: returns the user's active AI configuration with the API key
// decrypted. Never send the result of this function to the client.
export async function getActiveAIConfig(
  userId: string,
): Promise<AIProviderConfig | null> {
  const [row] = await db
    .select()
    .from(aiProviderConfigurations)
    .where(
      and(
        eq(aiProviderConfigurations.userId, userId),
        eq(aiProviderConfigurations.isActive, true),
      ),
    )
    .limit(1);

  if (!row || row.provider === AIProvider.NONE) {
    return null;
  }

  const resolvedModel = resolveModelName(row.provider, row.modelName);
  if (row.modelName && resolvedModel !== row.modelName) {
    logger.warn(
      { userId, savedModel: row.modelName, resolvedModel },
      "Saved AI model is retired; using the provider default",
    );
  }

  return {
    provider: row.provider,
    apiKey: await safeDecrypt(row.encryptedApiKey),
    modelName: resolvedModel,
    ollamaHost: row.ollamaHost || DEFAULT_OLLAMA_HOST,
    imageProcessingMethod:
      row.imageProcessingMethod ?? ImageProcessingMethod.AUTO,
  };
}
