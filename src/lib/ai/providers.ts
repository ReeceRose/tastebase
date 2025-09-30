import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { createOllama } from "ollama-ai-provider";
import { env } from "@/lib/config/env";
import {
  AIProvider,
  type AIProviderConfig,
  type AIProviderValue,
  DEFAULT_MODELS,
  IMAGE_GENERATION_MODELS,
  PROVIDER_DISPLAY_NAMES,
} from "@/lib/types";

export interface ProviderError {
  provider: AIProviderValue;
  error: string;
  isApiKeyError?: boolean;
  isModelError?: boolean;
  isConnectionError?: boolean;
}

export function getProvider(config: AIProviderConfig): LanguageModel {
  const { provider, apiKey, modelName, ollamaHost } = config;

  switch (provider) {
    case AIProvider.OPENAI: {
      if (!apiKey) {
        throw new Error("OpenAI API key is required");
      }
      const model = modelName || DEFAULT_MODELS[AIProvider.OPENAI];
      const client = createOpenAI({ apiKey });
      return client(model);
    }

    case AIProvider.ANTHROPIC: {
      if (!apiKey) {
        throw new Error("Anthropic API key is required");
      }
      const model = modelName || DEFAULT_MODELS[AIProvider.ANTHROPIC];
      const client = createAnthropic({ apiKey });
      return client(model);
    }

    case AIProvider.GOOGLE: {
      if (!apiKey) {
        throw new Error("Google API key is required");
      }
      const model = modelName || DEFAULT_MODELS[AIProvider.GOOGLE];
      const client = createGoogleGenerativeAI({ apiKey });
      return client(model);
    }

    case AIProvider.OLLAMA: {
      const host = ollamaHost || env.OLLAMA_BASE_URL;
      const model = modelName || DEFAULT_MODELS[AIProvider.OLLAMA];
      const client = createOllama({ baseURL: host });
      return client(model) as unknown as LanguageModel;
    }

    case AIProvider.NONE:
      throw new Error("AI provider is disabled");

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export async function validateProvider(config: AIProviderConfig): Promise<{
  valid: boolean;
  error?: ProviderError;
}> {
  try {
    const provider = getProvider(config);

    // Test with a simple prompt to validate the provider
    const testPrompt =
      "Respond with just the word 'test' to confirm the connection.";

    const { generateText } = await import("ai");

    const result = await generateText({
      model: provider,
      prompt: testPrompt,
      temperature: 0,
    });

    if (result.text.toLowerCase().includes("test")) {
      return { valid: true };
    }

    return {
      valid: false,
      error: {
        provider: config.provider,
        error: "Provider test failed - unexpected response",
        isConnectionError: true,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    let isApiKeyError = false;
    let isModelError = false;
    let isConnectionError = false;

    if (
      errorMessage.toLowerCase().includes("api key") ||
      errorMessage.toLowerCase().includes("unauthorized") ||
      errorMessage.toLowerCase().includes("authentication")
    ) {
      isApiKeyError = true;
    } else if (
      errorMessage.toLowerCase().includes("model") ||
      errorMessage.toLowerCase().includes("not found")
    ) {
      isModelError = true;
    } else if (
      errorMessage.toLowerCase().includes("connect") ||
      errorMessage.toLowerCase().includes("network") ||
      errorMessage.toLowerCase().includes("timeout")
    ) {
      isConnectionError = true;
    }

    return {
      valid: false,
      error: {
        provider: config.provider,
        error: errorMessage,
        isApiKeyError,
        isModelError,
        isConnectionError,
      },
    };
  }
}

export function getDefaultModelForProvider(provider: AIProviderValue): string {
  return DEFAULT_MODELS[provider] || "";
}

export function getProviderDisplayName(provider: AIProviderValue): string {
  return PROVIDER_DISPLAY_NAMES[provider] || provider;
}

export function getModelDisplayName(
  provider: AIProviderValue,
  modelName: string,
): string {
  const modelDisplayNames: Record<AIProviderValue, Record<string, string>> = {
    [AIProvider.OPENAI]: {
      "gpt-5": "GPT-5",
      "gpt-5-mini": "GPT-5 Mini",
      "gpt-5-nano": "GPT-5 Nano",
      "gpt-5-chat-latest": "GPT-5 Chat (Latest)",
      "gpt-4o": "GPT-4o",
      "gpt-4o-mini": "GPT-4o Mini",
      "gpt-4": "GPT-4",
      "gpt-4-turbo": "GPT-4 Turbo",
      "dall-e-3": "DALL-E 3",
    },
    [AIProvider.ANTHROPIC]: {
      "claude-opus-4-latest": "Claude Opus 4 (Latest)",
      "claude-sonnet-4-latest": "Claude Sonnet 4 (Latest)",
      "claude-3-7-sonnet-latest": "Claude 3.7 Sonnet (Latest)",
      "claude-3-5-sonnet-latest": "Claude 3.5 Sonnet (Latest)",
      "claude-3-5-haiku-latest": "Claude 3.5 Haiku (Latest)",
      "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
      "claude-3-opus-20240229": "Claude 3 Opus",
      "claude-3-haiku-20240307": "Claude 3 Haiku",
    },
    [AIProvider.GOOGLE]: {
      "gemini-2.5-pro": "Gemini 2.5 Pro",
      "gemini-2.5-flash": "Gemini 2.5 Flash",
      "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
      "gemini-2.0-flash-exp": "Gemini 2.0 Flash (Experimental)",
      "imagen-3.0-generate-001": "Imagen 3.0",
      "gemini-2.5-flash-image-preview": "Gemini 2.5 Flash (Image Generation)",
      "gemini-1.5-pro": "Gemini 1.5 Pro",
      "gemini-1.5-flash": "Gemini 1.5 Flash",
    },
    [AIProvider.OLLAMA]: {
      "llama3.2": "Llama 3.2",
      "llama3.1": "Llama 3.1",
      "qwen2.5": "Qwen 2.5",
      codegemma: "CodeGemma",
    },
    [AIProvider.NONE]: {},
  };

  return modelDisplayNames[provider]?.[modelName] || modelName;
}

export function requiresApiKey(provider: AIProviderValue): boolean {
  return provider !== AIProvider.OLLAMA && provider !== AIProvider.NONE;
}

export function supportsTask(provider: AIProviderValue): boolean {
  if (provider === AIProvider.NONE) return false;

  // All providers support all tasks for now
  // In the future, we might have provider-specific task compatibility
  return true;
}

export function supportsImageGeneration(provider: AIProviderValue): boolean {
  return provider === AIProvider.GOOGLE || provider === AIProvider.OPENAI;
}

export function getImageGenerationModel(
  provider: AIProviderValue,
): string | null {
  return (
    IMAGE_GENERATION_MODELS[provider as keyof typeof IMAGE_GENERATION_MODELS] ||
    null
  );
}

export function getAvailableImageProviders(userSettings: {
  hasGoogleKey?: boolean;
  hasOpenaiKey?: boolean;
}): AIProviderValue[] {
  const providers: AIProviderValue[] = [];

  if (userSettings.hasGoogleKey && supportsImageGeneration(AIProvider.GOOGLE)) {
    providers.push(AIProvider.GOOGLE);
  }

  if (userSettings.hasOpenaiKey && supportsImageGeneration(AIProvider.OPENAI)) {
    providers.push(AIProvider.OPENAI);
  }

  return providers;
}
