import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { createOllama } from "ai-sdk-ollama";
import { resolveModelName } from "@/lib/ai/models";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import {
  AIProvider,
  type AIProviderConfig,
  type AIProviderValue,
  DEFAULT_OLLAMA_HOST,
  PROVIDER_DISPLAY_NAMES,
  type ProviderConnectionResult,
} from "@/lib/types/ai-types";

const logger = createOperationLogger("ai-providers");

const CONNECTION_TIMEOUT_MS = 10000;

export function requiresApiKey(provider: AIProviderValue): boolean {
  return provider !== AIProvider.OLLAMA && provider !== AIProvider.NONE;
}

export function getProviderDisplayName(provider: AIProviderValue): string {
  return PROVIDER_DISPLAY_NAMES[provider];
}

export function getProvider(config: AIProviderConfig): LanguageModel {
  const modelName = resolveModelName(config.provider, config.modelName);

  if (!modelName || config.provider === AIProvider.NONE) {
    throw new Error("No AI provider configured");
  }

  if (requiresApiKey(config.provider) && !config.apiKey) {
    throw new Error(
      `${getProviderDisplayName(config.provider)} needs an API key`,
    );
  }

  const apiKey = config.apiKey ?? "";

  switch (config.provider) {
    case AIProvider.OPENAI:
      return createOpenAI({ apiKey })(modelName);
    case AIProvider.ANTHROPIC:
      return createAnthropic({ apiKey })(modelName);
    case AIProvider.GOOGLE:
      return createGoogleGenerativeAI({ apiKey })(modelName);
    case AIProvider.OLLAMA:
      return createOllama({
        baseURL: config.ollamaHost || DEFAULT_OLLAMA_HOST,
      })(modelName);
    default:
      throw new Error("No AI provider configured");
  }
}

interface ModelListRequest {
  url: string;
  headers: Record<string, string>;
  readIds: (body: ModelListBody) => string[];
}

interface ModelListBody {
  data?: Array<{ id?: string }>;
  models?: Array<{ name?: string; model?: string }>;
}

function getModelListRequest(config: AIProviderConfig): ModelListRequest {
  const apiKey = config.apiKey ?? "";

  switch (config.provider) {
    case AIProvider.OPENAI:
      return {
        url: "https://api.openai.com/v1/models",
        headers: { Authorization: `Bearer ${apiKey}` },
        readIds: (body) =>
          (body.data ?? []).flatMap((m) => (m.id ? [m.id] : [])),
      };
    case AIProvider.ANTHROPIC:
      return {
        url: "https://api.anthropic.com/v1/models?limit=100",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        readIds: (body) =>
          (body.data ?? []).flatMap((m) => (m.id ? [m.id] : [])),
      };
    case AIProvider.GOOGLE:
      return {
        url: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
        headers: { "x-goog-api-key": apiKey },
        readIds: (body) =>
          (body.models ?? []).flatMap((m) =>
            m.name ? [m.name.replace(/^models\//, "")] : [],
          ),
      };
    case AIProvider.OLLAMA:
      return {
        url: `${(config.ollamaHost || DEFAULT_OLLAMA_HOST).replace(/\/$/, "")}/api/tags`,
        headers: {},
        readIds: (body) =>
          (body.models ?? []).flatMap((m) => {
            const name = m.model ?? m.name;
            return name ? [name.replace(/:latest$/, "")] : [];
          }),
      };
    default:
      throw new Error("No AI provider selected");
  }
}

// Checks a provider configuration by listing the models the key can use.
// This verifies the key without spending tokens.
export async function testProviderConnection(
  config: AIProviderConfig,
): Promise<ProviderConnectionResult> {
  if (config.provider === AIProvider.NONE) {
    return { valid: false, error: "No AI provider selected", models: [] };
  }

  if (requiresApiKey(config.provider) && !config.apiKey) {
    return { valid: false, error: "An API key is required", models: [] };
  }

  try {
    const request = getModelListRequest(config);
    const response = await fetch(request.url, {
      headers: request.headers,
      signal: AbortSignal.timeout(CONNECTION_TIMEOUT_MS),
    });

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: "The API key was rejected", models: [] };
    }

    if (!response.ok) {
      return {
        valid: false,
        error: `${getProviderDisplayName(config.provider)} returned HTTP ${response.status}`,
        models: [],
      };
    }

    const body = (await response.json()) as ModelListBody;
    const models = request.readIds(body).sort();
    const modelName = resolveModelName(config.provider, config.modelName);

    if (modelName && models.length > 0 && !models.includes(modelName)) {
      const hint =
        config.provider === AIProvider.OLLAMA
          ? ` Run "ollama pull ${modelName}" on the Ollama host.`
          : "";
      return {
        valid: false,
        error: `The model "${modelName}" isn't available with this configuration.${hint}`,
        models,
      };
    }

    logger.info(
      { provider: config.provider, modelCount: models.length },
      "AI provider connection verified",
    );

    return { valid: true, error: null, models };
  } catch (error) {
    logError(logger, "AI provider connection test failed", error, {
      provider: config.provider,
    });
    const message =
      config.provider === AIProvider.OLLAMA
        ? "Couldn't reach the Ollama host"
        : "Couldn't reach the provider";
    return { valid: false, error: message, models: [] };
  }
}
