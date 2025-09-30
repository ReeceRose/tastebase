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

export type VisionCapableProvider =
  | AIProvider.OPENAI
  | AIProvider.ANTHROPIC
  | AIProvider.GOOGLE;
export type VisionCapableProviderValue = `${VisionCapableProvider}`;

export const DEFAULT_MODELS = {
  [AIProvider.OPENAI]: "gpt-5-mini",
  [AIProvider.ANTHROPIC]: "claude-sonnet-4-latest",
  [AIProvider.GOOGLE]: "gemini-2.5-flash",
  [AIProvider.OLLAMA]: "llama3.2",
  [AIProvider.NONE]: "",
} as const;

export const PROVIDER_DISPLAY_NAMES = {
  [AIProvider.OPENAI]: "OpenAI",
  [AIProvider.ANTHROPIC]: "Anthropic",
  [AIProvider.GOOGLE]: "Google",
  [AIProvider.OLLAMA]: "Ollama (Local)",
  [AIProvider.NONE]: "No AI",
} as const;

export const VISION_CAPABLE_PROVIDERS: VisionCapableProviderValue[] = [
  AIProvider.OPENAI,
  AIProvider.ANTHROPIC,
  AIProvider.GOOGLE,
];

export const IMAGE_GENERATION_MODELS = {
  [AIProvider.GOOGLE]: "imagen-3.0-generate-001",
  [AIProvider.OPENAI]: "dall-e-3",
} as const;

export const COMMON_MODELS = {
  [AIProvider.OPENAI]: {
    GPT_4: "gpt-4",
    GPT_4_TURBO: "gpt-4-turbo",
    GPT_4O: "gpt-4o",
    GPT_4O_MINI: "gpt-4o-mini",
    GPT_5: "gpt-5",
    GPT_5_MINI: "gpt-5-mini",
    GPT_5_NANO: "gpt-5-nano",
    GPT_5_CHAT_LATEST: "gpt-5-chat-latest",
  },
  [AIProvider.ANTHROPIC]: {
    CLAUDE_OPUS_4_LATEST: "claude-opus-4-latest",
    CLAUDE_SONNET_4_LATEST: "claude-sonnet-4-latest",
    CLAUDE_3_7_SONNET_LATEST: "claude-3-7-sonnet-latest",
    CLAUDE_3_5_SONNET_LATEST: "claude-3-5-sonnet-latest",
    CLAUDE_3_5_HAIKU_LATEST: "claude-3-5-haiku-latest",
    CLAUDE_3_5_SONNET_20241022: "claude-3-5-sonnet-20241022",
    CLAUDE_3_OPUS_20240229: "claude-3-opus-20240229",
    CLAUDE_3_HAIKU_20240307: "claude-3-haiku-20240307",
  },
  [AIProvider.GOOGLE]: {
    GEMINI_2_5_FLASH: "gemini-2.5-flash",
    GEMINI_2_5_FLASH_LITE: "gemini-2.5-flash-lite",
    GEMINI_2_0_FLASH_EXP: "gemini-2.0-flash-exp",
    GEMINI_1_5_PRO: "gemini-1.5-pro",
    GEMINI_1_5_FLASH: "gemini-1.5-flash",
  },
  [AIProvider.OLLAMA]: {
    LLAMA3_2: "llama3.2",
    LLAMA3_1: "llama3.1",
    QWEN2_5: "qwen2.5",
    CODEGEMMA: "codegemma",
  },
  [AIProvider.NONE]: {},
} as const;

export type AITask =
  | "recipe-parsing"
  | "chat-conversation"
  | "recipe-discovery"
  | "cooking-assistance";

export interface TaskSpecificTokenLimits {
  "recipe-parsing"?: number;
  "chat-conversation"?: number;
  "recipe-discovery"?: number;
  "cooking-assistance"?: number;
}

export const DEFAULT_TASK_TOKEN_LIMITS: TaskSpecificTokenLimits = {
  "recipe-parsing": 4000,
  "chat-conversation": 12000,
  "recipe-discovery": 8000,
  "cooking-assistance": 16000,
} as const;

export interface AIProviderConfig {
  id?: string;
  userId?: string;
  provider: AIProviderValue;
  apiKey?: string | null;
  encryptedApiKey?: string | null;
  modelName?: string | null;
  maxTokens?: number | null;
  taskSpecificTokenLimits?: string | null;
  temperature?: number | null;
  enabledTasks?: string;
  ollamaHost?: string | null;
  imageProcessingMethod?: ImageProcessingMethod | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProviderModelOptions {
  [AIProvider.OPENAI]: {
    "gpt-4": { maxTokens: 8192; costPer1k: 0.03 };
    "gpt-4-turbo": { maxTokens: 128000; costPer1k: 0.01 };
    "gpt-4o": { maxTokens: 128000; costPer1k: 0.005 };
    "gpt-4o-mini": { maxTokens: 128000; costPer1k: 0.0002 };
  };
  [AIProvider.ANTHROPIC]: {
    "claude-3-5-sonnet-20241022": { maxTokens: 200000; costPer1k: 0.003 };
    "claude-3-opus-20240229": { maxTokens: 200000; costPer1k: 0.015 };
    "claude-3-haiku-20240307": { maxTokens: 200000; costPer1k: 0.0002 };
  };
  [AIProvider.GOOGLE]: {
    "gemini-2.5-flash": { maxTokens: 8192000; costPer1k: 0.000075 };
    "gemini-2.5-flash-lite": { maxTokens: 1048576; costPer1k: 0.00003 };
    "gemini-1.5-pro": { maxTokens: 2097152; costPer1k: 0.00125 };
    "gemini-1.5-flash": { maxTokens: 1048576; costPer1k: 0.000075 };
    "gemini-2.0-flash-exp": { maxTokens: 1048576; costPer1k: 0.000075 };
  };
  [AIProvider.OLLAMA]: {
    "llama3.2": { maxTokens: 131072; costPer1k: 0 };
    "llama3.1": { maxTokens: 131072; costPer1k: 0 };
    "qwen2.5": { maxTokens: 32768; costPer1k: 0 };
    codegemma: { maxTokens: 8192; costPer1k: 0 };
  };
}

export type ModelName<T extends AIProviderValue> =
  T extends keyof ProviderModelOptions ? keyof ProviderModelOptions[T] : string;

export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  responseTime?: number;
}

export interface RecipeParsingResult {
  title?: string | null;
  description?: string | null;
  servings?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
  ingredients?: Array<{
    name: string;
    quantity?: string | null;
    unit?: string | null;
  }> | null;
  instructions?: Array<{
    step: number;
    instruction: string;
    timeMinutes?: number | null;
    temperature?: string | null;
  }> | null;
  tags?: string[] | null;
  difficulty?: "easy" | "medium" | "hard" | null;
  cuisine?: string | null;
}

export interface AITaskRequest {
  taskType: AITask;
  userId: string;
  input: string;
  context?: Record<string, unknown>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}

export interface ConversationContext {
  currentRecipes?: string[];
  ingredients?: string[];
  cookingState?: "planning" | "active" | "finished";
  userPreferences?: Record<string, unknown>;
}

// Fetch recipe tool result types
export interface FetchRecipeResult {
  url: string;
  method:
    | "json-ld"
    | "html-extraction"
    | "microdata"
    | "semantic"
    | "generic"
    | "text-extraction"
    | "raw-fallback"
    | "error";
  recipe?: RecipeParsingResult;
  title?: string;
  content?: string;
  error?: string;
  confidence: number;
}
