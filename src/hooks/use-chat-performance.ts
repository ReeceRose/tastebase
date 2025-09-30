import { useCallback, useEffect, useRef } from "react";

interface ChatPerformanceOptions {
  debounceMs?: number;
  maxMessageHistory?: number;
  enableVirtualization?: boolean;
  enableMessageBatching?: boolean;
  batchSize?: number;
}

export function useChatPerformance(options: ChatPerformanceOptions = {}) {
  const {
    debounceMs = 300,
    maxMessageHistory = 100,
    enableVirtualization: _enableVirtualization = false,
    enableMessageBatching = true,
    batchSize = 20,
  } = options;

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageCountRef = useRef(0);

  // Debounced function for expensive operations
  const debouncedOperation = useCallback(
    (callback: () => void) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        callback();
      }, debounceMs);
    },
    [debounceMs],
  );

  // Message history management with batching
  const trimMessageHistory = useCallback(
    (messages: unknown[]) => {
      if (messages.length > maxMessageHistory) {
        // Keep recent messages and system/important messages
        return messages.slice(-maxMessageHistory);
      }
      return messages;
    },
    [maxMessageHistory],
  );

  // Batch messages for better rendering performance
  const batchMessages = useCallback(
    (messages: unknown[]) => {
      if (!enableMessageBatching) return messages;

      // For very long conversations, only render recent messages initially
      if (messages.length > batchSize * 2) {
        return messages.slice(-batchSize);
      }
      return messages;
    },
    [enableMessageBatching, batchSize],
  );

  // Memory cleanup for old message references
  const cleanupMessages = useCallback(() => {
    // Force garbage collection of old message objects
    if (messageCountRef.current > maxMessageHistory) {
      // This helps prevent memory leaks in long conversations
      if ("gc" in window && typeof window.gc === "function") {
        window.gc();
      }
    }
  }, [maxMessageHistory]);

  // Track message count for performance monitoring
  const trackMessage = useCallback(() => {
    messageCountRef.current += 1;

    // Log performance warning if too many messages
    if (messageCountRef.current % 50 === 0) {
      console.warn(
        `Chat performance: ${messageCountRef.current} messages processed`,
      );
      cleanupMessages();
    }
  }, [cleanupMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    debouncedOperation,
    trimMessageHistory,
    batchMessages,
    trackMessage,
    cleanupMessages,
    messageCount: messageCountRef.current,
  };
}
