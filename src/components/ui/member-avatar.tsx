import { AvatarSize } from "@/lib/types";
import { cn } from "@/lib/utils";
import { memberSwatch, swatchClasses } from "@/lib/utils/swatches";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  [AvatarSize.SM]: "size-6 text-[11px]",
  [AvatarSize.MD]: "size-[30px] text-[13px]",
  [AvatarSize.LG]: "size-11 text-base",
};

interface MemberAvatarProps {
  userId: string;
  name: string;
  size?: AvatarSize;
  className?: string;
  decorative?: boolean;
}

export function memberInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toLocaleUpperCase() : "?";
}

export function MemberAvatar({
  userId,
  name,
  size = AvatarSize.MD,
  className,
  decorative = false,
}: MemberAvatarProps) {
  const swatch = swatchClasses(memberSwatch(userId));

  return (
    <span
      data-slot="member-avatar"
      title={name}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-extrabold leading-none select-none",
        swatch.bg,
        swatch.fg,
        SIZE_CLASSES[size],
        className,
      )}
    >
      <span aria-hidden>{memberInitial(name)}</span>
      {!decorative && <span className="sr-only">{name}</span>}
    </span>
  );
}
