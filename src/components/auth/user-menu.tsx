"use client";

import {
  LogOut,
  Monitor,
  Moon,
  NotebookPen,
  Settings,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { authClient } from "@/lib/auth/auth-client";
import { AvatarSize, Theme } from "@/lib/types";

interface UserMenuProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
}

const THEME_OPTIONS = [
  { value: Theme.LIGHT, label: "Light", icon: Sun },
  { value: Theme.DARK, label: "Dark", icon: Moon },
  { value: Theme.SYSTEM, label: "Match my device", icon: Monitor },
];

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const name = user.name || user.email.split("@")[0];

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/sign-in");
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Your account"
        className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <MemberAvatar
          userId={user.id}
          name={name}
          size={AvatarSize.LG}
          decorative
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel className="flex items-center gap-3 py-2 font-normal">
          <MemberAvatar userId={user.id} name={name} decorative />
          <span className="min-w-0">
            <span className="block truncate font-extrabold">{name}</span>
            <span className="block truncate text-meta font-normal text-muted-foreground">
              {user.email}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings?section=templates">
            <NotebookPen />
            Note templates
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun />
            Appearance
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as Theme)}
            >
              {THEME_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  <option.icon />
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
