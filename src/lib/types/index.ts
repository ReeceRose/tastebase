export type { ImageGenerationPromptData } from "../ai/prompts/image-generation-prompts";
export type { ImageGenerationResult } from "../ai/services/image-generation-service";
export * from "./ai-types";
// Re-export specific enums for convenience
export { ImageProcessingMethod } from "./ai-types";
export * from "./image-processing-types";
export * from "./recipe-types";

import type { RecipeModification } from "@/components/history/recipe-modification-history";
import type { User } from "@/db/schema.base";
import type { Recipe } from "@/db/schema.recipes";
import type { RecipeDraft } from "@/lib/server-actions/recipe-draft-actions";
import type { RecipeShareSettings } from "@/lib/sharing/recipe-sharing-types";
import type { UserPreferences } from "@/lib/utils/user-preferences";

// User preference enums
export enum TemperatureUnit {
  FAHRENHEIT = "fahrenheit",
  CELSIUS = "celsius",
}

export enum MeasurementUnit {
  IMPERIAL = "imperial",
  METRIC = "metric",
}

// Recipe difficulty enum
export enum RecipeDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

// Sharing/visibility enums
export enum SharingType {
  PRIVATE = "private",
  LINK = "link",
  PUBLIC = "public",
}

// UI component variant enums
export enum ButtonVariant {
  DEFAULT = "default",
  OUTLINE = "outline",
  SECONDARY = "secondary",
  DESTRUCTIVE = "destructive",
  GHOST = "ghost",
  LINK = "link",
}

// Chat message role enum
export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export enum BadgeVariant {
  DEFAULT = "default",
  SECONDARY = "secondary",
  OUTLINE = "outline",
  DESTRUCTIVE = "destructive",
}

// View mode enums
export enum ViewMode {
  CARDS = "cards",
  GRID = "grid",
  LIST = "list",
}

// Sort order enum
export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

// Date range enums
export enum DateRange {
  ALL = "all",
  WEEK = "week",
  MONTH = "month",
  QUARTER = "quarter",
  YEAR = "year",
}

export enum TimeFilter {
  ALL = "all",
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
}

// Message/feedback type enums
export enum MessageType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

// Size enums
export enum ComponentSize {
  SM = "sm",
  MD = "md",
  LG = "lg",
}

export enum SizeVariant {
  SM = "sm",
  DEFAULT = "default",
  LG = "lg",
}

// Rating variant enum
export enum RatingVariant {
  DEFAULT = "default",
  COMPACT = "compact",
  INLINE = "inline",
  DETAILED = "detailed",
}

// Action variant enum
export enum ActionVariant {
  DEFAULT = "default",
  INLINE = "inline",
  BUTTON = "button",
  DROPDOWN = "dropdown",
}

// Form field types
export enum FormFieldType {
  TEXT = "text",
  NUMBER = "number",
  EMAIL = "email",
  URL = "url",
  TEXTAREA = "textarea",
}

// File/export format enums
export enum ExportFormat {
  JSON = "json",
  MARKDOWN = "markdown",
  PLAINTEXT = "plaintext",
  PDF = "pdf",
  RECIPE_CARD = "recipe-card",
}

// Permission levels
export enum PermissionLevel {
  VIEW = "view",
  COMMENT = "comment",
  EDIT = "edit",
  ADMIN = "admin",
}

// Theme enum
export enum Theme {
  DARK = "dark",
  LIGHT = "light",
  SYSTEM = "system",
}

// Animation direction enum
export enum AnimationDirection {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
}

// Sheet side enum
export enum SheetSide {
  TOP = "top",
  RIGHT = "right",
  BOTTOM = "bottom",
  LEFT = "left",
}

// Image loading enum
export enum ImageLoading {
  LAZY = "lazy",
  EAGER = "eager",
}

export enum ImagePlaceholder {
  BLUR = "blur",
  EMPTY = "empty",
}

// Carousel orientation
export enum CarouselOrientation {
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical",
}

// Page section spacing
export enum SectionSpacing {
  COMPACT = "compact",
  DEFAULT = "default",
  SPACIOUS = "spacious",
}

// Page header stat types
export enum StatType {
  METRIC = "metric",
  STATUS = "status",
  PROGRESS = "progress",
}

// Stat status enum
export enum StatStatus {
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
  INFO = "info",
  MUTED = "muted",
}

// Navigation direction
export enum NavigationDirection {
  PREV = "prev",
  NEXT = "next",
}

// Common type aliases for Pick/Omit patterns
export type UserPreferencesSubset = Pick<
  User,
  "preferredTemperatureUnit" | "preferredWeightUnit" | "preferredVolumeUnit"
>;
export type UserMeasurementPreferences = Pick<
  User,
  "preferredWeightUnit" | "preferredVolumeUnit"
>;
export type UserTemperaturePreference = Pick<User, "preferredTemperatureUnit">;
export type RecipeDisplayInfo = Pick<
  Recipe,
  "title" | "description" | "cuisine"
>;
export type UserPreferencesDisplay = Pick<
  UserPreferences,
  "preferredWeightUnit" | "preferredVolumeUnit"
>;

// Common Omit patterns
export type RecipeModificationInput = Omit<
  RecipeModification,
  "id" | "createdAt"
>;
export type RecipeDraftInput = Omit<RecipeDraft, "id" | "lastSaved">;
export type ShareSettingsInput = Omit<
  RecipeShareSettings,
  "id" | "recipeId" | "userId" | "createdAt" | "updatedAt"
>;
