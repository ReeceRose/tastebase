import { describe, expect, it, vi } from "vitest";
import {
  getDefaultModelForProvider,
  getModelDisplayName,
  getProvider,
  getProviderDisplayName,
  requiresApiKey,
  supportsTask,
} from "@/lib/ai/providers";
import { AIProvider, type AIProviderConfig } from "@/lib/types";

// Mock the AI SDK modules
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn((config) => {
    return vi.fn((model) => ({
      model,
      config,
      provider: AIProvider.OPENAI,
    }));
  }),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn((config) => {
    return vi.fn((model) => ({
      model,
      config,
      provider: AIProvider.ANTHROPIC,
    }));
  }),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn((config) => {
    return vi.fn((model) => ({
      model,
      config,
      provider: AIProvider.GOOGLE,
    }));
  }),
}));

vi.mock("ollama-ai-provider", () => ({
  createOllama: vi.fn((config) => {
    return vi.fn((model) => ({
      model,
      config,
      provider: AIProvider.OLLAMA,
    }));
  }),
}));

describe("AI Providers", () => {
  describe("getProvider", () => {
    it("should create OpenAI provider with API key", () => {
      const config: AIProviderConfig = {
        provider: AIProvider.OPENAI,
        apiKey: "sk-test-key",
        modelName: "gpt-4",
      };

      const provider = getProvider(config);
      expect(provider).toBeDefined();
    });

    it("should create Anthropic provider with API key", () => {
      const config: AIProviderConfig = {
        provider: AIProvider.ANTHROPIC,
        apiKey: "sk-ant-test-key",
        modelName: "claude-3-sonnet",
      };

      const provider = getProvider(config);
      expect(provider).toBeDefined();
    });

    it("should create Google provider with API key", () => {
      const config: AIProviderConfig = {
        provider: AIProvider.GOOGLE,
        apiKey: "google-api-key",
        modelName: "gemini-pro",
      };

      const provider = getProvider(config);
      expect(provider).toBeDefined();
    });

    it("should create Ollama provider with host URL", () => {
      const config: AIProviderConfig = {
        provider: AIProvider.OLLAMA,
        modelName: "llama3.2",
        ollamaHost: "http://localhost:11434",
      };

      const provider = getProvider(config);
      expect(provider).toBeDefined();
    });

    it("should use default models when not specified", () => {
      const config: AIProviderConfig = {
        provider: AIProvider.OPENAI,
        apiKey: "sk-test-key",
      };

      const provider = getProvider(config);
      expect(provider).toBeDefined();
    });

    it("should throw error for missing API key on cloud providers", () => {
      const config: AIProviderConfig = {
        provider: AIProvider.OPENAI,
      };

      expect(() => getProvider(config)).toThrow("OpenAI API key is required");
    });

    it("should throw error for none provider", () => {
      const config: AIProviderConfig = {
        provider: AIProvider.NONE,
      };

      expect(() => getProvider(config)).toThrow("AI provider is disabled");
    });

    it("should throw error for unsupported provider", () => {
      const config: AIProviderConfig = {
        provider: "unsupported" as AIProvider,
      };

      expect(() => getProvider(config)).toThrow(
        "Unsupported AI provider: unsupported",
      );
    });
  });

  describe("getDefaultModelForProvider", () => {
    it("should return correct default models", () => {
      expect(getDefaultModelForProvider(AIProvider.OPENAI)).toBe("gpt-5-mini");
      expect(getDefaultModelForProvider(AIProvider.ANTHROPIC)).toBe(
        "claude-sonnet-4-latest",
      );
      expect(getDefaultModelForProvider(AIProvider.GOOGLE)).toBe(
        "gemini-2.5-flash",
      );
      expect(getDefaultModelForProvider(AIProvider.OLLAMA)).toBe("llama3.2");
      expect(getDefaultModelForProvider(AIProvider.NONE)).toBe("");
    });
  });

  describe("getProviderDisplayName", () => {
    it("should return correct display names", () => {
      expect(getProviderDisplayName(AIProvider.OPENAI)).toBe("OpenAI");
      expect(getProviderDisplayName(AIProvider.ANTHROPIC)).toBe("Anthropic");
      expect(getProviderDisplayName(AIProvider.GOOGLE)).toBe("Google");
      expect(getProviderDisplayName(AIProvider.OLLAMA)).toBe("Ollama (Local)");
      expect(getProviderDisplayName(AIProvider.NONE)).toBe("No AI");
    });
  });

  describe("getModelDisplayName", () => {
    it("should return correct model display names", () => {
      expect(getModelDisplayName(AIProvider.OPENAI, "gpt-4o")).toBe("GPT-4o");
      expect(
        getModelDisplayName(AIProvider.ANTHROPIC, "claude-3-5-sonnet-20241022"),
      ).toBe("Claude 3.5 Sonnet");
      expect(getModelDisplayName(AIProvider.GOOGLE, "gemini-1.5-pro")).toBe(
        "Gemini 1.5 Pro",
      );
      expect(getModelDisplayName(AIProvider.OLLAMA, "llama3.2")).toBe(
        "Llama 3.2",
      );
    });

    it("should return original model name for unknown models", () => {
      expect(getModelDisplayName(AIProvider.OPENAI, "unknown-model")).toBe(
        "unknown-model",
      );
    });
  });

  describe("requiresApiKey", () => {
    it("should correctly identify providers that require API keys", () => {
      expect(requiresApiKey(AIProvider.OPENAI)).toBe(true);
      expect(requiresApiKey(AIProvider.ANTHROPIC)).toBe(true);
      expect(requiresApiKey(AIProvider.GOOGLE)).toBe(true);
      expect(requiresApiKey(AIProvider.OLLAMA)).toBe(false);
      expect(requiresApiKey(AIProvider.NONE)).toBe(false);
    });
  });

  describe("supportsTask", () => {
    it("should return false for none provider", () => {
      expect(supportsTask(AIProvider.NONE)).toBe(false);
    });

    it("should return true for all other providers", () => {
      expect(supportsTask(AIProvider.OPENAI)).toBe(true);
      expect(supportsTask(AIProvider.ANTHROPIC)).toBe(true);
      expect(supportsTask(AIProvider.GOOGLE)).toBe(true);
      expect(supportsTask(AIProvider.OLLAMA)).toBe(true);
    });
  });
});
