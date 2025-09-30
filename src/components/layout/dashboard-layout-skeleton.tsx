import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-24" />
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              <Skeleton className="h-3 w-16 mx-3 mb-4" />

              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={`nav-item-${index + 1}`}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>

            <div className="px-3 mt-6 space-y-1">
              <Skeleton className="h-3 w-20 mx-3 mb-4" />

              {[0, 1, 2].map((index) => (
                <div
                  key={`quick-access-${index + 1}`}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-8 rounded" />
                </div>
              ))}
            </div>

            <div className="px-3 mt-6 pt-4 border-t">
              <div className="flex items-center gap-3 px-3 py-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </nav>

          <div className="p-4 border-t">
            <div className="text-center space-y-2">
              <Skeleton className="h-3 w-32 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b">
          <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
            <Skeleton className="h-8 w-8 rounded lg:hidden" />

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded hidden sm:block" />
              <Skeleton className="h-8 w-8 rounded sm:hidden" />
              <Skeleton className="h-8 w-8 rounded" />

              <div className="w-px h-6 bg-border" />

              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="hidden md:block space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={`dashboard-card-${index + 1}`}
                  className="space-y-3 p-4 border rounded-lg"
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
