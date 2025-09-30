import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatMessage } from "../chat-message";

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe("ChatMessage", () => {
  const mockMessage = {
    id: "1",
    role: "user" as const,
    content: "What can I make with chicken?",
    timestamp: new Date("2024-01-01T12:00:00Z"),
  };

  const mockUserId = "user-123";

  it("renders user message correctly", () => {
    render(<ChatMessage message={mockMessage} userId={mockUserId} />);

    expect(
      screen.getByText("What can I make with chicken?"),
    ).toBeInTheDocument();
    expect(screen.getByText("12:00 PM")).toBeInTheDocument();
  });

  it("renders assistant message correctly", () => {
    const assistantMessage = {
      ...mockMessage,
      role: "assistant" as const,
      content: "I can suggest some great chicken recipes!",
    };

    render(<ChatMessage message={assistantMessage} userId={mockUserId} />);

    expect(
      screen.getByText("I can suggest some great chicken recipes!"),
    ).toBeInTheDocument();
  });

  it("handles copy functionality", async () => {
    render(<ChatMessage message={mockMessage} userId={mockUserId} />);

    const copyButton = screen.getByRole("button");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "What can I make with chicken?",
      );
    });
  });

  it("shows recipe cards for assistant messages with recipes", () => {
    const recipeMessage = {
      ...mockMessage,
      role: "assistant" as const,
      content:
        "Here are some recipes:\n\n**[Chicken Fried Rice]**\n*Description: Quick and easy fried rice*",
    };

    render(<ChatMessage message={recipeMessage} userId={mockUserId} />);

    expect(screen.getByText("Chicken Fried Rice")).toBeInTheDocument();
  });

  it("applies correct styling for user vs assistant messages", () => {
    const { rerender } = render(
      <ChatMessage message={mockMessage} userId={mockUserId} />,
    );

    // User message should have primary background
    expect(
      screen.getByText("What can I make with chicken?").closest(".bg-primary"),
    ).toBeInTheDocument();

    const assistantMessage = {
      ...mockMessage,
      role: "assistant" as const,
    };

    rerender(<ChatMessage message={assistantMessage} userId={mockUserId} />);

    // Assistant message should have muted background
    expect(
      screen.getByText("What can I make with chicken?").closest(".bg-muted"),
    ).toBeInTheDocument();
  });
});
