"use client";

import {
  AlertTriangle,
  Globe,
  Image as ImageIcon,
  Loader2,
  Type,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { RecipeImportPreview } from "@/components/cards/recipe-import-preview";
import { RecipeImageUpload } from "@/components/forms/recipe-image-upload";
import { RecipeUrlInput } from "@/components/forms/recipe-url-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getRecipeImportCapabilitiesAction,
  importRecipeFromImageAction,
  importRecipeFromTextAction,
  importRecipeFromUrlAction,
} from "@/lib/server-actions/recipe-import-actions";
import type { ServerActionResult } from "@/lib/server-actions/utils";
import {
  type RecipeImportCapabilities,
  RecipeImportInput,
  type RecipeImportResult,
} from "@/lib/types/import-types";

interface RecipeImportFormProps {
  onImported: (result: RecipeImportResult) => void;
}

function photoDescription(capabilities: RecipeImportCapabilities | null) {
  if (capabilities?.visionAvailable) {
    return `The photo is sent to ${capabilities.providerName} to read the recipe.`;
  }
  return "The photo is read on this server with OCR. Clear, well-lit photos of printed recipes work best.";
}

export function RecipeImportForm({ onImported }: RecipeImportFormProps) {
  const textId = useId();
  const [activeTab, setActiveTab] = useState<string>(RecipeImportInput.URL);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [capabilities, setCapabilities] =
    useState<RecipeImportCapabilities | null>(null);
  const [result, setResult] = useState<RecipeImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    getRecipeImportCapabilitiesAction().then((response) => {
      if (response.success) {
        setCapabilities(response.data);
      }
    });
  }, []);

  const runImport = async (
    request: () => Promise<ServerActionResult<RecipeImportResult>>,
  ) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    const response = await request();
    setIsProcessing(false);
    if (response.success) {
      setResult(response.data);
    } else {
      setError(response.error);
    }
  };

  const handleCleanUp = async () => {
    if (!result?.rawText) {
      return;
    }
    setIsCleaningUp(true);
    const response = await importRecipeFromTextAction(result.rawText, true);
    setIsCleaningUp(false);
    if (response.success) {
      setResult({
        ...response.data,
        sourceUrl: result.sourceUrl,
        sourceName: result.sourceName,
      });
    } else {
      setError(response.error);
    }
  };

  const handleImage = (image: File) => {
    const formData = new FormData();
    formData.append("image", image);
    runImport(() => importRecipeFromImageAction(formData));
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value={RecipeImportInput.URL} className="gap-2">
            <Globe className="h-4 w-4" />
            Link
          </TabsTrigger>
          <TabsTrigger value={RecipeImportInput.TEXT} className="gap-2">
            <Type className="h-4 w-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value={RecipeImportInput.IMAGE} className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Photo
          </TabsTrigger>
        </TabsList>

        <TabsContent value={RecipeImportInput.URL} className="space-y-4">
          <RecipeUrlInput
            value={url}
            onChange={setUrl}
            onSubmit={() => runImport(() => importRecipeFromUrlAction(url))}
            disabled={isProcessing}
          />
          <Button
            className="w-full"
            onClick={() => runImport(() => importRecipeFromUrlAction(url))}
            disabled={!url.trim() || isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import from link
          </Button>
        </TabsContent>

        <TabsContent value={RecipeImportInput.TEXT} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={textId}>Recipe text</Label>
            <Textarea
              id={textId}
              rows={10}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                "Paste a recipe. Headings like Ingredients and Instructions help."
              }
              disabled={isProcessing}
            />
          </div>
          <Button
            className="w-full"
            onClick={() =>
              runImport(() => importRecipeFromTextAction(text, false))
            }
            disabled={!text.trim() || isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import text
          </Button>
        </TabsContent>

        <TabsContent value={RecipeImportInput.IMAGE}>
          <RecipeImageUpload
            onSubmit={handleImage}
            isProcessing={isProcessing}
            description={photoDescription(capabilities)}
          />
        </TabsContent>
      </Tabs>

      {capabilities && !capabilities.aiConfigured && (
        <p className="text-sm text-muted-foreground">
          Imports work without AI. For messy text and photos,{" "}
          <Link href="/settings?tab=ai" className="underline">
            add an AI provider
          </Link>
          .
        </p>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <RecipeImportPreview
          result={result}
          aiConfigured={capabilities?.aiConfigured ?? false}
          isCleaningUp={isCleaningUp}
          onUse={() => onImported(result)}
          onCleanUpWithAI={handleCleanUp}
        />
      )}
    </div>
  );
}
