"use client";

import { Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CompareRecipe } from "@/lib/types/recipe-compare-types";
import { cn } from "@/lib/utils";
import { resolveSwatch, swatchClasses } from "@/lib/utils/swatches";

interface CompareRecipeTileProps {
  item: CompareRecipe;
  factor: number;
  scaled: boolean;
  onRemove: () => void;
}

export function CompareRecipeTile({
  item,
  factor,
  scaled,
  onRemove,
}: CompareRecipeTileProps) {
  const { recipe } = item;
  const classes = swatchClasses(resolveSwatch(recipe.id, recipe.swatch));
  const hero = recipe.images.find((image) => image.isHero) ?? recipe.images[0];
  const source = recipe.sourceName || `${recipe.author.name}'s recipe`;
  const scaleNote = !scaled
    ? null
    : !recipe.servings
      ? "Not scaled: no serving count"
      : factor !== 1
        ? `Written for ${recipe.servings}`
        : null;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-tile p-4",
        classes.bg,
        classes.fg,
      )}
    >
      <div className="flex items-start gap-3">
        {hero && (
          <div className="relative size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/40">
            <Image
              src={`/api/recipes/images/${hero.filename}`}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/recipes/${recipe.slug}`}
            className="line-clamp-2 rounded-sm text-[17px] leading-tight font-extrabold tracking-[-0.01em] outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            {recipe.title}
          </Link>
          <p className="mt-1 truncate text-caption opacity-85">{source}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${recipe.title} from the comparison`}
          className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-full outline-none transition-colors hover:bg-black/10 focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>
      </div>
      {scaleNote && (
        <p className="mt-auto pt-3 text-caption opacity-85">{scaleNote}</p>
      )}
    </div>
  );
}

interface CompareAddTileProps {
  onAdd: () => void;
  description: string;
  className?: string;
}

export function CompareAddTile({
  onAdd,
  description,
  className,
}: CompareAddTileProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        "flex min-h-28 flex-col items-start justify-center gap-1 rounded-tile border-2 border-dashed border-foreground/25 p-4 text-left outline-none transition-colors hover:border-foreground hover:bg-card focus-visible:ring-[3px] focus-visible:ring-ring",
        className,
      )}
    >
      <span className="flex items-center gap-2 font-extrabold">
        <Plus className="size-4" strokeWidth={2.5} />
        Add a recipe to compare
      </span>
      <span className="text-meta text-muted-foreground">{description}</span>
    </button>
  );
}
