import { ExternalLink } from "lucide-react";
import { RecipeVideoPlayer } from "@/components/recipes/recipe-video-player";
import { Panel } from "@/components/ui/panel";
import type { RecipeVideo } from "@/lib/types/recipe-types";
import { hostnameOf } from "@/lib/utils/hostname";
import { safeVideoLink, videoEmbedUrl } from "@/lib/utils/video-embed";

interface RecipeVideoPanelProps {
  title: string;
  videoUrl: string | null;
  videos: RecipeVideo[];
}

export function RecipeVideoPanel({
  title,
  videoUrl,
  videos,
}: RecipeVideoPanelProps) {
  const link = safeVideoLink(videoUrl);
  if (!link && videos.length === 0) return null;
  const embed = link ? videoEmbedUrl(link) : null;

  return (
    <Panel title={videos.length > 1 ? "Videos" : "Video"} className="space-y-4">
      {videos.map((video) => (
        <RecipeVideoPlayer
          key={video.id}
          src={`/api/recipes/videos/${video.filename}`}
          title={video.title ?? `Video: ${title}`}
          clip={false}
        />
      ))}
      {embed && (
        <div className="aspect-video overflow-hidden rounded-control bg-muted">
          <iframe
            src={embed}
            title={`Video: ${title}`}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          {embed ? "Open on" : "Watch on"} {hostnameOf(link)}
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </Panel>
  );
}
