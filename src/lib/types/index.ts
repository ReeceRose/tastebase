export * from "@/lib/types/ai-types";
export * from "@/lib/types/import-types";
export * from "@/lib/types/recipe-types";
export * from "@/lib/types/storage-types";

import type { User } from "@/db/schema.base";
import type { Recipe } from "@/db/schema.recipes";
import type { RecipeShareSettings } from "@/lib/sharing/recipe-sharing-types";

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
  ACCENT = "accent",
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

// Rating variant enum
export enum RatingVariant {
  DEFAULT = "default",
  COMPACT = "compact",
  INLINE = "inline",
  DETAILED = "detailed",
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

// Recipe and member colour swatches
export enum RecipeSwatch {
  TOMATO = "tomato",
  LEEK = "leek",
  AUBERGINE = "aubergine",
  BEET = "beet",
  TURMERIC = "turmeric",
  RADISH = "radish",
  SKY = "sky",
  HERB = "herb",
}

export interface SwatchClasses {
  bg: string;
  fg: string;
  deep: string;
}

// Chip variants
export enum ChipVariant {
  FILTER = "filter",
  FACT = "fact",
  TAG = "tag",
}

// Member avatar sizes
export enum AvatarSize {
  SM = "sm",
  MD = "md",
  LG = "lg",
}

// Recipe library scopes
export enum LibraryScope {
  ALL = "all",
  FAVOURITES = "favourites",
  RECENT = "recent",
}

// Settings sections
export enum SettingsSection {
  PROFILE = "profile",
  HOUSEHOLD = "household",
  UNITS = "units",
  IMPORT = "import",
  TEMPLATES = "templates",
  STORAGE = "storage",
  SECURITY = "security",
}

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
}

// House activity kinds
export enum ActivityKind {
  ADDED = "added",
  NOTE = "note",
  COOKED = "cooked",
  EDITED = "edited",
}

// Navigation count keys
export enum NavCountKey {
  RECIPES = "recipes",
  FAVOURITES = "favourites",
}

// Recipe library sorting and visibility
export enum LibrarySort {
  NEWEST = "newest",
  RATING = "rating",
  QUICKEST = "quickest",
  TITLE = "title",
  UPDATED = "updated",
}

export enum LibraryVisibility {
  ALL = "all",
  MINE = "mine",
  PRIVATE = "private",
}

// Recipe editor
export enum EditorSection {
  BASICS = "basics",
  INGREDIENTS = "ingredients",
  METHOD = "method",
  PHOTOS = "photos",
  DETAILS = "details",
  SHARING = "sharing",
}

export enum RecipeEditorMode {
  CREATE = "create",
  EDIT = "edit",
}

export enum AddRecipeStep {
  START = "start",
  IMPORTING = "importing",
  REVIEW = "review",
}

// Recipe change history
export enum RecipeChangeType {
  TITLE = "title",
  INGREDIENTS = "ingredients",
  INSTRUCTIONS = "instructions",
  METADATA = "metadata",
  IMAGES = "images",
  MAJOR = "major",
}

// Common type aliases for Pick/Omit patterns
export type UserPreferencesSubset = Pick<
  User,
  "preferredTemperatureUnit" | "preferredWeightUnit" | "preferredVolumeUnit"
>;
export type RecipeDisplayInfo = Pick<
  Recipe,
  "title" | "description" | "cuisine"
>;
// Common Omit patterns
export type ShareSettingsInput = Omit<
  RecipeShareSettings,
  "id" | "recipeId" | "userId" | "createdAt" | "updatedAt"
>;
