"use client";

import { Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SizeVariant } from "@/lib/types";

interface VisibilityBadgeProps {
  isPublic: boolean;
  showIcon?: boolean;
  showTooltip?: boolean;
  size?: SizeVariant;
  className?: string;
}

export function VisibilityBadge({
  isPublic,
  showIcon = false,
  showTooltip = false,
  size = SizeVariant.DEFAULT,
  className,
}: VisibilityBadgeProps) {
  const badge = (
    <Badge
      variant={isPublic ? "default" : "outline"}
      className={`${size === SizeVariant.SM ? "text-xs" : ""} ${className || ""}`}
    >
      {showIcon &&
        (isPublic ? (
          <Eye className="h-3 w-3 mr-1" />
        ) : (
          <EyeOff className="h-3 w-3 mr-1" />
        ))}
      {isPublic ? "Public" : "Private"}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>
              {isPublic
                ? "This item is publicly visible"
                : "This item is private to you"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
