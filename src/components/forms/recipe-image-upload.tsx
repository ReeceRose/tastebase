"use client";

import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 9.5 * 1024 * 1024;

interface RecipeImageUploadProps {
  onSubmit: (image: File) => void;
  isProcessing: boolean;
  description: string;
}

export function RecipeImageUpload({
  onSubmit,
  isProcessing,
  description,
}: RecipeImageUploadProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (candidate: File | null) => {
    if (!candidate) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setError("Use a JPEG, PNG or WebP image");
      return;
    }
    if (candidate.size > MAX_IMAGE_BYTES) {
      setError("Images must be smaller than 9.5 MB");
      return;
    }
    setError(null);
    setFile(candidate);
  };

  return (
    <div className="space-y-4">
      <Label htmlFor={inputId}>Photo of a recipe</Label>
      {previewUrl && file ? (
        <div className="relative w-full overflow-hidden rounded-lg border bg-muted">
          <Image
            src={previewUrl}
            alt="Selected recipe"
            width={800}
            height={600}
            className="max-h-80 w-full object-contain"
            unoptimized
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute right-2 top-2"
            onClick={() => setFile(null)}
            disabled={isProcessing}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors duration-200",
            dragActive
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:bg-muted/30",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            selectFile(event.dataTransfer.files[0] ?? null);
          }}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">
            Drop a photo here, or click to choose one
          </span>
          <span className="text-xs text-muted-foreground">
            JPEG, PNG or WebP, up to 9.5 MB
          </span>
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          selectFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <p className="text-sm text-muted-foreground">{description}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        className="w-full"
        onClick={() => file && onSubmit(file)}
        disabled={!file || isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="mr-2 h-4 w-4" />
        )}
        Read recipe from photo
      </Button>
    </div>
  );
}
