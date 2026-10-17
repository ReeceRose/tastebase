import { StoragePanel } from "@/components/cards/storage-panel";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { getHouseholdOverview } from "@/lib/server-actions/household-actions";
import { getStorageStats } from "@/lib/server-actions/storage-actions";
import { AvatarSize } from "@/lib/types";
import { formatRelativeDay } from "@/lib/utils/time-formatting";

interface HouseholdSectionProps {
  currentUserId: string;
}

export async function HouseholdSection({
  currentUserId,
}: HouseholdSectionProps) {
  const members = await getHouseholdOverview();

  return (
    <div className="space-y-4">
      <p className="max-w-[60ch] text-muted-foreground">
        Everyone with an account on this Tastebase. They can all see shared
        recipes and leave notes. New people join by signing up on this server.
      </p>
      <ul className="divide-y-2 divide-background overflow-hidden rounded-tile bg-card">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-4 px-5 py-4">
            <MemberAvatar
              userId={member.id}
              name={member.name}
              size={AvatarSize.LG}
              decorative
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold">
                {member.name}
                {member.id === currentUserId && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-caption">
                    You
                  </span>
                )}
              </p>
              <p className="text-meta font-normal text-muted-foreground">
                Joined {formatRelativeDay(member.joinedAt)}
              </p>
            </div>
            <p className="shrink-0 text-right text-meta">
              <span className="block text-xl font-extrabold tabular">
                {member.sharedRecipes}
              </span>
              <span className="font-normal text-muted-foreground">shared</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function StorageSection() {
  const result = await getStorageStats();

  if (!result.success) {
    return (
      <p className="rounded-control bg-destructive/10 px-4 py-3 text-destructive">
        Storage details didn't load: {result.error}
      </p>
    );
  }

  return <StoragePanel initialStats={result.data} />;
}
