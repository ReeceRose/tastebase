"use client";

import { Search } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { BrandMark } from "@/components/navigation/brand-mark";
import { Kbd } from "@/components/ui/kbd";

interface AppTopbarProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
  onOpenSearch: () => void;
}

export function AppTopbar({ user, onOpenSearch }: AppTopbarProps) {
  return (
    <header className="flex items-center gap-3 px-5 pt-5 pb-2 lg:gap-4 lg:px-9 lg:pt-6">
      <BrandMark className="lg:hidden" wordmarkClassName="text-[22px]" />
      <button
        type="button"
        onClick={onOpenSearch}
        className="ml-auto flex size-11 items-center justify-center rounded-control border-2 border-foreground bg-card text-muted-foreground outline-none transition-colors duration-150 hover:bg-card/80 focus-visible:ring-[3px] focus-visible:ring-ring/25 lg:ml-0 lg:h-12 lg:w-auto lg:flex-1 lg:justify-start lg:gap-3 lg:px-4"
      >
        <Search className="size-5 shrink-0 text-foreground" />
        <span className="sr-only lg:not-sr-only lg:flex-1 lg:text-left">
          Search recipes, ingredients or tags
        </span>
        <Kbd className="hidden lg:inline-flex">⌘ K</Kbd>
      </button>
      <UserMenu user={user} />
    </header>
  );
}
