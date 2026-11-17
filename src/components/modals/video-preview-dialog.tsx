"use client";

import { FullVideo } from "@/components/recipes/full-video";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface VideoPreview {
  src: string;
  title: string;
  description: string | null;
}

interface VideoPreviewDialogProps {
  preview: VideoPreview | null;
  onClose: () => void;
}

export function VideoPreviewDialog({
  preview,
  onClose,
}: VideoPreviewDialogProps) {
  return (
    <Dialog
      open={preview !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{preview?.title ?? "Video"}</DialogTitle>
          <DialogDescription className={cn(!preview?.description && "sr-only")}>
            {preview?.description ?? "Preview of the video"}
          </DialogDescription>
        </DialogHeader>
        {preview && (
          <FullVideo
            key={preview.src}
            src={preview.src}
            title={preview.title}
            autoPlay
            className="max-h-[75dvh]"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
