"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RecipeImage } from "@/lib/types/recipe-types";
import { photoRoleLabel } from "@/lib/utils/photo-tags";

interface PhotoLightboxProps {
  images: RecipeImage[];
  title: string;
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
}

export function PhotoLightbox({
  images,
  title,
  openIndex,
  onOpenIndexChange,
}: PhotoLightboxProps) {
  const current = openIndex === null ? null : (images[openIndex] ?? null);
  const several = images.length > 1;
  const caption = current ? photoRoleLabel(current) : null;
  const move = (step: number) => {
    if (openIndex === null) return;
    onOpenIndexChange((openIndex + step + images.length) % images.length);
  };

  return (
    <Dialog
      open={current !== null}
      onOpenChange={(open) => !open && onOpenIndexChange(null)}
    >
      <DialogContent
        className="gap-3 p-3 sm:max-w-[min(calc(100vw-4rem),72rem)] sm:p-4"
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Photo {(openIndex ?? 0) + 1} of {images.length}
        </DialogDescription>
        {current && (
          <div className="relative aspect-[4/3] max-h-[calc(100dvh-9rem)] w-full overflow-hidden rounded-control bg-muted">
            <Image
              src={`/api/recipes/images/${current.filename}`}
              alt={current.altText || title}
              fill
              sizes="(max-width: 1200px) 100vw, 1152px"
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        {(several || caption) && (
          <div className="flex items-center justify-between gap-3">
            {several ? (
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous photo"
                className="grid size-11 shrink-0 place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : (
              <span className="size-11 shrink-0" />
            )}
            <p className="min-w-0 truncate text-center text-meta">
              {caption && <span className="font-semibold">{caption}</span>}
              {caption && several && (
                <span className="text-muted-foreground"> · </span>
              )}
              {several && (
                <span className="tabular text-muted-foreground">
                  {(openIndex ?? 0) + 1} / {images.length}
                </span>
              )}
            </p>
            {several ? (
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next photo"
                className="grid size-11 shrink-0 place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <ChevronRight className="size-5" />
              </button>
            ) : (
              <span className="size-11 shrink-0" />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
