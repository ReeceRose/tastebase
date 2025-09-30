import { streamText } from "ai";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getActiveConfig } from "@/lib/ai/config";
import { getProvider } from "@/lib/ai/providers";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { saveConversationMessage } from "@/lib/server-actions/conversation-actions";

const logger = createOperationLogger("recipe-modification-chat");

const RecipeModificationRequestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["user", "assistant"]),
      parts: z
        .array(
          z.object({
            type: z.string(),
            text: z.string(),
          }),
        )
        .optional(),
      content: z.string().optional(), // Fallback for compatibility
    }),
  ),
  sessionId: z.string().optional(),
  originalRecipe: z.object({
    name: z.string(),
    ingredients: z.array(
      z.object({
        name: z.string(),
        quantity: z.string().optional(),
        unit: z.string().optional(),
      }),
    ),
    instructions: z.array(
      z.object({
        step: z.number(),
        instruction: z.string(),
        timeMinutes: z.number().optional(),
        temperature: z.string().optional(),
      }),
    ),
    servings: z.number().optional(),
    prepTime: z.number().optional(),
    cookTime: z.number().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    cuisine: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
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
    const { messages, sessionId, originalRecipe } =
      RecipeModificationRequestSchema.parse(body);

    logger.info(
      {
        userId: session.user.id,
        messageCount: messages.length,
        sessionId,
        recipeName: originalRecipe.name,
      },
      "Starting recipe modification chat",
    );

    // Get AI configuration
    const config = await getActiveConfig(session.user.id);
    if (!config) {
      return new Response("AI not configured", { status: 400 });
    }

    const provider = getProvider(config);

    // Build detailed recipe context
    const recipeContext = `
ORIGINAL RECIPE TO MODIFY:
Name: ${originalRecipe.name}
Servings: ${originalRecipe.servings || "Not specified"}
Prep Time: ${originalRecipe.prepTime ? `${originalRecipe.prepTime} minutes` : "Not specified"}
Cook Time: ${originalRecipe.cookTime ? `${originalRecipe.cookTime} minutes` : "Not specified"}
Difficulty: ${originalRecipe.difficulty || "Not specified"}
Cuisine: ${originalRecipe.cuisine || "Not specified"}

INGREDIENTS:
${originalRecipe.ingredients
  .map((ing, i) =>
    `${i + 1}. ${ing.quantity || ""} ${ing.unit || ""} ${ing.name}`.trim(),
  )
  .join("\n")}

INSTRUCTIONS:
${originalRecipe.instructions
  .map(
    (inst) =>
      `${inst.step}. ${inst.instruction}${inst.timeMinutes ? ` (${inst.timeMinutes} min)` : ""}${inst.temperature ? ` at ${inst.temperature}` : ""}`,
  )
  .join("\n")}

TAGS: ${originalRecipe.tags?.join(", ") || "None"}`;

    const systemPrompt = `You are an expert recipe modification assistant. Help users modify and adapt recipes to meet their specific needs, preferences, or constraints.

${recipeContext}

YOUR EXPERTISE:
- Recipe scaling (adjusting servings up or down)
- Dietary modifications (vegetarian, vegan, gluten-free, keto, etc.)
- Ingredient substitutions (availability, allergies, preferences)
- Cooking method adaptations (equipment constraints)
- Nutritional improvements (healthier alternatives)
- Flavor modifications (spice levels, cuisines, preferences)
- Time adjustments (quicker or slower cooking methods)

MODIFICATION CAPABILITIES:
1. **Scaling**: Intelligently adjust ingredient quantities and cooking times
2. **Dietary Adaptations**: Replace ingredients while maintaining flavor and texture
3. **Substitutions**: Suggest alternatives for unavailable or unwanted ingredients
4. **Equipment Changes**: Adapt for different cooking tools or methods
5. **Health Optimization**: Reduce calories, sodium, sugar, or increase nutrition
6. **Flavor Adjustments**: Modify spice levels, add different cuisines influences

RESPONSE FORMAT:
When suggesting modifications, provide:
- Clear explanation of changes and why they work
- Updated ingredient list with specific quantities
- Modified cooking instructions with timing adjustments
- Notes about how the changes affect taste, texture, or nutrition
- Alternative options when multiple approaches are possible

IMPORTANT GUIDELINES:
- Maintain recipe integrity and food safety
- Explain the science behind substitutions
- Warn about significant changes in taste or texture
- Provide specific measurements and timing
- Consider cooking time/temperature adjustments for modifications
- Offer gradual changes for major dietary shifts

EXAMPLE MODIFICATIONS:
- "To make this vegan, replace the eggs with flax eggs (1 tbsp ground flaxseed + 3 tbsp water per egg, let sit 5 minutes)"
- "For gluten-free, substitute the all-purpose flour with a 1:1 gluten-free flour blend"
- "To double the recipe, use 2x ingredients but only increase baking time by 10-15 minutes"

Be precise, practical, and ensure modified recipes will actually work!`;

    // Convert messages for the AI model
    const modelMessages = messages.map((msg) => {
      // Handle AI SDK v5 parts format or fallback to content
      const content = msg.parts
        ? msg.parts.map((part) => part.text).join("")
        : msg.content || "";

      return {
        role: msg.role,
        content,
      };
    });

    // Stream the response
    const result = streamText({
      model: provider,
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.4, // Balanced creativity for modifications while maintaining accuracy
    });

    // Save user message to conversation history
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        // Extract content using same logic as model messages
        const content = lastMessage.parts
          ? lastMessage.parts.map((part) => part.text).join("")
          : lastMessage.content || "";

        await saveConversationMessage({
          sessionId:
            sessionId || `modification-${session.user.id}-${Date.now()}`,
          userId: session.user.id,
          role: "user",
          content,
          taskType: "recipe-discovery", // Using recipe-discovery as closest match
          metadata: { originalRecipe, modificationType: "recipe-modification" },
        }).catch((error) => {
          logError(logger, "Failed to save user message", error, {
            userId: session.user.id,
            sessionId,
          });
        });
      }
    }

    logger.info(
      {
        userId: session.user.id,
        sessionId,
        provider: config.provider,
        recipeName: originalRecipe.name,
      },
      "Recipe modification response streaming started",
    );

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError(logger, "Recipe modification chat error", error as Error);

    if (error instanceof z.ZodError) {
      return new Response("Invalid request format", { status: 400 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
