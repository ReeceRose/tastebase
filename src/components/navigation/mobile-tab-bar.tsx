"use client";

import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isNavItemActive,
  MOBILE_NAV,
  type NavItem,
} from "@/components/navigation/nav-items";
import { cn } from "@/lib/utils";

const tabClass =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded-xl";

export function MobileTabBar() {
  const pathname = usePathname();
  const [home, recipes, favourites] = MOBILE_NAV;
  const settingsActive = pathname.startsWith("/settings");

  const renderTab = (item: NavItem) => {
    const active = isNavItemActive(item, pathname);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          tabClass,
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <item.icon
          className={cn("size-[22px]", active && "fill-foreground/15")}
          strokeWidth={active ? 2.5 : 2}
        />
        {item.title}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex items-end gap-1 border-t border-border bg-card px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      {renderTab(home)}
      {renderTab(recipes)}
      <Link
        href="/recipes/new"
        className="flex flex-1 flex-col items-center gap-1 text-[11px] font-semibold outline-none"
      >
        <span className="-mt-6 grid size-14 place-items-center rounded-full bg-accent text-accent-foreground ring-4 ring-card focus-visible:ring-ring">
          <Plus className="size-7" strokeWidth={2.5} />
        </span>
        Add
      </Link>
      {renderTab(favourites)}
      <Link
        href="/settings"
        aria-current={settingsActive ? "page" : undefined}
        className={cn(
          tabClass,
          settingsActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <Settings
          className="size-[22px]"
          strokeWidth={settingsActive ? 2.5 : 2}
        />
        Settings
      </Link>
    </nav>
  );
}
