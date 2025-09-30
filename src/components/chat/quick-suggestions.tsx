"use client";

import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function QuickSuggestions({
  suggestions,
  onSuggestionClick,
  disabled = false,
  compact = false,
}: QuickSuggestionsProps) {
  const displaySuggestions = compact ? suggestions.slice(0, 3) : suggestions;

  // Enhanced suggestions with food emojis and styling
  const enhancedSuggestions = [
    {
      text: "What can I make with chicken and rice?",
      emoji: "🍗",
      category: "ingredient-based",
    },
    {
      text: "I need a quick vegetarian dinner",
      emoji: "🥗",
      category: "dietary",
    },
    {
      text: "Something healthy for meal prep",
      emoji: "🥙",
      category: "health",
    },
    { text: "Comfort food for a cold day", emoji: "🍲", category: "comfort" },
    { text: "Easy dessert with chocolate", emoji: "🍫", category: "dessert" },
    { text: "Spicy Asian-inspired dishes", emoji: "🌶️", category: "cuisine" },
  ];

  const getCategoryColor = () => {
    // Use consistent ShadCN colors for all categories
    return "border-border hover:bg-muted hover:border-muted-foreground/20";
  };

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ChefHat className="h-4 w-4 text-primary" />
            <span className="font-medium">Try asking Chef Claude:</span>
          </div>
        </div>
      )}

      <div
        className={`flex flex-wrap gap-2 ${compact ? "justify-center" : ""} max-w-full overflow-hidden`}
      >
        {displaySuggestions.map((suggestion) => {
          const enhanced = enhancedSuggestions.find(
            (s) => s.text === suggestion,
          );
          return (
            <Button
              key={`suggestion-${suggestion.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => onSuggestionClick(suggestion)}
              disabled={disabled}
              variant="outline"
              size={compact ? "sm" : "default"}
              className={`text-left justify-start transition-all duration-200 ${
                compact
                  ? "h-7 px-2 text-xs max-w-none flex-shrink-0"
                  : "h-auto py-3 px-4 whitespace-normal text-sm"
              } ${
                enhanced ? getCategoryColor() : "border-border hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-1">
                {enhanced && (
                  <span
                    className={`${compact ? "text-sm" : "text-base"}`}
                    role="img"
                    aria-label="category"
                  >
                    {enhanced.emoji}
                  </span>
                )}
                <span className="truncate">
                  {compact
                    ? suggestion.slice(0, 20) +
                      (suggestion.length > 20 ? "..." : "")
                    : suggestion}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
