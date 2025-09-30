"use client";

import {
  Archive,
  Calendar,
  Clock,
  Eye,
  Filter,
  Heart,
  Star,
} from "lucide-react";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange, TimeFilter } from "@/lib/types";

export interface RecipeStatusFilters {
  favorites: boolean;
  recentlyViewed: boolean;
  recentlyCreated: boolean;
  recentlyUpdated: boolean;
  archived: boolean;
  rated: boolean;
  unrated: boolean;
  hasImages: boolean;
  noImages: boolean;
  dateRange: DateRange;
  viewedInLast: TimeFilter;
}

interface RecipeStatusFiltersProps {
  filters: RecipeStatusFilters;
  onFiltersChange: (filters: RecipeStatusFilters) => void;
  resultCount?: number;
  isLoading?: boolean;
  className?: string;
}

export function RecipeStatusFiltersComponent({
  filters,
  onFiltersChange,
  resultCount,
  isLoading = false,
  className,
}: RecipeStatusFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const favoritesId = useId();
  const archivedId = useId();
  const recentlyViewedId = useId();
  const recentlyCreatedId = useId();
  const recentlyUpdatedId = useId();
  const ratedId = useId();
  const unratedId = useId();
  const hasImagesId = useId();
  const noImagesId = useId();

  const updateFilter = (
    key: keyof RecipeStatusFilters,
    value: boolean | string,
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      favorites: false,
      recentlyViewed: false,
      recentlyCreated: false,
      recentlyUpdated: false,
      archived: false,
      rated: false,
      unrated: false,
      hasImages: false,
      noImages: false,
      dateRange: DateRange.ALL,
      viewedInLast: TimeFilter.ALL,
    });
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "dateRange") return value !== "all";
      if (key === "viewedInLast") return value !== "all";
      return value === true;
    }).length;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Status Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {resultCount !== undefined && !isLoading && (
                  <span>{resultCount} recipes</span>
                )}
                {isLoading && <span>Loading...</span>}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-6">
              {/* Quick Status Filters */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                  Quick Status
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={favoritesId}
                      checked={filters.favorites}
                      onCheckedChange={(checked) =>
                        updateFilter("favorites", !!checked)
                      }
                    />
                    <Label
                      htmlFor={favoritesId}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Heart className="h-4 w-4 text-red-500" />
                      Favorites
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={archivedId}
                      checked={filters.archived}
                      onCheckedChange={(checked) =>
                        updateFilter("archived", !!checked)
                      }
                    />
                    <Label
                      htmlFor={archivedId}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Archive className="h-4 w-4 text-muted-foreground" />
                      Archived
                    </Label>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                  Recent Activity
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={recentlyViewedId}
                      checked={filters.recentlyViewed}
                      onCheckedChange={(checked) =>
                        updateFilter("recentlyViewed", !!checked)
                      }
                    />
                    <Label
                      htmlFor={recentlyViewedId}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="h-4 w-4 text-blue-500" />
                      Recently Viewed
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={recentlyCreatedId}
                      checked={filters.recentlyCreated}
                      onCheckedChange={(checked) =>
                        updateFilter("recentlyCreated", !!checked)
                      }
                    />
                    <Label
                      htmlFor={recentlyCreatedId}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Calendar className="h-4 w-4 text-green-500" />
                      Recently Created
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={recentlyUpdatedId}
                      checked={filters.recentlyUpdated}
                      onCheckedChange={(checked) =>
                        updateFilter("recentlyUpdated", !!checked)
                      }
                    />
                    <Label
                      htmlFor={recentlyUpdatedId}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Clock className="h-4 w-4 text-orange-500" />
                      Recently Updated
                    </Label>
                  </div>
                </div>
              </div>

              {/* Rating Status */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                  Rating Status
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={ratedId}
                      checked={filters.rated}
                      onCheckedChange={(checked) =>
                        updateFilter("rated", !!checked)
                      }
                    />
                    <Label
                      htmlFor={ratedId}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Star className="h-4 w-4 text-yellow-500" />
                      Rated
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={unratedId}
                      checked={filters.unrated}
                      onCheckedChange={(checked) =>
                        updateFilter("unrated", !!checked)
                      }
                    />
                    <Label
                      htmlFor={unratedId}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Star className="h-4 w-4 text-muted-foreground" />
                      Unrated
                    </Label>
                  </div>
                </div>
              </div>

              {/* Image Status */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                  Image Status
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={hasImagesId}
                      checked={filters.hasImages}
                      onCheckedChange={(checked) =>
                        updateFilter("hasImages", !!checked)
                      }
                    />
                    <Label htmlFor={hasImagesId} className="cursor-pointer">
                      Has Images
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={noImagesId}
                      checked={filters.noImages}
                      onCheckedChange={(checked) =>
                        updateFilter("noImages", !!checked)
                      }
                    />
                    <Label htmlFor={noImagesId} className="cursor-pointer">
                      No Images
                    </Label>
                  </div>
                </div>
              </div>

              {/* Date Range Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="dateRange"
                    className="text-sm font-medium mb-2 block text-muted-foreground"
                  >
                    Created Within
                  </Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => updateFilter("dateRange", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="week">Last week</SelectItem>
                      <SelectItem value="month">Last month</SelectItem>
                      <SelectItem value="quarter">Last 3 months</SelectItem>
                      <SelectItem value="year">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="viewedInLast"
                    className="text-sm font-medium mb-2 block text-muted-foreground"
                  >
                    Viewed In Last
                  </Label>
                  <Select
                    value={filters.viewedInLast}
                    onValueChange={(value) =>
                      updateFilter("viewedInLast", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any time</SelectItem>
                      <SelectItem value="day">24 hours</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              {activeFilterCount > 0 && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Default filter state
export const defaultRecipeStatusFilters: RecipeStatusFilters = {
  favorites: false,
  recentlyViewed: false,
  recentlyCreated: false,
  recentlyUpdated: false,
  archived: false,
  rated: false,
  unrated: false,
  hasImages: false,
  noImages: false,
  dateRange: DateRange.ALL,
  viewedInLast: TimeFilter.ALL,
};

// Helper function to build filter query for server actions
interface FilterQuery {
  isFavorited?: boolean;
  isArchived?: boolean;
  hasRating?: boolean;
  createdAfter?: Date;
  viewedAfter?: Date;
  [key: string]: unknown;
}

export function buildRecipeStatusFilterQuery(filters: RecipeStatusFilters) {
  const query: FilterQuery = {};

  if (filters.favorites) query.isFavorited = true;
  if (filters.archived) query.isArchived = true;
  if (filters.rated) query.hasRating = true;
  if (filters.unrated) query.hasRating = false;
  if (filters.hasImages) query.hasImages = true;
  if (filters.noImages) query.hasImages = false;

  // Date range filters
  if (filters.dateRange !== "all") {
    const now = new Date();
    let dateThreshold: Date;

    switch (filters.dateRange) {
      case "week":
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        dateThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateThreshold = new Date(0);
    }
    query.createdAfter = dateThreshold;
  }

  // View filters
  if (filters.viewedInLast !== "all") {
    const now = new Date();
    let viewThreshold: Date;

    switch (filters.viewedInLast) {
      case "day":
        viewThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        viewThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        viewThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        viewThreshold = new Date(0);
    }
    query.viewedAfter = viewThreshold;
  }

  // Recent activity flags
  if (
    filters.recentlyCreated ||
    filters.recentlyUpdated ||
    filters.recentlyViewed
  ) {
    const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    if (filters.recentlyCreated) query.recentlyCreated = recentThreshold;
    if (filters.recentlyUpdated) query.recentlyUpdated = recentThreshold;
    if (filters.recentlyViewed) query.recentlyViewed = recentThreshold;
  }

  return query;
}
