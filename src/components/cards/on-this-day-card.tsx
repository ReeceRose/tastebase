import Image from "next/image";
import Link from "next/link";
import type { JournalGroup } from "@/lib/types/journal-types";
import { cn } from "@/lib/utils";
import {
  dayToTimestamp,
  journalEntryHeading,
  journalRecipeTitles,
} from "@/lib/utils/journal";
import { resolveSwatch, swatchClasses } from "@/lib/utils/swatches";

interface OnThisDayCardProps {
  groups: JournalGroup[];
}

function longDay(day: string): string {
  return dayToTimestamp(day).toLocaleDateString("en-CA", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function OnThisDayCard({ groups }: OnThisDayCardProps) {
  return (
    <section className="rounded-tile bg-card p-6">
      <h2 className="mb-4 text-heading">On this day</h2>
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.key} className="space-y-3">
            <p className="text-meta">
              <span className="font-extrabold">{group.label}</span>
              <span className="text-muted-foreground">
                {" "}
                · {longDay(group.key)}
              </span>
            </p>
            <ul className="space-y-3">
              {group.entries.map((entry) => {
                const photo = entry.photos[0];
                const heading =
                  journalEntryHeading(entry) ??
                  journalRecipeTitles(entry) ??
                  "A note";
                const [only] = entry.recipes;
                const swatch = swatchClasses(
                  resolveSwatch(
                    only?.recipeId ?? entry.id,
                    only?.swatch ?? null,
                  ),
                );
                const href =
                  entry.recipes.length === 1 && only.slug
                    ? `/recipes/${only.slug}`
                    : "/journal";
                return (
                  <li key={entry.id}>
                    <Link
                      href={href}
                      className="-mx-2 flex gap-3 rounded-control p-2 outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <span
                        className={cn(
                          "relative size-16 shrink-0 overflow-hidden rounded-control",
                          !photo && swatch.bg,
                        )}
                      >
                        {photo && (
                          <Image
                            src={`/api/recipes/images/${photo.filename}`}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </span>
                      <span className="min-w-0 space-y-0.5">
                        <span className="block truncate font-extrabold">
                          {heading}
                        </span>
                        {entry.content && (
                          <span className="line-clamp-2 text-meta text-muted-foreground">
                            {entry.content}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
