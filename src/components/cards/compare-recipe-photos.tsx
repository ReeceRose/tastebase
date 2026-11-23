"use client";

import Image from "next/image";
import { useState } from "react";
import { PhotoLightbox } from "@/components/modals/photo-lightbox";
import { CircleMotif } from "@/components/ui/circle-motif";
import type { CompareColumn } from "@/lib/types/recipe-compare-types";
import type { RecipeImage } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { swatchClasses } from "@/lib/utils/swatches";

const THUMBNAIL_LIMIT = 4;

interface CompareRecipePhotosProps {
  images: RecipeImage[];
  column: CompareColumn;
}

export function CompareRecipePhotos({
  images,
  column,
}: CompareRecipePhotosProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const classes = swatchClasses(column.swatch);
  const [main, ...rest] = images;
  const thumbnails = rest.slice(0, THUMBNAIL_LIMIT);
  const hidden = rest.length - thumbnails.length;

  if (!main) {
    return (
      <div
        aria-hidden
        className={cn(
          "relative h-40 overflow-hidden rounded-tile sm:h-48 xl:h-56",
          classes.bg,
        )}
      >
        <CircleMotif
          className={cn("-top-10 -right-10 size-40", classes.deep)}
        />
        <CircleMotif className="bottom-6 left-6 size-8 bg-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpenIndex(0)}
        aria-label={`Open photos of ${column.title}`}
        className="relative block h-40 w-full overflow-hidden rounded-tile sm:h-48 xl:h-56 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <Image
          src={`/api/recipes/images/${main.filename}`}
          alt={main.altText || ""}
          fill
          sizes="(min-width: 1024px) 30vw, 60vw"
          className="object-cover transition-transform duration-300 hover:scale-[1.03]"
          unoptimized
        />
      </button>
      {thumbnails.length > 0 && (
        <ul
          className="flex gap-2"
          aria-label={`More photos of ${column.title}`}
        >
          {thumbnails.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setOpenIndex(index + 1)}
                aria-label={`Open photo ${index + 2} of ${images.length}`}
                className="relative block size-12 overflow-hidden rounded-control outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <Image
                  src={`/api/recipes/images/${image.filename}`}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
                {hidden > 0 && index === thumbnails.length - 1 && (
                  <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-extrabold text-white">
                    +{hidden}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <PhotoLightbox
        images={images}
        title={column.title}
        openIndex={openIndex}
        onOpenIndexChange={setOpenIndex}
      />
    </div>
  );
}
