import { streamText } from "ai";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getActiveConfig } from "@/lib/ai/config";
import { getProvider } from "@/lib/ai/providers";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { saveConversationMessage } from "@/lib/server-actions/conversation-actions";

const logger = createOperationLogger("cooking-assistance-chat");

const CookingAssistanceRequestSchema = z.object({
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
  recipeContext: z
    .object({
      recipeName: z.string().optional(),
      currentStep: z.number().optional(),
      ingredients: z.array(z.string()).optional(),
      cookingMethod: z.string().optional(),
      servings: z.number().optional(),
    })
    .optional(),
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
    const { messages, sessionId, recipeContext } =
      CookingAssistanceRequestSchema.parse(body);

    logger.info(
      {
        userId: session.user.id,
        messageCount: messages.length,
        sessionId,
        hasRecipeContext: !!recipeContext,
      },
      "Starting cooking assistance chat",
    );

    // Get AI configuration
    const config = await getActiveConfig(session.user.id);
    if (!config) {
      return new Response("AI not configured", { status: 400 });
    }

    const provider = getProvider(config);

    // Build context-aware system prompt
    let contextPrompt = "";
    if (recipeContext) {
      contextPrompt = `
CURRENT RECIPE CONTEXT:
- Recipe: ${recipeContext.recipeName || "Unknown recipe"}
- Current Step: ${recipeContext.currentStep ? `Step ${recipeContext.currentStep}` : "Not specified"}
- Servings: ${recipeContext.servings || "Not specified"}
- Cooking Method: ${recipeContext.cookingMethod || "Not specified"}
- Key Ingredients: ${recipeContext.ingredients?.join(", ") || "Not specified"}

Use this context to provide specific, relevant cooking assistance.`;
    }

    const systemPrompt = `You are an expert cooking assistant helping users in real-time while they cook. You provide practical, immediate help for cooking questions and problems.

${contextPrompt}

YOUR EXPERTISE:
- Step-by-step cooking guidance and troubleshooting
- Temperature and timing advice for food safety and quality
- Ingredient substitutions and modifications
- Cooking technique explanations and tips
- Food safety guidelines and best practices
- Equipment alternatives and workarounds
- Flavor adjustments and seasoning guidance

CONVERSATION STYLE:
- Be concise and actionable - users are actively cooking
- Prioritize food safety and proper technique
- Provide specific measurements, times, and temperatures
- Offer quick fixes for common cooking problems
- Be encouraging and supportive about cooking skills
- Ask clarifying questions when needed for better help

RESPONSE FORMAT:
- Start with the immediate answer or solution
- Provide step-by-step instructions when needed
- Include specific times, temperatures, or measurements
- Add helpful tips or alternatives when relevant
- End with encouragement or next steps

COOKING SAFETY PRIORITIES:
1. Food safety (proper temperatures, timing)
2. Kitchen safety (heat, sharp tools, burns)
3. Recipe success and quality
4. Learning and skill building

EXAMPLE RESPONSES:
- "Yes, your chicken is done! Internal temperature should be 165°F (74°C). Let it rest for 5 minutes before slicing."
- "Don't worry about the sauce separating! Lower the heat and whisk in 1 tablespoon of cold water to bring it back together."
- "That smell means your garlic is burning. Quickly remove the pan from heat and add your liquid ingredients to stop the cooking."

Be the helpful cooking companion they need right now in their kitchen!`;

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
      temperature: 0.3, // Lower temperature for more reliable cooking advice
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
          sessionId: sessionId || `cooking-${session.user.id}-${Date.now()}`,
          userId: session.user.id,
          role: "user",
          content,
          taskType: "cooking-assistance",
          metadata: recipeContext ? { recipeContext } : undefined,
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
        hasRecipeContext: !!recipeContext,
      },
      "Cooking assistance response streaming started",
    );

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError(logger, "Cooking assistance chat error", error as Error);

    if (error instanceof z.ZodError) {
      return new Response("Invalid request format", { status: 400 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
