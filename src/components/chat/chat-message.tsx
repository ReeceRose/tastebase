"use client";

import { CheckCircle, ChefHat, Copy, Save, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { RecipeCardMessage } from "@/components/chat/messages/recipe-card-message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMobileChat } from "@/hooks/use-mobile-chat";
import { cn } from "@/lib/utils";
import { markdownToHtml } from "@/lib/utils/markdown";

interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
    imageData?: {
      base64: string;
      description?: string;
    };
  };
  userId: string;
  onSaveRecipe?: (content: string) => void;
}

export function ChatMessage({
  message,
  userId,
  onSaveRecipe,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [htmlContent, setHtmlContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const isUser = message.role === "user";
  const { isMobile, getTouchTargetSize } = useMobileChat();

  useEffect(() => {
    if (!isUser) {
      markdownToHtml(message.content)
        .then((html) => setHtmlContent(html))
        .catch(() => setHtmlContent(message.content));
    }
  }, [message.content, isUser]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveRecipe = async () => {
    if (!onSaveRecipe || isSaving) return;

    setIsSaving(true);
    try {
      await onSaveRecipe(message.content);
    } catch (error) {
      console.error("Failed to save recipe:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if message contains structured recipe content
  const hasRecipeCards =
    message.role === "assistant" &&
    // Recipe-specific keywords with structure indicators
    ((message.content.includes("Recipe:") &&
      (message.content.includes("## ") ||
        message.content.includes("### ") ||
        message.content.includes("**Ingredients") ||
        message.content.includes("**Instructions") ||
        message.content.includes("**Steps"))) ||
      // Multiple recipe headers
      (message.content.match(/##\s+\w+/g)?.length ?? 0) >= 2 ||
      // Recipe list format (numbered ingredients + instructions)
      (message.content.includes("**Ingredients") &&
        message.content.includes("**Instructions")) ||
      // Structured recipe cards format (AI suggestion format)
      message.content.includes("**[") ||
      // Recipe suggestion format with structured data
      message.content.includes("*Description:") ||
      message.content.includes("*Time:") ||
      message.content.includes("*Difficulty:") ||
      message.content.includes("*Why it's perfect:"));

  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start",
        isMobile ? "gap-2" : "gap-3",
      )}
      data-user-id={userId}
    >
      {!isUser && (
        <Avatar
          className={cn("mt-1 flex-shrink-0", isMobile ? "h-6 w-6" : "h-8 w-8")}
        >
          <AvatarFallback className="bg-primary text-primary-foreground">
            <ChefHat className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex flex-col space-y-2",
          isMobile ? "max-w-[90%]" : "max-w-[85%]",
          isUser ? "items-end" : "items-start",
        )}
      >
        <Card
          className={cn(
            isUser
              ? "bg-primary text-primary-foreground ml-auto shadow-lg"
              : "bg-muted border shadow-md",
            isMobile ? "p-2" : "p-3",
          )}
        >
          <div className="space-y-3">
            {/* Image display for user messages */}
            {isUser && message.imageData && (
              <div
                className={cn("mb-2", isMobile ? "max-w-[200px]" : "max-w-xs")}
              >
                <Image
                  src={message.imageData.base64}
                  alt={message.imageData.description || "Uploaded image"}
                  width={isMobile ? 200 : 300}
                  height={isMobile ? 133 : 200}
                  className="w-full h-auto rounded-lg border shadow-sm"
                  unoptimized
                />
              </div>
            )}

            {hasRecipeCards ? (
              <RecipeCardMessage content={message.content} />
            ) : (
              <div
                className={cn(
                  "leading-relaxed",
                  isMobile ? "text-sm" : "text-sm",
                )}
              >
                {isUser ? (
                  <div className="whitespace-pre-wrap">
                    {message.content.startsWith("🖼️ ")
                      ? message.content.replace("🖼️ ", "")
                      : message.content}
                  </div>
                ) : (
                  <div
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: AI-generated content from trusted source, markdown processed with remark
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                    className="markdown-content"
                  />
                )}
              </div>
            )}
          </div>

          <div
            className={cn(
              "flex items-center justify-between border-t",
              isMobile ? "mt-1 pt-1" : "mt-2 pt-2",
              isUser ? "border-primary-foreground/20" : "border-border",
            )}
          >
            <span
              className={cn(
                isMobile ? "text-xs" : "text-xs",
                isUser ? "text-white/80" : "text-muted-foreground",
              )}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            <div className="flex items-center gap-1">
              {/* Save Recipe Button - only for AI messages with recipe content */}
              {!isUser && hasRecipeCards && onSaveRecipe && (
                <Button
                  onClick={handleSaveRecipe}
                  disabled={isSaving}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    getTouchTargetSize(),
                    isMobile ? "h-5 px-1" : "h-6 px-2",
                    "hover:bg-muted text-muted-foreground hover:text-foreground",
                  )}
                  title="Save Recipe"
                >
                  <Save
                    className={cn(
                      isMobile ? "h-3 w-3" : "h-3 w-3",
                      isSaving && "animate-spin",
                    )}
                  />
                </Button>
              )}

              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className={cn(
                  getTouchTargetSize(),
                  isMobile ? "h-5 px-1" : "h-6 px-2",
                  isUser
                    ? "hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
                title="Copy"
              >
                {copied ? (
                  <CheckCircle
                    className={cn(isMobile ? "h-3 w-3" : "h-3 w-3")}
                  />
                ) : (
                  <Copy className={cn(isMobile ? "h-3 w-3" : "h-3 w-3")} />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {isUser && (
        <Avatar
          className={cn("mt-1 flex-shrink-0", isMobile ? "h-6 w-6" : "h-8 w-8")}
        >
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
