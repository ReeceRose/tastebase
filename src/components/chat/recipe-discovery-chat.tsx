"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChefHat, History, ImagePlus, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChatErrorHandler } from "@/components/chat/chat-error-handler";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatStatusIndicator } from "@/components/chat/chat-status-indicator";
import { ImageChatInput } from "@/components/chat/image-chat-input";
import { QuickSuggestions } from "@/components/chat/quick-suggestions";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatPerformance } from "@/hooks/use-chat-performance";
import { useMobileChat } from "@/hooks/use-mobile-chat";
import { MessageRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeDiscoveryChatProps {
  userId: string;
}

interface ChatRequestBody {
  sessionId: string;
  imageData?: {
    imageBase64: string;
    description: string;
    context: {
      isRecipeRelated: boolean;
    };
  };
}

const QUICK_SUGGESTIONS = [
  "What can I make with chicken and rice?",
  "I need a quick vegetarian dinner",
  "Something healthy for meal prep",
  "Comfort food for a cold day",
  "Easy dessert with chocolate",
  "Spicy Asian-inspired dishes",
];

export function RecipeDiscoveryChat({ userId }: RecipeDiscoveryChatProps) {
  const [sessionId] = useState(() => `discovery-${userId}-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  // Mobile and performance hooks
  const {
    isMobile,
    scrollToBottom,
    getTouchTargetSize,
    preventDoubleZoom,
    getSafeAreaInsets,
    getChatHeight,
  } = useMobileChat();
  const { trimMessageHistory, batchMessages, trackMessage } =
    useChatPerformance({
      maxMessageHistory: 50,
      enableMessageBatching: true,
      batchSize: 15,
    });

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat/recipe-discovery",
    }),
    onFinish: () => {
      setIsSubmitting(false);
      trackMessage();
      // Focus input after response (with mobile consideration)
      setTimeout(
        () => {
          if (!isMobile || document.activeElement !== inputRef.current) {
            inputRef.current?.focus();
          }
        },
        isMobile ? 300 : 100,
      );
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  // Manage input state manually
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  // Image state for pending upload
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    base64: string;
  } | null>(null);

  // Store sent images by message content for rendering
  const [sentImages, setSentImages] = useState<
    Map<string, { base64: string; description?: string }>
  >(new Map());

  // Error handling state
  const [chatError, setChatError] = useState<Error | null>(null);

  // Show loading indicators only when waiting for response to start
  // Hide once AI starts streaming text back
  const showLoadingIndicators = isSubmitting && status !== "streaming";
  const isLoading = status === "streaming" || isSubmitting;

  // Progressive loading messages
  const [loadingMessage, setLoadingMessage] = useState("");
  const loadingMessages = [
    "Thinking about your request...",
    "Exploring recipe possibilities...",
    "Generating culinary ideas...",
    "Crafting the perfect suggestions...",
  ];

  // Cycle through loading messages
  useEffect(() => {
    if (showLoadingIndicators) {
      let messageIndex = 0;
      setLoadingMessage(loadingMessages[0]);

      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 1500); // Change message every 1.5 seconds

      return () => clearInterval(interval);
    } else {
      setLoadingMessage("");
    }
  }, [showLoadingIndicators]);

  // Optimize messages for performance
  const optimizedMessages = useMemo(() => {
    const trimmed = trimMessageHistory(messages);
    return batchMessages(trimmed);
  }, [messages, trimMessageHistory, batchMessages]);

  // Auto-scroll to bottom for active conversations
  // biome-ignore lint/correctness/useExhaustiveDependencies: optimizedMessages.length is intentionally used to trigger scroll on message count change
  useEffect(() => {
    // Find the scrollable container (the overflow-y-auto div)
    let scrollContainer = messagesEndRef.current?.parentElement;
    while (
      scrollContainer &&
      !scrollContainer.classList.contains("overflow-y-auto")
    ) {
      scrollContainer = scrollContainer.parentElement;
    }

    if (!scrollContainer) return;

    // Check if user is near the bottom (within 300px for more aggressive scrolling)
    const isNearBottom =
      scrollContainer.scrollHeight -
        scrollContainer.scrollTop -
        scrollContainer.clientHeight <
      300;

    // More aggressive auto-scroll for active conversations:
    // - Always scroll when user submits or AI is streaming
    // - Scroll if user is within 300px of bottom (expanded from 150px)
    const isActiveConversation = isSubmitting || status === "streaming";
    const shouldScroll = isActiveConversation || isNearBottom;

    if (shouldScroll) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        scrollToBottom(messagesEndRef.current);
      });
    }
  }, [scrollToBottom, optimizedMessages.length, isSubmitting, status]);

  // Additional scroll effect for streaming content
  useEffect(() => {
    if (status === "streaming") {
      const scrollToBottomRepeatedly = () => {
        requestAnimationFrame(() => {
          scrollToBottom(messagesEndRef.current);
        });
      };

      // Scroll every 100ms during streaming to follow the content
      const interval = setInterval(scrollToBottomRepeatedly, 100);
      return () => clearInterval(interval);
    }
  }, [status, scrollToBottom]);

  // Setup mobile optimizations for input
  useEffect(() => {
    if (inputRef.current && isMobile) {
      preventDoubleZoom(inputRef.current);
    }
  }, [preventDoubleZoom, isMobile]);

  // Handle chat errors
  const handleError = (error: Error) => {
    setChatError(error);
    setIsSubmitting(false);
  };

  // Clear error state
  const clearError = () => {
    setChatError(null);
  };

  // Retry after error
  const retryAfterError = () => {
    setChatError(null);
    // Optionally retry the last message
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setIsSubmitting(true);

    try {
      sendMessage(
        { text: suggestion },
        {
          body: { sessionId },
        },
      );
    } catch (error) {
      handleError(error as Error);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || pendingImage) {
      setIsSubmitting(true);

      try {
        const messageText =
          input.trim() ||
          (pendingImage ? "What can you tell me about this image?" : "");
        if (!messageText) return; // Don't send empty messages

        // Include image data if present
        const requestBody: ChatRequestBody = { sessionId };
        if (pendingImage) {
          requestBody.imageData = {
            imageBase64: pendingImage.base64,
            description: messageText,
            context: {
              isRecipeRelated: true,
            },
          };
        }

        const displayText = pendingImage ? `🖼️ ${messageText}` : messageText;

        sendMessage({ text: displayText }, { body: requestBody });

        // Store image data for rendering if present
        if (pendingImage) {
          setSentImages((prev) =>
            new Map(prev).set(displayText, {
              base64: pendingImage.base64,
              description: messageText,
            }),
          );
        }

        // Clear form
        setInput("");
        setPendingImage(null);
        setShowImageInput(false);
        clearError();
      } catch (error) {
        handleError(error as Error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const syntheticEvent = {
        preventDefault: () => {},
      } as React.FormEvent;
      handleFormSubmit(syntheticEvent);
    }
  };

  const handleImageSelect = async (file: File) => {
    try {
      // Convert file to base64 and store as pending
      const reader = new FileReader();
      reader.onload = () => {
        const imageBase64 = reader.result as string;
        setPendingImage({
          file,
          base64: imageBase64,
        });
        // Keep the image input area open so user can type a message
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to process image:", error);
    }
  };

  const handleSaveRecipe = async (content: string) => {
    try {
      // Call the AI recipe parsing endpoint
      const response = await fetch("/api/ai/parse-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to parse recipe");
      }

      const { parsedRecipe } = await response.json();

      // Navigate to recipe creation form with pre-filled data
      const searchParams = new URLSearchParams({
        fromChat: "true",
        data: JSON.stringify(parsedRecipe),
      });

      window.open(`/recipes/new?${searchParams.toString()}`, "_blank");
    } catch (error) {
      console.error("Failed to save recipe:", error);
      // TODO: Add proper error handling/toast
    }
  };

  const safeAreaInsets = getSafeAreaInsets();

  return (
    <div
      className={cn(
        "h-full flex flex-col",
        isMobile && "h-screen max-h-screen overflow-hidden",
      )}
      style={{
        paddingTop: isMobile ? `${safeAreaInsets.top}px` : undefined,
        paddingBottom: isMobile ? `${safeAreaInsets.bottom}px` : undefined,
        height: isMobile ? getChatHeight() : undefined,
      }}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b bg-background",
          isMobile ? "p-3" : "p-4",
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ChefHat
            className={cn(
              "text-primary flex-shrink-0",
              isMobile ? "h-4 w-4" : "h-5 w-5",
            )}
          />
          <h1
            className={cn(
              "font-semibold truncate",
              isMobile ? "text-sm" : "text-base",
            )}
          >
            Recipe Discovery
          </h1>
          {!isMobile && (
            <ChatStatusIndicator
              status={
                chatError
                  ? "error"
                  : status === "streaming"
                    ? "streaming"
                    : isSubmitting
                      ? "connecting"
                      : "idle"
              }
              messageCount={optimizedMessages.length}
            />
          )}
        </div>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "sm"}
          asChild
          className={cn("flex-shrink-0", isMobile && "px-2")}
        >
          <Link href="/recipes/discover/history">
            <History className={cn(isMobile ? "h-4 w-4" : "h-4 w-4 mr-2")} />
            {!isMobile && "Chat History"}
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className={cn("flex-1 overflow-y-auto", isMobile ? "p-3" : "p-6")}>
        <div
          className={cn(
            "space-y-6",
            isMobile ? "max-w-none" : "max-w-3xl mx-auto",
          )}
        >
          {/* Error Handler */}
          {chatError && (
            <ChatErrorHandler
              error={chatError}
              onRetry={retryAfterError}
              onClear={clearError}
              isLoading={isSubmitting}
            />
          )}

          {/* Page Header - Hidden after first message */}
          {!chatError && (
            <div
              className={`text-center space-y-4 transition-all duration-700 ease-in-out ${
                optimizedMessages.length === 0
                  ? "opacity-100 max-h-96 translate-y-0"
                  : "opacity-0 max-h-0 -translate-y-4 overflow-hidden"
              }`}
            >
              <h1
                className={cn(
                  "font-bold text-foreground",
                  isMobile ? "text-2xl" : "text-4xl",
                )}
              >
                Recipe Discovery
              </h1>
              <p
                className={cn(
                  "text-muted-foreground px-2",
                  isMobile ? "text-sm" : "text-lg",
                )}
              >
                Tell me what ingredients you have, your dietary preferences, or
                what type of meal you're craving, and I'll help you discover
                perfect recipes!
              </p>
            </div>
          )}

          {/* Simple Welcome Section */}
          {!chatError && (
            <div
              className={`transition-all duration-500 ease-in-out ${
                optimizedMessages.length === 0
                  ? "opacity-100 transform-none"
                  : "opacity-0 -translate-y-8 pointer-events-none"
              }`}
            >
              {optimizedMessages.length === 0 && (
                <div className="text-center space-y-6">
                  <div
                    className={cn(
                      "relative mx-auto",
                      isMobile ? "w-12 h-12" : "w-16 h-16",
                    )}
                  >
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                    <div
                      className={cn(
                        "relative bg-primary rounded-full shadow-xl flex items-center justify-center",
                        isMobile ? "w-12 h-12" : "w-16 h-16",
                      )}
                    >
                      <ChefHat
                        className={cn(
                          "text-primary-foreground drop-shadow-lg",
                          isMobile ? "h-6 w-6" : "h-8 w-8",
                        )}
                      />
                    </div>
                    <Sparkles
                      className={cn(
                        "absolute -top-1 -right-1 text-primary animate-bounce",
                        isMobile ? "h-3 w-3" : "h-4 w-4",
                      )}
                      style={{ animationDelay: "0.5s" }}
                    />
                  </div>

                  <div className="space-y-4">
                    <h2
                      className={cn(
                        "font-semibold text-foreground",
                        isMobile ? "text-lg px-2" : "text-2xl",
                      )}
                    >
                      How can I help you discover recipes? 👨‍🍳
                    </h2>

                    <QuickSuggestions
                      suggestions={QUICK_SUGGESTIONS.slice(0, isMobile ? 3 : 4)}
                      onSuggestionClick={handleQuickSuggestion}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages Area */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              optimizedMessages.length > 0
                ? "opacity-100 transform-none"
                : "opacity-0 translate-y-4"
            }`}
          >
            {optimizedMessages.length > 0 && (
              <div
                className={cn(
                  "space-y-4",
                  isMobile ? "max-w-none" : "max-w-4xl mx-auto",
                )}
              >
                {optimizedMessages.map((message) => {
                  const typedMessage = message as {
                    id: string;
                    role: "user" | "assistant";
                    parts?: Array<{ text?: string }>;
                    content?: string;
                    createdAt?: Date;
                  };

                  // AI SDK v5 uses parts array with text property
                  const content = typedMessage.parts
                    ? typedMessage.parts.map((part) => part.text || "").join("")
                    : typedMessage.content || "";

                  // Check if this message has associated image data
                  const imageData =
                    typedMessage.role === "user" && content.startsWith("🖼️")
                      ? sentImages.get(content)
                      : undefined;

                  return (
                    <ChatMessage
                      key={typedMessage.id}
                      message={{
                        id: typedMessage.id,
                        role:
                          typedMessage.role === "user"
                            ? MessageRole.USER
                            : MessageRole.ASSISTANT,
                        content,
                        timestamp: typedMessage.createdAt || new Date(),
                        imageData,
                      }}
                      userId={userId}
                      onSaveRecipe={handleSaveRecipe}
                    />
                  );
                })}

                {/* Enhanced Loading State */}
                {showLoadingIndicators && (
                  <div className="space-y-4">
                    <TypingIndicator />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground animate-pulse transition-all duration-300">
                        {loadingMessage}
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Input Area at Bottom */}
      <div
        className={cn(
          "flex-shrink-0 bg-background border-t",
          isMobile ? "p-3" : "p-4",
        )}
      >
        <div
          className={cn(
            "space-y-4",
            isMobile ? "max-w-none" : "max-w-3xl mx-auto",
          )}
        >
          {/* Image Input (when active) */}
          {showImageInput && (
            <div
              className={cn(
                "border rounded-lg bg-muted/30",
                isMobile ? "p-3" : "p-4",
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  className={cn(
                    "font-medium",
                    isMobile ? "text-xs" : "text-sm",
                  )}
                >
                  {pendingImage ? "Image attached" : "Upload Recipe Image"}
                </h3>
                <Button
                  onClick={() => {
                    setShowImageInput(false);
                    setPendingImage(null);
                  }}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className={getTouchTargetSize()}
                >
                  <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                </Button>
              </div>
              {!pendingImage ? (
                <ImageChatInput
                  onImageSelect={handleImageSelect}
                  disabled={isLoading}
                  maxSize={10}
                />
              ) : (
                <div
                  className={cn(
                    "flex items-center gap-3 border rounded-lg bg-background",
                    isMobile ? "p-2" : "p-3",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg overflow-hidden border flex-shrink-0",
                      isMobile ? "w-12 h-12" : "w-16 h-16",
                    )}
                  >
                    {/* biome-ignore lint/performance/noImgElement: base64 data URL not supported by Next.js Image */}
                    <img
                      src={pendingImage.base64}
                      alt="Pending upload"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium",
                        isMobile ? "text-xs" : "text-sm",
                      )}
                    >
                      Image attached
                    </p>
                    <p
                      className={cn(
                        "text-muted-foreground",
                        isMobile ? "text-xs" : "text-xs",
                      )}
                    >
                      Type your message below and press send
                    </p>
                  </div>
                  <Button
                    onClick={() => setPendingImage(null)}
                    variant="ghost"
                    size="sm"
                    className={getTouchTargetSize()}
                  >
                    <X className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          <form
            onSubmit={handleFormSubmit}
            className={cn("flex gap-2", isMobile && "gap-2")}
          >
            <Input
              ref={inputRef}
              id={inputId}
              placeholder={
                pendingImage
                  ? "Ask about this image..."
                  : isMobile
                    ? "Ask me about recipes..."
                    : "Ask me about recipes... (e.g., 'What can I make with chicken?')"
              }
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className={cn(
                "flex-1",
                isMobile && "text-16px", // Prevents zoom on iOS
              )}
              autoComplete="off"
              style={{
                fontSize: isMobile ? "16px" : undefined, // Prevent iOS zoom
              }}
            />
            <Button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              disabled={isLoading}
              className={cn(getTouchTargetSize(), isMobile ? "px-2" : "px-3")}
            >
              <ImagePlus className={cn(isMobile ? "h-4 w-4" : "h-4 w-4")} />
              <span className="sr-only">Upload Image</span>
            </Button>
            <Button
              type="submit"
              disabled={(!input.trim() && !pendingImage) || isLoading}
              size={isMobile ? "sm" : "default"}
              className={cn(getTouchTargetSize(), isMobile ? "px-3" : "px-4")}
            >
              <Send className={cn(isMobile ? "h-4 w-4" : "h-4 w-4")} />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
