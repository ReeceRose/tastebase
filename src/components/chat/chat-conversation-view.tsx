"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowLeft,
  ChefHat,
  History,
  ImagePlus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChatMessage } from "@/components/chat/chat-message";
import { ImageChatInput } from "@/components/chat/image-chat-input";
import { QuickSuggestions } from "@/components/chat/quick-suggestions";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatPerformance } from "@/hooks/use-chat-performance";
import { useMobileChat } from "@/hooks/use-mobile-chat";
import { getConversationHistory } from "@/lib/server-actions/conversation-actions";
import { MessageRole } from "@/lib/types";

interface ChatConversationViewProps {
  userId: string;
  sessionId: string;
}

const QUICK_SUGGESTIONS = [
  "What can I make with chicken and rice?",
  "I need a quick vegetarian dinner",
  "Something healthy for meal prep",
  "Comfort food for a cold day",
  "Easy dessert with chocolate",
  "Spicy Asian-inspired dishes",
];

export function ChatConversationView({
  userId,
  sessionId,
}: ChatConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Mobile and performance hooks
  const { isMobile, scrollToBottom } = useMobileChat();
  const { trimMessageHistory, trackMessage } = useChatPerformance();

  const { messages, sendMessage, status, setMessages } = useChat({
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

  // Load conversation history
  useEffect(() => {
    async function loadHistory() {
      setIsLoadingHistory(true);
      const result = await getConversationHistory(sessionId, userId);

      if (result.success && result.data) {
        // Convert database messages to chat format
        const chatMessages = result.data.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: msg.content }],
          createdAt: new Date(msg.createdAt),
        }));

        setMessages(chatMessages);
      }
      setIsLoadingHistory(false);
    }

    loadHistory();
  }, [sessionId, userId, setMessages]);

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
    return trimMessageHistory(messages);
  }, [messages, trimMessageHistory]);

  // Auto-scroll to bottom with mobile optimization
  useEffect(() => {
    scrollToBottom(messagesEndRef.current);
  }, [scrollToBottom]);

  const handleQuickSuggestion = (suggestion: string) => {
    setIsSubmitting(true);
    sendMessage(
      { text: suggestion },
      {
        body: { sessionId },
      },
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setIsSubmitting(true);
      sendMessage(
        { text: input },
        {
          body: { sessionId },
        },
      );
      setInput("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleImageSelect = async (file: File, description?: string) => {
    try {
      setIsSubmitting(true);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const imageBase64 = reader.result as string;

        // Send to image analysis API
        const response = await fetch("/api/chat/image-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64,
            description:
              description || "What can you tell me about this image?",
            sessionId,
            context: {
              isRecipeRelated: true,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze image");
        }

        console.log("Conversation image uploaded for analysis", {
          file: file.name,
          description,
          sessionId,
        });

        setShowImageInput(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to process conversation image:", error);
      setIsSubmitting(false);
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <Button variant="outline" size="sm" asChild>
          <Link href="/recipes/discover/history">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-semibold">Recipe Discovery Chat</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Show welcome if no messages */}
          {optimizedMessages.length === 0 && (
            <div className="text-center space-y-6">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                <div className="relative w-16 h-16 bg-primary rounded-full shadow-xl flex items-center justify-center">
                  <ChefHat className="h-8 w-8 text-primary-foreground drop-shadow-lg" />
                </div>
                <Sparkles
                  className="absolute -top-1 -right-1 h-4 w-4 text-primary animate-bounce"
                  style={{ animationDelay: "0.5s" }}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  Continue your recipe discovery! 👨‍🍳
                </h2>
                <QuickSuggestions
                  suggestions={QUICK_SUGGESTIONS.slice(0, 4)}
                  onSuggestionClick={handleQuickSuggestion}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Messages Area */}
          {optimizedMessages.length > 0 && (
            <div className="space-y-4 max-w-4xl mx-auto">
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
                    }}
                    userId={userId}
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

      {/* Fixed Input Area at Bottom */}
      <div className="flex-shrink-0 bg-background border-t p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Image Input (when active) */}
          {showImageInput && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Upload Image</h3>
                <Button
                  onClick={() => setShowImageInput(false)}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ImageChatInput
                onImageSelect={handleImageSelect}
                disabled={isLoading}
                maxSize={10}
              />
            </div>
          )}

          {/* Text Input */}
          <form onSubmit={handleFormSubmit} className="flex gap-3">
            <Input
              ref={inputRef}
              id={inputId}
              placeholder="Continue the conversation... (e.g., 'What about dessert options?')"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              className="flex-1"
              autoComplete="off"
            />
            <Button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              variant="outline"
              size="default"
              disabled={isLoading}
              className="px-3"
            >
              <ImagePlus className="h-4 w-4" />
              <span className="sr-only">Upload Image</span>
            </Button>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="default"
              className="px-4"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
