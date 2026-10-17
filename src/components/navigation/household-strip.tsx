import Link from "next/link";
import { MemberAvatarStack } from "@/components/ui/member-avatar-stack";
import { getHouseholdMembers } from "@/lib/server-actions/household-actions";

export async function HouseholdStrip() {
  const members = await getHouseholdMembers();
  if (members.length === 0) return null;

  const label =
    members.length === 1 ? "Just you so far" : `${members.length} cooks here`;

  return (
    <Link
      href="/settings?section=household"
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 outline-none hover:bg-sidebar-accent focus-visible:ring-[3px] focus-visible:ring-sidebar-ring"
    >
      <span className="text-meta font-normal opacity-80">{label}</span>
      <MemberAvatarStack
        members={members}
        max={4}
        ringClassName="ring-sidebar"
      />
    </Link>
  );
}

export function HouseholdStripSkeleton() {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="h-3.5 w-24 animate-pulse rounded-full bg-sidebar-accent" />
      <div className="flex">
        {[0, 1, 2].map((index) => (
          <span
            key={`household-avatar-skeleton-${index}`}
            className="-ml-2 size-[30px] animate-pulse rounded-full bg-sidebar-accent ring-2 ring-sidebar first:ml-0"
          />
        ))}
      </div>
    </div>
  );
}
