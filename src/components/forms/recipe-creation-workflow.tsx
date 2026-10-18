"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { ImportSummaryCard } from "@/components/cards/import-summary-card";
import { SavedRecipeNotice } from "@/components/cards/saved-recipe-notice";
import { AddRecipeStart } from "@/components/forms/add-recipe-start";
import { RecipeEditor } from "@/components/forms/recipe-editor/recipe-editor";
import { RecipeImportProgress } from "@/components/skeletons/recipe-import-progress";
import { Button } from "@/components/ui/button";
import { useExtensionPageImport } from "@/hooks/use-extension-page-import";
import {
  findSavedRecipeAction,
  getRecipeImportCapabilitiesAction,
  importRecipeFromImageAction,
  importRecipeFromPageAction,
  importRecipeFromTextAction,
  importRecipeFromUrlAction,
} from "@/lib/server-actions/recipe-import-actions";
import type { ServerActionResult } from "@/lib/server-actions/utils";
import { AddRecipeStep, ButtonVariant, RecipeEditorMode } from "@/lib/types";
import {
  type PhotoSuggestion,
  type RecipeImportResult,
  RecipeImportSource,
  type SavedRecipeMatch,
} from "@/lib/types/import-types";
import type {
  PendingImage,
  RecipeEditorValues,
} from "@/lib/types/recipe-types";
import { mergePhotoSuggestions } from "@/lib/utils/photo-suggestions";
import {
  editorValuesFromImport,
  emptyEditorValues,
} from "@/lib/utils/recipe-editor-values";
import { mapImportResultToFormData } from "@/lib/utils/recipe-import-mapping";

interface RecipeCreationWorkflowProps {
  userId: string;
  fromExtension: boolean;
  sharedUrl: string | null;
}

const EXTENSION_TIMEOUT_ERROR =
  "Nothing arrived from the browser extension. Open the recipe and click Save to Tastebase again.";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function RecipeCreationWorkflow({
  userId,
  fromExtension,
  sharedUrl,
}: RecipeCreationWorkflowProps) {
  const [step, setStep] = useState<AddRecipeStep>(AddRecipeStep.START);
  const [isImporting, startImport] = useTransition();
  const [importingLabel, setImportingLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecipeImportResult | null>(null);
  const [values, setValues] = useState<RecipeEditorValues>(emptyEditorValues);
  const [canTidy, setCanTidy] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [awaitingImport, setAwaitingImport] = useState(
    fromExtension || sharedUrl !== null,
  );
  const [photoSuggestions, setPhotoSuggestions] = useState<PhotoSuggestion[]>(
    [],
  );
  const [initialPhotos, setInitialPhotos] = useState<PendingImage[]>([]);
  const keptPhotos = useRef<PendingImage[]>([]);
  const [savedMatch, setSavedMatch] = useState<SavedRecipeMatch | null>(null);

  const checkAlreadySaved = (sourceUrl: string | null) => {
    setSavedMatch(null);
    if (!sourceUrl) return;
    findSavedRecipeAction(sourceUrl)
      .then((response) => {
        if (response.success) setSavedMatch(response.data);
      })
      .catch(() => undefined);
  };

  const runImport = (
    label: string,
    request: () => Promise<ServerActionResult<RecipeImportResult>>,
    capturedPhotos: PhotoSuggestion[] = [],
    photosToKeep: PendingImage[] | null = null,
  ) => {
    setError(null);
    setImportingLabel(label);
    startImport(async () => {
      const [response, capabilities] = await Promise.all([
        request(),
        getRecipeImportCapabilitiesAction().catch(() => undefined),
      ]);
      setImportingLabel(null);
      setAwaitingImport(false);
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
      checkAlreadySaved(imported.sourceUrl);
      setPhotoSuggestions(mergePhotoSuggestions(capturedPhotos, imported));
      setInitialPhotos(
        photosToKeep ?? (imported.image ? [imported.image] : []),
      );
      setValues(editorValuesFromImport(mapImportResultToFormData(imported)));
      setEditorKey((key) => key + 1);
      setStep(AddRecipeStep.REVIEW);
    });
  };

  useExtensionPageImport({
    enabled: fromExtension,
    onProgress: ({ photosDone, photosTotal }) =>
      setImportingLabel(
        photosTotal > 1
          ? `Gathering photos (${Math.min(photosDone, photosTotal)} of ${photosTotal})…`
          : "Gathering photos…",
      ),
    onPage: (page) =>
      runImport(
        `Reading the recipe from ${hostnameOf(page.url)}…`,
        () => importRecipeFromPageAction({ ...page, photos: [] }),
        page.photos,
      ),
    onTimeout: () => {
      setAwaitingImport(false);
      setError(EXTENSION_TIMEOUT_ERROR);
    },
  });

  const importUrl = (url: string) =>
    runImport(`Reading the recipe from ${hostnameOf(url)}…`, () =>
      importRecipeFromUrlAction(url),
    );

  const sharedImportStarted = useRef(false);
  useEffect(() => {
    if (!sharedUrl || sharedImportStarted.current) return;
    sharedImportStarted.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    importUrl(sharedUrl);
  });

  const tidyWithAI = () => {
    if (!result?.rawText) return;
    const rawText = result.rawText;
    runImport(
      "Tidying up with AI…",
      async () => {
        const response = await importRecipeFromTextAction(rawText, true);
        return response.success
          ? {
              ...response,
              data: {
                ...response.data,
                sourceUrl: result.sourceUrl,
                sourceName: result.sourceName,
                imageUrl: result.imageUrl,
                image: result.image,
              },
            }
          : response;
      },
      photoSuggestions,
      keptPhotos.current,
    );
  };

  const startOver = () => {
    setStep(AddRecipeStep.START);
    setResult(null);
    setError(null);
    setPhotoSuggestions([]);
    setSavedMatch(null);
    setValues(emptyEditorValues());
  };

  if (step === AddRecipeStep.START && awaitingImport) {
    return (
      <RecipeImportProgress
        label={
          importingLabel ??
          (sharedUrl
            ? `Reading the recipe from ${hostnameOf(sharedUrl)}…`
            : "Finding the recipe…")
        }
      />
    );
  }

  if (step === AddRecipeStep.START) {
    return (
      <AddRecipeStart
        isImporting={isImporting}
        importingLabel={importingLabel}
        error={error}
        initialUrl={sharedUrl ?? ""}
        onImportUrl={importUrl}
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
          setSavedMatch(null);
          setInitialPhotos([]);
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
      {savedMatch && <SavedRecipeNotice match={savedMatch} />}
      {result && (
        <ImportSummaryCard
          result={result}
          morePhotos={photoSuggestions.length}
        />
      )}
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
        notice={null}
        initialPhotos={initialPhotos}
        onPhotosChange={(photos) => {
          keptPhotos.current = photos;
        }}
        photoSuggestions={photoSuggestions}
        onStartOver={startOver}
      />
    </div>
  );
}
