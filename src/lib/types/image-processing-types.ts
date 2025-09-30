import type {
  AIProviderValue,
  ImageProcessingMethod,
  RecipeParsingResult,
  VisionCapableProviderValue,
} from "@/lib/types/ai-types";

export interface ImageProcessingResult extends RecipeParsingResult {
  processingMethod: ImageProcessingMethod;
  processingTime: number;
  confidence: number;
  fallbackUsed: boolean;
  costEstimate?: number;
  error?: string;
}

export interface ImageProcessingSettings {
  method: ImageProcessingMethod;
  preferredProvider?: VisionCapableProviderValue;
  maxFileSize?: number;
  enableFallback?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface AIGeneratedImageMetadata {
  source: "ai-generated";
  provider: AIProviderValue;
  model: string;
  prompt: string;
  generatedAt: string;
  size?: string;
  quality?: string;
}

export interface RecipeImageWithMetadata {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  metadata?: AIGeneratedImageMetadata | null;
}

export enum ImageSource {
  USER_UPLOAD = "user-upload",
  AI_GENERATED = "ai-generated",
}
