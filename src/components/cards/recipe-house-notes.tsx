"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { NoteBubble } from "@/components/cards/note-bubble";
import { NoteComposer } from "@/components/forms/note-composer";
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
import { Button } from "@/components/ui/button";
import { deleteRecipeNote } from "@/lib/server-actions/recipe-actions";
import { ButtonVariant } from "@/lib/types";
import type { RecipeNoteWithAuthor } from "@/lib/types/recipe-types";

interface RecipeHouseNotesProps {
  recipeId: string;
  notes: RecipeNoteWithAuthor[];
  currentUserId: string;
}

export function RecipeHouseNotes({
  recipeId,
  notes,
  currentUserId,
}: RecipeHouseNotesProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  const confirmDelete = () => {
    if (!deletingId) return;
    startDeleting(async () => {
      const result = await deleteRecipeNote(deletingId);
      if (result.success) {
        toast.success("Note deleted");
        router.refresh();
      } else {
        toast.error(result.error || "That note didn't delete. Try again.");
      }
      setDeletingId(null);
    });
  };

  return (
    <section aria-labelledby="house-notes-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="house-notes-title" className="text-lg font-extrabold">
          From the house
        </h2>
        {!adding && (
          <Button
            variant={ButtonVariant.OUTLINE}
            size="sm"
            onClick={() => {
              setEditingId(null);
              setAdding(true);
            }}
          >
            <Plus />
            Add a note
          </Button>
        )}
      </div>

      {adding && (
        <NoteComposer recipeId={recipeId} onDone={() => setAdding(false)} />
      )}

      {notes.length === 0 && !adding && (
        <p className="text-muted-foreground">
          No notes yet. Leave one after you cook it: what worked, what you
          changed.
        </p>
      )}

      {notes.map((note) =>
        editingId === note.id ? (
          <NoteComposer
            key={note.id}
            recipeId={recipeId}
            note={note}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <NoteBubble
            key={note.id}
            note={note}
            isOwn={note.userId === currentUserId}
            onEdit={() => {
              setAdding(false);
              setEditingId(note.id);
            }}
            onDelete={() => setDeletingId(note.id)}
          />
        ),
      )}

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be gone for everyone in the house. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
