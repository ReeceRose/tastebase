"use client";

import Image from "next/image";
import { useState } from "react";
import { PhotoLightbox } from "@/components/modals/photo-lightbox";
import type { RecipeImage } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";

interface PhotoStripProps {
  images: RecipeImage[];
  title: string;
  minimum?: number;
  large?: boolean;
  label?: string;
}

export function PhotoStrip({
  images,
  title,
  minimum = 2,
  large = false,
  label = "Photos",
}: PhotoStripProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length < minimum) return null;

  return (
    <>
      <ul className="flex gap-2.5 overflow-x-auto pb-1" aria-label={label}>
        {images.map((image, index) => (
          <li key={image.id} className="shrink-0">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Open photo ${index + 1} of ${images.length}`}
              className={cn(
                "relative block overflow-hidden rounded-control outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
                large ? "aspect-[4/3] h-40 sm:h-52" : "size-20 sm:size-24",
              )}
            >
              <Image
                src={`/api/recipes/images/${image.filename}`}
                alt=""
                fill
                sizes={large ? "280px" : "96px"}
                className="object-cover"
                unoptimized
              />
            </button>
          </li>
        ))}
      </ul>
      <PhotoLightbox
        images={images}
        title={title}
        openIndex={openIndex}
        onOpenIndexChange={setOpenIndex}
      />
    </>
  );
}
