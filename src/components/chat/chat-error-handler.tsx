"use client";

import { AlertTriangle, RefreshCw, Settings, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChatErrorHandlerProps {
  error: Error | null;
  onRetry: () => void;
  onClear: () => void;
  isLoading?: boolean;
}

type ErrorType =
  | "network"
  | "auth"
  | "ai_config"
  | "rate_limit"
  | "server"
  | "unknown";

function getErrorType(error: Error | null): ErrorType {
  if (!error) return "unknown";

  const message = error.message.toLowerCase();

  if (message.includes("network") || message.includes("fetch")) {
    return "network";
  }
  if (message.includes("unauthorized") || message.includes("auth")) {
    return "auth";
  }
  if (message.includes("ai not configured") || message.includes("provider")) {
    return "ai_config";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "rate_limit";
  }
  if (message.includes("server") || message.includes("500")) {
    return "server";
  }

  return "unknown";
}

function getErrorInfo(errorType: ErrorType) {
  switch (errorType) {
    case "network":
      return {
        title: "Connection Problem",
        description:
          "Unable to connect to the server. Please check your internet connection.",
        icon: WifiOff,
        actionText: "Retry",
        canRetry: true,
        suggestions: [
          "Check your internet connection",
          "Try refreshing the page",
          "Wait a moment and try again",
        ],
      };

    case "auth":
      return {
        title: "Authentication Error",
        description: "Your session has expired. Please sign in again.",
        icon: AlertTriangle,
        actionText: "Sign In",
        canRetry: false,
        suggestions: [
          "Sign out and sign in again",
          "Clear your browser cache",
          "Contact support if the problem persists",
        ],
      };

    case "ai_config":
      return {
        title: "AI Not Configured",
        description:
          "AI features need to be set up before you can use the chat.",
        icon: Settings,
        actionText: "Configure AI",
        canRetry: false,
        suggestions: [
          "Go to Settings → AI Configuration",
          "Add your AI provider API key",
          "Select your preferred AI model",
        ],
      };

    case "rate_limit":
      return {
        title: "Rate Limit Reached",
        description:
          "You've reached the rate limit for AI requests. Please wait before trying again.",
        icon: AlertTriangle,
        actionText: "Try Again Later",
        canRetry: true,
        suggestions: [
          "Wait a few minutes before sending another message",
          "Consider upgrading your AI provider plan",
          "Try shorter messages to reduce token usage",
        ],
      };

    case "server":
      return {
        title: "Server Error",
        description:
          "The server encountered an error. Our team has been notified.",
        icon: AlertTriangle,
        actionText: "Retry",
        canRetry: true,
        suggestions: [
          "Wait a moment and try again",
          "Check the status page for updates",
          "Contact support if this continues",
        ],
      };

    default:
      return {
        title: "Something Went Wrong",
        description: "An unexpected error occurred. Please try again.",
        icon: AlertTriangle,
        actionText: "Retry",
        canRetry: true,
        suggestions: [
          "Try again in a moment",
          "Refresh the page if the problem persists",
          "Contact support with the error details below",
        ],
      };
  }
}

export function ChatErrorHandler({
  error,
  onRetry,
  onClear,
  isLoading = false,
}: ChatErrorHandlerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!error) return null;

  const errorType = getErrorType(error);
  const errorInfo = getErrorInfo(errorType);
  const Icon = errorInfo.icon;

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    onRetry();
  };

  const handleAction = () => {
    switch (errorType) {
      case "auth":
        window.location.href = "/auth/sign-in";
        break;
      case "ai_config":
        window.location.href = "/settings";
        break;
      default:
        handleRetry();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Offline indicator */}
      {!isOnline && (
        <Alert className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're currently offline. Please check your internet connection.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive text-lg">
            <Icon className="mr-2 h-5 w-5" />
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-destructive/80">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Suggestions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">What you can try:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {errorInfo.suggestions.map((suggestion) => (
                <li key={suggestion} className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Retry information */}
          {retryCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Retry attempts: {retryCount}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {errorInfo.canRetry && (
              <Button
                onClick={handleAction}
                disabled={isLoading || !isOnline}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                {isLoading ? "Retrying..." : errorInfo.actionText}
              </Button>
            )}

            {!errorInfo.canRetry && (
              <Button onClick={handleAction} variant="outline">
                {errorInfo.actionText}
              </Button>
            )}

            <Button onClick={onClear} variant="ghost" size="sm">
              Dismiss
            </Button>
          </div>

          {/* Error details for debugging */}
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
