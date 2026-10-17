"use client";

import { useState } from "react";
import { GlobalSearchModal } from "@/components/modals/global-search-modal";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { AppTopbar } from "@/components/navigation/app-topbar";
import { MobileTabBar } from "@/components/navigation/mobile-tab-bar";
import { NavCountsProvider } from "@/components/navigation/nav-counts-provider";
import { useGlobalSearchShortcut } from "@/hooks/use-keyboard-shortcuts";
import type { NavCounts } from "@/lib/types";

interface AppShellProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
  counts: Promise<NavCounts>;
  household: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ user, counts, household, children }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  useGlobalSearchShortcut(() => setSearchOpen(true));

  return (
    <NavCountsProvider counts={counts}>
      <div className="flex min-h-dvh bg-background">
        <AppSidebar counts={counts} household={household} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar user={user} onOpenSearch={() => setSearchOpen(true)} />
          <main
            id="main"
            className="w-full max-w-[1360px] flex-1 px-5 pt-5 pb-28 lg:px-9 lg:pt-6 lg:pb-12"
          >
            {children}
          </main>
        </div>
        <MobileTabBar />
        <GlobalSearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          userId={user.id}
        />
      </div>
    </NavCountsProvider>
  );
}
