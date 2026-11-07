"use client";

import { ArrowLeft, ArrowRight, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface EditorPhotoTileProps {
  src: string;
  alt: string;
  index: number;
  count: number;
  isDragging: boolean;
  isDropTarget: boolean;
  onMove: (to: number) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}

const tileButton =
  "grid size-9 place-items-center rounded-full bg-white/90 text-ink-fixed outline-none hover:bg-white focus-visible:ring-[3px] focus-visible:ring-ring";

export function EditorPhotoTile({
  src,
  alt,
  index,
  count,
  isDragging,
  isDropTarget,
  onMove,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: EditorPhotoTileProps) {
  const isMain = index === 0;

  return (
    <li
      draggable={count > 1}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "relative aspect-[4/3] overflow-hidden rounded-control bg-muted",
        count > 1 && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
        isDropTarget && "ring-[3px] ring-ring",
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="240px"
        className="pointer-events-none object-cover"
        draggable={false}
        unoptimized
      />
      {isMain && (
        <span className="absolute top-2 left-2 rounded-full bg-accent px-2.5 py-0.5 text-caption text-accent-foreground">
          Main photo
        </span>
      )}
      {count > 1 && (
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          {index > 0 && (
            <button
              type="button"
              className={tileButton}
              onClick={() => onMove(index - 1)}
              aria-label={`Move photo ${index + 1} earlier`}
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          {index < count - 1 && (
            <button
              type="button"
              className={tileButton}
              onClick={() => onMove(index + 1)}
              aria-label={`Move photo ${index + 1} later`}
            >
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      )}
      <div className="absolute right-2 bottom-2 flex gap-1.5">
        {!isMain && (
          <button
            type="button"
            className={tileButton}
            onClick={() => onMove(0)}
            aria-label="Make this the main photo"
          >
            <Star className="size-4" />
          </button>
        )}
        <button
          type="button"
          className={tileButton}
          onClick={onRemove}
          aria-label="Delete photo"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
