"use client";

import {
  Calendar,
  Database,
  FileText,
  HardDrive,
  Image,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateStorageStats } from "@/lib/server-actions/storage-actions";

// Define the interface locally since it's not exported from the server actions
interface StorageStatsResult {
  totalRecipes: number;
  totalImages: number;
  databaseSizeMB: number;
  imagesSizeMB: number;
  totalSizeMB: number;
  avgRecipeSize: number;
  lastCalculated: Date;
}

export function StorageStatsDisplay() {
  const [storageStats, setStorageStats] = useState<StorageStatsResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStorageStats = useCallback(async (forceRefresh = false) => {
    const loadingState = forceRefresh ? setIsRefreshing : setIsLoading;
    loadingState(true);
    setError(null);

    try {
      const result = await calculateStorageStats();
      if (result.success) {
        setStorageStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("Failed to load storage stats:", err);
      setError("Failed to load storage statistics");
    } finally {
      loadingState(false);
      if (!forceRefresh) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStorageStats();
  }, [loadStorageStats]);

  const handleRefresh = () => {
    loadStorageStats(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Information
          </CardTitle>
          <CardDescription>
            Monitor your recipe data and image storage usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((index) => (
              <div
                key={`storage-stat-skeleton-${index}`}
                className="text-center p-4 bg-muted/20 rounded-lg border"
              >
                <Skeleton className="h-4 w-4 mx-auto mb-2" />
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Skeleton className="h-4 w-32" />
            {[0, 1, 2].map((index) => (
              <div
                key={`breakdown-skeleton-${index}`}
                className="flex justify-between items-center"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Information
          </CardTitle>
          <CardDescription>
            Monitor your recipe data and image storage usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!storageStats) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Information
            </CardTitle>
            <CardDescription>
              Monitor your recipe data and image storage usage
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Storage Used</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {(storageStats.totalSizeMB || 0).toFixed(1)} MB
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/20 rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-chart-1" />
            </div>
            <div className="text-2xl font-bold text-chart-1">
              {storageStats.totalRecipes}
            </div>
            <div className="text-sm text-muted-foreground">Total Recipes</div>
            <div className="text-xs text-muted-foreground mt-1">
              ~{(storageStats.avgRecipeSize || 0).toFixed(2)} MB avg
            </div>
          </div>

          <div className="text-center p-4 bg-muted/20 rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Image className="h-4 w-4 text-chart-2" />
            </div>
            <div className="text-2xl font-bold text-chart-2">
              {storageStats.totalImages}
            </div>
            <div className="text-sm text-muted-foreground">Recipe Images</div>
            <div className="text-xs text-muted-foreground mt-1">
              {(storageStats.imagesSizeMB || 0).toFixed(1)} MB total
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Storage Breakdown
          </h4>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Recipe images</span>
              <span className="font-medium">
                {(storageStats.imagesSizeMB || 0).toFixed(1)} MB
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Database</span>
              <span className="font-medium">
                {(storageStats.databaseSizeMB || 0).toFixed(1)} MB
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-t pt-2">
              <span className="font-medium">Total used</span>
              <span className="font-bold">
                {(storageStats.totalSizeMB || 0).toFixed(1)} MB
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
          <Calendar className="h-4 w-4" />
          <span>
            Last calculated:{" "}
            {formatDate(storageStats.lastCalculated.toISOString())}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
