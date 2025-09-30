"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

interface ActiveFilterChipsProps {
  filters: ActiveFilter[];
  onClearFilter: (filterType: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({
  filters,
  onClearFilter,
  onClearAll,
}: ActiveFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {filters.map((filter) => (
        <Badge
          key={`${filter.type}-${filter.value}`}
          variant="secondary"
          className="flex items-center gap-1 bg-secondary hover:bg-secondary/80 transition-colors"
        >
          {filter.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onClearFilter(filter.type)}
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3 hover:text-destructive transition-colors" />
          </Button>
        </Badge>
      ))}
      {filters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs ml-1"
        >
          Clear All
        </Button>
      )}
    </div>
  );
}
