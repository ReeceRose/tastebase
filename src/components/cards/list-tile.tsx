import Image from "next/image";
import Link from "next/link";
import { CircleMotif, TILE_MOTIF_MOTION } from "@/components/ui/circle-motif";
import type { RecipeListTileData } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { swatchClasses } from "@/lib/utils/swatches";

interface ListTileProps {
  list: RecipeListTileData;
}

export function ListTile({ list }: ListTileProps) {
  const classes = swatchClasses(list.swatch);
  const label =
    list.recipeCount === 1 ? "1 recipe" : `${list.recipeCount} recipes`;

  return (
    <Link
      href={list.href}
      className={cn(
        "group relative flex min-h-[170px] flex-col overflow-hidden rounded-tile outline-none transition-[filter] duration-150 hover:brightness-95 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        classes.bg,
        classes.fg,
      )}
    >
      {list.photoFilename ? (
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-black/10">
          <Image
            src={`/api/recipes/images/${list.photoFilename}`}
            alt=""
            fill
            className="object-cover transition-[scale] duration-500 ease-out motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 320px"
            unoptimized
          />
        </div>
      ) : (
        <CircleMotif
          className={cn(
            "-right-10 -bottom-16 size-[130px] motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110",
            TILE_MOTIF_MOTION,
            classes.deep,
          )}
        />
      )}
      <div className="relative flex flex-1 flex-col p-5">
        <h3 className="text-[19px] leading-[1.05] font-extrabold tracking-[-0.02em] wrap-break-word sm:text-tile">
          {list.name}
        </h3>
        <p className="mt-1 text-meta opacity-85">{label}</p>
        {!list.photoFilename && list.previewTitles.length > 0 && (
          <ul className="mt-auto space-y-0.5 pt-4 pr-14 text-sm">
            {list.previewTitles.map((title) => (
              <li key={title} className="truncate">
                {title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
