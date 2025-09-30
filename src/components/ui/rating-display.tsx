"use client";

import { Star } from "lucide-react";
import { ComponentSize, RatingVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating?: number | null;
  maxRating?: number;
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  size?: ComponentSize;
  variant?: RatingVariant;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function RatingDisplay({
  rating,
  maxRating = 5,
  showValue = false,
  showCount = false,
  count,
  size = ComponentSize.MD,
  variant = RatingVariant.DEFAULT,
  interactive = false,
  onRatingChange,
  className,
}: RatingDisplayProps) {
  const sizeClasses = {
    [ComponentSize.SM]: "h-3 w-3",
    [ComponentSize.MD]: "h-4 w-4",
    [ComponentSize.LG]: "h-5 w-5",
  };

  const gapClasses = {
    [ComponentSize.SM]: "gap-0.5",
    [ComponentSize.MD]: "gap-1",
    [ComponentSize.LG]: "gap-1.5",
  };

  const textSizeClasses = {
    [ComponentSize.SM]: "text-xs",
    [ComponentSize.MD]: "text-sm",
    [ComponentSize.LG]: "text-base",
  };

  const currentRating = rating || 0;
  const hasRating = rating !== null && rating !== undefined && rating > 0;

  const renderStars = () => {
    return Array.from({ length: maxRating }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= currentRating;

      return (
        <Star
          key={starValue}
          className={cn(
            sizeClasses[size],
            "transition-all duration-200",
            isFilled ? "text-primary fill-primary" : "text-muted-foreground/30",
            interactive && "cursor-pointer hover:text-primary/80",
          )}
          onClick={() => interactive && onRatingChange?.(starValue)}
        />
      );
    });
  };

  const renderRatingText = () => {
    if (!hasRating) {
      return (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          Unrated
        </span>
      );
    }

    const ratingText = `${currentRating.toFixed(1)}`;
    const countText = count !== undefined ? ` (${count})` : "";

    if (variant === RatingVariant.COMPACT) {
      return (
        <span
          className={cn("font-medium text-foreground", textSizeClasses[size])}
        >
          {ratingText}/5{countText}
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <span
          className={cn("font-semibold text-primary", textSizeClasses[size])}
        >
          {ratingText}
        </span>
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          /5
        </span>
        {showCount && count !== undefined && (
          <span className={cn("text-muted-foreground", textSizeClasses[size])}>
            ({count} rating{count !== 1 ? "s" : ""})
          </span>
        )}
      </div>
    );
  };

  if (variant === RatingVariant.COMPACT && !hasRating) {
    return (
      <span
        className={cn(
          "text-muted-foreground",
          textSizeClasses[size],
          className,
        )}
      >
        Unrated
      </span>
    );
  }

  if (variant === RatingVariant.DETAILED) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-1 bg-muted/50 px-3 py-2 rounded-full border">
          <div className={cn("flex items-center", gapClasses[size])}>
            {renderStars()}
          </div>
        </div>
        {(showValue || showCount) && renderRatingText()}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", gapClasses[size], className)}>
      {renderStars()}
      {(showValue || showCount || variant === RatingVariant.COMPACT) && (
        <div className="ml-2">{renderRatingText()}</div>
      )}
    </div>
  );
}

interface InteractiveRatingProps {
  rating?: number;
  maxRating?: number;
  size?: ComponentSize;
  onRatingChange: (rating: number | undefined) => void;
  onHover?: (rating: number | undefined) => void;
  clearable?: boolean;
  className?: string;
}

export function InteractiveRating({
  rating,
  maxRating = 5,
  size = ComponentSize.MD,
  onRatingChange,
  onHover,
  clearable = true,
  className,
}: InteractiveRatingProps) {
  const sizeClasses = {
    [ComponentSize.SM]: "h-4 w-4",
    [ComponentSize.MD]: "h-6 w-6",
    [ComponentSize.LG]: "h-8 w-8",
  };

  const handleStarClick = (starValue: number) => {
    if (rating === starValue && clearable) {
      onRatingChange(undefined);
    } else {
      onRatingChange(starValue);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = rating !== undefined && starValue <= rating;

        return (
          <button
            key={starValue}
            type="button"
            className="p-1 hover:bg-muted/50 rounded-sm transition-colors"
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => onHover?.(starValue)}
            onMouseLeave={() => onHover?.(undefined)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-all duration-200",
                isFilled
                  ? "text-primary fill-primary"
                  : "text-muted-foreground/40 hover:text-primary/60",
              )}
            />
          </button>
        );
      })}
      {clearable && rating !== undefined && (
        <button
          type="button"
          className="ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onRatingChange(undefined)}
        >
          Clear
        </button>
      )}
    </div>
  );
}
