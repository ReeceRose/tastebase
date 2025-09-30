"use client";

import {
  Download,
  Grid3X3,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViewMode } from "@/lib/types";

interface RecipeHeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  showViewToggle?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
  view?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  onSearch?: (query: string) => void;
  recipeCount?: number;
  className?: string;
}

const viewOptions = [
  { value: ViewMode.CARDS, icon: LayoutGrid, label: "Cards" },
  { value: ViewMode.GRID, icon: Grid3X3, label: "Grid" },
  { value: ViewMode.LIST, icon: List, label: "List" },
] as const;

export function RecipeHeader({
  title,
  subtitle,
  showSearch = false,
  showViewToggle = false,
  showFilters = false,
  showActions = false,
  view = ViewMode.CARDS,
  onViewChange,
  onSearch,
  recipeCount,
  className,
}: RecipeHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value === "") {
      onSearch?.("");
    }
  };

  return (
    <div
      className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
    >
      <div className="px-6 py-4 space-y-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-1">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {title}
              </h1>
              {recipeCount !== undefined && (
                <Badge variant="secondary" className="text-sm w-fit">
                  {recipeCount} {recipeCount === 1 ? "recipe" : "recipes"}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-muted-foreground text-sm sm:text-base">
                {subtitle}
              </p>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipe
                </Link>
              </Button>

              <Button size="icon" className="sm:hidden" asChild>
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add Recipe</span>
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Recipe Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Recipes
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Export Recipes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {(showSearch || showViewToggle || showFilters) && (
          <div className="space-y-4">
            {showSearch && (
              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </form>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {showFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <Select>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cuisines</SelectItem>
                      <SelectItem value="italian">Italian</SelectItem>
                      <SelectItem value="asian">Asian</SelectItem>
                      <SelectItem value="mexican">Mexican</SelectItem>
                      <SelectItem value="american">American</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:inline-flex"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>

                  <Button variant="outline" size="icon" className="sm:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="sr-only">More Filters</span>
                  </Button>
                </div>
              )}

              {showViewToggle && (
                <div className="flex items-center border rounded-lg p-1 self-start sm:self-auto">
                  {viewOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={view === option.value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onViewChange?.(option.value)}
                      className="h-8 px-3"
                    >
                      <option.icon className="h-4 w-4" />
                      <span className="sr-only">{option.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
