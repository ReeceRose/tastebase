import { streamText } from "ai";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getActiveConfig } from "@/lib/ai/config";
import { getProvider } from "@/lib/ai/providers";
import { auth } from "@/lib/auth/auth";
import { createOperationLogger, logError } from "@/lib/logging/logger";
import { saveConversationMessage } from "@/lib/server-actions/conversation-actions";

const logger = createOperationLogger("recipe-discovery-chat");

const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["user", "assistant"]),
      parts: z
        .array(
          z.object({
            type: z.string().optional(),
            text: z.string().optional(),
          }),
        )
        .optional(),
      content: z.string().optional(), // Fallback for compatibility
    }),
  ),
  sessionId: z.string().optional(),
  imageData: z
    .object({
      imageBase64: z.string(),
      description: z.string().optional(),
      context: z
        .object({
          isRecipeRelated: z.boolean().optional(),
          recipeName: z.string().optional(),
          currentStep: z.number().optional(),
        })
        .optional(),
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

    // Log the incoming request for debugging
    logger.info(
      {
        userId: session.user.id,
        bodyKeys: Object.keys(body),
        messagesCount: body.messages?.length,
        hasImageData: !!body.imageData,
      },
      "Incoming request structure",
    );

    const { messages, sessionId, imageData } = ChatRequestSchema.parse(body);

    logger.info(
      {
        userId: session.user.id,
        messageCount: messages.length,
        sessionId,
      },
      "Starting recipe discovery chat",
    );

    // Get AI configuration
    const config = await getActiveConfig(session.user.id);
    if (!config) {
      return new Response("AI not configured", { status: 400 });
    }

    const provider = getProvider(config);

    // Check if this request includes image data and if provider supports vision
    const hasImageData = !!imageData;
    const visionCapableProviders = ["openai", "anthropic", "google"];
    const supportsVision = visionCapableProviders.includes(config.provider);

    if (hasImageData && !supportsVision) {
      return new Response(
        "Current AI provider does not support image analysis",
        { status: 400 },
      );
    }

    // Recipe discovery system prompt (enhanced for vision when needed)
    let systemPrompt = `You are a helpful recipe discovery assistant for Tastebase, a personal recipe management app. Help users discover recipes based on:`;

    if (hasImageData) {
      systemPrompt = `You are a helpful recipe discovery assistant for Tastebase with visual analysis capabilities. When analyzing images, focus on:

VISUAL ANALYSIS FOR COOKING:
- Identify ingredients, cooking stages, and food items in images
- Assess cooking doneness, technique, and food safety
- Suggest recipes based on visible ingredients
- Provide cooking advice based on what you see
- Recommend improvements or next steps

RECIPE DISCOVERY CAPABILITIES:
- Ingredients they have available
- Dietary preferences and restrictions
- Cuisine types and cooking methods
- Time constraints and difficulty levels
- Seasonal ingredients and occasions

CONVERSATION STYLE:
- Be enthusiastic and helpful about food and cooking
- Ask clarifying questions to better understand their needs
- Suggest 2-3 specific recipes with brief descriptions
- Explain why each recipe fits their requirements
- Offer cooking tips and ingredient substitutions
- Keep responses concise but informative

RECIPE SUGGESTIONS FORMAT:
When suggesting recipes, use this format:
**[Recipe Name]**
*Description: Brief 1-2 sentence description*
*Time: Prep + cook time*
*Difficulty: Easy/Medium/Hard*
*Why it's perfect: Explain how it fits their request*

GUIDELINES:
- Focus on practical, achievable recipes`;
    } else {
      systemPrompt += `

CAPABILITIES:
- Ingredients they have available
- Dietary preferences and restrictions
- Cuisine types and cooking methods
- Time constraints and difficulty levels
- Seasonal ingredients and occasions

CONVERSATION STYLE:
- Be enthusiastic and helpful about food and cooking
- Ask clarifying questions to better understand their needs
- Suggest 2-3 specific recipes with brief descriptions
- Explain why each recipe fits their requirements
- Offer cooking tips and ingredient substitutions
- Keep responses concise but informative

RECIPE SUGGESTIONS FORMAT:
When suggesting recipes, use this format:
**[Recipe Name]**
*Description: Brief 1-2 sentence description*
*Time: Prep + cook time*
*Difficulty: Easy/Medium/Hard*
*Why it's perfect: Explain how it fits their request*

GUIDELINES:
- Focus on practical, achievable recipes`;
    }

    systemPrompt += `
- Consider ingredient availability and seasonality
- Suggest recipes with varying difficulty levels
- Offer substitutions for missing ingredients
- Be encouraging about cooking skills and experimentation
- Ask follow-up questions to refine suggestions

Current conversation context: The user is looking for recipe ideas and you should help them discover perfect recipes for their situation.`;

    // Convert messages for the AI model
    const modelMessages = messages.map((msg) => {
      // Handle AI SDK v5 parts format or fallback to content
      const content = msg.parts
        ? msg.parts
            .map((part) => part.text || "")
            .filter(Boolean)
            .join("")
        : msg.content || "";

      return {
        role: msg.role,
        content,
      };
    });

    // If there's image data, add it to the last user message
    if (imageData && modelMessages.length > 0) {
      const lastMessage = modelMessages[modelMessages.length - 1];
      if (lastMessage.role === "user") {
        // Convert to multimodal message format for vision-capable models
        // Type assertion needed because AI SDK accepts both string and multimodal content
        lastMessage.content = [
          {
            type: "text" as const,
            text:
              imageData.description ||
              "What can you tell me about this image for cooking?",
          },
          {
            type: "image" as const,
            image: imageData.imageBase64,
          },
        ] as unknown as string;
      }
    }

    // Save user message to conversation history first
    const finalSessionId =
      sessionId || `discovery-${session.user.id}-${Date.now()}`;

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        // Extract content using same logic as model messages
        const content = lastMessage.parts
          ? lastMessage.parts.map((part) => part.text).join("")
          : lastMessage.content || "";

        await saveConversationMessage({
          sessionId: finalSessionId,
          userId: session.user.id,
          role: "user",
          content,
          taskType: "recipe-discovery",
        }).catch((error) => {
          logError(logger, "Failed to save user message", error, {
            userId: session.user.id,
            sessionId: finalSessionId,
          });
        });
      }
    }

    // Stream the response
    const result = streamText({
      model: provider,
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.8, // More creative for recipe suggestions
      onFinish: async (completion) => {
        // Save AI assistant response after completion
        await saveConversationMessage({
          sessionId: finalSessionId,
          userId: session.user.id,
          role: "assistant",
          content: completion.text,
          taskType: "recipe-discovery",
        }).catch((error) => {
          logError(logger, "Failed to save assistant message", error, {
            userId: session.user.id,
            sessionId: finalSessionId,
          });
        });
      },
    });

    logger.info(
      {
        userId: session.user.id,
        sessionId: finalSessionId,
        provider: config.provider,
      },
      "Recipe discovery response streaming started",
    );

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError(logger, "Recipe discovery chat error", error as Error);

    if (error instanceof z.ZodError) {
      return new Response("Invalid request format", { status: 400 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
