// Types and interfaces for recipe sharing functionality
// This is preparation for future phases where sharing will be implemented

import {
  type ExportFormat,
  type PermissionLevel,
  type RecipeDifficulty,
  type ShareSettingsInput,
  SharingType,
} from "@/lib/types";
import type { RecipeWithDetails } from "@/lib/types/recipe-types";

export interface RecipeShareSettings {
  id: string;
  recipeId: string;
  userId: string;
  shareType: SharingType;
  shareLink?: string;
  allowComments: boolean;
  allowRatings: boolean;
  allowCopying: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeSharePermissions {
  canView: boolean;
  canComment: boolean;
  canRate: boolean;
  canCopy: boolean;
  canEdit: boolean;
  canShare: boolean;
}

export interface RecipeShareLink {
  shareId: string;
  shareLink: string;
  recipeId: string;
  recipeTitle: string;
  shareType: RecipeShareSettings["shareType"];
  permissions: RecipeSharePermissions;
  expiresAt?: Date;
  isActive: boolean;
}

export interface SharedRecipeMetadata {
  sharedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  sharedAt: Date;
  shareType: RecipeShareSettings["shareType"];
  permissions: RecipeSharePermissions;
  viewCount: number;
  commentCount: number;
  ratingCount: number;
  avgRating?: number;
}

export interface RecipeExportFormat {
  format: ExportFormat;
  includeImages: boolean;
  includeNotes: boolean;
  includeRatings: boolean;
  includeMetadata: boolean;
}

export enum ImportSourceType {
  URL = "url",
  TEXT = "text",
  FILE = "file",
  SHARED_LINK = "shared-link",
}

export interface RecipeImportSource {
  source: ImportSourceType;
  originalUrl?: string;
  sharedFrom?: {
    userId: string;
    userName: string;
    shareId: string;
  };
  importedAt: Date;
}

// Future sharing feature flags
export interface SharingFeatureFlags {
  publicSharing: boolean;
  linkSharing: boolean;
  communityFeatures: boolean;
  recipeCollections: boolean;
  collaborativeEditing: boolean;
  recipeMarketplace: boolean;
}

// Default sharing settings
export const DEFAULT_SHARE_SETTINGS: ShareSettingsInput = {
  shareType: SharingType.PRIVATE,
  allowComments: true,
  allowRatings: true,
  allowCopying: false,
};

// Default permissions for different share types
export const SHARE_TYPE_PERMISSIONS: Record<
  SharingType,
  RecipeSharePermissions
> = {
  [SharingType.PUBLIC]: {
    canView: true,
    canComment: true,
    canRate: true,
    canCopy: false,
    canEdit: false,
    canShare: true,
  },
  [SharingType.LINK]: {
    canView: true,
    canComment: false,
    canRate: false,
    canCopy: false,
    canEdit: false,
    canShare: false,
  },
  [SharingType.PRIVATE]: {
    canView: false,
    canComment: false,
    canRate: false,
    canCopy: false,
    canEdit: false,
    canShare: false,
  },
};

// Validation schemas for sharing (to be implemented with Zod later)
export interface CreateShareLinkInput {
  recipeId: string;
  shareType: RecipeShareSettings["shareType"];
  allowComments?: boolean;
  allowRatings?: boolean;
  allowCopying?: boolean;
  expiresIn?: number; // minutes
}

export interface UpdateShareSettingsInput {
  shareId: string;
  shareType?: RecipeShareSettings["shareType"];
  allowComments?: boolean;
  allowRatings?: boolean;
  allowCopying?: boolean;
  expiresAt?: Date;
}

// Analytics for shared recipes
export interface RecipeShareAnalytics {
  shareId: string;
  recipeId: string;
  totalViews: number;
  uniqueViews: number;
  totalCopies: number;
  totalComments: number;
  totalRatings: number;
  avgRating: number;
  viewsByDate: Record<string, number>; // YYYY-MM-DD -> count
  topReferrers: Array<{
    source: string;
    count: number;
  }>;
  geographicData: Array<{
    country: string;
    count: number;
  }>;
  lastViewed: Date;
  createdAt: Date;
}

// Community features (future)
export interface RecipeCommunityFeatures {
  recipeId: string;
  isPublic: boolean;
  isFeatured: boolean;
  communityRating: number;
  communityRatingCount: number;
  tags: string[];
  categories: string[];
  difficulty: RecipeDifficulty;
  cuisine: string;
  dietaryRestrictions: string[];
  mealType: string[];
  seasonality: string[];
  trending: {
    istrending: boolean;
    trendScore: number;
    calculatedAt: Date;
  };
}

// Recipe collection sharing (future)
export interface SharedRecipeCollection {
  id: string;
  name: string;
  description?: string;
  recipeIds: string[];
  ownerId: string;
  ownerName: string;
  shareSettings: RecipeShareSettings;
  collaborators: Array<{
    userId: string;
    userName: string;
    permissions: PermissionLevel;
    addedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Export utilities interface (for future implementation)
export interface RecipeExportUtil {
  toJSON(recipe: RecipeWithDetails, options?: RecipeExportFormat): string;
  toMarkdown(recipe: RecipeWithDetails, options?: RecipeExportFormat): string;
  toPlainText(recipe: RecipeWithDetails, options?: RecipeExportFormat): string;
  toPDF(
    recipe: RecipeWithDetails,
    options?: RecipeExportFormat,
  ): Promise<Buffer>;
  toRecipeCard(
    recipe: RecipeWithDetails,
    options?: RecipeExportFormat,
  ): Promise<Buffer>;
}

// Import utilities interface (for future implementation)
export interface RecipeImportUtil {
  fromJSON(data: string): RecipeWithDetails;
  fromMarkdown(data: string): RecipeWithDetails;
  fromPlainText(data: string): RecipeWithDetails;
  fromURL(url: string): Promise<RecipeWithDetails>;
  fromSharedLink(shareLink: string): Promise<RecipeWithDetails>;
}

// Social features (future)
export interface RecipeSocialFeatures {
  recipeId: string;
  likes: number;
  shares: number;
  bookmarks: number;
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    content: string;
    rating?: number;
    createdAt: Date;
    replies: Array<{
      id: string;
      userId: string;
      userName: string;
      content: string;
      createdAt: Date;
    }>;
  }>;
  mentions: Array<{
    userId: string;
    userName: string;
    mentionedAt: Date;
  }>;
}

// Notification types for sharing features
export enum RecipeShareNotificationType {
  RECIPE_SHARED = "recipe_shared",
  RECIPE_COMMENTED = "recipe_commented",
  RECIPE_RATED = "recipe_rated",
  RECIPE_COPIED = "recipe_copied",
  RECIPE_MENTIONED = "recipe_mentioned",
  COLLABORATION_INVITED = "collaboration_invited",
  COLLECTION_SHARED = "collection_shared",
}

export interface RecipeShareNotification {
  id: string;
  type: RecipeShareNotificationType;
  userId: string; // recipient
  fromUserId: string; // sender
  fromUserName: string;
  recipeId: string;
  recipeTitle: string;
  shareId?: string;
  collectionId?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// Configuration for future sharing features
export interface SharingConfiguration {
  enabled: boolean;
  publicSharingEnabled: boolean;
  linkSharingEnabled: boolean;
  maxShareLinksPerUser: number;
  defaultLinkExpiration: number; // days
  allowAnonymousViewing: boolean;
  requireAuthForComments: boolean;
  requireAuthForRatings: boolean;
  moderationEnabled: boolean;
  rateLimits: {
    sharesPerDay: number;
    commentsPerHour: number;
    ratingsPerHour: number;
  };
}
