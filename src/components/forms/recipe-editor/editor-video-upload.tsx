"use client";

import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ButtonVariant } from "@/lib/types";
import type { PendingVideo } from "@/lib/types/recipe-types";

interface EditorVideoUploadProps {
  onUploaded: (video: PendingVideo) => Promise<void>;
}

interface UploadErrorBody {
  error: string;
}

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const ACCEPTED_TYPES = "video/mp4,video/webm,video/quicktime";
const DURATION_TIMEOUT_MS = 5000;

// The browser reads the length from the file before it's sent, which saves
// the server from parsing video containers.
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const timer = window.setTimeout(() => finish(null), DURATION_TIMEOUT_MS);
    function finish(seconds: number | null) {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(seconds);
    }
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      finish(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => finish(null);
    video.src = url;
  });
}

function uploadVideo(
  file: File,
  durationSeconds: number | null,
  onProgress: (percent: number) => void,
): Promise<PendingVideo> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (durationSeconds !== null) {
      form.append("durationSeconds", String(durationSeconds));
    }
    const request = new XMLHttpRequest();
    request.open("POST", "/api/recipes/videos");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response as PendingVideo);
        return;
      }
      const body = request.response as UploadErrorBody | null;
      reject(new Error(body?.error ?? "That video didn't upload. Try again."));
    };
    request.onerror = () =>
      reject(new Error("That video didn't upload. Try again."));
    request.send(form);
  });
}

export function EditorVideoUpload({ onUploaded }: EditorVideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.size > MAX_VIDEO_BYTES) {
        toast.error(`${file.name} is larger than 50 MB`);
        continue;
      }
      setCurrent(file.name);
      setProgress(0);
      try {
        const duration = await readDuration(file);
        const video = await uploadVideo(file, duration, setProgress);
        await onUploaded(video);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "That video didn't upload",
        );
      }
    }
    setCurrent(null);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length > 0) uploadFiles(files);
        }}
      />
      <Button
        type="button"
        variant={ButtonVariant.OUTLINE}
        disabled={current !== null}
        onClick={() => inputRef.current?.click()}
      >
        {current ? <Loader2 className="animate-spin" /> : <Upload />}
        {current ? "Uploading" : "Upload a video"}
      </Button>
      {current ? (
        <div className="space-y-1.5" aria-live="polite">
          <p className="truncate text-meta text-muted-foreground">
            {current} · {progress}%
          </p>
          <Progress value={progress} />
        </div>
      ) : (
        <p className="text-meta text-muted-foreground">
          MP4 or WebM, up to 50 MB each.
        </p>
      )}
    </div>
  );
}
