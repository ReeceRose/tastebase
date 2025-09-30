"use client";

import {
  Activity,
  BarChart3,
  PieChart,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface RatingDataPoint {
  id: string;
  recipeId: string;
  recipeTitle: string;
  overallRating: number;
  categories: {
    taste: number;
    difficulty: number;
    timeAccuracy: number;
  };
  createdAt: Date;
  tags: string[];
}

export interface RatingTrendsProps {
  ratings: RatingDataPoint[];
  className?: string;
}

export enum TimeRange {
  SEVEN_DAYS = "7d",
  THIRTY_DAYS = "30d",
  NINETY_DAYS = "90d",
  ONE_YEAR = "1y",
  ALL = "all",
}

export enum ViewType {
  TIMELINE = "timeline",
  DISTRIBUTION = "distribution",
  CATEGORIES = "categories",
  INSIGHTS = "insights",
}

// Extracted components for better performance
const StarBar = ({
  rating,
  count,
  maxCount,
}: {
  rating: number;
  count: number;
  maxCount: number;
}) => {
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 w-12">
        <Star className="h-3 w-3 text-yellow-400 fill-current" />
        <span className="text-sm font-mono">{rating}</span>
      </div>
      <div className="flex-1 bg-muted rounded-full h-2 relative">
        <div
          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground w-8 text-right">
        {count}
      </span>
    </div>
  );
};

const TimelineView = ({
  filteredRatings,
}: {
  filteredRatings: RatingDataPoint[];
}) => {
  const chartData = useMemo(() => {
    // Group ratings by week for display
    const weeks = new Map<string, { ratings: number[]; date: Date }>();

    filteredRatings.forEach((rating) => {
      const date = new Date(rating.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, { ratings: [], date: weekStart });
      }

      weeks.get(weekKey)?.ratings.push(rating.overallRating);
    });

    return Array.from(weeks.entries())
      .map(([_key, data]) => ({
        date: data.date,
        average:
          data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length,
        count: data.ratings.length,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-12); // Last 12 weeks max
  }, [filteredRatings]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Rating Timeline
      </h3>

      {chartData.length > 0 ? (
        <div className="space-y-2">
          {chartData.map((point, index) => (
            <div
              key={`chart-${point.date.toISOString()}-${index}`}
              className="flex items-center gap-2"
            >
              <div className="w-20 text-xs text-muted-foreground">
                {point.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="flex-1 bg-muted rounded-full h-2 relative">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(point.average / 5) * 100}%` }}
                />
              </div>
              <div className="w-12 text-xs text-right">
                {point.average.toFixed(1)}
              </div>
              <div className="w-8 text-xs text-muted-foreground text-right">
                ({point.count})
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No rating data available for this time period
        </p>
      )}
    </div>
  );
};

const DistributionView = ({
  stats,
}: {
  stats: { distribution: number[]; totalReviews: number };
}) => {
  const maxCount = Math.max(...stats.distribution);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        Rating Distribution
      </h3>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating, _index) => (
          <StarBar
            key={rating}
            rating={rating}
            count={stats.distribution[rating - 1]}
            maxCount={maxCount}
          />
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        Based on {stats.totalReviews} review
        {stats.totalReviews !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

const CategoriesView = ({
  stats,
}: {
  stats: { categoryAverages: Record<string, number> };
}) => (
  <div className="space-y-4">
    <h3 className="font-semibold flex items-center gap-2">
      <PieChart className="h-4 w-4" />
      Category Averages
    </h3>

    <div className="grid gap-3">
      {Object.entries(stats.categoryAverages).map(([category, average]) => {
        const displayName =
          category === "timeAccuracy"
            ? "Time Accuracy"
            : category.charAt(0).toUpperCase() + category.slice(1);

        return (
          <div key={category} className="flex items-center justify-between">
            <span className="text-sm font-medium">{displayName}</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3 w-3",
                      star <= average
                        ? "text-yellow-400 fill-current"
                        : "text-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-mono w-8">
                {average.toFixed(1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const InsightsView = ({
  stats,
}: {
  stats: {
    average: number;
    trend: number;
    topTags: { tag: string; count: number }[];
  };
}) => (
  <div className="space-y-4">
    <h3 className="font-semibold flex items-center gap-2">
      <TrendingUp className="h-4 w-4" />
      Insights
    </h3>

    <div className="space-y-3">
      {/* Average Rating */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <span className="font-medium">Average Rating</span>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="font-mono text-lg">{stats.average.toFixed(1)}</span>
        </div>
      </div>

      {/* Trend */}
      {stats.trend !== 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span className="font-medium">Recent Trend</span>
          <div className="flex items-center gap-2">
            {stats.trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={cn(
                "font-mono",
                stats.trend > 0 ? "text-green-600" : "text-red-600",
              )}
            >
              {stats.trend > 0 ? "+" : ""}
              {stats.trend.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Top Tags */}
      {stats.topTags.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Most Common Tags</h4>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(({ tag, count }) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag} ({count})
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export function RatingTrendsChart({ ratings, className }: RatingTrendsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.THIRTY_DAYS);
  const [viewType, setViewType] = useState<ViewType>(ViewType.TIMELINE);

  // Filter ratings by time range
  const filteredRatings = useMemo(() => {
    if (timeRange === TimeRange.ALL) return ratings;

    const now = new Date();
    const cutoff = new Date();

    switch (timeRange) {
      case TimeRange.SEVEN_DAYS:
        cutoff.setDate(now.getDate() - 7);
        break;
      case TimeRange.THIRTY_DAYS:
        cutoff.setDate(now.getDate() - 30);
        break;
      case TimeRange.NINETY_DAYS:
        cutoff.setDate(now.getDate() - 90);
        break;
      case TimeRange.ONE_YEAR:
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return ratings.filter((rating) => rating.createdAt >= cutoff);
  }, [ratings, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredRatings.length === 0) {
      return {
        average: 0,
        trend: 0,
        distribution: [0, 0, 0, 0, 0],
        categoryAverages: { taste: 0, difficulty: 0, timeAccuracy: 0 },
        totalReviews: 0,
        topTags: [],
      };
    }

    const average =
      filteredRatings.reduce((sum, r) => sum + r.overallRating, 0) /
      filteredRatings.length;

    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(filteredRatings.length / 2);
    const firstHalf = filteredRatings.slice(0, midPoint);
    const secondHalf = filteredRatings.slice(midPoint);

    const firstAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, r) => sum + r.overallRating, 0) /
          firstHalf.length
        : 0;
    const secondAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, r) => sum + r.overallRating, 0) /
          secondHalf.length
        : 0;

    const trend = secondAvg - firstAvg;

    // Rating distribution
    const distribution = [0, 0, 0, 0, 0];
    filteredRatings.forEach((rating) => {
      const index = Math.max(
        0,
        Math.min(4, Math.floor(rating.overallRating) - 1),
      );
      distribution[index]++;
    });

    // Category averages
    const categoryAverages = {
      taste:
        filteredRatings.reduce((sum, r) => sum + r.categories.taste, 0) /
        filteredRatings.length,
      difficulty:
        filteredRatings.reduce((sum, r) => sum + r.categories.difficulty, 0) /
        filteredRatings.length,
      timeAccuracy:
        filteredRatings.reduce((sum, r) => sum + r.categories.timeAccuracy, 0) /
        filteredRatings.length,
    };

    // Top tags
    const tagCounts = new Map<string, number>();
    filteredRatings.forEach((rating) => {
      rating.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    return {
      average,
      trend,
      distribution,
      categoryAverages,
      totalReviews: filteredRatings.length,
      topTags,
    };
  }, [filteredRatings]);

  if (ratings.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rating Trends
          </CardTitle>
          <CardDescription>
            Track your recipe rating patterns over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">No ratings yet</p>
            <p className="text-sm">
              Start rating recipes to see trends and insights
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rating Trends
            </CardTitle>
            <CardDescription>
              Track your recipe rating patterns over time
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Select
              value={timeRange}
              onValueChange={(value: TimeRange) => setTimeRange(value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TimeRange.SEVEN_DAYS}>7 days</SelectItem>
                <SelectItem value={TimeRange.THIRTY_DAYS}>30 days</SelectItem>
                <SelectItem value={TimeRange.NINETY_DAYS}>90 days</SelectItem>
                <SelectItem value={TimeRange.ONE_YEAR}>1 year</SelectItem>
                <SelectItem value={TimeRange.ALL}>All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* View Type Selector */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {[
            { key: ViewType.TIMELINE, label: "Timeline", icon: Activity },
            {
              key: ViewType.DISTRIBUTION,
              label: "Distribution",
              icon: BarChart3,
            },
            { key: ViewType.CATEGORIES, label: "Categories", icon: PieChart },
            { key: ViewType.INSIGHTS, label: "Insights", icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={viewType === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType(key as ViewType)}
              className="flex-1"
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Content */}
        {viewType === ViewType.TIMELINE && (
          <TimelineView filteredRatings={filteredRatings} />
        )}
        {viewType === ViewType.DISTRIBUTION && (
          <DistributionView stats={stats} />
        )}
        {viewType === ViewType.CATEGORIES && <CategoriesView stats={stats} />}
        {viewType === ViewType.INSIGHTS && <InsightsView stats={stats} />}
      </CardContent>
    </Card>
  );
}
