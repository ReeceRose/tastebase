import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMobileChat } from "../use-mobile-chat";

// Mock window properties
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, "innerHeight", {
  writable: true,
  configurable: true,
  value: 768,
});

describe("useMobileChat", () => {
  beforeEach(() => {
    // Reset window size to desktop
    window.innerWidth = 1024;
    window.innerHeight = 768;

    // Clear all event listeners
    vi.clearAllMocks();
  });

  it("detects desktop device correctly", () => {
    const { result } = renderHook(() => useMobileChat());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.orientation).toBe("landscape");
  });

  it("detects mobile device correctly", () => {
    window.innerWidth = 375;
    window.innerHeight = 667;

    const { result } = renderHook(() => useMobileChat());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.orientation).toBe("portrait");
  });

  it("detects orientation changes", () => {
    window.innerWidth = 375;
    window.innerHeight = 667;

    const { result } = renderHook(() => useMobileChat());

    expect(result.current.orientation).toBe("portrait");

    // Simulate orientation change
    act(() => {
      window.innerWidth = 667;
      window.innerHeight = 375;
      window.dispatchEvent(new Event("orientationchange"));
    });

    expect(result.current.orientation).toBe("landscape");
  });

  it("returns correct chat height for mobile", () => {
    window.innerWidth = 375;
    window.innerHeight = 667;

    const { result } = renderHook(() => useMobileChat());

    expect(result.current.getChatHeight()).toBe("85vh");
  });

  it("returns correct chat height for desktop", () => {
    const { result } = renderHook(() => useMobileChat());

    expect(result.current.getChatHeight()).toBe("70vh");
  });

  it("returns correct touch target size for mobile", () => {
    window.innerWidth = 375;

    const { result } = renderHook(() => useMobileChat());

    expect(result.current.getTouchTargetSize()).toBe("h-12 min-w-12");
  });

  it("returns correct touch target size for desktop", () => {
    const { result } = renderHook(() => useMobileChat());

    expect(result.current.getTouchTargetSize()).toBe("h-10 min-w-10");
  });

  it("handles custom breakpoint", () => {
    window.innerWidth = 600;

    const { result } = renderHook(() => useMobileChat({ breakpoint: 500 }));

    expect(result.current.isMobile).toBe(false);

    const { result: result2 } = renderHook(() =>
      useMobileChat({ breakpoint: 700 }),
    );

    expect(result2.current.isMobile).toBe(true);
  });

  it("scrollToBottom calls element.scrollIntoView", () => {
    const mockElement = {
      scrollIntoView: vi.fn(),
    } as unknown as HTMLElement;

    const { result } = renderHook(() => useMobileChat());

    act(() => {
      result.current.scrollToBottom(mockElement);
    });

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "end",
    });
  });
});
