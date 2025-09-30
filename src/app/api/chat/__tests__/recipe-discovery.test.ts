import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../recipe-discovery/route";

// Mock dependencies
vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/ai/config", () => ({
  getActiveConfig: vi.fn(),
}));

vi.mock("@/lib/ai/providers", () => ({
  getProvider: vi.fn(),
}));

vi.mock("@/lib/server-actions/conversation-actions", () => ({
  saveConversationMessage: vi.fn(),
}));

vi.mock("ai", () => ({
  convertToCoreMessages: vi.fn(),
  streamText: vi.fn(),
}));

import { streamText } from "ai";
import { getActiveConfig } from "@/lib/ai/config";
import { getProvider } from "@/lib/ai/providers";
import { auth } from "@/lib/auth/auth";
import { saveConversationMessage } from "@/lib/server-actions/conversation-actions";

describe("/api/chat/recipe-discovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/chat/recipe-discovery",
      {
        method: "POST",
        body: JSON.stringify({
          messages: [],
          sessionId: "test-session",
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  it("returns 400 when AI is not configured", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferredTemperatureUnit: "celsius",
        preferredWeightUnit: "metric",
        preferredVolumeUnit: "metric",
      },
      session: {
        id: "session-123",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        token: "test-token",
        ipAddress: null,
        userAgent: null,
      },
    });

    vi.mocked(getActiveConfig).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/chat/recipe-discovery",
      {
        method: "POST",
        body: JSON.stringify({
          messages: [],
          sessionId: "test-session",
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("AI not configured");
  });

  it("returns 400 for invalid request format", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferredTemperatureUnit: "celsius",
        preferredWeightUnit: "metric",
        preferredVolumeUnit: "metric",
      },
      session: {
        id: "session-123",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        token: "test-token",
        ipAddress: null,
        userAgent: null,
      },
    });

    const request = new NextRequest(
      "http://localhost/api/chat/recipe-discovery",
      {
        method: "POST",
        body: JSON.stringify({
          // Missing required fields
          invalidField: "invalid",
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid request format");
  });

  it("processes valid recipe discovery request", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferredTemperatureUnit: "celsius",
        preferredWeightUnit: "metric",
        preferredVolumeUnit: "metric",
      },
      session: {
        id: "session-123",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        token: "test-token",
        ipAddress: null,
        userAgent: null,
      },
    };

    const mockConfig = {
      id: "config-123",
      userId: "user-123",
      provider: "openai" as const,
      apiKey: "test-key",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProvider = "mock-provider";

    const mockStreamResult = {
      toUIMessageStreamResponse: vi
        .fn()
        .mockReturnValue(new Response("Mock stream")),
    } as unknown as ReturnType<typeof streamText>;

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(getActiveConfig).mockResolvedValue(mockConfig);
    vi.mocked(getProvider).mockReturnValue(mockProvider);
    vi.mocked(streamText).mockReturnValue(mockStreamResult);
    vi.mocked(saveConversationMessage).mockResolvedValue({
      success: true,
      data: { messageId: "test-message-id" },
    });

    const request = new NextRequest(
      "http://localhost/api/chat/recipe-discovery",
      {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              id: "msg-1",
              role: "user",
              content: "What can I make with chicken?",
            },
          ],
          sessionId: "test-session",
        }),
      },
    );

    const response = await POST(request);

    expect(response).toBeInstanceOf(Response);
    expect(streamText).toHaveBeenCalledWith({
      model: mockProvider,
      system: expect.stringContaining("recipe discovery assistant"),
      messages: expect.any(Array),
      temperature: 0.8,
      maxTokens: 1000,
    });

    expect(mockStreamResult.toUIMessageStreamResponse).toHaveBeenCalled();
  });

  it("saves user message to conversation history", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferredTemperatureUnit: "celsius",
        preferredWeightUnit: "metric",
        preferredVolumeUnit: "metric",
      },
      session: {
        id: "session-123",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        token: "test-token",
        ipAddress: null,
        userAgent: null,
      },
    };

    const mockConfig = {
      id: "config-123",
      userId: "user-123",
      provider: "openai" as const,
      apiKey: "test-key",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(getActiveConfig).mockResolvedValue(mockConfig);
    vi.mocked(getProvider).mockReturnValue("mock-provider");
    vi.mocked(streamText).mockReturnValue({
      toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response()),
    } as unknown as ReturnType<typeof streamText>);

    const request = new NextRequest(
      "http://localhost/api/chat/recipe-discovery",
      {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              id: "msg-1",
              role: "user",
              content: "What can I make with chicken?",
            },
          ],
          sessionId: "test-session",
        }),
      },
    );

    await POST(request);

    expect(saveConversationMessage).toHaveBeenCalledWith({
      sessionId: "test-session",
      userId: "user-123",
      role: "user",
      content: "What can I make with chicken?",
      taskType: "recipe-discovery",
    });
  });
});
