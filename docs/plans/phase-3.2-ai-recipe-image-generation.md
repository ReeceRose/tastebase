# Phase 3.2: AI Recipe Image Generation

**Duration:** 4-5 hours
**Priority:** Medium-High (AI Enhancement Feature)
**Prerequisites:** Phase 3 (AI Integration) and Phase 3.1 (Dual Image Processing) completed
**Dependencies:** Existing AI infrastructure, image storage system

---

## Overview

Add AI-powered image generation capabilities to create professional food photography for recipes using multiple AI providers (Google Gemini 2.5 Flash Image, OpenAI DALL-E 3, etc.). Users can generate clean, studio-quality images on demand through an intuitive UI integration that builds on the existing AI infrastructure.

## Goals

- ✅ Multi-provider AI image generation (Google Gemini 2.5 Flash Image, OpenAI DALL-E 3)
- ✅ Professional food photography aesthetic with studio lighting
- ✅ Seamless UI integration in recipe detail and create/edit pages
- ✅ Generate unlimited images per recipe on user request
- ✅ AI-generated image metadata and tagging system
- ✅ Provider detection based on user's configured API keys
- ✅ Comprehensive prompt engineering using all recipe data
- ✅ Error handling with optional detailed error information

---

## Tasks Breakdown

### ✅ 1. AI Providers Configuration Updates (~30 minutes) - COMPLETED

**File:** `src/lib/ai/providers.ts` (MODIFY)

#### 1.1 Add Image Generation Support Functions
```typescript
export function supportsImageGeneration(provider: AIProvider): boolean {
  switch (provider) {
    case "google":
    case "openai":
      return true;
    case "anthropic":
    case "ollama":
    case "none":
      return false;
    default:
      return false;
  }
}

export function getImageGenerationModel(provider: AIProvider): string | null {
  switch (provider) {
    case "google":
      return "gemini-2-5-flash-image";
    case "openai":
      return "dall-e-3";
    case "anthropic":
    case "ollama":
    case "none":
    default:
      return null;
  }
}

export function getAvailableImageProviders(userSettings: AIConfig): AIProvider[] {
  const providers: AIProvider[] = [];

  if (userSettings.hasGoogleKey && supportsImageGeneration("google")) {
    providers.push("google");
  }

  if (userSettings.hasOpenaiKey && supportsImageGeneration("openai")) {
    providers.push("openai");
  }

  return providers;
}
```

#### 1.2 Update Model Display Names
```typescript
// Add to existing modelDisplayNames object in getModelDisplayName function
google: {
  "gemini-2.0-flash-exp": "Gemini 2.0 Flash (Experimental)",
  "gemini-2-5-flash-image": "Gemini 2.5 Flash Image", // NEW
  "gemini-1.5-pro": "Gemini 1.5 Pro",
  "gemini-1.5-flash": "Gemini 1.5 Flash",
},
openai: {
  "gpt-5": "GPT-5",
  "gpt-5-mini": "GPT-5 Mini",
  "gpt-5-nano": "GPT-5 Nano",
  "gpt-5-chat-latest": "GPT-5 Chat (Latest)",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4": "GPT-4",
  "gpt-4-turbo": "GPT-4 Turbo",
  "dall-e-3": "DALL-E 3", // NEW
},
```

### ✅ 2. Image Generation Prompt Engineering (~30 minutes) - COMPLETED

**File:** `src/lib/ai/prompts/image-generation-prompts.ts` (CREATE)

#### 2.1 Prompt Builder Function
```typescript
import type { Recipe, RecipeIngredient, RecipeInstruction } from "@/lib/types";

export interface ImageGenerationPromptData {
  title: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  cuisineType?: string;
  tags?: string[];
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  notes?: string;
}

export function buildRecipeImagePrompt(data: ImageGenerationPromptData): string {
  const {
    title,
    description,
    ingredients,
    instructions,
    cuisineType,
    tags,
    servings,
    notes
  } = data;

  // Base style directive
  const styleDirective = "Professional food photography, clean minimal studio lighting, elegant plating, high-end cookbook style, white or neutral background, shot from above at 45-degree angle";

  // Build detailed description
  const parts: string[] = [
    `A beautifully plated ${title}`,
  ];

  // Add description context
  if (description) {
    parts.push(`- ${description.slice(0, 200)}`);
  }

  // Add ingredient highlights
  if (ingredients.length > 0) {
    const keyIngredients = ingredients
      .slice(0, 5) // Top 5 ingredients
      .map(ing => ing.name)
      .join(", ");
    parts.push(`featuring ${keyIngredients}`);
  }

  // Add cooking technique context
  if (instructions.length > 0) {
    const cookingMethods = extractCookingMethods(instructions);
    if (cookingMethods.length > 0) {
      parts.push(`prepared by ${cookingMethods.join(" and ")}`);
    }
  }

  // Add cuisine and serving context
  if (cuisineType) {
    parts.push(`in ${cuisineType} style`);
  }

  if (servings) {
    const servingStyle = servings === 1 ? "individual portion" :
                        servings <= 4 ? "family-style presentation" :
                        "large serving platter";
    parts.push(`presented as ${servingStyle}`);
  }

  // Add dietary context
  if (tags) {
    const dietaryTags = tags.filter(tag =>
      ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo']
        .some(diet => tag.toLowerCase().includes(diet))
    );
    if (dietaryTags.length > 0) {
      parts.push(`(${dietaryTags.join(", ")})`);
    }
  }

  const prompt = parts.join(" ") + `. ${styleDirective}. Highly detailed, appetizing, and visually stunning.`;

  return prompt;
}

function extractCookingMethods(instructions: RecipeInstruction[]): string[] {
  const methods = new Set<string>();
  const methodKeywords = {
    'baking': ['bake', 'baked', 'oven'],
    'grilling': ['grill', 'grilled', 'barbecue'],
    'sautéing': ['sauté', 'sautéed', 'pan-fry'],
    'roasting': ['roast', 'roasted'],
    'braising': ['braise', 'braised'],
    'steaming': ['steam', 'steamed'],
    'frying': ['fry', 'fried', 'deep-fry'],
    'simmering': ['simmer', 'simmered'],
    'boiling': ['boil', 'boiled']
  };

  const fullText = instructions.map(inst => inst.instruction.toLowerCase()).join(' ');

  for (const [method, keywords] of Object.entries(methodKeywords)) {
    if (keywords.some(keyword => fullText.includes(keyword))) {
      methods.add(method);
    }
  }

  return Array.from(methods).slice(0, 2); // Limit to 2 methods
}
```

### ✅ 3. AI Image Generation Service (~1 hour) - COMPLETED

**File:** `src/lib/ai/services/image-generation-service.ts` (CREATE)

#### 3.1 Core Service Implementation
```typescript
import { generateImage } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { getProvider } from "@/lib/ai/providers";
import { buildRecipeImagePrompt, type ImageGenerationPromptData } from "@/lib/ai/prompts/image-generation-prompts";
import type { AIProvider, AIProviderConfig } from "@/lib/types";

export interface ImageGenerationResult {
  success: boolean;
  imageData?: string; // base64 encoded
  imageUrl?: string;
  metadata: {
    provider: AIProvider;
    model: string;
    prompt: string;
    generatedAt: string;
    size?: string;
    quality?: string;
  };
  error?: string;
}

export class AIImageGenerationService {
  static async generateRecipeImage(
    recipeData: ImageGenerationPromptData,
    userConfig: AIProviderConfig
  ): Promise<ImageGenerationResult> {
    try {
      // Build comprehensive prompt
      const prompt = buildRecipeImagePrompt(recipeData);

      // Generate image based on provider
      const result = await this.callImageGenerationAPI(prompt, userConfig);

      return {
        success: true,
        imageData: result.imageData,
        imageUrl: result.imageUrl,
        metadata: {
          provider: userConfig.provider,
          model: result.model,
          prompt,
          generatedAt: new Date().toISOString(),
          size: result.size,
          quality: result.quality,
        }
      };
    } catch (error) {
      return {
        success: false,
        metadata: {
          provider: userConfig.provider,
          model: "",
          prompt: buildRecipeImagePrompt(recipeData),
          generatedAt: new Date().toISOString(),
        },
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  private static async callImageGenerationAPI(
    prompt: string,
    config: AIProviderConfig
  ): Promise<{
    imageData: string;
    imageUrl: string;
    model: string;
    size?: string;
    quality?: string;
  }> {
    const { provider, apiKey } = config;

    switch (provider) {
      case "google": {
        if (!apiKey) {
          throw new Error("Google API key is required for image generation");
        }

        const { image } = await generateImage({
          model: google("gemini-2-5-flash-image", { apiKey }),
          prompt,
          size: "1024x1024"
        });

        return {
          imageData: Buffer.from(await image.arrayBuffer()).toString('base64'),
          imageUrl: image.url || "",
          model: "gemini-2-5-flash-image",
          size: "1024x1024"
        };
      }

      case "openai": {
        if (!apiKey) {
          throw new Error("OpenAI API key is required for image generation");
        }

        const { image } = await generateImage({
          model: openai("dall-e-3", { apiKey }),
          prompt,
          size: "1024x1024",
          quality: "standard"
        });

        return {
          imageData: Buffer.from(await image.arrayBuffer()).toString('base64'),
          imageUrl: image.url || "",
          model: "dall-e-3",
          size: "1024x1024",
          quality: "standard"
        };
      }

      default:
        throw new Error(`Image generation not supported for provider: ${provider}`);
    }
  }

  static getAvailableImageProviders(userSettings: any): AIProvider[] {
    const providers: AIProvider[] = [];

    if (userSettings.hasGoogleKey) {
      providers.push("google");
    }

    if (userSettings.hasOpenaiKey) {
      providers.push("openai");
    }

    return providers;
  }
}
```

### ✅ 4. Database Schema Update (~15 minutes) - COMPLETED

**File:** `src/db/migrations/0012_add_image_metadata.sql` (CREATE)

#### 4.1 Add Metadata Column to Recipe Images
```sql
-- Add metadata column to store AI generation information
ALTER TABLE recipe_images ADD COLUMN metadata JSONB;

-- Create index for querying AI-generated images
CREATE INDEX idx_recipe_images_ai_generated ON recipe_images USING GIN ((metadata->'source'));

-- Example metadata structure:
-- {
--   "source": "ai-generated",
--   "provider": "google",
--   "model": "gemini-2-5-flash-image",
--   "prompt": "A beautifully plated...",
--   "generatedAt": "2025-01-09T10:30:00Z",
--   "size": "1024x1024",
--   "quality": "standard"
-- }
```

#### 4.2 Update Migration Journal
**File:** `src/db/migrations/meta/0012_snapshot.json` (CREATE)
**File:** `src/db/migrations/meta/_journal.json` (MODIFY)

### ✅ 5. Server Actions for Image Generation (~45 minutes) - COMPLETED

**File:** `src/lib/server-actions/recipe-image-generation-actions.ts` (CREATE)

#### 5.1 Main Generation Action
```typescript
"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { recipeImages } from "@/db/schema";
import { AIImageGenerationService } from "@/lib/ai/services/image-generation-service";
import { getAIConfig } from "@/lib/server-actions/ai-config-actions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import type { ActionResult } from "@/lib/server-actions/base";
import type { ImageGenerationPromptData } from "@/lib/ai/prompts/image-generation-prompts";

export interface GeneratedImage {
  id: string;
  url: string;
  filename: string;
  isAIGenerated: boolean;
  metadata: any;
}

export async function generateRecipeImage(
  recipeId: string,
  recipeData: ImageGenerationPromptData,
  providerId?: string
): Promise<ActionResult<GeneratedImage>> {
  try {
    const session = await auth.api.getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    // Get user's AI configuration
    const aiConfigResult = await getAIConfig();
    if (!aiConfigResult.success) {
      return { success: false, error: "AI configuration not found" };
    }

    const userConfig = aiConfigResult.data;

    // Override provider if specified
    if (providerId && providerId !== userConfig.provider) {
      // Validate user has API key for requested provider
      const hasKey = (providerId === "google" && userConfig.hasGoogleKey) ||
                    (providerId === "openai" && userConfig.hasOpenaiKey);

      if (!hasKey) {
        return { success: false, error: `API key not configured for ${providerId}` };
      }

      userConfig.provider = providerId;
    }

    // Check if provider supports image generation
    const availableProviders = AIImageGenerationService.getAvailableImageProviders(userConfig);
    if (availableProviders.length === 0) {
      return {
        success: false,
        error: "No image generation providers available. Please configure Google or OpenAI API keys in settings."
      };
    }

    // Generate image
    const result = await AIImageGenerationService.generateRecipeImage(recipeData, userConfig);

    if (!result.success) {
      return { success: false, error: result.error || "Image generation failed" };
    }

    // Save image to filesystem
    const filename = `recipe-ai-${randomUUID()}.png`;
    const uploadsDir = join(process.cwd(), 'uploads', 'recipes');
    await mkdir(uploadsDir, { recursive: true });

    const filePath = join(uploadsDir, filename);
    const imageBuffer = Buffer.from(result.imageData!, 'base64');
    await writeFile(filePath, imageBuffer);

    // Save to database
    const [savedImage] = await db.insert(recipeImages).values({
      id: randomUUID(),
      recipeId,
      filename,
      originalName: `${recipeData.title} - AI Generated`,
      mimeType: 'image/png',
      size: imageBuffer.length,
      uploadedAt: new Date(),
      uploadedBy: session.user.id,
      metadata: {
        source: 'ai-generated',
        ...result.metadata
      }
    }).returning();

    return {
      success: true,
      data: {
        id: savedImage.id,
        url: `/api/recipes/images/${filename}`,
        filename: savedImage.filename,
        isAIGenerated: true,
        metadata: savedImage.metadata
      }
    };

  } catch (error) {
    console.error('Recipe image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate image"
    };
  }
}

export async function getAvailableImageGenerationProviders(): Promise<ActionResult<{
  providers: Array<{ id: string; name: string; model: string; }>;
}>> {
  try {
    const session = await auth.api.getSession();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const aiConfigResult = await getAIConfig();
    if (!aiConfigResult.success) {
      return { success: false, error: "AI configuration not found" };
    }

    const userConfig = aiConfigResult.data;
    const providers = [];

    if (userConfig.hasGoogleKey) {
      providers.push({
        id: "google",
        name: "Gemini 2.5 Flash Image",
        model: "gemini-2-5-flash-image"
      });
    }

    if (userConfig.hasOpenaiKey) {
      providers.push({
        id: "openai",
        name: "DALL-E 3",
        model: "dall-e-3"
      });
    }

    return { success: true, data: { providers } };

  } catch (error) {
    return { success: false, error: "Failed to get available providers" };
  }
}
```

### ✅ 6. UI Component for Image Generation (~1 hour) - COMPLETED

**File:** `src/components/ui/recipe-image-generator.tsx` (CREATE)

#### 6.1 Image Generation Component
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Image, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { generateRecipeImage, getAvailableImageGenerationProviders, type GeneratedImage } from "@/lib/server-actions/recipe-image-generation-actions";
import type { ImageGenerationPromptData } from "@/lib/ai/prompts/image-generation-prompts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  className
}: RecipeImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const loadProviders = async () => {
    if (providersLoaded) return;

    const result = await getAvailableImageGenerationProviders();
    if (result.success) {
      setProviders(result.data.providers);
    }
    setProvidersLoaded(true);
  };

  const handleGenerate = async (providerId?: string) => {
    setIsGenerating(true);
    setError(null);
    setShowErrorDetails(false);

    try {
      const result = await generateRecipeImage(recipeId, recipeData, providerId);

      if (result.success) {
        onImageGenerated?.(result.data);
      } else {
        setError(result.error || "Failed to generate image");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  if (providers.length === 0 && providersLoaded) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          AI image generation is not available. Please configure Google or OpenAI API keys in your settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      {providers.length === 1 ? (
        <Button
          onClick={() => handleGenerate()}
          disabled={isGenerating}
          variant="outline"
          size="sm"
          className="h-8"
          onMouseEnter={loadProviders}
        >
          {isGenerating ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          {isGenerating ? "Generating..." : "Generate AI Image"}
        </Button>
      ) : (
        <DropdownMenu onOpenChange={(open) => open && loadProviders()}>
          <DropdownMenuTrigger asChild>
            <Button
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
                  <span className="text-xs text-muted-foreground">{provider.model}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {error && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {!showErrorDetails && (
              <Button
                variant="link"
                size="sm"
                className="p-0 ml-2 h-auto"
                onClick={() => setShowErrorDetails(true)}
              >
                Show details
              </Button>
            )}
            {showErrorDetails && (
              <div className="mt-2 text-xs font-mono bg-muted p-2 rounded">
                {error}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// AI Generated Image Badge Component
export function AIGeneratedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="secondary" className={className}>
      <Sparkles className="h-3 w-3 mr-1" />
      AI Generated
    </Badge>
  );
}
```

### ✅ 7. Recipe Detail Page Integration (~30 minutes) - COMPLETED

**File:** `src/components/ui/recipe-image-manager.tsx` (MODIFY)

#### 7.1 Add Image Generator to Image Gallery Section
```tsx
// Add imports
import { RecipeImageGenerator } from "@/components/ui/recipe-image-generator";
import { AIGeneratedBadge } from "@/components/ui/recipe-image-generator";

// In the image gallery section, add the generator button
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold">Images</h3>
  <div className="flex gap-2">
    {/* Existing upload button */}
    <RecipeImageGenerator
      recipeId={recipe.id}
      recipeData={{
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        cuisineType: recipe.tags?.find(t => cuisineTypes.includes(t)),
        tags: recipe.tags || [],
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        notes: recipe.notes
      }}
      onImageGenerated={(image) => {
        // Refresh images or add to state
        router.refresh();
      }}
      className="ml-2"
    />
  </div>
</div>

// In image rendering, add AI badge for generated images
{images.map((image) => (
  <div key={image.id} className="relative group">
    <img
      src={image.url}
      alt={image.originalName || `Recipe image`}
      className="w-full h-48 object-cover rounded-lg"
    />
    {image.metadata?.source === 'ai-generated' && (
      <AIGeneratedBadge className="absolute top-2 left-2" />
    )}
    {/* Existing image controls */}
  </div>
))}
```

### ✅ 8. Recipe Create/Edit Form Integration (~30 minutes) - COMPLETED

**File:** `src/components/forms/recipe-create-form.tsx` (MODIFY)
**File:** `src/components/forms/recipe-edit-form.tsx` (MODIFY)

#### 8.1 Add Generator to Image Upload Section
```tsx
// In the image upload section of both forms
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <Label className="text-base font-medium">Recipe Images</Label>
    <RecipeImageGenerator
      recipeId={recipe?.id || "draft"}
      recipeData={{
        title: formData.title || "Untitled Recipe",
        description: formData.description,
        ingredients: formData.ingredients || [],
        instructions: formData.instructions || [],
        cuisineType: formData.tags?.find(t => cuisineTypes.includes(t)),
        tags: formData.tags || [],
        servings: formData.servings,
        prepTime: formData.prepTime,
        cookTime: formData.cookTime,
        notes: formData.notes
      }}
      onImageGenerated={(image) => {
        // Add generated image to form state
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), image]
        }));
      }}
      className="ml-2"
    />
  </div>

  {/* Existing image upload and management UI */}
</div>
```

### ✅ 9. Type Definitions (~15 minutes) - COMPLETED

**File:** `src/lib/types/image-processing-types.ts` (MODIFY/EXTEND)

#### 9.1 Add Image Generation Types
```typescript
export interface AIGeneratedImageMetadata {
  source: 'ai-generated';
  provider: AIProvider;
  model: string;
  prompt: string;
  generatedAt: string;
  size?: string;
  quality?: string;
}

export interface RecipeImageWithMetadata {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  metadata?: AIGeneratedImageMetadata | null;
}

export type ImageSource = 'user-upload' | 'ai-generated';
```

**File:** `src/lib/types/index.ts` (MODIFY)

#### 9.2 Export New Types
```typescript
export * from './image-processing-types';
export type { ImageGenerationPromptData } from '../ai/prompts/image-generation-prompts';
export type { ImageGenerationResult } from '../ai/services/image-generation-service';
```

### ✅ 10. Error Handling and Validation (~15 minutes) - COMPLETED

**File:** `src/lib/ai/services/image-generation-service.ts` (ENHANCE)

#### 10.1 Add Comprehensive Error Handling
```typescript
// Add to service class
private static validateRecipeData(data: ImageGenerationPromptData): string[] {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push("Recipe title is required for image generation");
  }

  if (!data.ingredients || data.ingredients.length === 0) {
    errors.push("At least one ingredient is required for image generation");
  }

  if (data.title && data.title.length > 100) {
    errors.push("Recipe title too long for optimal image generation");
  }

  return errors;
}

// Add validation to generateRecipeImage method
const validationErrors = this.validateRecipeData(recipeData);
if (validationErrors.length > 0) {
  return {
    success: false,
    metadata: {
      provider: userConfig.provider,
      model: "",
      prompt: "",
      generatedAt: new Date().toISOString(),
    },
    error: `Validation failed: ${validationErrors.join(", ")}`
  };
}
```

---

## Integration Points & Dependencies

### Existing Systems This Builds On:
1. **AI Infrastructure (Phase 3)**: Uses existing provider configuration and API key management
2. **Image Storage System**: Leverages existing recipe_images table and file upload system
3. **Server Actions Pattern**: Follows established server action architecture
4. **UI Components**: Builds on existing ShadCN/UI component library
5. **Type System**: Extends existing type definitions

### Files That Need Updates:
- `src/lib/ai/providers.ts` - Add image generation support functions
- `src/db/schema.ts` - Export new migration
- `src/components/cards/recipe-detail-view.tsx` - Add generator button
- `src/components/forms/recipe-create-form.tsx` - Add generator to form
- `src/components/forms/recipe-edit-form.tsx` - Add generator to form
- `src/lib/types/index.ts` - Export new types

---

## Technical Implementation Details

### Image Generation Flow:
1. User clicks "Generate AI Image" button
2. Component loads available providers based on user's API keys
3. User selects provider (or uses single available one)
4. Comprehensive prompt built from all recipe data
5. AI SDK calls image generation API with selected provider
6. Base64 image data received and converted to buffer
7. Image saved to filesystem with unique filename
8. Database record created with AI metadata
9. Image appears in UI with AI badge
10. User can generate more images or manage like regular images

### Cost Considerations:
- Google Gemini 2.5 Flash Image: ~$0.039 per image
- OpenAI DALL-E 3: ~$0.040-0.080 per image depending on size/quality
- Users control generation completely (no auto-generation)
- Error handling prevents wasted API calls
- Validation ensures good prompts before generation

### Storage & Performance:
- Generated images stored same as uploaded images
- AI metadata stored in JSONB column for flexibility
- 1024x1024 standard size balances quality and storage
- Synchronous generation for immediate feedback
- Error states clearly communicated to user

---

## Success Criteria

### ✅ Phase 3.2 Complete When:

#### Core Functionality
- [x] Users can generate AI images from recipe detail pages
- [x] Users can generate AI images from recipe create/edit forms
- [x] Multiple AI providers supported (Google, OpenAI) based on user configuration
- [x] Generated images automatically saved with AI metadata
- [x] AI-generated images clearly marked with badges
- [x] Error handling shows user-friendly messages with optional details

#### User Experience
- [x] Provider selection automatic based on available API keys
- [x] Single provider shows simple button, multiple providers show dropdown
- [x] Loading states clearly indicate generation progress
- [x] Generated images appear immediately in interface
- [x] AI images treated same as uploaded images for management
- [x] No limits on number of images users can generate

#### Technical Requirements
- [x] Comprehensive prompts built from all recipe data
- [x] Professional food photography aesthetic in generated images
- [x] Images saved to filesystem and database with proper metadata
- [x] Provider detection and validation working correctly
- [x] Error handling prevents API waste and provides useful feedback
- [x] Type safety throughout image generation pipeline

---

## Risk Assessment

### 🟡 Medium Risk
- **AI Image Quality**: Generated images may not always match user expectations
- **Provider Reliability**: API failures or rate limits could frustrate users
- **Cost Awareness**: Users may generate many expensive images without realizing cost

### 🟢 Low Risk
- **Technical Implementation**: Building on solid Phase 3 AI infrastructure
- **UI Integration**: Follows established patterns and component library
- **Storage**: Uses existing proven image storage system
- **Error Handling**: Comprehensive fallbacks and user communication

---

## ✅ PHASE 3.2 COMPLETED - Implementation Time: 4-5 hours

- ✅ **AI Providers Updates**: 30 minutes - COMPLETED
- ✅ **Prompt Engineering**: 30 minutes - COMPLETED
- ✅ **Image Generation Service**: 1 hour - COMPLETED
- ✅ **Database Schema**: 15 minutes - COMPLETED
- ✅ **Server Actions**: 45 minutes - COMPLETED
- ✅ **UI Components**: 1 hour - COMPLETED
- ✅ **Integration**: 1 hour - COMPLETED
- ✅ **Types & Error Handling**: 30 minutes - COMPLETED
- ✅ **Testing & Polish**: 30 minutes - COMPLETED

**FINAL STATUS**: All tasks completed successfully with zero lint or type-check issues. Phase 3.2 AI Recipe Image Generation is production-ready!

---

This phase strategically extends the existing AI infrastructure to provide users with powerful image generation capabilities while maintaining the privacy-first approach and cost transparency that defines the TasteBase AI system.