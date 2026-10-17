import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { SavedRecipeMatch } from "@/lib/types/import-types";
import { formatRelativeDay } from "@/lib/utils/time-formatting";

interface SavedRecipeNoticeProps {
  match: SavedRecipeMatch;
}

function whenSaved(date: Date): string {
  const day = formatRelativeDay(date);
  return /^(Today|Yesterday)$/.test(day) ? day.toLowerCase() : `on ${day}`;
}

export function SavedRecipeNotice({ match }: SavedRecipeNoticeProps) {
  const who = match.isOwn ? "You" : match.savedBy;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-control bg-accent px-4 py-3 text-accent-foreground">
      <p className="flex-1">
        {who} already saved this recipe {whenSaved(new Date(match.savedAt))}.
        Saving it again makes a second copy.
      </p>
      <Link
        href={`/recipes/${match.slug}`}
        className="inline-flex items-center gap-1.5 rounded-sm font-semibold underline-offset-2 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        Open {match.isOwn ? "your copy" : "it"}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}
