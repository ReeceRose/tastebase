"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BadgeVariant, SizeVariant } from "@/lib/types";

interface CategoryBadgeProps {
  category: string;
  variant?: BadgeVariant;
  showTooltip?: boolean;
  size?: SizeVariant;
  className?: string;
}

export function CategoryBadge({
  category,
  variant = BadgeVariant.OUTLINE,
  showTooltip = false,
  size = SizeVariant.DEFAULT,
  className,
}: CategoryBadgeProps) {
  const badge = (
    <Badge
      variant={variant}
      className={`capitalize ${size === SizeVariant.SM ? "text-xs" : ""} ${className || ""}`}
    >
      {category}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">{category} category</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
