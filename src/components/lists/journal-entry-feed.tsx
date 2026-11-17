"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { JournalEntryCard } from "@/components/cards/journal-entry-card";
import { JournalEntryDialog } from "@/components/modals/journal-entry-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteJournalEntry } from "@/lib/server-actions/journal-actions";
import { JournalEntryKind } from "@/lib/types";
import type { JournalEntry, JournalGroup } from "@/lib/types/journal-types";
import { cn } from "@/lib/utils";
import { localDay } from "@/lib/utils/journal";
import { resolveSwatch, swatchClasses } from "@/lib/utils/swatches";

interface JournalEntryFeedProps {
  groups: JournalGroup[];
  currentUserId: string;
  showAuthor: boolean;
  showRecipe: boolean;
  timeline: boolean;
}

function markerClass(entry: JournalEntry): string {
  const first = entry.recipes.find((recipe) => recipe.recipeId);
  if (entry.kind !== JournalEntryKind.COOKED || !first?.recipeId) {
    return "bg-background ring-2 ring-foreground/40";
  }
  return swatchClasses(resolveSwatch(first.recipeId, first.swatch)).bg;
}

export function JournalEntryFeed({
  groups,
  currentUserId,
  showAuthor,
  showRecipe,
  timeline,
}: JournalEntryFeedProps) {
  const router = useRouter();
  const today = localDay();
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  const confirmDelete = () => {
    if (!deletingId) return;
    startDeleting(async () => {
      const result = await deleteJournalEntry(deletingId);
      if (result.success) {
        toast.success("Entry deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "That entry didn't delete. Try again.");
      }
      setDeletingId(null);
    });
  };

  return (
    <>
      <div className="space-y-8">
        {groups.map((group) => (
          <section
            key={group.key}
            id={`journal-${group.key}`}
            className="scroll-mt-24 space-y-3"
          >
            {group.label && (
              <h2 className="text-heading" suppressHydrationWarning>
                {group.label}
              </h2>
            )}
            <ol
              className={cn(
                "space-y-4",
                timeline && "ml-1.5 border-l-2 border-border pl-6",
              )}
            >
              {group.entries.map((entry) => (
                <li key={entry.id} className="relative">
                  {timeline && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-6 -left-[33px] size-3.5 rounded-full",
                        markerClass(entry),
                      )}
                    />
                  )}
                  <JournalEntryCard
                    entry={entry}
                    today={today}
                    isOwn={entry.userId === currentUserId}
                    showAuthor={showAuthor}
                    showRecipe={showRecipe}
                    onEdit={() => setEditing(entry)}
                    onDelete={() => setDeletingId(entry.id)}
                  />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <JournalEntryDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        entry={editing}
        presetRecipe={null}
        defaultKind={editing?.kind ?? JournalEntryKind.COOKED}
      />

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Its photos go with it. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete entry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
