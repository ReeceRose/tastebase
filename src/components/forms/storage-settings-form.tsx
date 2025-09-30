"use client";

import { Database, HardDrive, Image, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculateStorageStats } from "@/lib/server-actions/storage-actions";

interface StorageStatsData {
  totalRecipes: number;
  totalImages: number;
  databaseSizeMB: number;
  imagesSizeMB: number;
  totalSizeMB: number;
  avgRecipeSize: number;
  lastCalculated: Date;
}

interface StorageSettingsFormProps {
  initialStats: StorageStatsData;
}

export function StorageSettingsForm({
  initialStats,
}: StorageSettingsFormProps) {
  const [stats, setStats] = useState<StorageStatsData>(initialStats);
  const [isPending, startTransition] = useTransition();

  const handleRecalculate = () => {
    startTransition(async () => {
      try {
        const result = await calculateStorageStats();

        if (result.success) {
          setStats(result.data);
          toast.success("Storage statistics recalculated successfully");
        } else {
          toast.error(result.error || "Failed to recalculate storage");
        }
      } catch (error) {
        console.error("Storage recalculation error:", error);
        toast.error("An unexpected error occurred");
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(1)} KB`;
    }
    if (sizeInMB < 1024) {
      return `${sizeInMB.toFixed(1)} MB`;
    }
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Overview
            </CardTitle>
            <CardDescription>
              Monitor your recipe data storage and disk usage
            </CardDescription>
          </div>
          <Button
            onClick={handleRecalculate}
            disabled={isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`}
            />
            {isPending ? "Calculating..." : "Recalculate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Storage Usage</span>
            <span className="text-sm font-medium">
              {formatSize(stats.totalSizeMB)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <p className="text-lg font-semibold">
                {formatSize(stats.databaseSizeMB)}
              </p>
              <p className="text-xs text-muted-foreground">
                Recipe data & metadata
              </p>
            </div>

            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Image className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Images</span>
              </div>
              <p className="text-lg font-semibold">
                {formatSize(stats.imagesSizeMB)}
              </p>
              <p className="text-xs text-muted-foreground">
                Recipe photos & uploads
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total Recipes:</span>
            </div>
            <p className="text-sm font-medium">
              {stats.totalRecipes.toLocaleString()} recipes
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total Images:</span>
            </div>
            <p className="text-sm font-medium">
              {stats.totalImages.toLocaleString()} images
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Database Size:</span>
            </div>
            <p className="text-sm font-medium">
              {formatSize(stats.databaseSizeMB)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Images Size:</span>
            </div>
            <p className="text-sm font-medium">
              {formatSize(stats.imagesSizeMB)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Avg Recipe Size:</span>
            </div>
            <p className="text-sm font-medium">
              {formatSize(stats.avgRecipeSize)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Calculated:</span>
            </div>
            <p className="text-sm font-medium">
              {formatDate(stats.lastCalculated)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
