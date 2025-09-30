"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-search";

interface RecipeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
  placeholder?: string;
  showClearButton?: boolean;
}

export function RecipeSearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = "Search recipes...",
  showClearButton = false,
}: RecipeSearchBarProps) {
  const debouncedValue = useDebouncedValue(value, 500);
  const previousDebouncedValue = useRef(value);

  useEffect(() => {
    // Only trigger search if the debounced value actually changed
    if (debouncedValue !== previousDebouncedValue.current) {
      previousDebouncedValue.current = debouncedValue;
      if (debouncedValue.length >= 2 || debouncedValue.length === 0) {
        onSearch();
      }
    }
  }, [debouncedValue, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={onSearch} variant="default">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>

        {showClearButton && onClear && (
          <Button onClick={onClear} variant="outline">
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
