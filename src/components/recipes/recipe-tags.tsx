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

interface RecipeTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function RecipeTagInput({
  tags,
  onChange,
  placeholder = "Add a tag...",
  className,
}: RecipeTagInputProps) {
  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      addTag(target.value);
      target.value = "";
    }
  };

  return (
    <div className={`space-y-1 ${className || ""}`}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          onKeyPress={handleKeyPress}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <kbd className="inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground opacity-100">
            Enter
          </kbd>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="min-h-[24px]">
          <RecipeTags
            tags={tags}
            onRemove={removeTag}
            variant={BadgeVariant.SECONDARY}
            size={SizeVariant.SM}
          />
        </div>
      )}
    </div>
  );
}
