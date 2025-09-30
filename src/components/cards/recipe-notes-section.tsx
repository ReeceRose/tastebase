"use client";

import { MessageSquare, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { RecipeNoteForm } from "@/components/forms/recipe-note-form";
import { RecipeNotesList } from "@/components/lists/recipe-notes-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RatingDisplay } from "@/components/ui/rating-display";
import { ComponentSize, RatingVariant } from "@/lib/types";
import type { RecipeNote } from "@/lib/types/recipe-types";

interface RecipeNotesSectionProps {
  recipeId: string;
  notes: RecipeNote[];
  onNotesChange?: (updatedNotes?: RecipeNote[]) => void;
  className?: string;
}

export function RecipeNotesSection({
  recipeId,
  notes: initialNotes,
  onNotesChange,
  className,
}: RecipeNotesSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);
  const [optimisticNotes, setOptimisticNotes] =
    useState<RecipeNote[]>(initialNotes);

  // Update optimistic notes when server data changes
  useEffect(() => {
    setOptimisticNotes(initialNotes);
  }, [initialNotes]);

  const notes = optimisticNotes;

  const handleOptimisticNoteAdd = (newNoteData: Partial<RecipeNote>) => {
    const now = new Date();
    const optimisticNote: RecipeNote = {
      id: `temp-${Date.now()}`, // Temporary ID
      recipeId,
      userId: newNoteData.userId || "temp-user", // Will be replaced by server
      content: newNoteData.content || "",
      rating: newNoteData.rating || null,
      isPrivate: newNoteData.isPrivate ?? true,
      createdAt: now,
      updatedAt: now,
      ...newNoteData,
    };

    const updatedNotes = [...optimisticNotes, optimisticNote];
    setOptimisticNotes(updatedNotes);

    // Notify parent with updated notes
    onNotesChange?.(updatedNotes);

    // Auto-expand notes when a new one is added
    setIsNotesExpanded(true);
  };

  const averageRating =
    notes.length > 0
      ? notes
          .filter((note) => note.rating !== null)
          .reduce((sum, note) => sum + (note.rating || 0), 0) /
        notes.filter((note) => note.rating !== null).length
      : null;

  const totalNotes = notes.length;
  const ratedNotes = notes.filter((note) => note.rating !== null).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes & Reviews
            {totalNotes > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({totalNotes})
              </span>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>

        {averageRating !== null && !Number.isNaN(averageRating) && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm font-medium text-muted-foreground">
              Average Rating:
            </span>
            <RatingDisplay
              rating={averageRating}
              showValue={true}
              showCount={true}
              count={ratedNotes}
              size={ComponentSize.SM}
              variant={RatingVariant.DEFAULT}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {showAddForm && (
          <RecipeNoteForm
            recipeId={recipeId}
            onSuccess={(newNote) => {
              setShowAddForm(false);
              if (newNote) {
                handleOptimisticNoteAdd(newNote);
              }
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        <Collapsible open={isNotesExpanded} onOpenChange={setIsNotesExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-left p-0 h-auto font-normal hover:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {isNotesExpanded ? "Hide" : "Show"} All Notes
                </span>
                {totalNotes > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({totalNotes})
                  </span>
                )}
              </div>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-4">
            <RecipeNotesList
              recipeId={recipeId}
              notes={notes}
              onNotesChange={onNotesChange}
              onOptimisticUpdate={setOptimisticNotes}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
