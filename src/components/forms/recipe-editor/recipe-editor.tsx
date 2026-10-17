"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FormProvider, type Path, useForm } from "react-hook-form";
import { toast } from "sonner";
import { EditorBasics } from "@/components/forms/recipe-editor/editor-basics";
import { EditorDetails } from "@/components/forms/recipe-editor/editor-details";
import { EditorIngredients } from "@/components/forms/recipe-editor/editor-ingredients";
import { EditorMethod } from "@/components/forms/recipe-editor/editor-method";
import { EditorPhotos } from "@/components/forms/recipe-editor/editor-photos";
import { EditorSectionNav } from "@/components/forms/recipe-editor/editor-section-nav";
import { EditorSharing } from "@/components/forms/recipe-editor/editor-sharing";
import { Button } from "@/components/ui/button";
import { useRecipeDraft } from "@/hooks/use-recipe-draft";
import {
  createRecipe,
  updateRecipe,
} from "@/lib/server-actions/recipe-actions";
import { attachImageToRecipe } from "@/lib/server-actions/recipe-image-actions";
import { ButtonVariant, EditorSection, RecipeEditorMode } from "@/lib/types";
import type {
  PendingImage,
  RecipeEditorValues,
  RecipeImage,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";
import {
  cleanEditorValues,
  mimeTypeFor,
} from "@/lib/utils/recipe-editor-values";
import { swatchFor } from "@/lib/utils/swatches";
import { formatRelativeDay } from "@/lib/utils/time-formatting";
import { createRecipeSchema } from "@/lib/validations/recipe-schemas";

interface RecipeEditorProps {
  mode: RecipeEditorMode;
  userId: string;
  recipe: RecipeWithRelations | null;
  initialValues: RecipeEditorValues;
  notice: string | null;
  onStartOver?: () => void;
}

const FIELD_SECTIONS: Record<string, EditorSection> = {
  title: EditorSection.BASICS,
  description: EditorSection.BASICS,
  servings: EditorSection.BASICS,
  prepTimeMinutes: EditorSection.BASICS,
  cookTimeMinutes: EditorSection.BASICS,
  difficulty: EditorSection.BASICS,
  cuisine: EditorSection.BASICS,
  ingredients: EditorSection.INGREDIENTS,
  instructions: EditorSection.METHOD,
  tags: EditorSection.DETAILS,
  sourceUrl: EditorSection.DETAILS,
  sourceName: EditorSection.DETAILS,
  swatch: EditorSection.DETAILS,
  isPublic: EditorSection.SHARING,
};

export function RecipeEditor({
  mode,
  userId,
  recipe,
  initialValues,
  notice,
  onStartOver,
}: RecipeEditorProps) {
  const router = useRouter();
  const form = useForm<RecipeEditorValues>({ defaultValues: initialValues });
  const [isSaving, startSaving] = useTransition();
  const [images, setImages] = useState<RecipeImage[]>(recipe?.images ?? []);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [sectionErrors, setSectionErrors] = useState<
    Partial<Record<EditorSection, string>>
  >({});
  const [errorSections, setErrorSections] = useState<Set<EditorSection>>(
    () => new Set(),
  );
  const isDirty = form.formState.isDirty;
  const values = form.watch();
  const draftKey = `tastebase:draft:${userId}:${recipe?.id ?? "new"}`;
  const draft = useRecipeDraft(draftKey, values, isDirty && !isSaving);
  const automaticSwatch = swatchFor(recipe?.id ?? draftKey);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const showErrors = (
    issues: { path: (string | number)[]; message: string }[],
    ingredientRows: number[],
    instructionRows: number[],
  ) => {
    const sections = new Set<EditorSection>();
    const arrayErrors: Partial<Record<EditorSection, string>> = {};
    let firstField: Path<RecipeEditorValues> | null = null;

    for (const issue of issues) {
      const [root, index, field] = issue.path;
      const section = FIELD_SECTIONS[String(root)] ?? EditorSection.BASICS;
      sections.add(section);

      if (
        (root === "ingredients" || root === "instructions") &&
        typeof index === "number"
      ) {
        const rows = root === "ingredients" ? ingredientRows : instructionRows;
        const path =
          `${root}.${rows[index]}.${String(field)}` as Path<RecipeEditorValues>;
        form.setError(path, { message: issue.message });
        firstField ??= path;
      } else if (root === "ingredients" || root === "instructions") {
        arrayErrors[section] = issue.message;
      } else {
        const path = String(root) as Path<RecipeEditorValues>;
        form.setError(path, { message: issue.message });
        firstField ??= path;
      }
    }

    setSectionErrors(arrayErrors);
    setErrorSections(sections);
    if (firstField) {
      form.setFocus(firstField);
    } else {
      const [first] = [...sections];
      if (first)
        document.getElementById(first)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const attachPending = async (recipeId: string, title: string) => {
    const results = await Promise.all(
      pending.map((image, index) =>
        attachImageToRecipe({
          recipeId,
          filename: image.filename,
          originalName: image.originalName,
          mimeType: mimeTypeFor(image.filename),
          fileSize: image.fileSize,
          width: image.width ?? undefined,
          height: image.height ?? undefined,
          altText: title,
          isHero: index === 0,
        }).catch(() => ({ success: false })),
      ),
    );
    return results.filter((result) => !result.success).length;
  };

  const save = () => {
    startSaving(async () => {
      form.clearErrors();
      setSectionErrors({});
      setErrorSections(new Set());

      const cleaned = cleanEditorValues(form.getValues());
      const parsed = createRecipeSchema.safeParse(cleaned.values);
      if (!parsed.success) {
        showErrors(
          parsed.error.issues.map((issue) => ({
            path: issue.path.map((part) =>
              typeof part === "number" ? part : String(part),
            ),
            message: issue.message,
          })),
          cleaned.ingredientRows,
          cleaned.instructionRows,
        );
        toast.error("A few things need fixing before this can be saved.");
        return;
      }

      if (mode === RecipeEditorMode.CREATE) {
        const result = await createRecipe(parsed.data);
        if (!result.success || !result.data) {
          toast.error(result.error || "That recipe didn't save. Try again.");
          return;
        }
        const failed = await attachPending(result.data.id, parsed.data.title);
        draft.clear();
        form.reset(form.getValues());
        if (failed > 0) {
          toast.warning("Recipe saved, but some photos didn't attach.");
        } else {
          toast.success("Recipe saved");
        }
        router.push(`/recipes/${result.data.slug}`);
        return;
      }

      if (!recipe) return;
      const result = await updateRecipe({ ...parsed.data, id: recipe.id });
      if (!result.success || !result.data) {
        toast.error(result.error || "Your changes didn't save. Try again.");
        return;
      }
      draft.clear();
      form.reset(form.getValues());
      toast.success("Changes saved");
      router.push(`/recipes/${result.data.slug}`);
      router.refresh();
    });
  };

  const savedLabel = draft.lastSavedAt
    ? "Draft saved on this device"
    : isDirty
      ? "Unsaved changes"
      : null;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        noValidate
        className="space-y-5"
      >
        <div className="sticky top-0 z-30 -mx-5 flex flex-wrap items-center gap-3 bg-background/95 px-5 py-3 backdrop-blur lg:-mx-9 lg:px-9">
          {recipe ? (
            <Link
              href={`/recipes/${recipe.slug}`}
              className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
            >
              <ArrowLeft className="size-4" />
              Back to recipe
            </Link>
          ) : (
            onStartOver && (
              <button
                type="button"
                onClick={onStartOver}
                className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <ArrowLeft className="size-4" />
                Start over
              </button>
            )
          )}
          <div className="ml-auto flex items-center gap-3">
            {savedLabel && (
              <span
                className="hidden text-meta font-normal text-muted-foreground sm:inline"
                aria-live="polite"
              >
                {savedLabel}
              </span>
            )}
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving
                ? "Saving…"
                : mode === RecipeEditorMode.CREATE
                  ? "Save recipe"
                  : "Save changes"}
            </Button>
          </div>
        </div>

        {notice && (
          <p className="rounded-control bg-accent px-4 py-3 text-accent-foreground">
            {notice}
          </p>
        )}

        {draft.savedDraft && (
          <div className="flex flex-wrap items-center gap-3 rounded-control bg-card px-4 py-3">
            <p className="flex-1">
              You have an unsaved draft from{" "}
              {formatRelativeDay(
                new Date(draft.savedDraft.savedAt),
              ).toLowerCase()}
              .
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (draft.savedDraft) {
                  form.reset(draft.savedDraft.values, {
                    keepDefaultValues: true,
                  });
                }
                draft.dismiss();
              }}
            >
              Restore draft
            </Button>
            <Button
              type="button"
              size="sm"
              variant={ButtonVariant.GHOST}
              onClick={draft.clear}
            >
              Discard
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          <EditorSectionNav sectionsWithErrors={errorSections} />
          <div className="min-w-0 space-y-5">
            <EditorBasics />
            <EditorIngredients
              sectionError={sectionErrors[EditorSection.INGREDIENTS] ?? null}
            />
            <EditorMethod
              sectionError={sectionErrors[EditorSection.METHOD] ?? null}
            />
            <EditorPhotos
              recipeId={recipe?.id ?? null}
              title={values.title}
              images={images}
              onImagesChange={setImages}
              pending={pending}
              onPendingChange={setPending}
            />
            <EditorDetails automaticSwatch={automaticSwatch} />
            <EditorSharing />
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving
                  ? "Saving…"
                  : mode === RecipeEditorMode.CREATE
                    ? "Save recipe"
                    : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
