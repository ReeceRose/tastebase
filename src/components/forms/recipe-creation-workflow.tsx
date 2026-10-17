"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { AddRecipeStart } from "@/components/forms/add-recipe-start";
import { RecipeEditor } from "@/components/forms/recipe-editor/recipe-editor";
import { Button } from "@/components/ui/button";
import {
  getRecipeImportCapabilitiesAction,
  importRecipeFromImageAction,
  importRecipeFromTextAction,
  importRecipeFromUrlAction,
} from "@/lib/server-actions/recipe-import-actions";
import type { ServerActionResult } from "@/lib/server-actions/utils";
import { AddRecipeStep, ButtonVariant, RecipeEditorMode } from "@/lib/types";
import {
  RECIPE_IMPORT_SOURCE_LABELS,
  type RecipeImportResult,
  RecipeImportSource,
} from "@/lib/types/import-types";
import type { RecipeEditorValues } from "@/lib/types/recipe-types";
import {
  editorValuesFromImport,
  emptyEditorValues,
} from "@/lib/utils/recipe-editor-values";
import { mapImportResultToFormData } from "@/lib/utils/recipe-import-mapping";

interface RecipeCreationWorkflowProps {
  userId: string;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function noticeFor(result: RecipeImportResult): string {
  const from = result.sourceName ? ` from ${result.sourceName}` : "";
  const found =
    result.recipe.ingredients.length === 0 &&
    result.recipe.instructions.length === 0
      ? "We couldn't find ingredients or steps, so fill them in below."
      : `${RECIPE_IMPORT_SOURCE_LABELS[result.source]}. Check it over, then save.`;
  return `Imported${from}. ${found}`;
}

export function RecipeCreationWorkflow({
  userId,
}: RecipeCreationWorkflowProps) {
  const [step, setStep] = useState<AddRecipeStep>(AddRecipeStep.START);
  const [isImporting, startImport] = useTransition();
  const [importingLabel, setImportingLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecipeImportResult | null>(null);
  const [values, setValues] = useState<RecipeEditorValues>(emptyEditorValues);
  const [canTidy, setCanTidy] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const runImport = (
    label: string,
    request: () => Promise<ServerActionResult<RecipeImportResult>>,
  ) => {
    setError(null);
    setImportingLabel(label);
    startImport(async () => {
      const [response, capabilities] = await Promise.all([
        request(),
        getRecipeImportCapabilitiesAction().catch(() => undefined),
      ]);
      setImportingLabel(null);
      if (!response.success) {
        setError(response.error);
        return;
      }
      const imported = response.data;
      const aiResult =
        imported.source === RecipeImportSource.AI_TEXT ||
        imported.source === RecipeImportSource.AI_VISION;
      setCanTidy(
        Boolean(
          capabilities?.success &&
            capabilities.data.aiConfigured &&
            !aiResult &&
            (imported.rawText ?? "").trim(),
        ),
      );
      setResult(imported);
      setValues(editorValuesFromImport(mapImportResultToFormData(imported)));
      setEditorKey((key) => key + 1);
      setStep(AddRecipeStep.REVIEW);
    });
  };

  const tidyWithAI = () => {
    if (!result?.rawText) return;
    const rawText = result.rawText;
    runImport("Tidying up with AI…", async () => {
      const response = await importRecipeFromTextAction(rawText, true);
      return response.success
        ? {
            ...response,
            data: {
              ...response.data,
              sourceUrl: result.sourceUrl,
              sourceName: result.sourceName,
            },
          }
        : response;
    });
  };

  const startOver = () => {
    setStep(AddRecipeStep.START);
    setResult(null);
    setError(null);
    setValues(emptyEditorValues());
  };

  if (step === AddRecipeStep.START) {
    return (
      <AddRecipeStart
        isImporting={isImporting}
        importingLabel={importingLabel}
        error={error}
        onImportUrl={(url) =>
          runImport(`Reading the recipe from ${hostnameOf(url)}…`, () =>
            importRecipeFromUrlAction(url),
          )
        }
        onImportText={(text) =>
          runImport("Reading your recipe…", () =>
            importRecipeFromTextAction(text, false),
          )
        }
        onImportImage={(image) => {
          const formData = new FormData();
          formData.append("image", image);
          runImport("Reading the photo…", () =>
            importRecipeFromImageAction(formData),
          );
        }}
        onWriteManually={() => {
          setResult(null);
          setValues(emptyEditorValues());
          setEditorKey((key) => key + 1);
          setStep(AddRecipeStep.REVIEW);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] lg:text-title">
        {result ? "Check it over" : "Write a recipe"}
      </h1>
      {result && result.warnings.length > 0 && (
        <ul className="space-y-1 rounded-control bg-card px-4 py-3 text-muted-foreground">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      {canTidy && (
        <div className="flex flex-wrap items-center gap-3 rounded-control bg-card px-4 py-3">
          <p className="flex-1">
            Something look off? AI can tidy up the ingredients and steps.
          </p>
          <Button
            type="button"
            variant={ButtonVariant.OUTLINE}
            size="sm"
            onClick={tidyWithAI}
            disabled={isImporting}
          >
            <Sparkles />
            {isImporting ? "Tidying…" : "Tidy up with AI"}
          </Button>
          {error && (
            <p role="alert" className="w-full text-meta text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
      <RecipeEditor
        key={editorKey}
        mode={RecipeEditorMode.CREATE}
        userId={userId}
        recipe={null}
        initialValues={values}
        notice={result ? noticeFor(result) : null}
        onStartOver={startOver}
      />
    </div>
  );
}
