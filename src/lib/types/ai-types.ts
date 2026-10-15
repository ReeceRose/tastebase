export enum AIProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  OLLAMA = "ollama",
  NONE = "none",
}

export enum ImageProcessingMethod {
  AUTO = "auto",
  AI_VISION = "ai-vision",
  OCR = "ocr",
}

export type AIProviderValue = `${AIProvider}`;

export const PROVIDER_DISPLAY_NAMES = {
  [AIProvider.OPENAI]: "OpenAI",
  [AIProvider.ANTHROPIC]: "Anthropic",
  [AIProvider.GOOGLE]: "Google",
  [AIProvider.OLLAMA]: "Ollama (Local)",
  [AIProvider.NONE]: "No AI",
} as const;

export const DEFAULT_OLLAMA_HOST = "http://localhost:11434";

export interface AIModelInfo {
  id: string;
  displayName: string;
  vision: boolean;
  recommended: boolean;
}

export interface AIProviderConfig {
  provider: AIProviderValue;
  apiKey: string | null;
  modelName: string | null;
  ollamaHost: string | null;
  imageProcessingMethod: ImageProcessingMethod;
}

export interface AIProviderSettings {
  id: string;
  provider: AIProviderValue;
  modelName: string | null;
  ollamaHost: string | null;
  imageProcessingMethod: ImageProcessingMethod;
  isActive: boolean;
  hasApiKey: boolean;
  maskedApiKey: string | null;
  createdAt: Date;
}

export interface AIProviderSettingsInput {
  provider: AIProviderValue;
  apiKey: string | null;
  modelName: string | null;
  ollamaHost: string | null;
  imageProcessingMethod: ImageProcessingMethod;
  isActive: boolean;
}

export interface ProviderConnectionResult {
  valid: boolean;
  error: string | null;
  models: string[];
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
