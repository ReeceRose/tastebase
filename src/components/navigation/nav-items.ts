import {
  Clock,
  Heart,
  House,
  type LucideIcon,
  NotebookText,
  Tags,
} from "lucide-react";
import { NavCountKey } from "@/lib/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  countKey?: NavCountKey;
  matchPrefixes?: string[];
}

export interface QuickPick {
  title: string;
  href: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { title: "Home", href: "/", icon: House },
  {
    title: "Recipes",
    href: "/recipes",
    icon: NotebookText,
    countKey: NavCountKey.RECIPES,
    matchPrefixes: ["/search"],
  },
  {
    title: "Favourites",
    href: "/recipes/favourites",
    icon: Heart,
    countKey: NavCountKey.FAVOURITES,
  },
  { title: "Recent", href: "/recipes/recent", icon: Clock },
  { title: "Tags", href: "/recipes/tags", icon: Tags },
];

export const MOBILE_NAV: NavItem[] = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[1],
  PRIMARY_NAV[2],
];

export const QUICK_PICKS: QuickPick[] = [
  { title: "Under 30 minutes", href: "/recipes?maxTime=30" },
  { title: "Top rated", href: "/recipes?sort=averageRating" },
  { title: "Easy wins", href: "/recipes?difficulty=easy" },
];

const RESERVED_RECIPE_PATHS = new Set([
  "/recipes/favourites",
  "/recipes/favorites",
  "/recipes/recent",
  "/recipes/tags",
  "/recipes/new",
]);

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  if (pathname === item.href) return true;
  if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  if (item.href === "/recipes") {
    return (
      pathname.startsWith("/recipes/") &&
      ![...RESERVED_RECIPE_PATHS].some((path) => pathname.startsWith(path))
    );
  }
  return pathname.startsWith(`${item.href}/`);
}
