import {
  type AIModelInfo,
  AIProvider,
  type AIProviderValue,
} from "@/lib/types/ai-types";

// Model IDs checked against each provider's model list on 2026-10-14.
// The AI is only used as a fallback for recipe import, so the defaults favour
// fast, inexpensive models that can also read images.
const MODEL_CATALOG: Record<AIProviderValue, AIModelInfo[]> = {
  [AIProvider.ANTHROPIC]: [
    {
      id: "claude-haiku-5-5",
      displayName: "Claude Haiku 5.5",
      vision: true,
      recommended: true,
    },
    {
      id: "claude-sonnet-5-5",
      displayName: "Claude Sonnet 5.5",
      vision: true,
      recommended: false,
    },
  ],
  [AIProvider.OPENAI]: [
    {
      id: "gpt-6-luna",
      displayName: "GPT-6 Luna",
      vision: true,
      recommended: true,
    },
    {
      id: "gpt-6.1-sol",
      displayName: "GPT-6.1 Sol",
      vision: true,
      recommended: false,
    },
  ],
  [AIProvider.GOOGLE]: [
    {
      id: "gemini-3.8-flash",
      displayName: "Gemini 3.8 Flash",
      vision: true,
      recommended: true,
    },
    {
      id: "gemini-3.5-flash-lite",
      displayName: "Gemini 3.5 Flash-Lite",
      vision: true,
      recommended: false,
    },
  ],
  [AIProvider.OLLAMA]: [
    {
      id: "qwen3",
      displayName: "Qwen 3",
      vision: false,
      recommended: true,
    },
    {
      id: "gemma3",
      displayName: "Gemma 3 (reads images)",
      vision: true,
      recommended: false,
    },
  ],
  [AIProvider.NONE]: [],
};

// Model IDs that earlier versions of Tastebase offered and that providers have
// since retired. Saved configurations using one of these fall back to the
// provider default.
export const RETIRED_MODEL_IDS: readonly string[] = [
  "gpt-4",
  "gpt-4-turbo",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-5-chat-latest",
  "claude-opus-4-latest",
  "claude-sonnet-4-latest",
  "claude-3-7-sonnet-latest",
  "claude-3-5-sonnet-latest",
  "claude-3-5-haiku-latest",
  "claude-3-5-sonnet-20241022",
  "claude-3-opus-20240229",
  "claude-3-haiku-20240307",
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
];

const OLLAMA_VISION_MODEL_PATTERN = /vision|vl|llava|gemma3|minicpm-v/i;

export function getModelsForProvider(provider: AIProviderValue): AIModelInfo[] {
  return MODEL_CATALOG[provider];
}

export function getDefaultModel(provider: AIProviderValue): string | null {
  const models = MODEL_CATALOG[provider];
  const recommended = models.find((model) => model.recommended) ?? models[0];
  return recommended ? recommended.id : null;
}

export function resolveModelName(
  provider: AIProviderValue,
  modelName: string | null,
): string | null {
  const trimmed = modelName?.trim() ?? "";
  if (trimmed.length === 0 || RETIRED_MODEL_IDS.includes(trimmed)) {
    return getDefaultModel(provider);
  }
  return trimmed;
}

export function getModelDisplayName(
  provider: AIProviderValue,
  modelName: string,
): string {
  const model = MODEL_CATALOG[provider].find((item) => item.id === modelName);
  return model ? model.displayName : modelName;
}

export function modelSupportsVision(
  provider: AIProviderValue,
  modelName: string,
): boolean {
  const model = MODEL_CATALOG[provider].find((item) => item.id === modelName);
  if (model) {
    return model.vision;
  }
  if (provider === AIProvider.OLLAMA) {
    return OLLAMA_VISION_MODEL_PATTERN.test(modelName);
  }
  return provider !== AIProvider.NONE;
}
