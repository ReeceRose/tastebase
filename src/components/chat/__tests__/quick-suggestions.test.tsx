import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickSuggestions } from "../quick-suggestions";

describe("QuickSuggestions", () => {
  const mockSuggestions = [
    "What can I make with chicken?",
    "I need a quick dinner",
    "Something healthy",
  ];

  const mockOnSuggestionClick = vi.fn();

  beforeEach(() => {
    mockOnSuggestionClick.mockClear();
  });

  it("renders all suggestions in normal mode", () => {
    render(
      <QuickSuggestions
        suggestions={mockSuggestions}
        onSuggestionClick={mockOnSuggestionClick}
      />,
    );

    expect(
      screen.getByText("What can I make with chicken?"),
    ).toBeInTheDocument();
    expect(screen.getByText("I need a quick dinner")).toBeInTheDocument();
    expect(screen.getByText("Something healthy")).toBeInTheDocument();
    expect(screen.getByText("Try asking:")).toBeInTheDocument();
  });

  it("renders limited suggestions in compact mode", () => {
    render(
      <QuickSuggestions
        suggestions={mockSuggestions}
        onSuggestionClick={mockOnSuggestionClick}
        compact
      />,
    );

    expect(
      screen.getByText("What can I make with chicken?"),
    ).toBeInTheDocument();
    expect(screen.getByText("I need a quick dinner")).toBeInTheDocument();
    expect(screen.getByText("Something healthy")).toBeInTheDocument();
    expect(screen.queryByText("Try asking:")).not.toBeInTheDocument();
  });

  it("calls onSuggestionClick when suggestion is clicked", () => {
    render(
      <QuickSuggestions
        suggestions={mockSuggestions}
        onSuggestionClick={mockOnSuggestionClick}
      />,
    );

    const suggestion = screen.getByText("What can I make with chicken?");
    fireEvent.click(suggestion);

    expect(mockOnSuggestionClick).toHaveBeenCalledWith(
      "What can I make with chicken?",
    );
  });

  it("disables suggestions when disabled prop is true", () => {
    render(
      <QuickSuggestions
        suggestions={mockSuggestions}
        onSuggestionClick={mockOnSuggestionClick}
        disabled
      />,
    );

    const suggestion = screen.getByText("What can I make with chicken?");
    expect(suggestion.closest("button")).toBeDisabled();
  });

  it("applies compact styling correctly", () => {
    const { rerender } = render(
      <QuickSuggestions
        suggestions={mockSuggestions}
        onSuggestionClick={mockOnSuggestionClick}
      />,
    );

    let suggestion = screen.getByText("What can I make with chicken?");
    expect(suggestion.closest("button")).toHaveClass("h-auto");

    rerender(
      <QuickSuggestions
        suggestions={mockSuggestions}
        onSuggestionClick={mockOnSuggestionClick}
        compact
      />,
    );

    suggestion = screen.getByText("What can I make with chicken?");
    expect(suggestion.closest("button")).toHaveClass("h-8");
  });
});
