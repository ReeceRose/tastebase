"use client";

import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { calculateStorageStats } from "@/lib/server-actions/storage-actions";
import { ButtonVariant } from "@/lib/types";
import type { StorageStats } from "@/lib/types/storage-types";
import { formatRelativeDay } from "@/lib/utils/time-formatting";

interface StoragePanelProps {
  initialStats: StorageStats;
}

function formatSize(megabytes: number): string {
  if (megabytes >= 1024) return `${(megabytes / 1024).toFixed(1)} GB`;
  if (megabytes >= 1) return `${megabytes.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(megabytes * 1024))} KB`;
}

export function StoragePanel({ initialStats }: StoragePanelProps) {
  const [stats, setStats] = useState(initialStats);
  const [isRefreshing, startRefresh] = useTransition();
  const total = Math.max(stats.totalSizeMB, 0.0001);
  const databaseShare = Math.round((stats.databaseSizeMB / total) * 100);

  const refresh = () => {
    startRefresh(async () => {
      const result = await calculateStorageStats();
      if (!result.success) {
        toast.error(result.error || "Couldn't recalculate storage");
        return;
      }
      setStats(result.data);
      toast.success("Storage recalculated");
    });
  };

  const rows = [
    { label: "Recipes", value: String(stats.totalRecipes) },
    { label: "Photos", value: String(stats.totalImages) },
    { label: "Recipes and notes", value: formatSize(stats.databaseSizeMB) },
    { label: "Photos on disk", value: formatSize(stats.imagesSizeMB) },
  ];

  return (
    <div className="space-y-5 rounded-tile bg-card p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-meta text-muted-foreground">Total used</p>
          <p className="text-display leading-none tabular">
            {formatSize(stats.totalSizeMB)}
          </p>
        </div>
        <Button
          variant={ButtonVariant.OUTLINE}
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={isRefreshing ? "animate-spin" : undefined} />
          {isRefreshing ? "Recalculating…" : "Recalculate"}
        </Button>
      </div>

      <div>
        <div
          className="flex h-3 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`${databaseShare}% recipes and notes, ${100 - databaseShare}% photos`}
        >
          <span
            className="bg-swatch-leek"
            style={{ width: `${databaseShare}%` }}
          />
          <span
            className="bg-swatch-turmeric"
            style={{ width: `${100 - databaseShare}%` }}
          />
        </div>
        <div className="mt-2 flex gap-4 text-caption text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full bg-swatch-leek"
            />
            Recipes and notes
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full bg-swatch-turmeric"
            />
            Photos
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-control bg-background px-4 py-3"
          >
            <dt className="text-caption text-muted-foreground">{row.label}</dt>
            <dd className="text-xl font-extrabold tabular">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-caption font-normal text-muted-foreground">
        Everything is stored on this server. Last checked{" "}
        {formatRelativeDay(new Date(stats.lastCalculated)).toLowerCase()}.
      </p>
    </div>
  );
}
