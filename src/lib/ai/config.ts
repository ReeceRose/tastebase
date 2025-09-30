import { createOperationLogger } from "@/lib/logging/logger";
import { getUserAIConfig } from "@/lib/server-actions/ai-config-actions";
import {
  AIProvider,
  type AIProviderConfig,
  type AIProviderValue,
  type AITask,
  DEFAULT_TASK_TOKEN_LIMITS,
  type TaskSpecificTokenLimits,
} from "@/lib/types";

const logger = createOperationLogger("ai-config");

const configCache = new Map<
  string,
  {
    config: AIProviderConfig | null;
    timestamp: number;
  }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getActiveConfig(
  userId: string,
  taskType?: AITask,
): Promise<AIProviderConfig | null> {
  // Check cache first
  const cached = configCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config;
  }

  try {
    const result = await getUserAIConfig(userId);

    if (!result.success || !result.data) {
      logger.warn({ userId }, "No AI configuration found for user");
      configCache.set(userId, {
        config: null,
        timestamp: Date.now(),
      });
      return null;
    }

    const activeConfig = result.data.activeConfiguration;

    if (!activeConfig) {
      logger.warn({ userId }, "No active AI configuration found for user");
      configCache.set(userId, {
        config: null,
        timestamp: Date.now(),
      });
      return null;
    }

    // Parse task-specific token limits
    let taskSpecificLimits: TaskSpecificTokenLimits = {};
    if (activeConfig.taskSpecificTokenLimits) {
      try {
        taskSpecificLimits = JSON.parse(activeConfig.taskSpecificTokenLimits);
      } catch (error) {
        logger.warn(
          { userId, error },
          "Failed to parse task-specific token limits",
        );
      }
    }

    // Determine max tokens based on task type
    let maxTokens = activeConfig.maxTokens || 4000;
    if (taskType && taskSpecificLimits[taskType] !== undefined) {
      maxTokens = taskSpecificLimits[taskType];
    } else if (taskType && DEFAULT_TASK_TOKEN_LIMITS[taskType] !== undefined) {
      maxTokens = DEFAULT_TASK_TOKEN_LIMITS[taskType];
    }

    const config: AIProviderConfig = {
      provider: activeConfig.provider as AIProviderValue,
      apiKey: activeConfig.apiKey || undefined,
      modelName: activeConfig.modelName || undefined,
      maxTokens,
      taskSpecificTokenLimits:
        activeConfig.taskSpecificTokenLimits || undefined,
      temperature: activeConfig.temperature || 0.7,
      enabledTasks: activeConfig.enabledTasks || "recipe-parsing",
      ollamaHost: activeConfig.ollamaHost || "http://localhost:11434",
      isActive: activeConfig.isActive,
    };

    // Cache the result
    configCache.set(userId, {
      config,
      timestamp: Date.now(),
    });

    logger.info(
      {
        userId,
        provider: config.provider,
        hasApiKey: !!config.apiKey,
      },
      "Retrieved active AI configuration",
    );

    return config;
  } catch (error) {
    logger.error({ userId, error }, "Failed to get active AI configuration");
    return null;
  }
}

export function invalidateCache(userId: string): void {
  configCache.delete(userId);
  logger.info({ userId }, "Invalidated AI config cache");
}

export function clearCache(): void {
  configCache.clear();
  logger.info("Cleared all AI config cache");
}

export async function isAIEnabled(userId: string): Promise<boolean> {
  const config = await getActiveConfig(userId);
  return config !== null && config.provider !== AIProvider.NONE;
}

export async function supportsTask(
  userId: string,
  taskType: string,
): Promise<boolean> {
  const config = await getActiveConfig(userId);

  if (!config || config.provider === AIProvider.NONE) {
    return false;
  }

  // Check if the task is enabled for this user
  return (
    config.enabledTasks?.split(",").includes(taskType as AIProvider) ?? false
  );
}

export function getDefaultConfig(): AIProviderConfig {
  return {
    provider: AIProvider.NONE,
    maxTokens: 4000,
    temperature: 0.7,
    enabledTasks: "recipe-parsing",
    ollamaHost: "http://localhost:11434",
    isActive: false,
  };
}

export function getTaskSpecificTokenLimit(
  config: AIProviderConfig | null,
  taskType: AITask,
): number {
  if (!config) {
    return DEFAULT_TASK_TOKEN_LIMITS[taskType] || 4000;
  }

  // Parse task-specific token limits
  let taskSpecificLimits: TaskSpecificTokenLimits = {};
  if (config.taskSpecificTokenLimits) {
    try {
      taskSpecificLimits = JSON.parse(config.taskSpecificTokenLimits);
    } catch {
      // Fall back to defaults on parse error
    }
  }

  // Return in order of preference: user-specific > task default > global default
  return (
    taskSpecificLimits[taskType] ||
    DEFAULT_TASK_TOKEN_LIMITS[taskType] ||
    config.maxTokens ||
    4000
  );
}

export function validateConfig(config: Partial<AIProviderConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.provider) {
    errors.push("Provider is required");
  }

  if (
    config.provider &&
    config.provider !== AIProvider.NONE &&
    config.provider !== AIProvider.OLLAMA &&
    !config.apiKey
  ) {
    errors.push(`API key is required for ${config.provider}`);
  }

  if (
    config.maxTokens &&
    (config.maxTokens < 100 || config.maxTokens > 200000)
  ) {
    errors.push("Max tokens must be between 100 and 200,000");
  }

  if (
    config.temperature &&
    (config.temperature < 0 || config.temperature > 2)
  ) {
    errors.push("Temperature must be between 0 and 2");
  }

  if (config.ollamaHost && config.provider === AIProvider.OLLAMA) {
    try {
      new URL(config.ollamaHost);
    } catch {
      errors.push("Invalid Ollama host URL");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getProviderRequirements(provider: AIProviderValue): {
  requiresApiKey: boolean;
  requiresOllamaHost: boolean;
  defaultModel: string;
  supportedTasks: string[];
} {
  const defaultTasks = [
    "recipe-parsing",
    "chat-conversation",
    "recipe-discovery",
    "cooking-assistance",
  ];

  switch (provider) {
    case AIProvider.OPENAI:
      return {
        requiresApiKey: true,
        requiresOllamaHost: false,
        defaultModel: "gpt-4o-mini",
        supportedTasks: defaultTasks,
      };
    case AIProvider.ANTHROPIC:
      return {
        requiresApiKey: true,
        requiresOllamaHost: false,
        defaultModel: "claude-3-5-sonnet-20241022",
        supportedTasks: defaultTasks,
      };
    case AIProvider.GOOGLE:
      return {
        requiresApiKey: true,
        requiresOllamaHost: false,
        defaultModel: "gemini-1.5-flash",
        supportedTasks: defaultTasks,
      };
    case AIProvider.OLLAMA:
      return {
        requiresApiKey: false,
        requiresOllamaHost: true,
        defaultModel: "llama3.2",
        supportedTasks: defaultTasks,
      };
    case AIProvider.NONE:
      return {
        requiresApiKey: false,
        requiresOllamaHost: false,
        defaultModel: "",
        supportedTasks: [],
      };
    default:
      return {
        requiresApiKey: false,
        requiresOllamaHost: false,
        defaultModel: "",
        supportedTasks: [],
      };
  }
}
