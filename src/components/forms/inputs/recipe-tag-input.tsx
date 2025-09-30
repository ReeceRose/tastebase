"use client";

import { Plus, Tag, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Input } from "@/components/ui/input";
import { BadgeVariant, SizeVariant } from "@/lib/types";

// Common recipe tags organized by category
const SUGGESTED_TAGS = {
  cuisine: [
    "italian",
    "mexican",
    "indian",
    "chinese",
    "thai",
    "japanese",
    "french",
    "mediterranean",
    "american",
    "southern",
    "cajun",
    "middle-eastern",
    "korean",
    "vietnamese",
    "greek",
  ],
  diet: [
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "keto",
    "low-carb",
    "paleo",
    "whole30",
    "sugar-free",
    "nut-free",
    "egg-free",
    "soy-free",
    "low-sodium",
  ],
  course: [
    "appetizer",
    "main-course",
    "side-dish",
    "dessert",
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "soup",
    "salad",
    "pasta",
    "pizza",
    "sandwich",
    "burger",
  ],
  cooking: [
    "one-pot",
    "slow-cooker",
    "instant-pot",
    "grilled",
    "baked",
    "fried",
    "steamed",
    "no-cook",
    "make-ahead",
    "freezer-friendly",
    "quick",
    "easy",
    "comfort-food",
  ],
  occasion: [
    "holiday",
    "christmas",
    "thanksgiving",
    "easter",
    "birthday",
    "party",
    "potluck",
    "date-night",
    "family-dinner",
    "meal-prep",
    "picnic",
    "bbq",
    "brunch",
  ],
  season: [
    "spring",
    "summer",
    "fall",
    "winter",
    "seasonal",
    "fresh",
    "harvest",
  ],
};

interface RecipeTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export function RecipeTagInput({
  tags,
  onChange,
  placeholder = "Add tags (e.g., vegetarian, easy, comfort-food)",
  maxTags = 20,
  className,
}: RecipeTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ tag: string; category: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateSuggestions = useCallback(
    (input: string) => {
      if (!input.trim() || input.length < 2) {
        setSuggestions([]);
        return;
      }

      const inputLower = input.toLowerCase();
      const allSuggestions: Array<{ tag: string; category: string }> = [];

      // Search through all tag categories
      for (const [category, categoryTags] of Object.entries(SUGGESTED_TAGS)) {
        for (const tag of categoryTags) {
          if (
            tag.toLowerCase().includes(inputLower) &&
            !tags.includes(tag.toLowerCase())
          ) {
            allSuggestions.push({ tag, category });
          }
        }
      }

      // Sort by relevance (starts with input first, then contains)
      allSuggestions.sort((a, b) => {
        const aStartsWith = a.tag.toLowerCase().startsWith(inputLower);
        const bStartsWith = b.tag.toLowerCase().startsWith(inputLower);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.tag.localeCompare(b.tag);
      });

      setSuggestions(allSuggestions.slice(0, 12));
    },
    [tags],
  );

  useEffect(() => {
    generateSuggestions(inputValue);
  }, [inputValue, generateSuggestions]);

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();

    if (
      !normalizedTag ||
      tags.includes(normalizedTag) ||
      tags.length >= maxTags
    ) {
      return;
    }

    onChange([...tags, normalizedTag]);
    setInputValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (inputValue.trim() && suggestions.length > 0) {
          addTag(suggestions[0].tag);
        } else if (inputValue.trim()) {
          addTag(inputValue);
        }
        break;

      case "Backspace":
        if (!inputValue && tags.length > 0) {
          removeTag(tags[tags.length - 1]);
        }
        break;

      case "Escape":
        setShowSuggestions(false);
        setInputValue("");
        break;
    }
  };

  const groupedSuggestions = suggestions.reduce(
    (acc, { tag, category }) => {
      if (!acc[category]) acc[category] = [];
      acc[category].push(tag);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {/* Tag display */}
      <div className="flex flex-wrap gap-1 min-h-8">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => removeTag(tag)}
          >
            <Tag className="h-3 w-3 mr-1" />
            {tag}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        ))}

        {tags.length === 0 && (
          <span className="text-sm text-muted-foreground italic">
            No tags added yet
          </span>
        )}
      </div>

      {/* Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder={
                tags.length >= maxTags
                  ? `Maximum ${maxTags} tags reached`
                  : placeholder
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              disabled={tags.length >= maxTags}
              className="text-sm"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (inputValue.trim()) {
                addTag(inputValue);
              }
            }}
            disabled={!inputValue.trim() || tags.length >= maxTags}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-3 border shadow-lg max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {Object.entries(groupedSuggestions).map(
                ([category, categoryTags]) => (
                  <div key={category}>
                    <div className="mb-1">
                      <CategoryBadge
                        category={category}
                        variant={BadgeVariant.SECONDARY}
                        size={SizeVariant.SM}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {categoryTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="text-xs px-2 py-1 bg-muted hover:bg-muted-foreground/20 rounded transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Quick category shortcuts */}
      <div className="flex flex-wrap gap-1">
        {Object.keys(SUGGESTED_TAGS).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              setSelectedCategory(
                selectedCategory === category ? null : category,
              );
              if (selectedCategory !== category) {
                const categoryTags = SUGGESTED_TAGS[
                  category as keyof typeof SUGGESTED_TAGS
                ]
                  .filter((tag) => !tags.includes(tag))
                  .slice(0, 6);
                setSuggestions(categoryTags.map((tag) => ({ tag, category })));
                setShowSuggestions(true);
              }
            }}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              selectedCategory === category
                ? "bg-accent text-accent-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Tag count */}
      <div className="text-xs text-muted-foreground text-right">
        {tags.length} / {maxTags} tags
      </div>
    </div>
  );
}
