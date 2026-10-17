import Link from "next/link";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { AvatarSize, type RecipeSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { swatchClasses } from "@/lib/utils/swatches";
import {
  formatElapsed,
  formatRelativeDay,
  formatTotalTime,
} from "@/lib/utils/time-formatting";

interface RecipeRowListProps {
  recipes: RecipeSummary[];
  currentUserId: string;
  showLastViewed?: boolean;
  showElapsed?: boolean;
}

export function RecipeRowList({
  recipes,
  currentUserId,
  showLastViewed = false,
  showElapsed = false,
}: RecipeRowListProps) {
  return (
    <ul className="-mx-3 divide-y-2 divide-background">
      {recipes.map((recipe) => {
        const time = formatTotalTime(recipe.totalMinutes);
        const when = !recipe.lastViewedAt
          ? null
          : showElapsed
            ? formatElapsed(recipe.lastViewedAt)
            : showLastViewed
              ? formatRelativeDay(recipe.lastViewedAt)
              : null;
        const author =
          recipe.author.id === currentUserId ? "You" : recipe.author.name;

        return (
          <li key={recipe.id}>
            <Link
              href={`/recipes/${recipe.slug}`}
              className="flex min-h-14 items-center gap-3.5 rounded-control px-3 py-2.5 outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <span
                aria-hidden
                className={cn(
                  "size-3.5 shrink-0 rounded-full",
                  swatchClasses(recipe.swatch).bg,
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold tracking-[-0.01em]">
                  {recipe.title}
                </span>
                <span className="block truncate text-meta font-normal text-muted-foreground">
                  {[author, time, recipe.isPublic ? null : "Only you"]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              {when && (
                <span className="shrink-0 text-meta text-muted-foreground">
                  {when}
                </span>
              )}
              <MemberAvatar
                userId={recipe.author.id}
                name={recipe.author.name}
                size={AvatarSize.SM}
                decorative
                className="hidden sm:inline-grid"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
