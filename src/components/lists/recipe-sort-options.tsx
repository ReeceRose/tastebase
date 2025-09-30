"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortOrder } from "@/lib/types";

interface SortOption {
  value: string;
  label: string;
  field: string;
  order: SortOrder;
}

const SORT_OPTIONS: SortOption[] = [
  {
    value: "updatedAt-desc",
    label: "Recently Updated",
    field: "updatedAt",
    order: SortOrder.DESC,
  },
  {
    value: "createdAt-desc",
    label: "Recently Created",
    field: "createdAt",
    order: SortOrder.DESC,
  },
  {
    value: "title-asc",
    label: "Name A-Z",
    field: "title",
    order: SortOrder.ASC,
  },
  {
    value: "title-desc",
    label: "Name Z-A",
    field: "title",
    order: SortOrder.DESC,
  },
  {
    value: "prepTimeMinutes-asc",
    label: "Prep Time (Low to High)",
    field: "prepTimeMinutes",
    order: SortOrder.ASC,
  },
  {
    value: "prepTimeMinutes-desc",
    label: "Prep Time (High to Low)",
    field: "prepTimeMinutes",
    order: SortOrder.DESC,
  },
  {
    value: "cookTimeMinutes-asc",
    label: "Cook Time (Low to High)",
    field: "cookTimeMinutes",
    order: SortOrder.ASC,
  },
  {
    value: "cookTimeMinutes-desc",
    label: "Cook Time (High to Low)",
    field: "cookTimeMinutes",
    order: SortOrder.DESC,
  },
  {
    value: "difficulty-asc",
    label: "Difficulty (Easy to Hard)",
    field: "difficulty",
    order: SortOrder.ASC,
  },
  {
    value: "difficulty-desc",
    label: "Difficulty (Hard to Easy)",
    field: "difficulty",
    order: SortOrder.DESC,
  },
];

interface RecipeSortOptionsProps {
  sortBy: string;
  sortOrder: SortOrder;
  onSortChange: (field: string, order: SortOrder) => void;
  availableOptions?: SortOption[];
  className?: string;
}

export function RecipeSortOptions({
  sortBy,
  sortOrder,
  onSortChange,
  availableOptions = SORT_OPTIONS,
  className,
}: RecipeSortOptionsProps) {
  const currentValue = `${sortBy}-${sortOrder}`;

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-");
    onSortChange(field, order as SortOrder);
  };

  return (
    <Select value={currentValue} onValueChange={handleSortChange}>
      <SelectTrigger className={className || "w-48"}>
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        {availableOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { SORT_OPTIONS };
