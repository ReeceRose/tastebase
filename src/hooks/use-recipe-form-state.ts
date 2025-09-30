"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Recipe,
  RecipeIngredient,
  RecipeInstruction,
} from "@/db/schema.recipes";
import type { RecipeDifficulty } from "@/lib/types";

export interface RecipeFormData {
  title: string;
  description: string | null;
  servings: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  difficulty: RecipeDifficulty | null;
  cuisine: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  ingredients: Array<{
    name: string;
    amount: string | null;
    unit: string | null;
    notes: string | null;
    groupName: string | null;
    isOptional: boolean;
  }>;
  instructions: Array<{
    instruction: string;
    timeMinutes: number | null;
    temperature: string | null;
    notes: string | null;
    groupName: string | null;
  }>;
  tags: string[];
}

export interface FormState {
  data: RecipeFormData;
  isDirty: boolean;
  errors: Record<string, string>;
  touchedFields: Set<string>;
}

export const defaultRecipeFormData: RecipeFormData = {
  title: "",
  description: null,
  servings: 4,
  prepTimeMinutes: null,
  cookTimeMinutes: null,
  difficulty: null,
  cuisine: null,
  sourceUrl: null,
  sourceName: null,
  ingredients: [],
  instructions: [],
  tags: [],
};

export function useRecipeFormState(initialData?: Partial<Recipe>) {
  const [formState, setFormState] = useState<FormState>(() => ({
    data: {
      ...defaultRecipeFormData,
      ...initialData,
      ingredients: [],
      instructions: [],
      tags: [],
    },
    isDirty: false,
    errors: {},
    touchedFields: new Set(),
  }));

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [instructions, setInstructions] = useState<RecipeInstruction[]>([]);

  const updateField = useCallback(
    (
      field: keyof RecipeFormData,
      value: RecipeFormData[keyof RecipeFormData],
    ) => {
      setFormState((prev) => ({
        ...prev,
        data: { ...prev.data, [field]: value },
        isDirty: true,
        touchedFields: new Set([...prev.touchedFields, field]),
        errors: { ...prev.errors, [field]: "" },
      }));
    },
    [],
  );

  const updateIngredients = useCallback(
    (
      newIngredients:
        | RecipeIngredient[]
        | ((prev: RecipeIngredient[]) => RecipeIngredient[]),
    ) => {
      const updatedIngredients =
        typeof newIngredients === "function"
          ? newIngredients(ingredients)
          : newIngredients;

      setIngredients(updatedIngredients);
      setFormState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          ingredients: updatedIngredients.map((ing) => ({
            name: ing.name,
            amount: ing.amount || "",
            unit: ing.unit || "",
            notes: ing.notes || "",
            groupName: ing.groupName || "",
            isOptional: ing.isOptional || false,
          })),
        },
        isDirty: true,
      }));
    },
    [ingredients],
  );

  const updateInstructions = useCallback(
    (
      newInstructions:
        | RecipeInstruction[]
        | ((prev: RecipeInstruction[]) => RecipeInstruction[]),
    ) => {
      const updatedInstructions =
        typeof newInstructions === "function"
          ? newInstructions(instructions)
          : newInstructions;

      setInstructions(updatedInstructions);
      setFormState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          instructions: updatedInstructions.map((inst) => ({
            instruction: inst.instruction,
            timeMinutes: inst.timeMinutes || 0,
            temperature: inst.temperature || "",
            notes: inst.notes || "",
            groupName: inst.groupName || "",
          })),
        },
        isDirty: true,
      }));
    },
    [instructions],
  );

  const addIngredient = useCallback(() => {
    const newIngredient: RecipeIngredient = {
      id: `temp-${Date.now()}`,
      recipeId: "",
      name: "",
      amount: "",
      unit: "",
      notes: "",
      groupName: "",
      sortOrder: ingredients.length,
      isOptional: false,
    };
    updateIngredients([...ingredients, newIngredient]);
  }, [ingredients, updateIngredients]);

  const removeIngredient = useCallback(
    (index: number) => {
      updateIngredients(ingredients.filter((_, i) => i !== index));
    },
    [ingredients, updateIngredients],
  );

  const addInstruction = useCallback(() => {
    const newInstruction: RecipeInstruction = {
      id: `temp-${Date.now()}`,
      recipeId: "",
      stepNumber: instructions.length + 1,
      instruction: "",
      timeMinutes: 0,
      temperature: "",
      notes: "",
      groupName: "",
    };
    updateInstructions([...instructions, newInstruction]);
  }, [instructions, updateInstructions]);

  const removeInstruction = useCallback(
    (index: number) => {
      const updatedInstructions = instructions
        .filter((_, i) => i !== index)
        .map((inst, i) => ({ ...inst, stepNumber: i + 1 }));
      updateInstructions(updatedInstructions);
    },
    [instructions, updateInstructions],
  );

  const setFieldError = useCallback((field: string, error: string) => {
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: "" },
    }));
  }, []);

  const validateField = useCallback(
    (
      field: keyof RecipeFormData,
      value: RecipeFormData[keyof RecipeFormData],
    ) => {
      let error = "";

      switch (field) {
        case "title":
          if (typeof value === "string") {
            if (!value || value.trim().length === 0) {
              error = "Recipe title is required";
            } else if (value.length > 200) {
              error = "Title must be less than 200 characters";
            }
          }
          break;
        case "description":
          if (typeof value === "string" && value && value.length > 1000) {
            error = "Description must be less than 1000 characters";
          }
          break;
        case "servings":
          if (typeof value === "number" && (value < 1 || value > 100)) {
            error = "Servings must be between 1 and 100";
          }
          break;
        case "prepTimeMinutes":
        case "cookTimeMinutes":
          if (typeof value === "number" && (value < 0 || value > 1440)) {
            error = "Time must be between 0 and 1440 minutes (24 hours)";
          }
          break;
      }

      setFieldError(field, error);
      return error === "";
    },
    [setFieldError],
  );

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formState.data).forEach((key) => {
      const field = key as keyof RecipeFormData;
      const value = formState.data[field];

      if (!validateField(field, value)) {
        isValid = false;
      }
    });

    if (ingredients.length === 0) {
      errors.ingredients = "At least one ingredient is required";
      isValid = false;
    }

    if (instructions.length === 0) {
      errors.instructions = "At least one instruction is required";
      isValid = false;
    }

    setFormState((prev) => ({ ...prev, errors }));
    return isValid;
  }, [formState.data, ingredients, instructions, validateField]);

  const resetForm = useCallback(() => {
    setFormState({
      data: { ...defaultRecipeFormData },
      isDirty: false,
      errors: {},
      touchedFields: new Set(),
    });
    setIngredients([]);
    setInstructions([]);
  }, []);

  const markClean = useCallback(() => {
    setFormState((prev) => ({ ...prev, isDirty: false }));
  }, []);

  const getFormData = useCallback(
    () => ({
      ...formState.data,
      ingredients: formState.data.ingredients,
      instructions: formState.data.instructions,
    }),
    [formState.data],
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formState.isDirty) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formState.isDirty]);

  return {
    formState,
    ingredients,
    instructions,
    updateField,
    updateIngredients,
    updateInstructions,
    addIngredient,
    removeIngredient,
    addInstruction,
    removeInstruction,
    setFieldError,
    clearFieldError,
    validateField,
    validateForm,
    resetForm,
    markClean,
    getFormData,
  };
}
