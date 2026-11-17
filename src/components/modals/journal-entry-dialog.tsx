"use client";

import { JournalEntryForm } from "@/components/forms/journal-entry-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { JournalEntryKind } from "@/lib/types";
import type { JournalEntry } from "@/lib/types/journal-types";
import type { LinkedRecipe } from "@/lib/types/recipe-types";

interface JournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry | null;
  presetRecipe: LinkedRecipe | null;
  defaultKind: JournalEntryKind;
}

export function JournalEntryDialog({
  open,
  onOpenChange,
  entry,
  presetRecipe,
  defaultKind,
}: JournalEntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Edit entry" : "New journal entry"}
          </DialogTitle>
          <DialogDescription>
            Log something you made, or keep a note. Photos are welcome.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <JournalEntryForm
            key={entry?.id ?? "new"}
            entry={entry}
            presetRecipe={presetRecipe}
            defaultKind={defaultKind}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
