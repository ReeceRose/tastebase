"use client";

import { Edit2, MessageSquare, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RecipeNoteForm } from "@/components/forms/recipe-note-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RatingDisplay } from "@/components/ui/rating-display";
import { deleteRecipeNote } from "@/lib/server-actions/recipe-actions";
import { ComponentSize, RatingVariant } from "@/lib/types";
import type { RecipeNote } from "@/lib/types/recipe-types";

interface RecipeNotesListProps {
  recipeId: string;
  notes: RecipeNote[];
  onNotesChange?: (updatedNotes?: RecipeNote[]) => void;
  onOptimisticUpdate?: (notes: RecipeNote[]) => void;
  className?: string;
}

export function RecipeNotesList({
  recipeId,
  notes,
  onNotesChange,
  onOptimisticUpdate,
  className,
}: RecipeNotesListProps) {
  const [editingNote, setEditingNote] = useState<RecipeNote | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const handleDeleteNote = async (noteId: string) => {
    try {
      // Optimistically remove the note from the UI
      const updatedNotes = notes.filter((note) => note.id !== noteId);
      if (onOptimisticUpdate) {
        onOptimisticUpdate(updatedNotes);
      }

      const result = await deleteRecipeNote(noteId);

      if (result.success) {
        toast.success("Note deleted successfully");
        // Notify parent with the updated notes
        onNotesChange?.(updatedNotes);
      } else {
        toast.error(result.error || "Failed to delete note");
        // Revert the optimistic update by restoring the original notes
        if (onOptimisticUpdate) {
          onOptimisticUpdate(notes);
        }
        onNotesChange?.(); // Trigger a refresh
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("An unexpected error occurred");
      // Revert the optimistic update by restoring the original notes
      if (onOptimisticUpdate) {
        onOptimisticUpdate(notes);
      }
      onNotesChange?.(); // Trigger a refresh
    } finally {
      setDeletingNoteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (notes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No notes yet</h3>
          <p className="text-muted-foreground mb-4">
            Share your thoughts, modifications, or cooking tips for this recipe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className={`space-y-4 ${className || ""}`}>
        {notes.map((note) => (
          <Card
            key={note.id}
            className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border-l-4 border-l-primary/20 hover:border-l-primary/60"
          >
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {note.rating && (
                      <div className="mb-3 p-3 bg-muted/30 rounded-lg border">
                        <RatingDisplay
                          rating={note.rating}
                          showValue={true}
                          size={ComponentSize.SM}
                          variant={RatingVariant.DETAILED}
                        />
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 to-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground pl-2">
                        {note.content}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size={ComponentSize.SM}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary/10"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => setEditingNote(note)}
                        className="cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Note
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingNoteId(note.id)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Note
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gradient-to-r from-transparent via-border to-transparent">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-primary/40" />
                      <span>{formatDate(note.createdAt?.toISOString())}</span>
                    </div>
                    {note.updatedAt !== note.createdAt && (
                      <div className="flex items-center gap-1">
                        <Edit2 className="h-3 w-3" />
                        <span>
                          edited {formatDate(note.updatedAt?.toISOString())}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {note.isPrivate && (
                      <Badge
                        variant="outline"
                        className="border-muted-foreground/50 text-muted-foreground text-xs"
                      >
                        Private
                      </Badge>
                    )}
                    {note.rating && (
                      <RatingDisplay
                        rating={note.rating}
                        variant={RatingVariant.COMPACT}
                        size={ComponentSize.SM}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={editingNote !== null}
        onOpenChange={(open) => !open && setEditingNote(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recipe Note</DialogTitle>
            <DialogDescription>
              Update your recipe note and rating.
            </DialogDescription>
          </DialogHeader>
          {editingNote && (
            <RecipeNoteForm
              recipeId={recipeId}
              note={editingNote}
              onSuccess={(updatedNote) => {
                setEditingNote(null);
                if (updatedNote && onOptimisticUpdate) {
                  // Optimistically update the note in the list
                  const updatedNotes = notes.map((note) =>
                    note.id === editingNote.id
                      ? { ...note, ...updatedNote }
                      : note,
                  );
                  onOptimisticUpdate(updatedNotes);
                  onNotesChange?.(updatedNotes);
                } else {
                  onNotesChange?.();
                }
              }}
              onCancel={() => setEditingNote(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingNoteId !== null}
        onOpenChange={(open) => !open && setDeletingNoteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingNoteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingNoteId && handleDeleteNote(deletingNoteId)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
