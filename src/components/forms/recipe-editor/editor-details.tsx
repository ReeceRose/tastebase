"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  EditorField,
  EditorSectionCard,
} from "@/components/forms/recipe-editor/editor-field";
import { CircleMotif } from "@/components/ui/circle-motif";
import { Input } from "@/components/ui/input";
import { SwatchPicker } from "@/components/ui/swatch-picker";
import { Textarea } from "@/components/ui/textarea";
import { EditorSection, type RecipeSwatch } from "@/lib/types";
import type { RecipeEditorValues } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { swatchClasses } from "@/lib/utils/swatches";

interface EditorDetailsProps {
  automaticSwatch: RecipeSwatch;
}

export function EditorDetails({ automaticSwatch }: EditorDetailsProps) {
  const ids = {
    tags: useId(),
    url: useId(),
    name: useId(),
    video: useId(),
    extraNotes: useId(),
  };
  const [tagText, setTagText] = useState("");
  const [repeatedTags, setRepeatedTags] = useState<string[]>([]);
  const repeatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<RecipeEditorValues>();
  const tags = useWatch({ control, name: "tags" }) ?? [];
  const title = useWatch({ control, name: "title" });
  const chosen = useWatch({ control, name: "swatch" });
  const preview = swatchClasses(chosen ?? automaticSwatch);

  useEffect(
    () => () => {
      if (repeatTimer.current) clearTimeout(repeatTimer.current);
    },
    [],
  );

  const flagRepeats = (repeats: string[]) => {
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
    setRepeatedTags(repeats);
    repeatTimer.current = setTimeout(() => setRepeatedTags([]), 2500);
  };

  const addTags = (raw: string) => {
    const typed = [
      ...new Set(
        raw
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    if (typed.length === 0) return;
    const next = typed.filter((tag) => !tags.includes(tag));
    const repeats = typed.filter((tag) => tags.includes(tag));
    if (next.length > 0) {
      setValue("tags", [...tags, ...next], { shouldDirty: true });
    }
    if (repeats.length > 0) flagRepeats(repeats);
    setTagText("");
  };

  const repeatMessage =
    repeatedTags.length === 0
      ? ""
      : `${repeatedTags.map((tag) => `“${tag}”`).join(", ")} ${
          repeatedTags.length === 1 ? "is" : "are"
        } already on this recipe.`;

  return (
    <EditorSectionCard id={EditorSection.DETAILS} title="Details">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
        <div className="space-y-5">
          <EditorField
            id={ids.tags}
            label="Tags"
            hint={
              repeatMessage ||
              "Press Enter or a comma after each one. Tags help everyone find it later."
            }
          >
            <span role="status" className="sr-only">
              {repeatMessage}
            </span>
            <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-control border-2 border-input bg-card px-2 py-1.5 focus-within:border-foreground">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-sm font-semibold transition-colors",
                    repeatedTags.includes(tag)
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted",
                  )}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      setValue(
                        "tags",
                        tags.filter((item) => item !== tag),
                        { shouldDirty: true },
                      )
                    }
                    aria-label={`Remove tag ${tag}`}
                    className="grid size-6 place-items-center rounded-full outline-none hover:bg-foreground/10 focus-visible:ring-[3px] focus-visible:ring-ring"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              <input
                id={ids.tags}
                value={tagText}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value.includes(",")) {
                    addTags(value);
                  } else {
                    setTagText(value);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTags(tagText);
                  }
                  if (
                    event.key === "Backspace" &&
                    !tagText &&
                    tags.length > 0
                  ) {
                    setValue("tags", tags.slice(0, -1), { shouldDirty: true });
                  }
                }}
                onBlur={() => addTags(tagText)}
                placeholder={tags.length === 0 ? "weeknight, vegetarian" : ""}
                className="h-9 min-w-32 flex-1 bg-transparent px-2 text-base sm:text-body outline-none placeholder:text-muted-foreground"
              />
            </div>
          </EditorField>

          <div className="grid gap-4 sm:grid-cols-2">
            <EditorField
              id={ids.url}
              label="Where it came from (link)"
              error={errors.sourceUrl?.message}
            >
              <Input
                id={ids.url}
                type="url"
                {...register("sourceUrl")}
                placeholder="https://"
              />
            </EditorField>
            <EditorField
              id={ids.name}
              label="Or who it came from"
              error={errors.sourceName?.message}
            >
              <Input
                id={ids.name}
                {...register("sourceName")}
                placeholder="Grandma Rosa"
              />
            </EditorField>
          </div>

          <EditorField
            id={ids.video}
            label="Video (link)"
            hint="A video of someone making it. YouTube and Vimeo links play on the recipe page."
            error={errors.videoUrl?.message}
          >
            <Input
              id={ids.video}
              type="url"
              {...register("videoUrl")}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </EditorField>

          <EditorField
            id={ids.extraNotes}
            label="Recipe notes"
            hint="How to store it, how long it keeps, make-ahead tips. Anything that belongs with the recipe."
            error={errors.extraNotes?.message}
          >
            <Textarea
              id={ids.extraNotes}
              {...register("extraNotes")}
              rows={5}
              placeholder="Keeps in the fridge for up to 4 days."
            />
          </EditorField>

          <div className="space-y-2">
            <p className="text-meta">Colour</p>
            <p className="text-caption font-normal text-muted-foreground">
              Every recipe gets a colour so it's easy to spot. Leave it on
              automatic or pick one.
            </p>
            <Controller
              control={control}
              name="swatch"
              render={({ field }) => (
                <SwatchPicker
                  label="Recipe colour"
                  value={field.value}
                  automaticSwatch={automaticSwatch}
                  onValueChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        <div aria-hidden className="hidden lg:block">
          <p className="mb-2 text-caption text-muted-foreground">Preview</p>
          <div
            className={cn(
              "relative flex min-h-[200px] flex-col overflow-hidden rounded-tile p-5",
              preview.bg,
              preview.fg,
            )}
          >
            <CircleMotif
              className={cn("-right-9 -bottom-14 size-[140px]", preview.deep)}
            />
            <span className="relative line-clamp-3 max-w-[13ch] text-tile">
              {title?.trim() || "Your recipe"}
            </span>
          </div>
        </div>
      </div>
    </EditorSectionCard>
  );
}
