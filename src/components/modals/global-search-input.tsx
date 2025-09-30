"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlobalSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export function GlobalSearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search recipes, ingredients, instructions...",
  className,
}: GlobalSearchInputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border border-input rounded-xl bg-transparent",
        className,
      )}
    >
      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
        role="combobox"
        aria-expanded="true"
        aria-autocomplete="list"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 w-6 p-0 hover:bg-muted flex-shrink-0"
          tabIndex={-1}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
