import { tool } from "ai";
import type { z } from "zod";
import { fetchRecipeTool } from "@/lib/ai/tools/fetch-recipe-tool";

export interface AITool<T = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  execute: (params: unknown) => Promise<T>;
}

export interface AIToolRegistry {
  [key: string]: AITool;
}

export const AI_TOOLS: AIToolRegistry = {
  fetchRecipe: fetchRecipeTool,
};

export function getToolsForTask(taskType: string): Record<string, unknown> {
  const toolsForAI: Record<string, unknown> = {};

  switch (taskType) {
    case "recipe-parsing":
      // Include fetchRecipe tool for URL parsing
      toolsForAI.fetchRecipe = tool({
        description: fetchRecipeTool.description,
        inputSchema: fetchRecipeTool.inputSchema,
        execute: fetchRecipeTool.execute,
      });
      break;
    case "chat-conversation":
      // Future: add chat-specific tools
      break;
    default:
      // No tools for other tasks
      break;
  }

  return toolsForAI;
}

export function hasToolsForTask(taskType: string): boolean {
  const tools = getToolsForTask(taskType);
  return Object.keys(tools).length > 0;
}
