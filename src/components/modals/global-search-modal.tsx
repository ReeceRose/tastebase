"use client";

import { Clock, Loader2, Plus, Search, Settings, Tags, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { AvatarSize } from "@/lib/types";
import type { RecipeSummary } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { swatchClasses } from "@/lib/utils/swatches";
import { formatTotalTime } from "@/lib/utils/time-formatting";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const QUICK_ACTIONS = [
  { label: "Add a recipe", href: "/recipes/new", icon: Plus },
  { label: "Browse tags", href: "/recipes/tags", icon: Tags },
  { label: "Recently opened", href: "/recipes/recent", icon: Clock },
  { label: "Settings", href: "/settings", icon: Settings },
];

const rowClass =
  "flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left outline-none transition-colors";

export function GlobalSearchModal({
  isOpen,
  onClose,
  userId,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const inputId = useId();
  const search = useGlobalSearch({ isOpen });
  const yours = search.results.filter((recipe) => recipe.author.id === userId);
  const fromHouse = search.results.filter(
    (recipe) => recipe.author.id !== userId,
  );
  const ordered = [...yours, ...fromHouse];

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const open = (recipe: RecipeSummary) => {
    onClose();
    search.openRecipe(recipe);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && ordered.length > 0) {
      event.preventDefault();
      search.setSelectedIndex(
        Math.min(search.selectedIndex + 1, ordered.length - 1),
      );
    }
    if (event.key === "ArrowUp" && ordered.length > 0) {
      event.preventDefault();
      search.setSelectedIndex(Math.max(search.selectedIndex - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey || ordered.length === 0) {
        if (search.hasQuery) {
          onClose();
          search.viewAll();
        }
        return;
      }
      open(ordered[search.selectedIndex] ?? ordered[0]);
    }
  };

  const renderRecipe = (recipe: RecipeSummary) => {
    const index = ordered.indexOf(recipe);
    const selected = index === search.selectedIndex;
    const time = formatTotalTime(recipe.totalMinutes);
    return (
      <li key={recipe.id}>
        <button
          type="button"
          onMouseEnter={() => search.setSelectedIndex(index)}
          onClick={() => open(recipe)}
          aria-current={selected ? "true" : undefined}
          className={cn(rowClass, selected ? "bg-muted" : "hover:bg-muted/60")}
        >
          <span
            aria-hidden
            className={cn(
              "size-3.5 shrink-0 rounded-full",
              swatchClasses(recipe.swatch).bg,
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-extrabold">
              {recipe.title}
            </span>
            <span className="block truncate text-meta font-normal text-muted-foreground">
              {[recipe.cuisine, time, recipe.isPublic ? null : "Only you"]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <MemberAvatar
            userId={recipe.author.id}
            name={recipe.author.name}
            size={AvatarSize.SM}
            decorative
          />
        </button>
      </li>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] max-w-[640px] translate-y-0 gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">Search recipes</DialogTitle>
        <DialogDescription className="sr-only">
          Search names, ingredients, steps and notes across the house's recipes.
        </DialogDescription>

        <div className="p-3">
          <div className="flex items-center gap-3 rounded-control border-2 border-foreground px-4">
            <Search aria-hidden className="size-5 shrink-0" />
            <label htmlFor={inputId} className="sr-only">
              Search recipes
            </label>
            <input
              id={inputId}
              value={search.query}
              onChange={(event) => search.setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search recipes, ingredients or notes"
              autoComplete="off"
              className="h-13 flex-1 bg-transparent text-lead outline-none placeholder:text-muted-foreground"
            />
            {search.isPending ? (
              <Loader2
                aria-hidden
                className="size-4 animate-spin text-muted-foreground"
              />
            ) : (
              search.query && (
                <button
                  type="button"
                  onClick={() => search.setQuery("")}
                  aria-label="Clear search"
                  className="grid size-8 place-items-center rounded-full outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  <X className="size-4" />
                </button>
              )
            )}
          </div>
        </div>

        <div className="max-h-[min(60vh,440px)] overflow-y-auto px-3 pb-3">
          {!search.hasQuery && (
            <div className="space-y-4 pt-1">
              {search.recentSearches.length > 0 && (
                <div>
                  <p className="px-3 pb-1 text-caption text-muted-foreground">
                    Recent searches
                  </p>
                  <ul>
                    {search.recentSearches.map((recent) => (
                      <li key={recent}>
                        <button
                          type="button"
                          onClick={() => search.setQuery(recent)}
                          className={cn(
                            rowClass,
                            "hover:bg-muted/60 focus-visible:bg-muted",
                          )}
                        >
                          <Clock
                            aria-hidden
                            className="size-4 text-muted-foreground"
                          />
                          {recent}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="px-3 pb-1 text-caption text-muted-foreground">
                  Go to
                </p>
                <ul>
                  {QUICK_ACTIONS.map((action) => (
                    <li key={action.href}>
                      <button
                        type="button"
                        onClick={() => go(action.href)}
                        className={cn(
                          rowClass,
                          "font-semibold hover:bg-muted/60 focus-visible:bg-muted",
                        )}
                      >
                        <action.icon aria-hidden className="size-4" />
                        {action.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {search.hasQuery &&
            search.hasCompletedSearch &&
            ordered.length === 0 && (
              <p className="px-3 py-8 text-center text-muted-foreground">
                Nothing matches “{search.query.trim()}”. Try an ingredient or a
                shorter word.
              </p>
            )}

          {ordered.length > 0 && (
            <ul aria-label="Recipes" className="space-y-3">
              {yours.length > 0 && (
                <li>
                  <p className="px-3 pb-1 text-caption text-muted-foreground">
                    Yours
                  </p>
                  <ul>{yours.map(renderRecipe)}</ul>
                </li>
              )}
              {fromHouse.length > 0 && (
                <li>
                  <p className="px-3 pb-1 text-caption text-muted-foreground">
                    From the house
                  </p>
                  <ul>{fromHouse.map(renderRecipe)}</ul>
                </li>
              )}
            </ul>
          )}
        </div>

        {search.hasQuery && (
          <div className="flex items-center justify-between gap-3 border-t-2 border-background px-5 py-3 text-caption text-muted-foreground">
            <span className="hidden items-center gap-1.5 sm:flex">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              move
              <Kbd>↵</Kbd>
              open
              <Kbd>esc</Kbd>
              close
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                search.viewAll();
              }}
              className="ml-auto rounded-sm font-semibold text-foreground underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              {search.total > 0
                ? `See all ${search.total} in Recipes`
                : "Search in Recipes"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
