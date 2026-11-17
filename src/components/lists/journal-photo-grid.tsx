"use client";

import Image from "next/image";
import { useState } from "react";
import { PhotoLightbox } from "@/components/modals/photo-lightbox";
import type { WallMonth } from "@/lib/types/journal-lookback-types";

interface JournalPhotoGridProps {
  months: WallMonth[];
}

export function JournalPhotoGrid({ months }: JournalPhotoGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const photos = months.flatMap((month) => month.photos);
  const lightboxPhotos = photos.map((photo) => ({
    id: photo.id,
    filename: photo.filename,
    altText: photo.caption,
    photoRole: null,
    stepNumbers: [],
  }));
  const captions = photos.map(
    (photo) =>
      `${photo.caption} · ${new Date(photo.happenedAt).toLocaleDateString(
        "en-CA",
        { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" },
      )}`,
  );
  const offsets = months.map((_, index) =>
    months.slice(0, index).reduce((sum, month) => sum + month.photos.length, 0),
  );

  return (
    <div className="space-y-8">
      {months.map((month, monthIndex) => (
        <section key={month.key} className="space-y-3">
          <h2 className="text-heading">{month.label}</h2>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {month.photos.map((photo, index) => {
              const position = offsets[monthIndex] + index;
              return (
                <li key={photo.id}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(position)}
                    aria-label={`Open ${captions[position]}`}
                    className="relative block aspect-square w-full overflow-hidden rounded-control bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  >
                    <Image
                      src={`/api/recipes/images/${photo.filename}`}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 200px"
                      className="object-cover transition-[scale] duration-300 ease-out motion-safe:hover:scale-105"
                      unoptimized
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <PhotoLightbox
        images={lightboxPhotos}
        title="Journal photos"
        openIndex={openIndex}
        onOpenIndexChange={setOpenIndex}
        captions={captions}
      />
    </div>
  );
}
