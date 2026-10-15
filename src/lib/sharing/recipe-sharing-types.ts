// Types and interfaces for recipe sharing functionality
// This is preparation for future phases where sharing will be implemented

import type { SharingType } from "@/lib/types";

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
