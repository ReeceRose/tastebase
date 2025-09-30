"use client";

import { Calendar, Clock, Edit, Eye, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RecipeStatusIndicatorsProps {
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
  isFavorited?: boolean;
  averageRating?: number;
  viewCount?: number;
  isRecent?: boolean;
  isNew?: boolean;
  className?: string;
}

export function RecipeStatusIndicators({
  createdAt,
  updatedAt,
  lastViewedAt,
  isFavorited,
  averageRating,
  viewCount,
  isRecent,
  isNew,
  className,
}: RecipeStatusIndicatorsProps) {
  const now = new Date();
  const created = new Date(createdAt);
  const updated = new Date(updatedAt);
  const lastViewed = lastViewedAt ? new Date(lastViewedAt) : null;

  // Calculate if recipe is new (created within last 7 days)
  const daysSinceCreated = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isNewRecipe = isNew ?? daysSinceCreated <= 7;

  // Calculate if recipe was recently edited (updated within last 3 days, but not just created)
  const daysSinceUpdated = Math.floor(
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isRecentlyEdited =
    isRecent ?? (daysSinceUpdated <= 3 && updatedAt !== createdAt);

  // Calculate if recently viewed (within last 24 hours)
  const isRecentlyViewed =
    lastViewed && now.getTime() - lastViewed.getTime() <= 24 * 60 * 60 * 1000;

  const formatRelativeTime = (date: Date) => {
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hr ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const indicators = [];

  // New recipe indicator
  if (isNewRecipe) {
    indicators.push(
      <TooltipProvider key="new">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="default"
              className="bg-green-500 hover:bg-green-600"
            >
              <Star className="h-3 w-3 mr-1" />
              New
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Created {formatRelativeTime(created)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
  }

  // Recently edited indicator
  if (isRecentlyEdited && !isNewRecipe) {
    indicators.push(
      <TooltipProvider key="edited">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
            >
              <Edit className="h-3 w-3 mr-1" />
              Updated
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last updated {formatRelativeTime(updated)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
  }

  // Recently viewed indicator
  if (isRecentlyViewed && lastViewed) {
    indicators.push(
      <TooltipProvider key="viewed">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300"
            >
              <Eye className="h-3 w-3 mr-1" />
              Viewed
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last viewed {formatRelativeTime(lastViewed)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
  }

  // Favorite indicator
  if (isFavorited) {
    indicators.push(
      <TooltipProvider key="favorite">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
            >
              <Heart className="h-3 w-3 mr-1 fill-current" />
              Favorite
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Added to favorites</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
  }

  // Rating indicator
  if (averageRating && averageRating > 0) {
    const stars =
      "★".repeat(Math.floor(averageRating)) +
      (averageRating % 1 >= 0.5 ? "☆" : "") +
      "☆".repeat(5 - Math.ceil(averageRating));

    indicators.push(
      <TooltipProvider key="rating">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300"
            >
              <Star className="h-3 w-3 mr-1 fill-current" />
              {averageRating.toFixed(1)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {stars} ({averageRating.toFixed(1)}/5)
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
  }

  // View count indicator (only show if significant)
  if (viewCount && viewCount > 5) {
    indicators.push(
      <TooltipProvider key="views">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-muted-foreground">
              <Eye className="h-3 w-3 mr-1" />
              {viewCount > 999 ? `${Math.floor(viewCount / 1000)}k` : viewCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {viewCount} view{viewCount === 1 ? "" : "s"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
  }

  if (indicators.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className || ""}`}>
      {indicators}
    </div>
  );
}

// Separate component for just the timestamp info
export function RecipeTimestamps({
  createdAt,
  updatedAt,
  className,
}: {
  createdAt: string;
  updatedAt: string;
  className?: string;
}) {
  const created = new Date(createdAt);
  const updated = new Date(updatedAt);
  const wasUpdated = updatedAt !== createdAt;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={`text-xs text-muted-foreground ${className || ""}`}>
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        <span>Added {formatDate(created)}</span>
      </div>
      {wasUpdated && (
        <div className="flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3" />
          <span>Updated {formatDate(updated)}</span>
        </div>
      )}
    </div>
  );
}
