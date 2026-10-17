"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BrandMark } from "@/components/navigation/brand-mark";
import { NavCount } from "@/components/navigation/nav-count";
import {
  isNavItemActive,
  PRIMARY_NAV,
  QUICK_PICKS,
} from "@/components/navigation/nav-items";
import { Button } from "@/components/ui/button";
import { ButtonVariant, type NavCounts } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  counts: Promise<NavCounts>;
  household: React.ReactNode;
}

const itemClass =
  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 font-semibold transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-sidebar-ring";

function QuickPickLinks() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = search ? `${pathname}?${search}` : pathname;

  return QUICK_PICKS.map((pick) => {
    const active = current === pick.href;
    return (
      <Link
        key={pick.href}
        href={pick.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          itemClass,
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "hover:bg-sidebar-accent",
        )}
      >
        {pick.title}
      </Link>
    );
  });
}

export function AppSidebar({ counts, household }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[236px] shrink-0 flex-col bg-sidebar px-[18px] pt-[26px] pb-5 text-sidebar-foreground lg:flex">
      <BrandMark
        className="mb-6 px-2.5 text-white"
        wordmarkClassName="text-white"
      />

      <nav aria-label="Main" className="flex flex-col gap-1">
        {PRIMARY_NAV.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                itemClass,
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent",
              )}
            >
              {item.title}
              {item.countKey && (
                <Suspense fallback={null}>
                  <NavCount counts={counts} countKey={item.countKey} />
                </Suspense>
              )}
            </Link>
          );
        })}
      </nav>

      <p className="mt-6 mb-1.5 px-3 text-meta font-normal opacity-65">
        Quick picks
      </p>
      <nav aria-label="Quick picks" className="flex flex-col gap-1">
        <Suspense fallback={null}>
          <QuickPickLinks />
        </Suspense>
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        {household}
        <Button
          variant={ButtonVariant.ACCENT}
          size="lg"
          className="w-full"
          asChild
        >
          <Link href="/recipes/new">
            <Plus className="size-5" strokeWidth={2.5} />
            Add a recipe
          </Link>
        </Button>
      </div>
    </aside>
  );
}
