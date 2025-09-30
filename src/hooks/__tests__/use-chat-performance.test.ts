import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatPerformance } from "../use-chat-performance";

describe("useChatPerformance", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("debounces operations correctly", () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useChatPerformance({ debounceMs: 100 }),
    );

    act(() => {
      result.current.debouncedOperation(mockCallback);
      result.current.debouncedOperation(mockCallback);
      result.current.debouncedOperation(mockCallback);
    });

    // Should not be called immediately
    expect(mockCallback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(99);
    });

    // Still should not be called
    expect(mockCallback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Should be called once after debounce period
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("trims message history when exceeding limit", () => {
    const { result } = renderHook(() =>
      useChatPerformance({ maxMessageHistory: 3 }),
    );

    const messages = [
      { id: "1", content: "Message 1" },
      { id: "2", content: "Message 2" },
      { id: "3", content: "Message 3" },
      { id: "4", content: "Message 4" },
      { id: "5", content: "Message 5" },
    ];

    const trimmed = result.current.trimMessageHistory(messages);

    expect(trimmed).toHaveLength(3);
    expect(trimmed[0]).toEqual({ id: "3", content: "Message 3" });
    expect(trimmed[2]).toEqual({ id: "5", content: "Message 5" });
  });

  it("does not trim message history when under limit", () => {
    const { result } = renderHook(() =>
      useChatPerformance({ maxMessageHistory: 5 }),
    );

    const messages = [
      { id: "1", content: "Message 1" },
      { id: "2", content: "Message 2" },
    ];

    const trimmed = result.current.trimMessageHistory(messages);

    expect(trimmed).toHaveLength(2);
    expect(trimmed).toEqual(messages);
  });

  it("tracks message count correctly", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useChatPerformance());

    // Track 50 messages to trigger warning
    act(() => {
      for (let i = 0; i < 50; i++) {
        result.current.trackMessage();
      }
    });

    expect(result.current.messageCount).toBe(50);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Chat performance: 50 messages processed",
    );

    consoleSpy.mockRestore();
  });

  it("clears debounce timer on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const { result, unmount } = renderHook(() => useChatPerformance());

    const mockCallback = vi.fn();

    act(() => {
      result.current.debouncedOperation(mockCallback);
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("uses default options when none provided", () => {
    const { result } = renderHook(() => useChatPerformance());

    expect(result.current.messageCount).toBe(0);

    // Test default debounce time (300ms)
    const mockCallback = vi.fn();

    act(() => {
      result.current.debouncedOperation(mockCallback);
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(mockCallback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
