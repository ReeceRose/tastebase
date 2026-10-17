"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  EditorField,
  EditorSectionCard,
} from "@/components/forms/recipe-editor/editor-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EditorSection, RecipeDifficulty } from "@/lib/types";
import type { RecipeEditorValues } from "@/lib/types/recipe-types";

const DIFFICULTY_OPTIONS = [
  { value: RecipeDifficulty.EASY, label: "Easy" },
  { value: RecipeDifficulty.MEDIUM, label: "Medium" },
  { value: RecipeDifficulty.HARD, label: "Takes effort" },
];

const numberOrUndefined = (value: string) =>
  value === "" ? undefined : Number(value);

export function EditorBasics() {
  const ids = {
    title: useId(),
    description: useId(),
    servings: useId(),
    prep: useId(),
    cook: useId(),
    difficulty: useId(),
    cuisine: useId(),
  };
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<RecipeEditorValues>();

  return (
    <EditorSectionCard id={EditorSection.BASICS} title="Basics">
      <div className="space-y-5">
        <EditorField
          id={ids.title}
          label="Recipe name"
          error={errors.title?.message}
        >
          <Input
            id={ids.title}
            {...register("title")}
            placeholder="Weeknight chana masala"
            aria-invalid={Boolean(errors.title)}
            className="h-14 text-2xl font-extrabold tracking-[-0.02em]"
          />
        </EditorField>

        <EditorField
          id={ids.description}
          label="A line or two about it"
          hint="What makes it worth making. Shown under the name."
          error={errors.description?.message}
        >
          <Textarea
            id={ids.description}
            {...register("description")}
            rows={3}
            placeholder="The one we make when nobody planned dinner."
          />
        </EditorField>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <EditorField
            id={ids.servings}
            label="Serves"
            error={errors.servings?.message}
          >
            <Input
              id={ids.servings}
              type="number"
              inputMode="numeric"
              min={1}
              {...register("servings", { setValueAs: numberOrUndefined })}
            />
          </EditorField>
          <EditorField
            id={ids.prep}
            label="Prep (min)"
            error={errors.prepTimeMinutes?.message}
          >
            <Input
              id={ids.prep}
              type="number"
              inputMode="numeric"
              min={0}
              {...register("prepTimeMinutes", {
                setValueAs: numberOrUndefined,
              })}
            />
          </EditorField>
          <EditorField
            id={ids.cook}
            label="Cook (min)"
            error={errors.cookTimeMinutes?.message}
          >
            <Input
              id={ids.cook}
              type="number"
              inputMode="numeric"
              min={0}
              {...register("cookTimeMinutes", {
                setValueAs: numberOrUndefined,
              })}
            />
          </EditorField>
          <EditorField id={ids.difficulty} label="Difficulty">
            <Controller
              control={control}
              name="difficulty"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id={ids.difficulty} className="w-full">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </EditorField>
          <EditorField
            id={ids.cuisine}
            label="Cuisine"
            error={errors.cuisine?.message}
            className="col-span-2 sm:col-span-1"
          >
            <Input
              id={ids.cuisine}
              {...register("cuisine")}
              placeholder="Indian"
            />
          </EditorField>
        </div>
      </div>
    </EditorSectionCard>
  );
}
