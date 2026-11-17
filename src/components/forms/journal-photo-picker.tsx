"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { uploadRecipeImage } from "@/lib/server-actions/recipe-image-actions";
import type { JournalPhotoUpload } from "@/lib/types/journal-types";
import {
  JOURNAL_PHOTO_MAX,
  JOURNAL_PHOTO_MAX_BYTES,
  JOURNAL_PHOTO_TYPES,
} from "@/lib/utils/journal";

interface JournalPhotoPickerProps {
  photos: JournalPhotoUpload[];
  onPhotosChange: (
    update: (photos: JournalPhotoUpload[]) => JournalPhotoUpload[],
  ) => void;
  onUploadingChange: (uploading: boolean) => void;
}

export function JournalPhotoPicker({
  photos,
  onPhotosChange,
  onUploadingChange,
}: JournalPhotoPickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const room = JOURNAL_PHOTO_MAX - photos.length - pending.length;

  const upload = async (files: File[]) => {
    const accepted = files.filter(
      (file) =>
        JOURNAL_PHOTO_TYPES.includes(file.type) &&
        file.size <= JOURNAL_PHOTO_MAX_BYTES,
    );
    const chosen = accepted.slice(0, Math.max(room, 0));
    if (accepted.length < files.length) {
      setError("Use JPEG, PNG or WebP photos under 9.5 MB.");
    } else if (chosen.length < accepted.length) {
      setError(`Entries hold up to ${JOURNAL_PHOTO_MAX} photos.`);
    } else {
      setError(null);
    }
    if (chosen.length === 0) return;

    const queued = chosen.map((file) => ({ file, id: crypto.randomUUID() }));
    setPending((current) => [...current, ...queued.map((item) => item.id)]);
    onUploadingChange(true);
    for (const { file, id } of queued) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadRecipeImage(formData).catch(() => null);
      if (result?.success && result.file) {
        const saved = result.file;
        onPhotosChange((current) => [
          ...current,
          {
            filename: saved.filename,
            originalName: saved.originalName ?? null,
            mimeType: saved.mimeType,
            fileSize: saved.fileSize,
            width: saved.width ?? null,
            height: saved.height ?? null,
          },
        ]);
      } else {
        setError(result?.error ?? "A photo didn't upload. Try again.");
      }
      setPending((current) => current.filter((item) => item !== id));
    }
    onUploadingChange(false);
  };

  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-2" aria-label="Photos">
        {photos.map((photo) => (
          <li key={photo.filename} className="relative size-20">
            <Image
              src={`/api/recipes/images/${photo.filename}`}
              alt=""
              fill
              sizes="80px"
              className="rounded-control object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() =>
                onPhotosChange((current) =>
                  current.filter((item) => item.filename !== photo.filename),
                )
              }
              aria-label="Remove photo"
              className="absolute -top-1.5 -right-1.5 grid size-7 place-items-center rounded-full bg-foreground text-background outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
        {pending.map((id) => (
          <li
            key={`journal-photo-uploading-${id}`}
            className="grid size-20 place-items-center rounded-control bg-muted"
          >
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="sr-only">Uploading photo</span>
          </li>
        ))}
        {room > 0 && (
          <li>
            <label
              htmlFor={inputId}
              className="grid size-20 cursor-pointer place-items-center rounded-control border-2 border-dashed border-foreground/30 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring"
            >
              <ImagePlus className="size-5" />
              <span className="sr-only">Add photos</span>
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={JOURNAL_PHOTO_TYPES.join(",")}
              multiple
              className="sr-only"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (inputRef.current) inputRef.current.value = "";
                void upload(files);
              }}
            />
          </li>
        )}
      </ul>
      {error && (
        <p role="alert" className="text-meta text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
