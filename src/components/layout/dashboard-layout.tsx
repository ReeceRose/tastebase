"use client";

import {
  Book,
  Bot,
  ChefHat,
  Clock,
  FileText,
  Heart,
  Menu,
  Plus,
  Search,
  Settings,
  Star,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { GlobalSearchModal } from "@/components/modals/global-search-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useGlobalSearchShortcut } from "@/hooks/use-keyboard-shortcuts";

interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
}

const navigationItems: NavItem[] = [
  {
    title: "All Recipes",
    href: "/recipes",
    icon: Book,
    description: "Browse your complete recipe collection",
  },
  {
    title: "Add Recipe",
    href: "/recipes/new",
    icon: Plus,
    description: "Create a new recipe",
  },
  {
    title: "Recipe Discovery",
    href: "/recipes/discover",
    icon: Bot,
    badge: "AI",
    description: "Discover recipes with AI assistance",
  },
  {
    title: "Search",
    href: "/search",
    icon: Search,
    description: "Find recipes by ingredients or name",
  },
  {
    title: "Favorites",
    href: "/recipes/favorites",
    icon: Heart,
    description: "Your starred recipes",
  },
  {
    title: "Recent",
    href: "/recipes/recent",
    icon: Clock,
    description: "Recently viewed or edited",
  },
  {
    title: "Tags",
    href: "/recipes/tags",
    icon: Tags,
    description: "Browse by cuisine, diet, and more",
  },
  {
    title: "Templates",
    href: "/templates",
    icon: FileText,
    description: "Manage your note templates",
  },
];

const quickAccessItems: NavItem[] = [
  {
    title: "Quick Meals",
    href: "/recipes?filter=quick",
    icon: Clock,
    badge: "30 min",
  },
  {
    title: "Highly Rated",
    href: "/recipes?filter=top-rated",
    icon: Star,
    badge: "4.5+",
  },
  {
    title: "Easy Recipes",
    href: "/recipes?filter=easy",
    icon: ChefHat,
  },
];

function SidebarContent({
  pathname,
  onOpenGlobalSearch,
}: {
  pathname: string;
  onOpenGlobalSearch: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border">
        <div className="flex h-14 items-center gap-2 px-6">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">TasteBase</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2">
          <div className="space-y-2">
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight">
                Recipes
              </h2>
              <div className="space-y-1">
                {navigationItems.map((item) =>
                  item.href === "/search" ? (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={onOpenGlobalSearch}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span className="flex-1 text-left">{item.title}</span>
                      <div className="ml-auto">
                        <kbd className="pointer-events-none select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 flex h-4">
                          ⌘ K
                        </kbd>
                      </div>
                    </Button>
                  ) : (
                    <Button
                      key={item.href}
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span className="flex-1 text-left">{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  ),
                )}
              </div>
            </div>

            <Separator />

            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight">
                Quick Access
              </h2>
              <div className="space-y-1">
                {quickAccessItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="px-3 py-2">
              <Button
                variant={pathname === "/settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </nav>
      </ScrollArea>
    </div>
  );
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const pathname = usePathname();

  useGlobalSearchShortcut(() => setGlobalSearchOpen(true));

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col">
        <SidebarContent
          pathname={pathname}
          onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
        />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden lg:border-l border-border">
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>
                    Access recipe management and application navigation
                  </SheetDescription>
                </VisuallyHidden>
                <SidebarContent
                  pathname={pathname}
                  onOpenGlobalSearch={() => {
                    setGlobalSearchOpen(true);
                    setSidebarOpen(false);
                  }}
                />
              </SheetContent>
            </Sheet>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipe
                </Link>
              </Button>

              <Button size="icon" className="sm:hidden" asChild>
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add Recipe</span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                className="relative hidden sm:flex sm:items-center sm:gap-2 sm:px-3 sm:h-8"
                onClick={() => setGlobalSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span className="hidden md:inline text-sm text-muted-foreground">
                  Search
                </span>
                <div className="hidden lg:flex items-center gap-0.5 ml-auto">
                  <kbd className="pointer-events-none select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 flex h-5">
                    ⌘ K
                  </kbd>
                </div>
              </Button>

              <Button variant="ghost" size="icon" className="sm:hidden" asChild>
                <Link href="/search">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search recipes</span>
                </Link>
              </Button>

              <ThemeToggle />

              <Separator orientation="vertical" className="h-6" />

              <UserMenu user={user} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        userId={user.id}
      />
    </div>
  );
}
