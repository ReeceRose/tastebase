"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RecipeImage } from "@/lib/types/recipe-types";

interface PhotoStripProps {
  images: RecipeImage[];
  title: string;
}

export function PhotoStrip({ images, title }: PhotoStripProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length < 2) return null;

  const current = openIndex === null ? null : images[openIndex];
  const move = (step: number) =>
    setOpenIndex((index) =>
      index === null ? index : (index + step + images.length) % images.length,
    );

  return (
    <>
      <ul className="flex gap-2.5 overflow-x-auto pb-1" aria-label="Photos">
        {images.map((image, index) => (
          <li key={image.id} className="shrink-0">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Open photo ${index + 1} of ${images.length}`}
              className="relative block size-20 overflow-hidden rounded-control outline-none focus-visible:ring-[3px] focus-visible:ring-ring sm:size-24"
            >
              <Image
                src={`/api/recipes/images/${image.filename}`}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={current !== null}
        onOpenChange={(open) => !open && setOpenIndex(null)}
      >
        <DialogContent className="max-w-4xl gap-3 p-3 sm:p-4">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Photo {(openIndex ?? 0) + 1} of {images.length}
          </DialogDescription>
          {current && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-control bg-muted">
              <Image
                src={`/api/recipes/images/${current.filename}`}
                alt={current.altText || title}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous photo"
              className="grid size-11 place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-meta tabular">
              {(openIndex ?? 0) + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next photo"
              className="grid size-11 place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
