import { streamText } from "ai";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getActiveConfig } from "@/lib/ai/config";
import { getProvider } from "@/lib/ai/providers";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { RECIPE_PARSING_SCHEMA } from "@/lib/validations/recipe-schemas";

const logger = createOperationLogger("ai-recipe-parsing");

const ParseRecipeRequestSchema = z.object({
  content: z.string().min(1, "Content is required"),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { content, sessionId } = ParseRecipeRequestSchema.parse(body);

    logger.info(
      {
        userId: session.user.id,
        sessionId,
        contentLength: content.length,
      },
      "Starting AI recipe parsing",
    );

    // Get AI configuration
    const config = await getActiveConfig(session.user.id);
    if (!config) {
      return new Response("AI not configured", { status: 400 });
    }

    const provider = getProvider(config);

    // Enhanced recipe parsing system prompt
    const systemPrompt = `You are a recipe extraction specialist. Your job is to parse conversational recipe content into structured data.

TASK: Extract recipe information from the provided text and return it as valid JSON matching this exact schema:

{
  "title": "string (max 200 chars) | null",
  "description": "string (max 1000 chars) | null",
  "servings": "number (1-100) | null",
  "prepTime": "number (minutes, 0-1440) | null",
  "cookTime": "number (minutes, 0-1440) | null",
  "ingredients": [
    {
      "name": "string (max 200 chars)",
      "quantity": "string (max 50 chars) | null",
      "unit": "string (max 20 chars) | null"
    }
  ] | null,
  "instructions": [
    {
      "step": "number (1-50)",
      "instruction": "string (max 1000 chars)",
      "timeMinutes": "number (0-1440) | null",
      "temperature": "string (max 50 chars) | null"
    }
  ] | null,
  "tags": ["string (max 30 chars)"] | null,
  "difficulty": "easy" | "medium" | "hard" | null,
  "cuisine": "string (max 50 chars) | null"
}

EXTRACTION RULES:
1. Extract ONLY information explicitly mentioned in the text
2. Use null for missing information - don't guess or invent
3. Parse quantities and units carefully (e.g., "2 cups flour" → quantity: "2", unit: "cups", name: "flour")
4. Number instructions sequentially starting from 1
5. Convert time references to minutes (e.g., "1 hour" → 60)
6. Extract temperature with unit (e.g., "350°F", "180°C")
7. Infer difficulty based on complexity and cooking techniques
8. Extract cuisine from context clues
9. Create descriptive tags based on dish type, cooking method, dietary info

IMPORTANT:
- Return ONLY valid JSON, no explanations or markdown
- Ensure all string lengths are within limits
- All numeric values must be within specified ranges
- Use exact field names as shown in schema`;

    // Use the AI to parse the recipe
    const result = await streamText({
      model: provider,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Parse this recipe content into the required JSON format:\n\n${content}`,
        },
      ],
      temperature: 0.1, // Low temperature for consistent parsing
    });

    // Collect the streamed response
    let parsedText = "";
    for await (const chunk of result.textStream) {
      parsedText += chunk;
    }

    logger.info(
      {
        userId: session.user.id,
        sessionId,
        parsedLength: parsedText.length,
      },
      "AI parsing completed",
    );

    // Parse and validate the JSON response
    let parsedRecipe: z.infer<typeof RECIPE_PARSING_SCHEMA>;
    try {
      // Clean the response (remove any markdown code blocks)
      const cleanedText = parsedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      parsedRecipe = JSON.parse(cleanedText);

      // Validate against our schema
      parsedRecipe = RECIPE_PARSING_SCHEMA.parse(parsedRecipe);
    } catch (parseError) {
      logger.error(
        {
          userId: session.user.id,
          sessionId,
          parseError:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parse error",
          rawResponse: parsedText.slice(0, 500), // First 500 chars for debugging
        },
        "Failed to parse AI response as JSON",
      );

      return new Response("Failed to parse recipe - invalid AI response", {
        status: 500,
      });
    }

    logger.info(
      {
        userId: session.user.id,
        sessionId,
        hasTitle: !!parsedRecipe.title,
        ingredientCount: parsedRecipe.ingredients?.length || 0,
        instructionCount: parsedRecipe.instructions?.length || 0,
      },
      "Recipe parsing successful",
    );

    return Response.json({
      success: true,
      parsedRecipe,
    });
  } catch (error) {
    logError(logger, "AI recipe parsing error", error as Error);

    if (error instanceof z.ZodError) {
      return new Response("Invalid request format", { status: 400 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
