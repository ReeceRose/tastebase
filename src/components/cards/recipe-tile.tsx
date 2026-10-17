import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CircleMotif } from "@/components/ui/circle-motif";
import { memberInitial } from "@/components/ui/member-avatar";
import type { RecipeSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isDarkSwatch, swatchClasses } from "@/lib/utils/swatches";
import { formatTotalTime } from "@/lib/utils/time-formatting";

interface RecipeTileProps {
  recipe: RecipeSummary;
  currentUserId: string;
  compact?: boolean;
  priority?: boolean;
}

export function RecipeTile({
  recipe,
  currentUserId,
  compact = false,
  priority = false,
}: RecipeTileProps) {
  const classes = swatchClasses(recipe.swatch);
  const dark = isDarkSwatch(recipe.swatch);
  const time = formatTotalTime(recipe.totalMinutes);
  const authorLabel =
    recipe.author.id === currentUserId ? "You" : recipe.author.name;

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-tile outline-none transition-[filter] duration-150 hover:brightness-95 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        compact ? "min-h-[150px]" : "min-h-[200px]",
        classes.bg,
        classes.fg,
      )}
    >
      {recipe.heroImage ? (
        <div className="relative aspect-[16/10] w-full shrink-0 bg-black/10">
          <Image
            src={`/api/recipes/images/${recipe.heroImage.filename}`}
            alt=""
            fill
            priority={priority}
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 320px"
            unoptimized
          />
        </div>
      ) : (
        <CircleMotif
          className={cn(
            "-right-9 -bottom-14 transition-transform duration-200 group-hover:scale-105",
            compact ? "size-[110px]" : "size-[140px]",
            classes.deep,
          )}
        />
      )}

      {recipe.isFavourite && (
        <span
          className={cn(
            "absolute top-3 right-3 grid size-8 place-items-center rounded-full",
            recipe.heroImage
              ? "bg-white text-swatch-tomato"
              : "bg-white/85 text-swatch-tomato",
          )}
        >
          <Heart className="size-4 fill-current" />
          <span className="sr-only">Favourite</span>
        </span>
      )}

      <div
        className={cn("relative flex flex-1 flex-col", compact ? "p-4" : "p-5")}
      >
        <h3
          className={cn(
            "line-clamp-3 max-w-[13ch] pr-6",
            compact
              ? "text-[18px] leading-[1.05] font-extrabold tracking-[-0.02em]"
              : "text-tile",
          )}
        >
          {recipe.title}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4 text-meta">
          <span className="flex flex-wrap items-center gap-1.5">
            {time && <span className="tabular">{time}</span>}
            {!recipe.isPublic && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-caption",
                  dark ? "bg-white/20" : "bg-black/15",
                )}
              >
                Only you
              </span>
            )}
          </span>
          <span
            title={authorLabel}
            className="grid size-[30px] shrink-0 place-items-center rounded-full bg-white/85 text-[13px] font-extrabold text-ink-fixed"
          >
            <span aria-hidden>{memberInitial(recipe.author.name)}</span>
            <span className="sr-only">Added by {authorLabel}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
