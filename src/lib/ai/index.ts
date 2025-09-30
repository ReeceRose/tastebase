// Core AI services

// Re-export types for convenience
export type {
  AIProvider,
  AIProviderConfig,
  AIResponse,
  AITask,
  AITaskRequest,
  ConversationContext,
  RecipeParsingResult,
} from "@/lib/types";
export {
  clearCache,
  getActiveConfig,
  getDefaultConfig,
  getProviderRequirements,
  invalidateCache,
  isAIEnabled,
  supportsTask as configSupportsTask,
  validateConfig,
} from "./config";
export {
  getDefaultModelForProvider,
  getImageGenerationModel,
  getModelDisplayName,
  getProvider,
  getProviderDisplayName,
  requiresApiKey,
  supportsImageGeneration,
  supportsTask,
  validateProvider,
} from "./providers";
export { parseRecipeText } from "./recipe-parsing";
export { processTask } from "./service";
