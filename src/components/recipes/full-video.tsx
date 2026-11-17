"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface FullVideoProps {
  src: string;
  title: string;
  autoPlay: boolean;
  className?: string;
}

// A video with the browser's own controls and sound on. It mounts muted, as
// autoplay rules require, and is unmuted straight away.
export function FullVideo({ src, title, autoPlay, className }: FullVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    if (autoPlay) video.play().catch(() => undefined);
  }, [autoPlay]);

  return (
    <video
      ref={videoRef}
      src={src}
      title={title}
      muted
      controls
      playsInline
      preload="metadata"
      className={cn(
        "aspect-video w-full rounded-control bg-black object-contain",
        className,
      )}
    />
  );
}
