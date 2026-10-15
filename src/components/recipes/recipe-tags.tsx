import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeVariant, SizeVariant } from "@/lib/types";
import type { RecipeTag } from "@/lib/types/recipe-types";

interface RecipeTagsProps {
  tags: RecipeTag[] | string[];
  onRemove?: (tagId: string | string) => void;
  variant?: BadgeVariant;
  size?: SizeVariant;
  className?: string;
}

export function RecipeTags({
  tags,
  onRemove,
  variant = BadgeVariant.SECONDARY,
  size = SizeVariant.DEFAULT,
  className,
}: RecipeTagsProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className || ""}`}>
      {tags.map((tag) => {
        const tagName = typeof tag === "string" ? tag : tag.name;
        const tagId = typeof tag === "string" ? tag : tag.id;

        return (
          <Badge
            key={tagId}
            variant={variant}
            className={`
              !rounded-full
              transition-all duration-200 
              hover:scale-105 
              hover:shadow-sm 
              ${size === SizeVariant.SM ? "text-xs px-2.5 py-1 h-6" : "px-3 py-1.5 h-7"} 
              ${onRemove ? "pr-1.5 group" : ""}
            `}
          >
            <span className="truncate max-w-[120px]">{tagName}</span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(tagId)}
                className="ml-1.5 -mr-1 hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5 transition-all duration-200 opacity-60 group-hover:opacity-100"
                aria-label={`Remove ${tagName} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        );
      })}
    </div>
  );
}
