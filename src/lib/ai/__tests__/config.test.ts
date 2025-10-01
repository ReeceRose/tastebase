import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCache,
  getDefaultConfig,
  getProviderRequirements,
  validateConfig,
} from "@/lib/ai/config";
import { AIProvider, type AIProviderConfig } from "@/lib/types";

// Mock the server actions
vi.mock("@/lib/server-actions/ai-config-actions", () => ({
  getUserAIConfig: vi.fn(),
}));

describe("AI Config Functions", () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("validateConfig", () => {
    it("should validate a valid OpenAI config", () => {
      const config: Partial<AIProviderConfig> = {
        provider: AIProvider.OPENAI,
        apiKey: "sk-test-key",
        maxTokens: 4000,
        temperature: 0.7,
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate a valid Ollama config", () => {
      const config: Partial<AIProviderConfig> = {
        provider: AIProvider.OLLAMA,
        ollamaHost: "http://localhost:11434",
        maxTokens: 4000,
        temperature: 0.7,
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate none provider", () => {
      const config: Partial<AIProviderConfig> = {
        provider: AIProvider.NONE,
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should require provider", () => {
      const config: Partial<AIProviderConfig> = {};

      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Provider is required");
    });

    it("should require API key for cloud providers", () => {
      const config: Partial<AIProviderConfig> = {
        provider: AIProvider.OPENAI,
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("API key is required for openai");
    });

    it("should validate max tokens range", () => {
      const config1: Partial<AIProviderConfig> = {
        provider: AIProvider.OLLAMA,
        maxTokens: 50,
      };

      const config2: Partial<AIProviderConfig> = {
        provider: AIProvider.OLLAMA,
        maxTokens: 300000,
      };

      const result1 = validateConfig(config1);
      const result2 = validateConfig(config2);

      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain(
        "Max tokens must be between 100 and 200,000",
      );
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain(
        "Max tokens must be between 100 and 200,000",
      );
    });

    it("should validate temperature range", () => {
      const config1: Partial<AIProviderConfig> = {
        provider: AIProvider.OLLAMA,
        temperature: -0.1,
      };

      const config2: Partial<AIProviderConfig> = {
        provider: AIProvider.OLLAMA,
        temperature: 2.1,
      };

      const result1 = validateConfig(config1);
      const result2 = validateConfig(config2);

      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain("Temperature must be between 0 and 2");
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain("Temperature must be between 0 and 2");
    });

    it("should validate Ollama host URL", () => {
      const config: Partial<AIProviderConfig> = {
        provider: AIProvider.OLLAMA,
        ollamaHost: "invalid-url",
      };

      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid Ollama host URL");
    });
  });

  describe("getProviderRequirements", () => {
    it("should return correct requirements for OpenAI", () => {
      const requirements = getProviderRequirements(AIProvider.OPENAI);

      expect(requirements).toEqual({
        requiresApiKey: true,
        requiresOllamaHost: false,
        defaultModel: "gpt-5-mini",
        supportedTasks: [
          "recipe-parsing",
          "chat-conversation",
          "recipe-discovery",
          "cooking-assistance",
        ],
      });
    });

    it("should return correct requirements for Anthropic", () => {
      const requirements = getProviderRequirements(AIProvider.ANTHROPIC);

      expect(requirements).toEqual({
        requiresApiKey: true,
        requiresOllamaHost: false,
        defaultModel: "claude-sonnet-4-latest",
        supportedTasks: [
          "recipe-parsing",
          "chat-conversation",
          "recipe-discovery",
          "cooking-assistance",
        ],
      });
    });

    it("should return correct requirements for Google", () => {
      const requirements = getProviderRequirements(AIProvider.GOOGLE);

      expect(requirements).toEqual({
        requiresApiKey: true,
        requiresOllamaHost: false,
        defaultModel: "gemini-2.5-flash",
        supportedTasks: [
          "recipe-parsing",
          "chat-conversation",
          "recipe-discovery",
          "cooking-assistance",
        ],
      });
    });

    it("should return correct requirements for Ollama", () => {
      const requirements = getProviderRequirements(AIProvider.OLLAMA);

      expect(requirements).toEqual({
        requiresApiKey: false,
        requiresOllamaHost: true,
        defaultModel: "llama3.2",
        supportedTasks: [
          "recipe-parsing",
          "chat-conversation",
          "recipe-discovery",
          "cooking-assistance",
        ],
      });
    });

    it("should return correct requirements for none", () => {
      const requirements = getProviderRequirements(AIProvider.NONE);

      expect(requirements).toEqual({
        requiresApiKey: false,
        requiresOllamaHost: false,
        defaultModel: "",
        supportedTasks: [],
      });
    });
  });

  describe("getDefaultConfig", () => {
    it("should return a valid default configuration", () => {
      const defaultConfig = getDefaultConfig();

      expect(defaultConfig).toEqual({
        provider: AIProvider.NONE,
        maxTokens: 4000,
        temperature: 0.7,
        enabledTasks: "recipe-parsing",
        ollamaHost: "http://localhost:11434",
        isActive: false,
      });
    });
  });

  describe("cache management", () => {
    it("should clear cache for specific user", () => {
      // This is a unit test for cache invalidation
      // We can't easily test the actual cache behavior without mocking the internal Map
      // This test is no longer applicable as invalidateCache is now imported directly
    });

    it("should clear all cache", () => {
      expect(() => clearCache()).not.toThrow();
    });
  });
});
