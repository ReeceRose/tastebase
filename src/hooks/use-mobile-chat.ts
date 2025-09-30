import { useCallback, useEffect, useState } from "react";

interface MobileChatOptions {
  breakpoint?: number;
  keyboardOffset?: number;
  enableSwipeGestures?: boolean;
  enablePullToRefresh?: boolean;
}

// WeakMap to store last touch time for elements
const lastTouchTimes = new WeakMap<HTMLElement, number>();

export function useMobileChat(options: MobileChatOptions = {}) {
  const {
    breakpoint = 768,
    keyboardOffset = 300,
    enableSwipeGestures = true,
  } = options;

  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );
  const [isScrolling, setIsScrolling] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < breakpoint;
      setIsMobile(isMobileDevice);
      setViewportHeight(window.innerHeight);
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape",
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, [breakpoint]);

  // Detect virtual keyboard on mobile
  useEffect(() => {
    if (!isMobile) return;

    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;

      // If height decreased significantly, keyboard is likely open
      setIsKeyboardOpen(heightDifference > keyboardOffset);
    };

    window.addEventListener("resize", handleResize);

    // Also listen for visual viewport changes (more reliable on iOS)
    if ("visualViewport" in window) {
      const visualViewport = window.visualViewport as VisualViewport;
      visualViewport.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        visualViewport.removeEventListener("resize", handleResize);
      };
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile, keyboardOffset]);

  // Scroll to bottom with mobile considerations
  const scrollToBottom = useCallback(
    (element: HTMLElement | null, smooth = true) => {
      if (!element) return;

      const scrollOptions: ScrollIntoViewOptions = {
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      };

      // On mobile with keyboard, add extra offset
      if (isMobile && isKeyboardOpen) {
        element.scrollIntoView(scrollOptions);
        // Add small delay for keyboard animation
        setTimeout(() => {
          element.scrollIntoView({ ...scrollOptions, behavior: "auto" });
        }, 300);
      } else {
        element.scrollIntoView(scrollOptions);
      }
    },
    [isMobile, isKeyboardOpen],
  );

  // Get optimal chat height for mobile
  const getChatHeight = useCallback(() => {
    if (!isMobile) return "70vh";

    if (isKeyboardOpen) {
      // Reduce height when keyboard is open
      return orientation === "landscape" ? "40vh" : "50vh";
    }

    return orientation === "landscape" ? "80vh" : "85vh";
  }, [isMobile, isKeyboardOpen, orientation]);

  // Touch-friendly button sizing
  const getTouchTargetSize = useCallback(() => {
    return isMobile ? "h-12 min-w-12" : "h-10 min-w-10";
  }, [isMobile]);

  // Touch gesture handlers
  const handleTouchStart = useCallback(
    (_e: TouchEvent) => {
      if (!enableSwipeGestures || !isMobile) return;
      // Touch start tracking for future gesture support
    },
    [enableSwipeGestures, isMobile],
  );

  const handleTouchMove = useCallback(() => {
    if (!isMobile) return;
    setIsScrolling(true);
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    setTimeout(() => setIsScrolling(false), 150);
  }, [isMobile]);

  // Prevent zoom on double tap for input elements
  const preventDoubleZoom = useCallback(
    (element: HTMLInputElement | HTMLTextAreaElement) => {
      if (!isMobile) return;

      element.addEventListener("touchend", (e) => {
        const now = Date.now();
        const lastTouchTime = lastTouchTimes.get(element) || 0;
        const timeDiff = now - lastTouchTime;

        if (timeDiff < 300 && timeDiff > 0) {
          e.preventDefault();
        }

        lastTouchTimes.set(element, now);
      });
    },
    [isMobile],
  );

  // Safe area insets for modern mobile devices (iPhone X+ notch)
  const getSafeAreaInsets = useCallback(() => {
    if (!isMobile) return { top: 0, bottom: 0 };

    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(
        computedStyle.getPropertyValue("env(safe-area-inset-top)") || "0",
        10,
      ),
      bottom: parseInt(
        computedStyle.getPropertyValue("env(safe-area-inset-bottom)") || "0",
        10,
      ),
    };
  }, [isMobile]);

  return {
    isMobile,
    isKeyboardOpen,
    viewportHeight,
    orientation,
    isScrolling,
    scrollToBottom,
    getChatHeight,
    getTouchTargetSize,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    preventDoubleZoom,
    getSafeAreaInsets,
  };
}
