"use client";

import { Camera, Link2, Loader2, PenLine, Type } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { RecipeImageUpload } from "@/components/forms/recipe-image-upload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getRecipeImportCapabilitiesAction } from "@/lib/server-actions/recipe-import-actions";
import { ButtonVariant } from "@/lib/types";
import {
  type RecipeImportCapabilities,
  RecipeImportInput,
} from "@/lib/types/import-types";
import { cn } from "@/lib/utils";

interface AddRecipeStartProps {
  isImporting: boolean;
  importingLabel: string | null;
  error: string | null;
  onImportUrl: (url: string) => void;
  onImportText: (text: string) => void;
  onImportImage: (image: File) => void;
  onWriteManually: () => void;
}

function photoDescription(capabilities: RecipeImportCapabilities | null) {
  if (capabilities?.visionAvailable) {
    return `The photo is sent to ${capabilities.providerName} to read the recipe.`;
  }
  return "The photo is read on this server. Clear, well-lit photos of printed recipes work best.";
}

export function AddRecipeStart({
  isImporting,
  importingLabel,
  error,
  onImportUrl,
  onImportText,
  onImportImage,
  onWriteManually,
}: AddRecipeStartProps) {
  const urlId = useId();
  const textId = useId();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [other, setOther] = useState<RecipeImportInput | null>(null);
  const [capabilities, setCapabilities] =
    useState<RecipeImportCapabilities | null>(null);

  useEffect(() => {
    getRecipeImportCapabilitiesAction().then((response) => {
      if (response.success) setCapabilities(response.data);
    });
  }, []);

  const optionClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-control border-2 px-4 py-3.5 text-left font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring",
      active
        ? "border-foreground bg-card"
        : "border-dashed border-input hover:border-foreground",
    );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
          Add a recipe
        </h1>
        <p className="mt-3 max-w-[56ch] text-lead text-muted-foreground">
          Paste a link and Tastebase pulls out the ingredients and steps. You'll
          check everything before it's saved.
        </p>
      </div>

      <form
        className="rounded-tile bg-card p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (url.trim()) onImportUrl(url.trim());
        }}
      >
        <label htmlFor={urlId} className="mb-2 block text-meta">
          Recipe link
        </label>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Link2
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
            />
            <input
              id={urlId}
              type="url"
              inputMode="url"
              autoComplete="off"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.example.com/your-favourite-recipe"
              disabled={isImporting}
              className="h-14 w-full rounded-control border-2 border-foreground bg-card pr-4 pl-12 text-lead outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-60"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            variant={ButtonVariant.ACCENT}
            disabled={!url.trim() || isImporting}
            className="h-14 px-7 text-base"
          >
            Import
          </Button>
        </div>

        {isImporting && importingLabel && (
          <p
            role="status"
            className="mt-4 flex items-center gap-2 text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" />
            {importingLabel}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-control bg-destructive/10 px-4 py-3 text-destructive"
          >
            {error}
          </p>
        )}
      </form>

      <div className="space-y-3">
        <p className="text-meta text-muted-foreground">Or start another way</p>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              setOther(
                other === RecipeImportInput.TEXT
                  ? null
                  : RecipeImportInput.TEXT,
              )
            }
            aria-expanded={other === RecipeImportInput.TEXT}
            className={optionClass(other === RecipeImportInput.TEXT)}
          >
            <Type className="size-5 shrink-0" />
            Paste the text
          </button>
          <button
            type="button"
            onClick={() =>
              setOther(
                other === RecipeImportInput.IMAGE
                  ? null
                  : RecipeImportInput.IMAGE,
              )
            }
            aria-expanded={other === RecipeImportInput.IMAGE}
            className={optionClass(other === RecipeImportInput.IMAGE)}
          >
            <Camera className="size-5 shrink-0" />
            Photo of a page
          </button>
          <button
            type="button"
            onClick={onWriteManually}
            className={optionClass(false)}
          >
            <PenLine className="size-5 shrink-0" />
            Write it yourself
          </button>
        </div>

        {other === RecipeImportInput.TEXT && (
          <div className="space-y-3 rounded-tile bg-card p-5">
            <label htmlFor={textId} className="block text-meta">
              Recipe text
            </label>
            <Textarea
              id={textId}
              rows={10}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste the whole recipe. Headings like Ingredients and Method help."
              disabled={isImporting}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => onImportText(text)}
                disabled={!text.trim() || isImporting}
              >
                Read this recipe
              </Button>
            </div>
          </div>
        )}

        {other === RecipeImportInput.IMAGE && (
          <div className="rounded-tile bg-card p-5">
            <RecipeImageUpload
              onSubmit={onImportImage}
              isProcessing={isImporting}
              description={photoDescription(capabilities)}
            />
          </div>
        )}

        {capabilities && !capabilities.aiConfigured && (
          <p className="text-meta font-normal text-muted-foreground">
            Imports work without AI. For messy text and photos you can{" "}
            <Link
              href="/settings?section=import"
              className="underline decoration-2 underline-offset-4 hover:decoration-accent"
            >
              add an AI provider
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
