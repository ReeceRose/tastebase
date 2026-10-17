import Link from "next/link";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { ActivityKind, type HouseActivityItem } from "@/lib/types";
import { formatRelativeDay } from "@/lib/utils/time-formatting";

interface HouseActivityProps {
  items: HouseActivityItem[];
}

const ACTION_LABELS: Record<ActivityKind, string> = {
  [ActivityKind.ADDED]: "added",
  [ActivityKind.NOTE]: "left a note on",
  [ActivityKind.COOKED]: "cooked",
  [ActivityKind.EDITED]: "updated",
};

export function HouseActivity({ items }: HouseActivityProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        When others in your house add recipes or leave notes, you'll see it
        here.
      </p>
    );
  }

  return (
    <ul className="divide-y-2 divide-background">
      {items.map((item) => (
        <li
          key={item.id}
          className="grid grid-cols-[30px_1fr_auto] items-start gap-3 py-3 first:pt-0 last:pb-0"
        >
          <MemberAvatar
            userId={item.actor.id}
            name={item.actor.name}
            decorative
          />
          <p className="min-w-0">
            <span className="font-extrabold">{item.actor.name}</span>{" "}
            {ACTION_LABELS[item.kind]}{" "}
            <Link
              href={`/recipes/${item.recipe.slug}`}
              className="font-extrabold underline decoration-2 decoration-transparent underline-offset-4 outline-none hover:decoration-accent focus-visible:decoration-accent"
            >
              {item.recipe.title}
            </Link>
            {item.excerpt && (
              <span className="mt-1 block text-muted-foreground">
                {item.kind === ActivityKind.NOTE
                  ? `“${item.excerpt}”`
                  : item.excerpt}
              </span>
            )}
          </p>
          <span className="text-meta font-normal text-muted-foreground">
            {formatRelativeDay(item.at)}
          </span>
        </li>
      ))}
    </ul>
  );
}
