"use client";

import { Clock, GripVertical, Plus, Thermometer, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InlineEdit, InlineEditType } from "@/components/forms/inline-edit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RecipeInstruction } from "@/db/schema.recipes";
import {
  addRecipeInstruction,
  removeRecipeInstruction,
  updateRecipeInstruction,
} from "@/lib/server-actions/recipe-component-actions";
import { BadgeVariant, ButtonVariant } from "@/lib/types";

interface RecipeInstructionsInlineEditorProps {
  recipeId: string;
  instructions: RecipeInstruction[];
  onUpdate?: (instructions: RecipeInstruction[]) => void;
  disabled?: boolean;
}

export function RecipeInstructionsInlineEditor({
  recipeId,
  instructions,
  onUpdate,
  disabled = false,
}: RecipeInstructionsInlineEditorProps) {
  const [optimisticInstructions, setOptimisticInstructions] =
    useState(instructions);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newInstruction, setNewInstruction] = useState({
    instruction: "",
    timeMinutes: "",
    temperature: "",
    notes: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const sortedInstructions = [...optimisticInstructions].sort(
    (a, b) => a.stepNumber - b.stepNumber,
  );

  const handleUpdateInstruction = async (
    instructionId: string,
    field: string,
    value: string | number,
  ) => {
    if (disabled) return;

    const previousInstructions = [...optimisticInstructions];

    // Optimistic update
    setOptimisticInstructions((prev) =>
      prev.map((inst) =>
        inst.id === instructionId
          ? {
              ...inst,
              [field]: field === "timeMinutes" ? Number(value) || null : value,
            }
          : inst,
      ),
    );

    setIsUpdating(true);

    try {
      const updateData = {
        id: instructionId,
        [field]: field === "timeMinutes" ? Number(value) || null : value,
      };
      const result = await updateRecipeInstruction(updateData);

      if (result.success && result.data) {
        setOptimisticInstructions((prev) =>
          prev.map((inst) => (inst.id === instructionId ? result.data : inst)),
        );
        onUpdate?.(optimisticInstructions);
        toast.success("Instruction updated");
      } else {
        // Revert optimistic update
        setOptimisticInstructions(previousInstructions);
        toast.error(result.error || "Failed to update instruction");
      }
    } catch (error) {
      setOptimisticInstructions(previousInstructions);
      console.error("Error updating instruction:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddInstruction = async () => {
    if (!newInstruction.instruction.trim()) {
      toast.error("Instruction text is required");
      return;
    }

    setIsUpdating(true);

    try {
      const instructionData = {
        recipeId,
        instruction: newInstruction.instruction.trim(),
        timeMinutes: Number(newInstruction.timeMinutes) || undefined,
        temperature: newInstruction.temperature.trim() || undefined,
        notes: newInstruction.notes.trim() || undefined,
        groupName: undefined,
      };

      const result = await addRecipeInstruction(instructionData);

      if (result.success && result.data) {
        setOptimisticInstructions((prev) => [...prev, result.data]);
        onUpdate?.([...optimisticInstructions, result.data]);
        setNewInstruction({
          instruction: "",
          timeMinutes: "",
          temperature: "",
          notes: "",
        });
        setShowAddForm(false);
        toast.success("Instruction added");
      } else {
        toast.error(result.error || "Failed to add instruction");
      }
    } catch (error) {
      console.error("Error adding instruction:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteInstruction = async (instructionId: string) => {
    if (disabled) return;

    const previousInstructions = [...optimisticInstructions];

    // Optimistic update
    setOptimisticInstructions((prev) =>
      prev.filter((inst) => inst.id !== instructionId),
    );

    setIsUpdating(true);

    try {
      const result = await removeRecipeInstruction(instructionId);

      if (result.success) {
        onUpdate?.(
          optimisticInstructions.filter((inst) => inst.id !== instructionId),
        );
        toast.success("Instruction removed");
      } else {
        // Revert optimistic update
        setOptimisticInstructions(previousInstructions);
        toast.error(result.error || "Failed to remove instruction");
      }
    } catch (error) {
      setOptimisticInstructions(previousInstructions);
      console.error("Error removing instruction:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const validateTime = (value: string | number): string | null => {
    const num = Number(value);
    if (num < 0) return "Time cannot be negative";
    if (num > 1440) return "Time must not exceed 24 hours (1440 minutes)";
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Instructions ({sortedInstructions.length})</span>
          {isUpdating && (
            <Badge variant={BadgeVariant.SECONDARY}>Updating...</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedInstructions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No instructions added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedInstructions.map((instruction, _index) => (
              <div
                key={instruction.id}
                className="group flex gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Badge variant={BadgeVariant.OUTLINE} className="min-w-fit">
                    Step {instruction.stepNumber}
                  </Badge>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Instruction text */}
                  <InlineEdit
                    value={instruction.instruction}
                    onSave={(value) =>
                      handleUpdateInstruction(
                        instruction.id,
                        "instruction",
                        value,
                      )
                    }
                    type={InlineEditType.TEXTAREA}
                    placeholder="Describe this step..."
                    disabled={disabled || isUpdating}
                    displayClassName="text-sm leading-relaxed"
                  />

                  {/* Time and Temperature */}
                  <div className="flex flex-wrap gap-4">
                    {(!disabled || instruction.timeMinutes) && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <InlineEdit
                          value={instruction.timeMinutes || ""}
                          onSave={(value) =>
                            handleUpdateInstruction(
                              instruction.id,
                              "timeMinutes",
                              value,
                            )
                          }
                          type={InlineEditType.NUMBER}
                          placeholder="Time"
                          validation={validateTime}
                          disabled={disabled || isUpdating}
                          displayClassName="text-sm"
                        />
                        {instruction.timeMinutes && (
                          <span className="text-sm text-muted-foreground">
                            min
                          </span>
                        )}
                      </div>
                    )}

                    {(!disabled || instruction.temperature) && (
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        <InlineEdit
                          value={instruction.temperature || ""}
                          onSave={(value) =>
                            handleUpdateInstruction(
                              instruction.id,
                              "temperature",
                              value,
                            )
                          }
                          placeholder="Temperature"
                          disabled={disabled || isUpdating}
                          displayClassName="text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {(instruction.notes || !disabled) && (
                    <div className="mt-2">
                      <InlineEdit
                        value={instruction.notes || ""}
                        onSave={(value) =>
                          handleUpdateInstruction(
                            instruction.id,
                            "notes",
                            value,
                          )
                        }
                        placeholder="Additional notes for this step..."
                        disabled={disabled || isUpdating}
                        displayClassName="text-sm text-muted-foreground italic"
                      />
                    </div>
                  )}
                </div>

                <Button
                  variant={ButtonVariant.GHOST}
                  size="sm"
                  onClick={() => handleDeleteInstruction(instruction.id)}
                  disabled={disabled || isUpdating}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 self-start"
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Instruction */}
        {!disabled && (
          <div className="border-t pt-4">
            {showAddForm ? (
              <div className="space-y-3">
                <Textarea
                  value={newInstruction.instruction}
                  onChange={(e) =>
                    setNewInstruction((prev) => ({
                      ...prev,
                      instruction: e.target.value,
                    }))
                  }
                  placeholder="Describe this step... *"
                  rows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={newInstruction.timeMinutes}
                    onChange={(e) =>
                      setNewInstruction((prev) => ({
                        ...prev,
                        timeMinutes: e.target.value,
                      }))
                    }
                    type="number"
                    placeholder="Time (minutes)"
                  />
                  <Input
                    value={newInstruction.temperature}
                    onChange={(e) =>
                      setNewInstruction((prev) => ({
                        ...prev,
                        temperature: e.target.value,
                      }))
                    }
                    placeholder="Temperature"
                  />
                  <Input
                    value={newInstruction.notes}
                    onChange={(e) =>
                      setNewInstruction((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Notes (optional)"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddInstruction}
                    disabled={isUpdating || !newInstruction.instruction.trim()}
                    size="sm"
                  >
                    Add Instruction
                  </Button>
                  <Button
                    variant={ButtonVariant.OUTLINE}
                    onClick={() => {
                      setShowAddForm(false);
                      setNewInstruction({
                        instruction: "",
                        timeMinutes: "",
                        temperature: "",
                        notes: "",
                      });
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant={ButtonVariant.OUTLINE}
                onClick={() => setShowAddForm(true)}
                className="w-full"
                disabled={isUpdating}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Instruction
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
