import { streamText } from "ai";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getActiveConfig } from "@/lib/ai/config";
import { getProvider } from "@/lib/ai/providers";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { saveConversationMessage } from "@/lib/server-actions/conversation-actions";

const logger = createOperationLogger("image-analysis-chat");

const ImageAnalysisRequestSchema = z.object({
  imageBase64: z.string(),
  description: z.string().optional(),
  sessionId: z.string().optional(),
  context: z
    .object({
      isRecipeRelated: z.boolean().optional(),
      recipeName: z.string().optional(),
      currentStep: z.number().optional(),
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
    const { imageBase64, description, sessionId, context } =
      ImageAnalysisRequestSchema.parse(body);

    logger.info(
      {
        userId: session.user.id,
        sessionId,
        hasDescription: !!description,
        hasContext: !!context,
      },
      "Starting image analysis",
    );

    // Get AI configuration
    const config = await getActiveConfig(session.user.id);
    if (!config) {
      return new Response("AI not configured", { status: 400 });
    }

    // Check if provider supports vision
    const visionCapableProviders = ["openai", "anthropic", "google"];
    if (!visionCapableProviders.includes(config.provider)) {
      return new Response(
        "Current AI provider does not support image analysis",
        { status: 400 },
      );
    }

    const provider = getProvider(config);

    // Build context-aware system prompt
    let contextPrompt = "";
    if (context?.isRecipeRelated) {
      contextPrompt = `
COOKING CONTEXT:
- This image is related to cooking/recipe preparation
- Recipe: ${context.recipeName || "Unknown"}
- Current Step: ${context.currentStep ? `Step ${context.currentStep}` : "Not specified"}

Focus on culinary analysis: ingredient identification, cooking stages, doneness, techniques, food safety, and troubleshooting.`;
    }

    const systemPrompt = `You are an expert visual analysis assistant for cooking and food. Analyze images to help users with cooking, ingredient identification, and food-related questions.

${contextPrompt}

YOUR CAPABILITIES:
- Ingredient identification and substitution suggestions
- Cooking stage assessment (doneness, browning, texture)
- Food safety evaluation (signs of spoilage, proper cooking)
- Technique analysis (knife cuts, mixing, cooking methods)
- Troubleshooting cooking problems from visual cues
- Equipment and tool identification
- Plating and presentation suggestions

ANALYSIS APPROACH:
1. Describe what you see in detail
2. Identify key culinary elements (ingredients, techniques, stages)
3. Assess quality and doneness if applicable
4. Provide specific actionable advice
5. Suggest next steps or improvements

RESPONSE STYLE:
- Be specific and detailed in observations
- Use culinary terminology appropriately
- Provide practical, actionable advice
- Consider food safety when relevant
- Be encouraging and educational

USER'S QUESTION: ${description || "What do you see in this image?"}

Analyze the image thoroughly and provide helpful culinary insights.`;

    // Create message with image
    const messages = [
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: description || "What do you see in this image?",
          },
          {
            type: "image" as const,
            image: imageBase64,
          },
        ],
      },
    ];

    // Stream the response
    const result = streamText({
      model: provider,
      system: systemPrompt,
      messages,
      temperature: 0.4,
    });

    // Save user message to conversation history
    await saveConversationMessage({
      sessionId: sessionId || `image-analysis-${session.user.id}-${Date.now()}`,
      userId: session.user.id,
      role: "user",
      content: description || "Image analysis request",
      taskType: "chat-conversation",
      metadata: {
        hasImage: true,
        imageAnalysis: true,
        context,
      },
    }).catch((error) => {
      logError(logger, "Failed to save user message", error, {
        userId: session.user.id,
        sessionId,
      });
    });

    logger.info(
      {
        userId: session.user.id,
        sessionId,
        provider: config.provider,
      },
      "Image analysis response streaming started",
    );

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError(logger, "Image analysis error", error as Error);

    if (error instanceof z.ZodError) {
      return new Response("Invalid request format", { status: 400 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
