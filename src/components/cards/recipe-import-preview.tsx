"use client";

import { AlertTriangle, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RECIPE_IMPORT_SOURCE_LABELS,
  type RecipeImportResult,
  RecipeImportSource,
} from "@/lib/types/import-types";

const PREVIEW_INGREDIENTS = 5;
const PREVIEW_STEPS = 3;

interface RecipeImportPreviewProps {
  result: RecipeImportResult;
  aiConfigured: boolean;
  isCleaningUp: boolean;
  onUse: () => void;
  onCleanUpWithAI: () => void;
}

export function RecipeImportPreview({
  result,
  aiConfigured,
  isCleaningUp,
  onUse,
  onCleanUpWithAI,
}: RecipeImportPreviewProps) {
  const { recipe } = result;
  const isAIResult =
    result.source === RecipeImportSource.AI_TEXT ||
    result.source === RecipeImportSource.AI_VISION;
  const canCleanUp =
    aiConfigured && !isAIResult && (result.rawText ?? "").trim().length > 0;
  const isEmpty =
    recipe.ingredients.length === 0 && recipe.instructions.length === 0;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">
            {recipe.title ?? "Untitled recipe"}
          </CardTitle>
          <Badge variant="outline">
            {RECIPE_IMPORT_SOURCE_LABELS[result.source]}
          </Badge>
        </div>
        {result.sourceName && (
          <p className="text-sm text-muted-foreground">
            From {result.sourceName}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {result.warnings.map((warning) => (
          <Alert key={warning}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        ))}

        {recipe.description && (
          <p className="text-sm text-muted-foreground">{recipe.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {recipe.servings && <span>Serves {recipe.servings}</span>}
          {recipe.prepTime && <span>Prep {recipe.prepTime} min</span>}
          {recipe.cookTime && <span>Cook {recipe.cookTime} min</span>}
        </div>

        {recipe.ingredients.length > 0 && (
          <div className="space-y-1 text-sm">
            <p className="font-medium">
              Ingredients ({recipe.ingredients.length})
            </p>
            <ul className="space-y-0.5 text-muted-foreground">
              {recipe.ingredients
                .slice(0, PREVIEW_INGREDIENTS)
                .map((ingredient) => (
                  <li
                    key={`import-ingredient-${ingredient.quantity ?? ""}-${ingredient.unit ?? ""}-${ingredient.name}`}
                  >
                    {[ingredient.quantity, ingredient.unit, ingredient.name]
                      .filter(Boolean)
                      .join(" ")}
                  </li>
                ))}
              {recipe.ingredients.length > PREVIEW_INGREDIENTS && (
                <li>
                  and {recipe.ingredients.length - PREVIEW_INGREDIENTS} more
                </li>
              )}
            </ul>
          </div>
        )}

        {recipe.instructions.length > 0 && (
          <div className="space-y-1 text-sm">
            <p className="font-medium">Steps ({recipe.instructions.length})</p>
            <ol className="space-y-0.5 text-muted-foreground">
              {recipe.instructions.slice(0, PREVIEW_STEPS).map((step) => (
                <li key={`import-step-${step.step}`} className="line-clamp-2">
                  {step.step}. {step.instruction}
                </li>
              ))}
              {recipe.instructions.length > PREVIEW_STEPS && (
                <li>and {recipe.instructions.length - PREVIEW_STEPS} more</li>
              )}
            </ol>
          </div>
        )}

        {isEmpty && (
          <p className="text-sm text-muted-foreground">
            No ingredients or steps were found.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={onUse} disabled={isCleaningUp}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Review and save
          </Button>
          {canCleanUp && (
            <Button
              variant="outline"
              onClick={onCleanUpWithAI}
              disabled={isCleaningUp}
            >
              {isCleaningUp ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Clean up with AI
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
