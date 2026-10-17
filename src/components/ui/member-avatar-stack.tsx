import { MemberAvatar } from "@/components/ui/member-avatar";
import { AvatarSize, type HouseholdMember } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MemberAvatarStackProps {
  members: HouseholdMember[];
  max?: number;
  size?: AvatarSize;
  ringClassName?: string;
  className?: string;
}

export function MemberAvatarStack({
  members,
  max = 5,
  size = AvatarSize.MD,
  ringClassName = "ring-background",
  className,
}: MemberAvatarStackProps) {
  const visible = members.slice(0, max);
  const hidden = members.length - visible.length;
  const label = members.map((member) => member.name).join(", ");

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("flex items-center", className)}
    >
      {visible.map((member) => (
        <MemberAvatar
          key={member.id}
          userId={member.id}
          name={member.name}
          size={size}
          decorative
          className={cn("-ml-2 ring-2 first:ml-0", ringClassName)}
        />
      ))}
      {hidden > 0 && (
        <span
          aria-hidden
          className={cn(
            "-ml-2 inline-grid size-[30px] place-items-center rounded-full bg-muted text-caption ring-2",
            ringClassName,
          )}
        >
          +{hidden}
        </span>
      )}
    </div>
  );
}
