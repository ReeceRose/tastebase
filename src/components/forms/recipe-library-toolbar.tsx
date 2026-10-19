"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Chip } from "@/components/ui/chip";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-search";
import {
  AvatarSize,
  LibrarySort,
  LibraryVisibility,
  RecipeDifficulty,
  ViewMode,
} from "@/lib/types";
import type {
  LibraryFacets,
  LibraryFilters,
  LibraryFilterUpdate,
} from "@/lib/types/recipe-types";
import {
  hasActiveFilters,
  libraryParamsToQuery,
} from "@/lib/utils/library-params";

interface RecipeLibraryToolbarProps {
  filters: LibraryFilters;
  facets: LibraryFacets;
  basePath: string;
  currentUserId: string;
}

const ANY = "any";

const SORT_OPTIONS = [
  { value: LibrarySort.NEWEST, label: "Newest first" },
  { value: LibrarySort.RATING, label: "Top rated" },
  { value: LibrarySort.QUICKEST, label: "Quickest first" },
  { value: LibrarySort.TITLE, label: "A to Z" },
  { value: LibrarySort.UPDATED, label: "Recently changed" },
];

const VIEW_OPTIONS = [
  { value: ViewMode.CARDS, label: "Tiles" },
  { value: ViewMode.LIST, label: "List" },
];

const TIME_OPTIONS = [
  { value: 30, label: "Under 30 min" },
  { value: 60, label: "Under an hour" },
];

const DIFFICULTY_OPTIONS = [
  { value: RecipeDifficulty.EASY, label: "Easy" },
  { value: RecipeDifficulty.MEDIUM, label: "Medium" },
  { value: RecipeDifficulty.HARD, label: "Takes effort" },
];

const VISIBILITY_OPTIONS = [
  { value: LibraryVisibility.ALL, label: "Everyone's recipes" },
  { value: LibraryVisibility.MINE, label: "Just mine" },
  { value: LibraryVisibility.PRIVATE, label: "Only visible to me" },
];

const pillTrigger =
  "h-9 rounded-full border-foreground px-3.5 text-sm font-semibold data-[placeholder]:text-foreground";

export function RecipeLibraryToolbar({
  filters,
  facets,
  basePath,
  currentUserId,
}: RecipeLibraryToolbarProps) {
  const router = useRouter();
  const searchId = useId();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(filters.query ?? "");
  const debouncedText = useDebouncedValue(text, 350);
  const latest = useRef(filters);
  latest.current = filters;

  const update = (change: LibraryFilterUpdate) => {
    const next = { ...latest.current, page: 1, ...change };
    const query = libraryParamsToQuery(next);
    startTransition(() => {
      router.replace(query ? `${basePath}?${query}` : basePath, {
        scroll: false,
      });
    });
  };

  useEffect(() => {
    setText((current) =>
      current.trim() === (filters.query ?? "")
        ? current
        : (filters.query ?? ""),
    );
  }, [filters.query]);

  useEffect(() => {
    const trimmed = debouncedText.trim();
    if (trimmed === (latest.current.query ?? "")) return;
    const next = { ...latest.current, page: 1, query: trimmed || null };
    const query = libraryParamsToQuery(next);
    startTransition(() => {
      router.replace(query ? `${basePath}?${query}` : basePath, {
        scroll: false,
      });
    });
  }, [debouncedText, basePath, router]);

  const otherMembers = facets.members.length > 1 ? facets.members : [];
  const sortValue = filters.sort ?? LibrarySort.NEWEST;

  return (
    <div className="space-y-3" aria-busy={isPending}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">
            Search recipes
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          />
          <input
            id={searchId}
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Search by name, ingredient, note or source"
            className="h-12 w-full rounded-control border-2 border-foreground bg-card pr-12 pl-12 text-base sm:text-body outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 [&::-webkit-search-cancel-button]:hidden"
          />
          {text && (
            <button
              type="button"
              onClick={() => setText("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={sortValue}
            onValueChange={(value) => update({ sort: value as LibrarySort })}
          >
            <SelectTrigger
              aria-label="Sort recipes"
              className="min-w-44 flex-1"
            >
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
          <SegmentedControl
            label="Show recipes as"
            options={VIEW_OPTIONS}
            value={filters.view}
            onValueChange={(value) =>
              update({ view: value as ViewMode, page: filters.page })
            }
          />
        </div>
      </div>

      <div className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&>*]:shrink-0">
        {otherMembers.map((member) => {
          const active = filters.authorId === member.id;
          return (
            <Chip
              key={member.id}
              aria-pressed={active}
              onClick={() =>
                update({
                  authorId: active ? null : member.id,
                  visibility: LibraryVisibility.ALL,
                })
              }
              className="pl-1.5"
            >
              <MemberAvatar
                userId={member.id}
                name={member.name}
                size={AvatarSize.SM}
                decorative
              />
              {member.id === currentUserId ? "You" : member.name.split(" ")[0]}
            </Chip>
          );
        })}

        {TIME_OPTIONS.map((option) => {
          const active = filters.maxTime === option.value;
          return (
            <Chip
              key={option.value}
              aria-pressed={active}
              onClick={() => update({ maxTime: active ? null : option.value })}
            >
              {option.label}
            </Chip>
          );
        })}

        {DIFFICULTY_OPTIONS.map((option) => {
          const active = filters.difficulty === option.value;
          return (
            <Chip
              key={option.value}
              aria-pressed={active}
              onClick={() =>
                update({ difficulty: active ? null : option.value })
              }
            >
              {option.label}
            </Chip>
          );
        })}

        {facets.cuisines.length > 0 && (
          <Select
            value={filters.cuisine ?? ANY}
            onValueChange={(value) =>
              update({ cuisine: value === ANY ? null : value })
            }
          >
            <SelectTrigger
              size="sm"
              aria-label="Cuisine"
              className={pillTrigger}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any cuisine</SelectItem>
              {facets.cuisines.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {facets.sources.length > 0 && (
          <Select
            value={filters.source ?? ANY}
            onValueChange={(value) =>
              update({ source: value === ANY ? null : value })
            }
          >
            <SelectTrigger
              size="sm"
              aria-label="Source"
              className={pillTrigger}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any source</SelectItem>
              {facets.sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {facets.tags.length > 0 && (
          <Select
            value={filters.tags[0] ?? ANY}
            onValueChange={(value) =>
              update({ tags: value === ANY ? [] : [value] })
            }
          >
            <SelectTrigger size="sm" aria-label="Tag" className={pillTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any tag</SelectItem>
              {facets.tags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filters.visibility}
          onValueChange={(value) =>
            update({
              visibility: value as LibraryVisibility,
              authorId: null,
            })
          }
        >
          <SelectTrigger
            size="sm"
            aria-label="Whose recipes"
            className={pillTrigger}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => {
              setText("");
              update({
                query: null,
                authorId: null,
                difficulty: null,
                cuisine: null,
                source: null,
                tags: [],
                maxTime: null,
                visibility: LibraryVisibility.ALL,
              });
            }}
            className="ml-1 rounded-sm text-sm font-semibold underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            Clear filters
          </button>
        )}

        {isPending && (
          <span role="status" className="text-meta text-muted-foreground">
            Updating…
          </span>
        )}
      </div>
    </div>
  );
}
