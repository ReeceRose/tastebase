"use client";

import {
  ChefHat,
  Clock,
  MessageSquare,
  Save,
  Star,
  Target,
} from "lucide-react";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SizeVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface DetailedReviewData {
  overallRating: number;
  categories: {
    taste: number;
    difficulty: number;
    timeAccuracy: number;
  };
  content: string;
  wouldMakeAgain: boolean;
  tags: string[];
  modifications?: string;
}

export interface DetailedReviewFormProps {
  onSubmit: (data: DetailedReviewData) => void;
  onCancel?: () => void;
  initialData?: Partial<DetailedReviewData>;
  isLoading?: boolean;
  className?: string;
}

const defaultData: DetailedReviewData = {
  overallRating: 0,
  categories: {
    taste: 0,
    difficulty: 0,
    timeAccuracy: 0,
  },
  content: "",
  wouldMakeAgain: false,
  tags: [],
  modifications: "",
};

const REVIEW_TAGS = [
  "Easy to follow",
  "Great flavor",
  "Perfect timing",
  "Kid-friendly",
  "Healthy option",
  "Comfort food",
  "Quick meal",
  "Party favorite",
  "Restaurant quality",
  "Good leftovers",
  "Budget friendly",
  "Special occasion",
];

// Extracted components for better performance
const StarRating = ({
  value,
  onChange,
  size = SizeVariant.DEFAULT,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: SizeVariant;
}) => {
  const starSize =
    size === SizeVariant.SM
      ? "h-4 w-4"
      : size === SizeVariant.LG
        ? "h-6 w-6"
        : "h-5 w-5";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={cn(
            "transition-colors hover:scale-110",
            star <= value ? "text-yellow-400" : "text-muted-foreground/30",
          )}
        >
          <Star className={cn(starSize, star <= value && "fill-current")} />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {value > 0 ? `${value}/5` : "Not rated"}
      </span>
    </div>
  );
};

const StarDisplay = ({ value, label }: { value: number; label: string }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3 w-3",
            star <= value
              ? "text-yellow-400 fill-current"
              : "text-muted-foreground/30",
          )}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{value}/5</span>
    </div>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export function DetailedReviewForm({
  onSubmit,
  onCancel,
  initialData = {},
  isLoading = false,
  className,
}: DetailedReviewFormProps) {
  const contentId = useId();
  const modificationsId = useId();
  const [formData, setFormData] = useState<DetailedReviewData>({
    ...defaultData,
    ...initialData,
  });

  const updateFormData = (updates: Partial<DetailedReviewData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateCategories = (
    category: keyof DetailedReviewData["categories"],
    value: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value,
      },
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Calculate average rating from categories
  const categoryAverage =
    Object.values(formData.categories).reduce((sum, val) => sum + val, 0) / 3;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recipe Review
        </CardTitle>
        <CardDescription>
          Share your experience making this recipe with detailed feedback
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Overall Rating</Label>
            <StarRating
              value={formData.overallRating}
              onChange={(value) => updateFormData({ overallRating: value })}
              size={SizeVariant.LG}
            />
          </div>

          <Separator />

          {/* Category Ratings */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Rate Different Aspects</h3>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Taste Rating */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <ChefHat className="h-4 w-4" />
                  Taste & Flavor
                </Label>
                <StarRating
                  value={formData.categories.taste}
                  onChange={(value) => updateCategories("taste", value)}
                />
              </div>

              {/* Difficulty Rating */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4" />
                  Difficulty Level
                </Label>
                <StarRating
                  value={formData.categories.difficulty}
                  onChange={(value) => updateCategories("difficulty", value)}
                />
                <p className="text-xs text-muted-foreground">
                  1 = Very Easy, 5 = Very Hard
                </p>
              </div>

              {/* Time Accuracy */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Time Accuracy
                </Label>
                <StarRating
                  value={formData.categories.timeAccuracy}
                  onChange={(value) => updateCategories("timeAccuracy", value)}
                />
                <p className="text-xs text-muted-foreground">
                  How accurate was the timing?
                </p>
              </div>
            </div>

            {/* Category average display */}
            {categoryAverage > 0 && (
              <div className="text-sm text-muted-foreground">
                Average category rating: {categoryAverage.toFixed(1)}/5
              </div>
            )}
          </div>

          <Separator />

          {/* Would Make Again */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Would you make this again?
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.wouldMakeAgain ? "default" : "outline"}
                size="sm"
                onClick={() => updateFormData({ wouldMakeAgain: true })}
              >
                Yes, definitely!
              </Button>
              <Button
                type="button"
                variant={!formData.wouldMakeAgain ? "default" : "outline"}
                size="sm"
                onClick={() => updateFormData({ wouldMakeAgain: false })}
              >
                Maybe not
              </Button>
            </div>
          </div>

          {/* Review Tags */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Quick Tags</Label>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}>
                  <Badge
                    variant={
                      formData.tags.includes(tag) ? "default" : "outline"
                    }
                    className="cursor-pointer hover:bg-primary/80"
                  >
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
            {formData.tags.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Selected {formData.tags.length} tag
                {formData.tags.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Written Review */}
          <div className="space-y-2">
            <Label htmlFor={contentId} className="text-base font-semibold">
              Your Review
            </Label>
            <Textarea
              id={contentId}
              placeholder="Share your thoughts about this recipe... What worked well? Any tips for next time?"
              value={formData.content}
              onChange={(e) => updateFormData({ content: e.target.value })}
              rows={4}
              className="min-h-[100px]"
            />
          </div>

          {/* Modifications */}
          <div className="space-y-2">
            <Label
              htmlFor={modificationsId}
              className="text-base font-semibold"
            >
              Modifications Made (Optional)
            </Label>
            <Textarea
              id={modificationsId}
              placeholder="Did you change anything? Substitute ingredients, adjust cooking time, etc."
              value={formData.modifications || ""}
              onChange={(e) =>
                updateFormData({ modifications: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {formData.overallRating > 0 || formData.content.length > 0 ? (
                <span>Review in progress...</span>
              ) : (
                <span>Start by adding a rating or writing a review</span>
              )}
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  (formData.overallRating === 0 &&
                    formData.content.trim() === "")
                }
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Review"}
              </Button>
            </div>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

// Component for displaying a detailed review
export interface DetailedReviewDisplayProps {
  review: DetailedReviewData & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  };
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function DetailedReviewDisplay({
  review,
  className,
  onEdit,
  onDelete,
}: DetailedReviewDisplayProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    star <= review.overallRating
                      ? "text-yellow-400 fill-current"
                      : "text-muted-foreground/30",
                  )}
                />
              ))}
              <span className="ml-2 font-semibold">
                {review.overallRating}/5
              </span>
            </div>
            {review.wouldMakeAgain && (
              <Badge variant="secondary" className="text-xs">
                Would make again
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {review.createdAt.toLocaleDateString()}
          {review.updatedAt.getTime() !== review.createdAt.getTime() &&
            " • Edited"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category Ratings */}
        <div className="grid grid-cols-3 gap-4">
          <StarDisplay value={review.categories.taste} label="Taste" />
          <StarDisplay
            value={review.categories.difficulty}
            label="Difficulty"
          />
          <StarDisplay
            value={review.categories.timeAccuracy}
            label="Time Accuracy"
          />
        </div>

        {/* Written Review */}
        {review.content && (
          <div>
            <p className="text-sm leading-relaxed">{review.content}</p>
          </div>
        )}

        {/* Modifications */}
        {review.modifications && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Modifications:</h4>
            <p className="text-sm text-muted-foreground">
              {review.modifications}
            </p>
          </div>
        )}

        {/* Tags */}
        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {review.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
