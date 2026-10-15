import { describe, expect, it } from "vitest";
import {
  getDefaultModel,
  getModelsForProvider,
  modelSupportsVision,
  RETIRED_MODEL_IDS,
  resolveModelName,
} from "@/lib/ai/models";
import { AIProvider } from "@/lib/types/ai-types";

describe("model catalog", () => {
  it("has exactly one recommended model for each provider", () => {
    for (const provider of [
      AIProvider.ANTHROPIC,
      AIProvider.OPENAI,
      AIProvider.GOOGLE,
      AIProvider.OLLAMA,
    ]) {
      const recommended = getModelsForProvider(provider).filter(
        (model) => model.recommended,
      );
      expect(recommended).toHaveLength(1);
    }
  });

  it("does not offer retired models", () => {
    for (const provider of Object.values(AIProvider)) {
      for (const model of getModelsForProvider(provider)) {
        expect(RETIRED_MODEL_IDS).not.toContain(model.id);
      }
    }
  });

  it("has no default model when AI is off", () => {
    expect(getDefaultModel(AIProvider.NONE)).toBeNull();
  });
});

describe("resolveModelName", () => {
  it("uses the provider default when no model is saved", () => {
    expect(resolveModelName(AIProvider.ANTHROPIC, null)).toBe(
      "claude-haiku-5-5",
    );
    expect(resolveModelName(AIProvider.GOOGLE, "  ")).toBe("gemini-3.8-flash");
  });

  it("replaces retired models with the provider default", () => {
    expect(
      resolveModelName(AIProvider.ANTHROPIC, "claude-sonnet-4-latest"),
    ).toBe("claude-haiku-5-5");
    expect(resolveModelName(AIProvider.OPENAI, "gpt-4o")).toBe("gpt-6-luna");
  });

  it("keeps custom models the user chose", () => {
    expect(resolveModelName(AIProvider.OLLAMA, "llama3.3")).toBe("llama3.3");
  });
});

describe("modelSupportsVision", () => {
  it("uses catalog data for known models", () => {
    expect(modelSupportsVision(AIProvider.OLLAMA, "qwen3")).toBe(false);
    expect(modelSupportsVision(AIProvider.OLLAMA, "gemma3")).toBe(true);
  });

  it("guesses from the name for unknown Ollama models", () => {
    expect(modelSupportsVision(AIProvider.OLLAMA, "llama3.2-vision")).toBe(
      true,
    );
    expect(modelSupportsVision(AIProvider.OLLAMA, "qwen2.5vl:7b")).toBe(true);
    expect(modelSupportsVision(AIProvider.OLLAMA, "mistral")).toBe(false);
  });

  it("assumes current cloud models can read images", () => {
    expect(modelSupportsVision(AIProvider.OPENAI, "gpt-custom")).toBe(true);
  });
});
