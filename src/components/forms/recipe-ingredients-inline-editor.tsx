"use client";

import { GripVertical, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InlineEdit, InlineEditType } from "@/components/forms/inline-edit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RecipeIngredient } from "@/db/schema.recipes";
import {
  addRecipeIngredient,
  removeRecipeIngredient,
  updateRecipeIngredient,
} from "@/lib/server-actions/recipe-component-actions";

interface RecipeIngredientsInlineEditorProps {
  recipeId: string;
  ingredients: RecipeIngredient[];
  onUpdate?: (ingredients: RecipeIngredient[]) => void;
  disabled?: boolean;
}

export function RecipeIngredientsInlineEditor({
  recipeId,
  ingredients,
  onUpdate,
  disabled = false,
}: RecipeIngredientsInlineEditorProps) {
  const [optimisticIngredients, setOptimisticIngredients] =
    useState(ingredients);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    amount: "",
    unit: "",
    notes: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const sortedIngredients = [...optimisticIngredients].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const handleUpdateIngredient = async (
    ingredientId: string,
    field: string,
    value: string | number,
  ) => {
    if (disabled) return;

    const previousIngredients = [...optimisticIngredients];

    // Optimistic update
    setOptimisticIngredients((prev) =>
      prev.map((ing) =>
        ing.id === ingredientId
          ? {
              ...ing,
              [field]: field === "amount" ? Number(value) || null : value,
            }
          : ing,
      ),
    );

    setIsUpdating(true);

    try {
      const updateData = {
        id: ingredientId,
        [field]: field === "amount" ? Number(value) || null : value,
      };
      const result = await updateRecipeIngredient(updateData);

      if (result.success && result.data) {
        setOptimisticIngredients((prev) =>
          prev.map((ing) => (ing.id === ingredientId ? result.data : ing)),
        );
        onUpdate?.(optimisticIngredients);
        toast.success("Ingredient updated");
      } else {
        // Revert optimistic update
        setOptimisticIngredients(previousIngredients);
        toast.error(result.error || "Failed to update ingredient");
      }
    } catch (error) {
      setOptimisticIngredients(previousIngredients);
      console.error("Error updating ingredient:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) {
      toast.error("Ingredient name is required");
      return;
    }

    setIsUpdating(true);

    try {
      const ingredientData = {
        recipeId,
        name: newIngredient.name.trim(),
        amount: newIngredient.amount.trim() || undefined,
        unit: newIngredient.unit.trim() || undefined,
        notes: newIngredient.notes.trim() || undefined,
        groupName: undefined,
        isOptional: false,
      };

      const result = await addRecipeIngredient(ingredientData);

      if (result.success && result.data) {
        setOptimisticIngredients((prev) => [...prev, result.data]);
        onUpdate?.([...optimisticIngredients, result.data]);
        setNewIngredient({ name: "", amount: "", unit: "", notes: "" });
        setShowAddForm(false);
        toast.success("Ingredient added");
      } else {
        toast.error(result.error || "Failed to add ingredient");
      }
    } catch (error) {
      console.error("Error adding ingredient:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    if (disabled) return;

    const previousIngredients = [...optimisticIngredients];

    // Optimistic update
    setOptimisticIngredients((prev) =>
      prev.filter((ing) => ing.id !== ingredientId),
    );

    setIsUpdating(true);

    try {
      const result = await removeRecipeIngredient(ingredientId);

      if (result.success) {
        onUpdate?.(
          optimisticIngredients.filter((ing) => ing.id !== ingredientId),
        );
        toast.success("Ingredient removed");
      } else {
        // Revert optimistic update
        setOptimisticIngredients(previousIngredients);
        toast.error(result.error || "Failed to remove ingredient");
      }
    } catch (error) {
      setOptimisticIngredients(previousIngredients);
      console.error("Error removing ingredient:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ingredients ({sortedIngredients.length})</span>
          {isUpdating && <Badge variant="secondary">Updating...</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedIngredients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No ingredients added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedIngredients.map((ingredient, _index) => (
              <div
                key={ingredient.id}
                className="group flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  {/* Name */}
                  <div className="md:col-span-4">
                    <InlineEdit
                      value={ingredient.name}
                      onSave={(value) =>
                        handleUpdateIngredient(ingredient.id, "name", value)
                      }
                      placeholder="Ingredient name"
                      disabled={disabled || isUpdating}
                      displayClassName="font-medium"
                    />
                  </div>

                  {/* Amount */}
                  <div className="md:col-span-2">
                    <InlineEdit
                      value={ingredient.amount || ""}
                      onSave={(value) =>
                        handleUpdateIngredient(ingredient.id, "amount", value)
                      }
                      type={InlineEditType.NUMBER}
                      placeholder="Amount"
                      disabled={disabled || isUpdating}
                    />
                  </div>

                  {/* Unit */}
                  <div className="md:col-span-2">
                    <InlineEdit
                      value={ingredient.unit || ""}
                      onSave={(value) =>
                        handleUpdateIngredient(ingredient.id, "unit", value)
                      }
                      placeholder="Unit"
                      disabled={disabled || isUpdating}
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-4">
                    <InlineEdit
                      value={ingredient.notes || ""}
                      onSave={(value) =>
                        handleUpdateIngredient(ingredient.id, "notes", value)
                      }
                      placeholder="Notes (optional)"
                      disabled={disabled || isUpdating}
                      displayClassName="text-muted-foreground italic"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteIngredient(ingredient.id)}
                  disabled={disabled || isUpdating}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Ingredient */}
        {!disabled && (
          <div className="border-t pt-4">
            {showAddForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="md:col-span-4">
                    <Input
                      value={newIngredient.name}
                      onChange={(e) =>
                        setNewIngredient((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ingredient name *"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      value={newIngredient.amount}
                      onChange={(e) =>
                        setNewIngredient((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      type={InlineEditType.NUMBER}
                      step="any"
                      placeholder="Amount"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      value={newIngredient.unit}
                      onChange={(e) =>
                        setNewIngredient((prev) => ({
                          ...prev,
                          unit: e.target.value,
                        }))
                      }
                      placeholder="Unit"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Input
                      value={newIngredient.notes}
                      onChange={(e) =>
                        setNewIngredient((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Notes (optional)"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddIngredient}
                    disabled={isUpdating || !newIngredient.name.trim()}
                    size="sm"
                  >
                    Add Ingredient
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewIngredient({
                        name: "",
                        amount: "",
                        unit: "",
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
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full"
                disabled={isUpdating}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
