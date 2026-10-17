import Link from "next/link";
import { CircleMotif } from "@/components/ui/circle-motif";
import type { TagTileData } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { swatchClasses } from "@/lib/utils/swatches";

interface TagTileProps {
  tag: TagTileData;
}

export function TagTile({ tag }: TagTileProps) {
  const classes = swatchClasses(tag.swatch);
  const label =
    tag.recipeCount === 1 ? "1 recipe" : `${tag.recipeCount} recipes`;

  return (
    <Link
      href={`/recipes?tag=${encodeURIComponent(tag.name)}`}
      className={cn(
        "group relative flex min-h-[170px] flex-col overflow-hidden rounded-tile p-5 outline-none transition-[filter] duration-150 hover:brightness-95 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        classes.bg,
        classes.fg,
      )}
    >
      <CircleMotif
        className={cn(
          "-right-10 -bottom-16 size-[130px] transition-transform duration-200 group-hover:scale-105",
          classes.deep,
        )}
      />
      <h3 className="relative text-tile capitalize">{tag.name}</h3>
      <p className="relative mt-1 text-meta opacity-85">{label}</p>
      {tag.previewTitles.length > 0 && (
        <ul className="relative mt-auto space-y-0.5 pt-4 pr-14 text-sm">
          {tag.previewTitles.map((title) => (
            <li key={title} className="truncate">
              {title}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
