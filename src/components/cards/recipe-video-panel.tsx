import { ExternalLink } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { hostnameOf } from "@/lib/utils/hostname";
import { safeVideoLink, videoEmbedUrl } from "@/lib/utils/video-embed";

interface RecipeVideoPanelProps {
  title: string;
  videoUrl: string | null;
}

export function RecipeVideoPanel({ title, videoUrl }: RecipeVideoPanelProps) {
  const link = safeVideoLink(videoUrl);
  if (!link) return null;
  const embed = videoEmbedUrl(link);

  return (
    <Panel title="Video" className="space-y-4">
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
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        {embed ? "Open on" : "Watch on"} {hostnameOf(link)}
        <ExternalLink className="h-4 w-4" />
      </a>
    </Panel>
  );
}
