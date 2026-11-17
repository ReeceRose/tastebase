import { JournalEntryFeed } from "@/components/lists/journal-entry-feed";
import { NewJournalEntryButton } from "@/components/modals/new-journal-entry-button";
import { EmptyState } from "@/components/ui/empty-state";
import { getJournal } from "@/lib/server-actions/journal-actions";
import { ButtonVariant, ComponentSize, JournalFilter } from "@/lib/types";
import { groupJournalByMonth } from "@/lib/utils/journal";

interface JournalTimelineProps {
  filter: JournalFilter;
  currentUserId: string;
}

const EMPTY_COPY: Record<JournalFilter, string> = {
  [JournalFilter.ALL]:
    "Log what you cook, with photos and how it went, or keep notes. They all land here, newest first.",
  [JournalFilter.COOKED]:
    "Nothing logged yet. After you make something, add it here with a photo.",
  [JournalFilter.NOTES]: "No notes yet. Use them for anything worth keeping.",
};

export async function JournalTimeline({
  filter,
  currentUserId,
}: JournalTimelineProps) {
  const journal = await getJournal(filter);

  if (!journal.success) {
    return (
      <p role="alert" className="text-destructive">
        {journal.error}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {journal.entries.length === 0 ? (
        <EmptyState
          title="Your journal is empty"
          description={EMPTY_COPY[filter]}
          action={
            <NewJournalEntryButton
              label="Add your first entry"
              presetRecipe={null}
              variant={ButtonVariant.ACCENT}
              size={ComponentSize.MD}
              initiallyOpen={false}
            />
          }
        />
      ) : (
        <JournalEntryFeed
          groups={groupJournalByMonth(journal.entries)}
          currentUserId={currentUserId}
          showAuthor={false}
          showRecipe
          timeline
        />
      )}
    </div>
  );
}
