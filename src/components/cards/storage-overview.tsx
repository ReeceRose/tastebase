import { StorageSettingsForm } from "@/components/forms/storage-settings-form";
import { getStorageStats } from "@/lib/server-actions/storage-actions";

export async function StorageOverview() {
  const result = await getStorageStats();

  if (!result.success) {
    return (
      <div className="p-6 text-center border rounded-lg">
        <p className="text-muted-foreground">
          Failed to load storage statistics: {result.error}
        </p>
      </div>
    );
  }

  return <StorageSettingsForm initialStats={result.data} />;
}
