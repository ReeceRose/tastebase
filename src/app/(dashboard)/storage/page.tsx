import { Suspense } from "react";
import { StorageOverview } from "@/components/cards/storage-overview";
import { StorageOverviewSkeleton } from "@/components/skeletons/storage-overview-skeleton";

export const metadata = {
  title: "Storage Management - Tastebase",
  description: "Manage your recipe data storage and disk usage",
};

export default function StoragePage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Storage Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor your recipe data storage and disk usage
        </p>
      </div>

      <Suspense fallback={<StorageOverviewSkeleton />}>
        <StorageOverview />
      </Suspense>
    </div>
  );
}
