"use client";

import { ChevronDown, ChevronUp, Filter, Search, Star, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { type RecipeDifficulty, SortOrder } from "@/lib/types";
import type { RecipeSearchParams } from "@/lib/validations/recipe-schemas";

// Type definitions for search form values
type SearchDifficulty = RecipeDifficulty[];
type SortBy =
  | "title"
  | "createdAt"
  | "difficulty"
  | "prepTimeMinutes"
  | "cookTimeMinutes"
  | "averageRating"
  | "relevance";

const CUISINE_OPTIONS = [
  "Italian",
  "Mexican",
  "Asian",
  "American",
  "French",
  "Indian",
  "Mediterranean",
  "Thai",
  "Chinese",
  "Japanese",
  "Korean",
  "Greek",
  "Spanish",
  "German",
  "British",
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const SORT_OPTIONS = [
  { value: "updatedAt", label: "Recently Updated" },
  { value: "createdAt", label: "Date Added" },
  { value: "title", label: "Recipe Name" },
  { value: "prepTimeMinutes", label: "Prep Time" },
  { value: "cookTimeMinutes", label: "Cook Time" },
];

interface RecipeSearchFormProps {
  onSearch?: (params: Partial<RecipeSearchParams>) => void;
  className?: string;
}

export function RecipeSearchForm({
  onSearch,
  className,
}: RecipeSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQueryId = useId();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxPrepTime, setMaxPrepTime] = useState<number[]>([60]);
  const [maxCookTime, setMaxCookTime] = useState<number[]>([120]);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, reset } = useForm<
    Partial<RecipeSearchParams>
  >({
    defaultValues: {
      query: "",
      difficulty: [],
      cuisine: [],
      sortBy: "updatedAt",
      sortOrder: SortOrder.DESC,
    },
  });

  const watchedDifficulty = watch("difficulty") || [];
  const watchedCuisine = watch("cuisine") || [];
  const watchedSortBy = watch("sortBy");
  const watchedSortOrder = watch("sortOrder");

  // Initialize form from URL params
  useEffect(() => {
    const query = searchParams.get("query") || "";
    const difficulty = searchParams.getAll("difficulty");
    const cuisine = searchParams.getAll("cuisine");
    const maxPrepTimeParam = searchParams.get("maxPrepTime");
    const maxCookTimeParam = searchParams.get("maxCookTime");
    const tags = searchParams.getAll("tags");
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    setValue("query", query);
    setValue("difficulty", difficulty as SearchDifficulty);
    setValue("cuisine", cuisine);
    setValue("sortBy", sortBy as SortBy);
    setValue("sortOrder", sortOrder as SortOrder);

    if (maxPrepTimeParam) {
      setMaxPrepTime([parseInt(maxPrepTimeParam, 10)]);
    }
    if (maxCookTimeParam) {
      setMaxCookTime([parseInt(maxCookTimeParam, 10)]);
    }
    if (tags.length > 0) {
      setSelectedTags(tags);
    }

    // Show advanced if any advanced filters are set
    if (
      difficulty.length > 0 ||
      cuisine.length > 0 ||
      maxPrepTimeParam ||
      maxCookTimeParam ||
      tags.length > 0
    ) {
      setShowAdvanced(true);
    }
  }, [searchParams, setValue]);

  const handleDifficultyChange = useCallback(
    (difficulty: string, checked: boolean) => {
      const current = watchedDifficulty;
      const updated = checked
        ? [...current, difficulty as RecipeDifficulty]
        : current.filter((d) => d !== difficulty);
      setValue("difficulty", updated as RecipeDifficulty[]);
    },
    [watchedDifficulty, setValue],
  );

  const handleCuisineChange = useCallback(
    (cuisine: string, checked: boolean) => {
      const current = watchedCuisine;
      const updated = checked
        ? [...current, cuisine]
        : current.filter((c) => c !== cuisine);
      setValue("cuisine", updated);
    },
    [watchedCuisine, setValue],
  );

  const addTag = useCallback(() => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags([...selectedTags, trimmedTag]);
      setTagInput("");
    }
  }, [tagInput, selectedTags]);

  const removeTag = useCallback(
    (tagToRemove: string) => {
      setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
    },
    [selectedTags],
  );

  const clearAllFilters = useCallback(() => {
    reset();
    setMaxPrepTime([60]);
    setMaxCookTime([120]);
    setSelectedTags([]);
    setTagInput("");

    // Clear URL params
    router.push("/recipes");
  }, [reset, router]);

  const onSubmit = useCallback(
    (data: Partial<RecipeSearchParams>) => {
      const params = {
        ...data,
        maxPrepTime: maxPrepTime[0] < 60 ? undefined : maxPrepTime[0],
        maxCookTime: maxCookTime[0] < 120 ? undefined : maxCookTime[0],
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      };

      // Clean up empty arrays and undefined values
      Object.keys(params).forEach((key) => {
        const value = params[key as keyof typeof params];
        if (Array.isArray(value) && value.length === 0) {
          delete params[key as keyof typeof params];
        }
        if (value === undefined || value === "") {
          delete params[key as keyof typeof params];
        }
      });

      onSearch?.(params);

      // Update URL with search params
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            urlParams.append(key, v.toString());
          });
        } else if (value !== undefined && value !== "") {
          urlParams.set(key, value.toString());
        }
      });

      const queryString = urlParams.toString();
      router.push(queryString ? `/recipes?${queryString}` : "/recipes");
    },
    [maxPrepTime, maxCookTime, selectedTags, onSearch, router],
  );

  const hasActiveFilters =
    watchedDifficulty.length > 0 ||
    watchedCuisine.length > 0 ||
    maxPrepTime[0] < 60 ||
    maxCookTime[0] < 120 ||
    selectedTags.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Recipes
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {[
                  watchedDifficulty.length,
                  watchedCuisine.length,
                  maxPrepTime[0] < 60 ? 1 : 0,
                  maxCookTime[0] < 120 ? 1 : 0,
                  selectedTags.length,
                ].reduce((sum, count) => sum + count, 0)}
              </Badge>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor={searchQueryId}>Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={searchQueryId}
                {...register("query")}
                placeholder="Search by recipe name, description, or cuisine..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Sort By</Label>
              <Select
                value={watchedSortBy}
                onValueChange={(value) => setValue("sortBy", value as SortBy)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Order</Label>
              <Select
                value={watchedSortOrder}
                onValueChange={(value) =>
                  setValue("sortOrder", value as SortOrder)
                }
              >
                <SelectTrigger className="mt-1 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showAdvanced && (
            <>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Difficulty Level
                  </Label>
                  <div className="space-y-2">
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`difficulty-${option.value}`}
                          checked={watchedDifficulty.includes(
                            option.value as RecipeDifficulty,
                          )}
                          onCheckedChange={(checked) =>
                            handleDifficultyChange(option.value, !!checked)
                          }
                        />
                        <Label
                          htmlFor={`difficulty-${option.value}`}
                          className="flex items-center gap-2"
                        >
                          <Star className="h-3 w-3" />
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Prep Time (max {maxPrepTime[0]} min)
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={maxPrepTime}
                      onValueChange={setMaxPrepTime}
                      max={180}
                      min={5}
                      step={5}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5 min</span>
                      <span>3 hours</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Cook Time (max {maxCookTime[0]} min)
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={maxCookTime}
                      onValueChange={setMaxCookTime}
                      max={300}
                      min={0}
                      step={10}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 min</span>
                      <span>5 hours</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Cuisine Type
                  </Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {CUISINE_OPTIONS.map((cuisine) => (
                      <div
                        key={cuisine}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`cuisine-${cuisine}`}
                          checked={watchedCuisine.includes(cuisine)}
                          onCheckedChange={(checked) =>
                            handleCuisineChange(cuisine, !!checked)
                          }
                        />
                        <Label
                          htmlFor={`cuisine-${cuisine}`}
                          className="text-sm"
                        >
                          {cuisine}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Tags</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>

            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search Recipes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
