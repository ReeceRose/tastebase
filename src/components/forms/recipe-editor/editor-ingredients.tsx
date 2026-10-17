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
  emptyIngredient,
  parsePastedIngredients,
} from "@/lib/utils/recipe-editor-values";

interface EditorIngredientsProps {
  sectionError: string | null;
}

const iconButton =
  "grid size-9 place-items-center rounded-full text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-30";

export function EditorIngredients({ sectionError }: EditorIngredientsProps) {
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
    name: "ingredients",
  });

  const addRow = (focus: boolean) => {
    append(emptyIngredient(), { shouldFocus: false });
    if (focus) {
      window.setTimeout(
        () => setFocus(`ingredients.${fields.length}.amount`),
        0,
      );
    }
  };

  const addPasted = () => {
    const parsed = parsePastedIngredients(pasteText);
    if (parsed.length === 0) return;
    const kept = getValues("ingredients").filter(
      (row) => row.name.trim() || row.amount?.trim() || row.unit?.trim(),
    );
    replace([...kept, ...parsed]);
    setPasteText("");
    setPasteOpen(false);
  };

  return (
    <EditorSectionCard
      id={EditorSection.INGREDIENTS}
      title="Ingredients"
      description="Amount, unit, then the ingredient. Press Enter on the last box to add another."
      action={
        <Button
          type="button"
          variant={ButtonVariant.OUTLINE}
          size="sm"
          onClick={() => setPasteOpen((open) => !open)}
          aria-expanded={pasteOpen}
        >
          <ClipboardPaste />
          Paste a list
        </Button>
      }
    >
      {pasteOpen && (
        <div className="mb-5 space-y-2 rounded-control bg-background p-4">
          <label htmlFor={pasteId} className="block text-meta">
            One ingredient per line
          </label>
          <Textarea
            id={pasteId}
            rows={6}
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            placeholder={
              "2 tbsp olive oil\n1 large onion, chopped\n400 g chickpeas"
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

      <div className="hidden grid-cols-[88px_104px_1fr_auto] gap-2 px-1 pb-1.5 text-caption text-muted-foreground md:grid">
        <span>Amount</span>
        <span>Unit</span>
        <span>Ingredient</span>
        <span className="w-[116px]" />
      </div>

      <ol className="space-y-2">
        {fields.map((field, index) => {
          const rowError = errors.ingredients?.[index]?.name?.message;
          return (
            <li
              key={field.id}
              className="rounded-control bg-background p-2 md:bg-transparent md:p-0"
            >
              <div className="grid grid-cols-[88px_1fr] gap-2 md:grid-cols-[88px_104px_1fr_auto]">
                <Input
                  {...register(`ingredients.${index}.amount`)}
                  aria-label={`Amount for ingredient ${index + 1}`}
                  placeholder="2"
                  className="h-11 tabular"
                />
                <Input
                  {...register(`ingredients.${index}.unit`)}
                  aria-label={`Unit for ingredient ${index + 1}`}
                  placeholder="tbsp"
                  className="h-11"
                />
                <Input
                  {...register(`ingredients.${index}.name`)}
                  aria-label={`Ingredient ${index + 1}`}
                  aria-invalid={Boolean(rowError)}
                  placeholder="olive oil"
                  className="col-span-2 h-11 md:col-span-1"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (index === fields.length - 1) {
                        addRow(true);
                      } else {
                        setFocus(`ingredients.${index + 1}.amount`);
                      }
                    }
                  }}
                />
                <div className="col-span-2 flex items-center justify-end md:col-span-1">
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Move ingredient ${index + 1} up`}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => move(index, index + 1)}
                    disabled={index === fields.length - 1}
                    aria-label={`Move ingredient ${index + 1} down`}
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={`Remove ingredient ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <details className="group mt-1 md:ml-[200px]">
                <summary className="cursor-pointer rounded-sm px-1 text-caption font-normal text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring">
                  Note, section or optional
                </summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_180px_auto] sm:items-center">
                  <Input
                    {...register(`ingredients.${index}.notes`)}
                    aria-label={`Note for ingredient ${index + 1}`}
                    placeholder="finely chopped"
                    className="h-10"
                  />
                  <Input
                    {...register(`ingredients.${index}.groupName`)}
                    aria-label={`Section for ingredient ${index + 1}`}
                    placeholder="Section, e.g. For the sauce"
                    className="h-10"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...register(`ingredients.${index}.isOptional`)}
                      className="size-4 accent-[var(--ink)]"
                    />
                    Optional
                  </label>
                </div>
              </details>
              {rowError && (
                <p role="alert" className="mt-1 text-caption text-destructive">
                  {rowError}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <Button
        type="button"
        variant={ButtonVariant.OUTLINE}
        className="mt-4"
        onClick={() => addRow(true)}
      >
        <Plus />
        Add ingredient
      </Button>
    </EditorSectionCard>
  );
}
