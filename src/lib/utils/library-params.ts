import {
  LibraryScope,
  LibrarySort,
  LibraryVisibility,
  RecipeDifficulty,
  ViewMode,
} from "@/lib/types";
import type { LibraryFilters } from "@/lib/types/recipe-types";

export type LibrarySearchParams = Record<string, string | string[] | undefined>;

export const LIBRARY_PAGE_SIZE = 48;

const LEGACY_SORTS: Record<string, LibrarySort> = {
  createdAt: LibrarySort.NEWEST,
  averageRating: LibrarySort.RATING,
  updatedAt: LibrarySort.UPDATED,
  title: LibrarySort.TITLE,
  prepTimeMinutes: LibrarySort.QUICKEST,
  cookTimeMinutes: LibrarySort.QUICKEST,
};

function first(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

function enumValue<T extends string>(
  values: Record<string, T>,
  raw: string | null,
): T | null {
  if (!raw) return null;
  return (Object.values(values) as string[]).includes(raw) ? (raw as T) : null;
}

function positiveInt(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseLibraryParams(
  params: LibrarySearchParams,
  scope: LibraryScope = LibraryScope.ALL,
): LibraryFilters {
  const rawSort = first(params.sort);
  const tags = (first(params.tags) ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const singleTag = first(params.tag);
  if (singleTag && !tags.includes(singleTag)) tags.push(singleTag);

  return {
    scope,
    query: first(params.q),
    authorId: first(params.author),
    difficulty: enumValue(RecipeDifficulty, first(params.difficulty)),
    cuisine: first(params.cuisine),
    source: first(params.source),
    tags,
    listId: null,
    maxTime: positiveInt(first(params.maxTime)),
    sort:
      enumValue(LibrarySort, rawSort) ??
      (rawSort ? (LEGACY_SORTS[rawSort] ?? null) : null),
    visibility:
      enumValue(LibraryVisibility, first(params.show)) ?? LibraryVisibility.ALL,
    view: first(params.view) === ViewMode.LIST ? ViewMode.LIST : ViewMode.CARDS,
    page: positiveInt(first(params.page)) ?? 1,
  };
}

export function libraryParamsToQuery(filters: LibraryFilters): string {
  const query = new URLSearchParams();
  if (filters.query) query.set("q", filters.query);
  if (filters.authorId) query.set("author", filters.authorId);
  if (filters.difficulty) query.set("difficulty", filters.difficulty);
  if (filters.cuisine) query.set("cuisine", filters.cuisine);
  if (filters.source) query.set("source", filters.source);
  if (filters.tags.length > 0) query.set("tags", filters.tags.join(","));
  if (filters.maxTime) query.set("maxTime", String(filters.maxTime));
  if (filters.sort) query.set("sort", filters.sort);
  if (filters.visibility !== LibraryVisibility.ALL) {
    query.set("show", filters.visibility);
  }
  if (filters.view !== ViewMode.CARDS) query.set("view", filters.view);
  if (filters.page > 1) query.set("page", String(filters.page));
  return query.toString();
}

export function hasActiveFilters(filters: LibraryFilters): boolean {
  return Boolean(
    filters.query ||
      filters.authorId ||
      filters.difficulty ||
      filters.cuisine ||
      filters.source ||
      filters.tags.length > 0 ||
      filters.maxTime ||
      filters.visibility !== LibraryVisibility.ALL,
  );
}
