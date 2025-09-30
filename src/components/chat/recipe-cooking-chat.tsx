"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ChefHat,
  ImagePlus,
  Maximize2,
  MessageCircle,
  Minimize2,
  Send,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ChatMessage } from "@/components/chat/chat-message";
import { ImageChatInput } from "@/components/chat/image-chat-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageRole } from "@/lib/types";

interface RecipeCookingChatProps {
  userId: string;
  recipeContext: {
    recipeName: string;
    currentStep?: number;
    totalSteps?: number;
    ingredients?: string[];
    cookingMethod?: string;
    servings?: number;
  };
}

const COOKING_SUGGESTIONS = [
  "How do I know when this is done?",
  "Can I substitute this ingredient?",
  "What if I don't have this tool?",
  "Is this supposed to look like this?",
  "How do I fix this?",
  "What's the next step?",
];

export function RecipeCookingChat({
  userId,
  recipeContext,
}: RecipeCookingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId] = useState(() => `cooking-${userId}-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat/cooking-assistance",
    }),
    onFinish: () => {
      setTimeout(() => inputRef.current?.focus(), 100);
    },
  });

  // Manage input state manually
  const [input, setInput] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const isLoading = status === "streaming";

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(
      { text: suggestion },
      {
        body: {
          sessionId,
          recipeContext,
        },
      },
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(
        { text: input },
        {
          body: {
            sessionId,
            recipeContext,
          },
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
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const imageBase64 = reader.result as string;

        // Send to image analysis API with cooking context
        const response = await fetch("/api/chat/image-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64,
            description:
              description || "How does this look? Any cooking advice?",
            sessionId,
            context: {
              isRecipeRelated: true,
              recipeName: recipeContext.recipeName,
              currentStep: recipeContext.currentStep,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze image");
        }

        console.log("Cooking image uploaded for analysis", {
          file: file.name,
          description,
          recipe: recipeContext.recipeName,
        });

        setShowImageInput(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to process cooking image:", error);
    }
  };

  const getStepProgress = () => {
    if (!recipeContext.currentStep || !recipeContext.totalSteps) return null;
    return `Step ${recipeContext.currentStep} of ${recipeContext.totalSteps}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        // Floating chat button
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        // Chat interface
        <Card
          className={`w-96 shadow-xl transition-all duration-200 ${
            isMinimized ? "h-16" : "h-[500px]"
          }`}
        >
          <CardHeader className="flex-shrink-0 p-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <CardTitle className="text-sm">Cooking Assistant</CardTitle>
                  {getStepProgress() && (
                    <Badge variant="outline" className="text-xs w-fit">
                      {getStepProgress()}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setIsMinimized(!isMinimized)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minimize2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="flex-1 flex flex-col p-0 h-[452px]">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-4 space-y-3">
                      <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">
                          I'm here to help you cook!
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Ask me anything about {recipeContext.recipeName}
                        </p>
                      </div>

                      {/* Quick suggestions */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Try asking:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {COOKING_SUGGESTIONS.slice(0, 3).map((suggestion) => (
                            <Button
                              key={`cooking-suggestion-${suggestion.replace(/\s+/g, "-").toLowerCase()}`}
                              onClick={() => handleQuickSuggestion(suggestion)}
                              disabled={isLoading}
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((message) => {
                    const typedMessage = message as {
                      id: string;
                      role: "user" | "assistant";
                      parts?: Array<{ text?: string }>;
                      content?: string;
                      createdAt?: Date;
                    };

                    // AI SDK v5 uses parts array with text property
                    const content = typedMessage.parts
                      ? typedMessage.parts
                          .map((part) => part.text || "")
                          .join("")
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
                          timestamp: new Date(),
                        }}
                        userId={userId}
                      />
                    );
                  })}

                  {isLoading && <TypingIndicator />}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="flex-shrink-0 border-t bg-muted/30 p-3 space-y-3">
                {/* Image Input (when active) */}
                {showImageInput && (
                  <div className="border rounded-lg p-3 bg-background">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium">
                        Upload Cooking Photo
                      </h4>
                      <Button
                        onClick={() => setShowImageInput(false)}
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <ImageChatInput
                      onImageSelect={handleImageSelect}
                      disabled={isLoading}
                      maxSize={10}
                    />
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    id={inputId}
                    placeholder="Ask about cooking..."
                    value={input}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="text-sm"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowImageInput(!showImageInput)}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="px-2"
                  >
                    <ImagePlus className="h-3 w-3" />
                  </Button>
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    size="sm"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </form>

                {messages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {COOKING_SUGGESTIONS.slice(0, 2).map((suggestion) => (
                      <Button
                        key={`quick-cooking-suggestion-${suggestion.replace(/\s+/g, "-").toLowerCase()}`}
                        onClick={() => handleQuickSuggestion(suggestion)}
                        disabled={isLoading}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
