"use client";

import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VideoPreviewDialog } from "@/components/modals/video-preview-dialog";
import { FullVideo } from "@/components/recipes/full-video";
import { cn } from "@/lib/utils";

interface RecipeVideoPlayerProps {
  src: string;
  title: string;
  clip: boolean;
  autoPlay?: boolean;
  className?: string;
}

const controlButton =
  "grid size-9 place-items-center rounded-full bg-white/90 text-ink-fixed outline-none hover:bg-white focus-visible:ring-[3px] focus-visible:ring-ring";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RecipeVideoPlayer({
  src,
  title,
  clip,
  autoPlay = false,
  className,
}: RecipeVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!clip || !video || paused || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => setPlaying(false));
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [clip, paused]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setPaused(false);
      video.play().catch(() => setPlaying(false));
    } else {
      setPaused(true);
      video.pause();
    }
  };

  const expand = () => {
    videoRef.current?.pause();
    setPaused(true);
    setExpanded(true);
  };

  const closeExpanded = () => {
    setExpanded(false);
    setPaused(false);
  };

  const toggleMuted = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  if (!clip) {
    return (
      <FullVideo
        src={src}
        title={title}
        autoPlay={autoPlay}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-control bg-muted",
        className,
      )}
    >
      <video
        ref={videoRef}
        src={`${src}#t=0.1`}
        title={title}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
        className="size-full object-cover"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={expand}
        className="absolute inset-0 cursor-zoom-in outline-none"
      />
      <div className="absolute right-2 bottom-2 flex gap-1.5">
        <button
          type="button"
          className={controlButton}
          onClick={expand}
          aria-label={`Watch ${title} larger`}
        >
          <Maximize2 className="size-4" />
        </button>
        <button
          type="button"
          className={controlButton}
          onClick={togglePlay}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          type="button"
          className={controlButton}
          onClick={toggleMuted}
          aria-label={muted ? `Turn on sound for ${title}` : `Mute ${title}`}
          aria-pressed={!muted}
        >
          {muted ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </button>
      </div>
      <VideoPreviewDialog
        preview={expanded ? { src, title, description: null } : null}
        onClose={closeExpanded}
      />
    </div>
  );
}
