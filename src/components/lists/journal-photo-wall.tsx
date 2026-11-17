import Link from "next/link";
import { JournalPhotoGrid } from "@/components/lists/journal-photo-grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getJournalPhotos } from "@/lib/server-actions/journal-lookback-actions";
import { ButtonVariant } from "@/lib/types";
import { groupPhotosByMonth } from "@/lib/utils/journal-lookback";

export async function JournalPhotoWall() {
  const photos = await getJournalPhotos();

  if (photos.length === 0) {
    return (
      <EmptyState
        title="No photos yet"
        description="Add photos to your journal entries and they'll all collect here."
        action={
          <Button variant={ButtonVariant.ACCENT} asChild>
            <Link href="/journal">Go to your journal</Link>
          </Button>
        }
      />
    );
  }

  return <JournalPhotoGrid months={groupPhotosByMonth(photos)} />;
}
