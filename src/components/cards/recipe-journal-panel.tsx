import { RecipeHistorySummary } from "@/components/cards/recipe-history-summary";
import { JournalEntryFeed } from "@/components/lists/journal-entry-feed";
import { NewJournalEntryButton } from "@/components/modals/new-journal-entry-button";
import { ButtonVariant, ComponentSize } from "@/lib/types";
import type { RecipeHistory } from "@/lib/types/journal-lookback-types";
import type { JournalEntry } from "@/lib/types/journal-types";
import type { LinkedRecipe } from "@/lib/types/recipe-types";

interface RecipeJournalPanelProps {
  recipe: LinkedRecipe;
  entries: JournalEntry[];
  history: RecipeHistory;
  currentUserId: string;
  openComposer: boolean;
}

export function RecipeJournalPanel({
  recipe,
  entries,
  history,
  currentUserId,
  openComposer,
}: RecipeJournalPanelProps) {
  return (
    <section className="space-y-3 pt-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Cook log</h2>
        <NewJournalEntryButton
          label="Log a cook"
          presetRecipe={recipe}
          variant={ButtonVariant.OUTLINE}
          size={ComponentSize.SM}
          initiallyOpen={openComposer}
        />
      </div>
      <RecipeHistorySummary history={history} />
      {entries.length === 0 ? (
        <p className="px-1 text-muted-foreground">
          Made this? Log it with a photo and how it went. It goes in your
          journal too.
        </p>
      ) : (
        <JournalEntryFeed
          groups={[{ key: recipe.id, label: null, entries }]}
          currentUserId={currentUserId}
          showAuthor
          showRecipe={false}
          timeline={false}
        />
      )}
    </section>
  );
}
