"use client";

import { AlertCircle, CheckCircle, Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatStatusIndicatorProps {
  status: "idle" | "connecting" | "streaming" | "error" | "offline";
  messageCount?: number;
  className?: string;
}

export function ChatStatusIndicator({
  status,
  messageCount = 0,
  className,
}: ChatStatusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Auto-hide after successful completion
  useEffect(() => {
    if (status === "idle" || status === "streaming") {
      setIsVisible(true);

      if (status === "idle" && messageCount > 0) {
        const timer = setTimeout(() => setIsVisible(false), 2000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(true);
    }
  }, [status, messageCount]);

  if (!isVisible && status === "idle") {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case "connecting":
        return {
          icon: Loader2,
          text: "Connecting...",
          variant: "secondary" as const,
          className: "animate-pulse",
          iconClassName: "animate-spin",
        };

      case "streaming":
        return {
          icon: Loader2,
          text: "AI is responding...",
          variant: "default" as const,
          className: "",
          iconClassName: "animate-spin",
        };

      case "error":
        return {
          icon: AlertCircle,
          text: "Connection error",
          variant: "destructive" as const,
          className: "",
          iconClassName: "",
        };

      case "offline":
        return {
          icon: WifiOff,
          text: "Offline",
          variant: "secondary" as const,
          className: "",
          iconClassName: "",
        };

      default:
        return {
          icon: CheckCircle,
          text: messageCount > 0 ? "Ready" : "Connected",
          variant: "outline" as const,
          className: "",
          iconClassName: "",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "flex items-center gap-1.5 text-xs transition-all duration-200",
        config.className,
        className,
      )}
    >
      <Icon className={cn("h-3 w-3", config.iconClassName)} />
      {config.text}
      {messageCount > 0 && status === "idle" && (
        <span className="text-xs opacity-70">• {messageCount} messages</span>
      )}
    </Badge>
  );
}
