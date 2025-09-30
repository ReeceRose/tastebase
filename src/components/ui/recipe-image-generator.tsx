"use client";

import { AlertCircle, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { ImageGenerationPromptData } from "@/lib/ai/prompts/image-generation-prompts";
import {
  type GeneratedImage,
  generateRecipeImageAction,
  getAvailableImageGenerationProvidersAction,
} from "@/lib/server-actions/recipe-image-generation-actions";
import { BadgeVariant } from "@/lib/types";

interface RecipeImageGeneratorProps {
  recipeId: string;
  recipeData: ImageGenerationPromptData;
  onImageGenerated?: (image: GeneratedImage) => void;
  className?: string;
}

interface Provider {
  id: string;
  name: string;
  model: string;
}

export function RecipeImageGenerator({
  recipeId,
  recipeData,
  onImageGenerated,
  className,
}: RecipeImageGeneratorProps) {
  const buttonId = useId();
  const dropdownId = useId();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [_showErrorDetails, setShowErrorDetails] = useState(false);

  const loadProviders = useCallback(async () => {
    if (providersLoaded) return;

    try {
      const result = await getAvailableImageGenerationProvidersAction();
      if (result.success && result.data) {
        setProviders(result.data.providers);
      } else {
        setProviders([]); // Explicitly set empty array on failure
      }
    } catch (_error) {
      setProviders([]); // Explicitly set empty array on error
    }
    setProvidersLoaded(true);
  }, [providersLoaded]);

  // Load providers on component mount
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Clear error when providers change
  useEffect(() => {
    if (providersLoaded) {
      setError(null);
    }
  }, [providersLoaded]);

  const handleGenerate = async (providerId?: string) => {
    setIsGenerating(true);
    setError(null);
    setShowErrorDetails(false);

    try {
      const result = await generateRecipeImageAction(
        recipeId,
        recipeData,
        providerId,
      );

      if (result.success && result.data) {
        onImageGenerated?.(result.data);
      } else {
        setError(result.error || "Failed to generate image");
      }
    } catch (_err) {
      setError("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading skeleton while checking providers
  if (!providersLoaded) {
    return (
      <div className={className}>
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  // Show helpful message if no providers available
  if (providers.length === 0) {
    return (
      <div className={className}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            AI image generation requires Google or OpenAI API keys.
            <br />
            <strong>To enable:</strong> Go to Settings → AI Configuration and
            add your Google or OpenAI API key.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      {error ? (
        // Show compact error state inline
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Failed</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setError(null)}
          >
            Try Again
          </Button>
        </div>
      ) : providers.length === 1 ? (
        <Button
          id={buttonId}
          onClick={() => handleGenerate()}
          disabled={isGenerating}
          variant="outline"
          size="sm"
          className="h-8"
        >
          {isGenerating ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          {isGenerating ? "Generating..." : "Generate AI Image"}
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id={dropdownId}
              variant="outline"
              size="sm"
              className="h-8"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {isGenerating ? "Generating..." : "Generate AI Image"}
              {!isGenerating && <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {providers.map((provider) => (
              <DropdownMenuItem
                key={provider.id}
                onClick={() => handleGenerate(provider.id)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{provider.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {provider.model}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function AIGeneratedBadge({ className }: { className?: string }) {
  return (
    <Badge variant={BadgeVariant.SECONDARY} className={className}>
      <Sparkles className="h-3 w-3 mr-1" />
      AI Generated
    </Badge>
  );
}
