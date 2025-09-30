"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle,
  Copy,
  Globe,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Type,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { RecipeImageUpload } from "@/components/forms/recipe-image-upload";
import { RecipeUrlInput } from "@/components/forms/recipe-url-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { checkAIEnabledAction } from "@/lib/server-actions/ai-config-actions";
import { parseRecipeTextAction } from "@/lib/server-actions/ai-recipe-parsing-actions";
import type { ImageProcessingResult, RecipeParsingResult } from "@/lib/types";
import { ImageProcessingMethod } from "@/lib/types";

interface AIRecipeParserProps {
  onRecipeParsed: (recipe: RecipeParsingResult) => void;
  disabled?: boolean;
  userId: string;
}

export function AIRecipeParser({
  onRecipeParsed,
  disabled = false,
  userId,
}: AIRecipeParserProps) {
  const [recipeText, setRecipeText] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    recipe?: RecipeParsingResult;
    error?: string;
  } | null>(null);
  const [isAIEnabled, setIsAIEnabled] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("text");

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const recipeTextId = useId();

  // Check AI availability on component mount
  useEffect(() => {
    const checkAI = async () => {
      const result = await checkAIEnabledAction(userId);
      setIsAIEnabled(result.success ? (result.data ?? false) : false);
    };
    checkAI();
  }, [userId]);

  const handleParseText = async () => {
    if (!recipeText.trim()) return;

    setIsProcessing(true);
    setProcessingMessage("Processing recipe with AI...");
    setParseResult(null);

    try {
      const result = await parseRecipeTextAction(recipeText);

      if (result.success && result.data) {
        setParseResult({
          success: true,
          recipe: result.data,
        });
      } else {
        setParseResult({
          success: false,
          error: result.error || "Failed to parse recipe",
        });
      }
    } catch (_error) {
      setParseResult({
        success: false,
        error: "An error occurred while parsing the recipe",
      });
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const handleParseUrl = async () => {
    if (!recipeUrl.trim()) return;

    setIsProcessing(true);
    setProcessingMessage("Processing recipe URL with AI...");
    setParseResult(null);

    try {
      const result = await parseRecipeTextAction(recipeUrl);

      if (result.success && result.data) {
        setParseResult({
          success: true,
          recipe: result.data,
        });
      } else {
        setParseResult({
          success: false,
          error: result.error || "Failed to parse recipe from URL",
        });
      }
    } catch {
      setParseResult({
        success: false,
        error: "An error occurred while parsing the recipe URL",
      });
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const handleImageParsed = (result: ImageProcessingResult) => {
    setParseResult({
      success: true,
      recipe: result,
    });
  };

  const handleUseRecipe = () => {
    if (parseResult?.success && parseResult.recipe) {
      onRecipeParsed(parseResult.recipe);
      // Clear the form after successful use
      setRecipeText("");
      setRecipeUrl("");
      setParseResult(null);
    }
  };

  const handleCopyRecipeText = () => {
    if (parseResult?.success && parseResult.recipe) {
      const formatted = formatRecipeForCopy(parseResult.recipe);
      navigator.clipboard.writeText(formatted);
    }
  };

  const formatRecipeForCopy = (recipe: RecipeParsingResult): string => {
    let formatted = "";

    if (recipe.title) formatted += `${recipe.title}\n\n`;
    if (recipe.description) formatted += `${recipe.description}\n\n`;

    if (recipe.servings || recipe.prepTime || recipe.cookTime) {
      formatted += "Details:\n";
      if (recipe.servings) formatted += `Servings: ${recipe.servings}\n`;
      if (recipe.prepTime)
        formatted += `Prep Time: ${recipe.prepTime} minutes\n`;
      if (recipe.cookTime)
        formatted += `Cook Time: ${recipe.cookTime} minutes\n`;
      formatted += "\n";
    }

    if (recipe.ingredients?.length) {
      formatted += "Ingredients:\n";
      recipe.ingredients.forEach((ing, i) => {
        const quantity = ing.quantity ? `${ing.quantity} ` : "";
        const unit = ing.unit ? `${ing.unit} ` : "";
        formatted += `${i + 1}. ${quantity}${unit}${ing.name}\n`;
      });
      formatted += "\n";
    }

    if (recipe.instructions?.length) {
      formatted += "Instructions:\n";
      recipe.instructions.forEach((inst) => {
        formatted += `${inst.step}. ${inst.instruction}\n`;
      });
    }

    return formatted;
  };

  if (isAIEnabled === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>AI Recipe Parser</span>
            <Badge variant="secondary">Disabled</Badge>
          </CardTitle>
          <CardDescription>
            AI features are not configured. Set up an AI provider in your
            settings to enable smart recipe parsing.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>AI Recipe Parser</span>
          <Badge variant="outline" className="bg-primary/10">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </CardTitle>
        <CardDescription>
          Paste recipe text or URL and let AI extract the structured recipe data
          automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={recipeTextId}>Recipe Text</Label>
              <Textarea
                id={recipeTextId}
                placeholder="Paste your recipe text here..."
                value={recipeText}
                onChange={(e) => setRecipeText(e.target.value)}
                disabled={disabled || isProcessing}
                rows={6}
              />
            </div>

            <Button
              onClick={handleParseText}
              disabled={!recipeText.trim() || disabled || isProcessing}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Parse Recipe Text
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <RecipeUrlInput
              value={recipeUrl}
              onChange={setRecipeUrl}
              onSubmit={handleParseUrl}
              disabled={disabled || isProcessing}
              placeholder="https://example.com/recipe"
            />

            <Button
              onClick={handleParseUrl}
              disabled={!recipeUrl.trim() || disabled || isProcessing}
              className="w-full"
            >
              <Globe className="mr-2 h-4 w-4" />
              Parse Recipe URL
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <RecipeImageUpload
              onImageProcessed={handleImageParsed}
              processingMethod={ImageProcessingMethod.AUTO}
              disabled={disabled}
            />
          </TabsContent>
        </Tabs>

        {/* Simple Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              {processingMessage}
            </span>
          </div>
        )}

        {parseResult && (
          <div className="space-y-4">
            <Separator />

            {parseResult.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Recipe parsed successfully! Review the extracted data below.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{parseResult.error}</AlertDescription>
              </Alert>
            )}

            {parseResult.success && parseResult.recipe && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parsed Recipe</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={handleUseRecipe} size="sm">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Use This Recipe
                    </Button>
                    <Button
                      onClick={handleCopyRecipeText}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Text
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {parseResult.recipe.title && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground leading-tight">
                          {parseResult.recipe.title}
                        </h3>
                      </div>
                    )}

                    {parseResult.recipe.description && (
                      <div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {parseResult.recipe.description}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {parseResult.recipe.servings && (
                        <span>Servings: {parseResult.recipe.servings}</span>
                      )}
                      {parseResult.recipe.prepTime && (
                        <span>Prep: {parseResult.recipe.prepTime}min</span>
                      )}
                      {parseResult.recipe.cookTime && (
                        <span>Cook: {parseResult.recipe.cookTime}min</span>
                      )}
                      {parseResult.recipe.difficulty && (
                        <span>Difficulty: {parseResult.recipe.difficulty}</span>
                      )}
                    </div>

                    {parseResult.recipe.ingredients &&
                      parseResult.recipe.ingredients.length > 0 && (
                        <div>
                          <span className="font-medium">
                            Ingredients ({parseResult.recipe.ingredients.length}
                            ):
                          </span>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {parseResult.recipe.ingredients
                              .slice(0, 3)
                              .map((ing) => (
                                <div
                                  key={`${ing.name}-${ing.quantity || "no-qty"}`}
                                >
                                  {ing.quantity} {ing.unit} {ing.name}
                                </div>
                              ))}
                            {parseResult.recipe.ingredients.length > 3 && (
                              <div>
                                ... and{" "}
                                {parseResult.recipe.ingredients.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {parseResult.recipe.instructions &&
                      parseResult.recipe.instructions.length > 0 && (
                        <div>
                          <span className="font-medium">
                            Instructions (
                            {parseResult.recipe.instructions.length} steps):
                          </span>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {parseResult.recipe.instructions
                              .slice(0, 2)
                              .map((inst) => (
                                <div
                                  key={`step-${inst.step}-${inst.instruction.slice(0, 20)}`}
                                >
                                  {inst.step}. {inst.instruction.slice(0, 60)}
                                  ...
                                </div>
                              ))}
                            {parseResult.recipe.instructions.length > 2 && (
                              <div>
                                ... and{" "}
                                {parseResult.recipe.instructions.length - 2}{" "}
                                more steps
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {parseResult.recipe.tags &&
                      parseResult.recipe.tags.length > 0 && (
                        <div>
                          <span className="font-medium">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {parseResult.recipe.tags.map((tag) => (
                              <Badge
                                key={`tag-${tag}`}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
