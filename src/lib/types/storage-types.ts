export interface StorageStats {
  totalRecipes: number;
  totalImages: number;
  databaseSizeMB: number;
  imagesSizeMB: number;
  totalSizeMB: number;
  avgRecipeSize: number;
  lastCalculated: Date;
}
