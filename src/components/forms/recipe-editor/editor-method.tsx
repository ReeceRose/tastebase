"use client";

import { ArrowDown, ArrowUp, ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { EditorSectionCard } from "@/components/forms/recipe-editor/editor-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ButtonVariant, EditorSection } from "@/lib/types";
import type { RecipeEditorValues } from "@/lib/types/recipe-types";
import {
  emptyInstruction,
  parsePastedSteps,
} from "@/lib/utils/recipe-editor-values";

interface EditorMethodProps {
  sectionError: string | null;
}

const iconButton =
  "grid size-9 place-items-center rounded-full text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-30";

const numberOrUndefined = (value: string) =>
  value === "" ? undefined : Number(value);

export function EditorMethod({ sectionError }: EditorMethodProps) {
  const pasteId = useId();
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const {
    control,
    register,
    getValues,
    setFocus,
    formState: { errors },
  } = useFormContext<RecipeEditorValues>();
  const { fields, append, remove, move, replace } = useFieldArray({
    control,
    name: "instructions",
  });

  const addStep = () => {
    append(emptyInstruction(), { shouldFocus: false });
    window.setTimeout(
      () => setFocus(`instructions.${fields.length}.instruction`),
      0,
    );
  };

  const addPasted = () => {
    const parsed = parsePastedSteps(pasteText);
    if (parsed.length === 0) return;
    const kept = getValues("instructions").filter((row) =>
      row.instruction.trim(),
    );
    replace([...kept, ...parsed]);
    setPasteText("");
    setPasteOpen(false);
  };

  return (
    <EditorSectionCard
      id={EditorSection.METHOD}
      title="Method"
      description="One step per box. Add a time and cook mode will offer a timer for that step."
      action={
        <Button
          type="button"
          variant={ButtonVariant.OUTLINE}
          size="sm"
          onClick={() => setPasteOpen((open) => !open)}
          aria-expanded={pasteOpen}
        >
          <ClipboardPaste />
          Paste steps
        </Button>
      }
    >
      {pasteOpen && (
        <div className="mb-5 space-y-2 rounded-control bg-background p-4">
          <label htmlFor={pasteId} className="block text-meta">
            One step per line
          </label>
          <Textarea
            id={pasteId}
            rows={6}
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            placeholder={
              "1. Fry the onion until golden, about 10 minutes.\n2. Add the spices."
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant={ButtonVariant.GHOST}
              size="sm"
              onClick={() => setPasteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={addPasted}>
              Add these
            </Button>
          </div>
        </div>
      )}

      {sectionError && (
        <p role="alert" className="mb-3 text-meta text-destructive">
          {sectionError}
        </p>
      )}

      <ol className="space-y-3">
        {fields.map((field, index) => {
          const rowError = errors.instructions?.[index]?.instruction?.message;
          return (
            <li
              key={field.id}
              className="grid grid-cols-[40px_1fr] gap-3 rounded-control bg-background p-3"
            >
              <span
                aria-hidden
                className="grid size-10 place-items-center rounded-full bg-card text-lg font-extrabold"
              >
                {index + 1}
              </span>
              <div className="min-w-0 space-y-2">
                <Textarea
                  {...register(`instructions.${index}.instruction`)}
                  aria-label={`Step ${index + 1}`}
                  aria-invalid={Boolean(rowError)}
                  rows={2}
                  placeholder="Fry the onion with a pinch of salt until deep golden."
                  className="min-h-20"
                />
                {rowError && (
                  <p role="alert" className="text-caption text-destructive">
                    {rowError}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    {...register(`instructions.${index}.timeMinutes`, {
                      setValueAs: numberOrUndefined,
                    })}
                    aria-label={`Minutes for step ${index + 1}`}
                    placeholder="Minutes"
                    className="h-10 w-28"
                  />
                  <Input
                    {...register(`instructions.${index}.temperature`)}
                    aria-label={`Temperature for step ${index + 1}`}
                    placeholder="180°C"
                    className="h-10 w-28"
                  />
                  <div className="ml-auto flex items-center">
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                      aria-label={`Move step ${index + 1} up`}
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => move(index, index + 1)}
                      disabled={index === fields.length - 1}
                      aria-label={`Move step ${index + 1} down`}
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      aria-label={`Remove step ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <Button
        type="button"
        variant={ButtonVariant.OUTLINE}
        className="mt-4"
        onClick={addStep}
      >
        <Plus />
        Add step
      </Button>
    </EditorSectionCard>
  );
}
