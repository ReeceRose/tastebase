"use client";

import { AlertCircle, Check, ExternalLink, Globe } from "lucide-react";
import { useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RecipeUrlInputProps {
  value: string;
  onChange: (url: string) => void;
  onSubmit?: (url: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showRecentUrls?: boolean;
}

interface UrlValidation {
  isValid: boolean;
  isUrl: boolean;
  domain?: string;
  error?: string;
}

export function RecipeUrlInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "https://example.com/recipe",
  showRecentUrls = true,
}: RecipeUrlInputProps) {
  const [recentUrls, setRecentUrls] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tastebase-recent-recipe-urls");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const urlInputId = useId();
  const validation = validateUrl(value);

  const handleUrlChange = (newUrl: string) => {
    onChange(newUrl);
  };

  const handleSubmit = () => {
    if (validation.isValid && onSubmit) {
      // Save to recent URLs
      if (value && !recentUrls.includes(value)) {
        const updatedUrls = [value, ...recentUrls.slice(0, 4)]; // Keep only 5 recent URLs
        setRecentUrls(updatedUrls);
        localStorage.setItem(
          "tastebase-recent-recipe-urls",
          JSON.stringify(updatedUrls),
        );
      }
      onSubmit(value);
    }
  };

  const handleOpenUrl = () => {
    if (validation.isValid && value) {
      window.open(value, "_blank", "noopener,noreferrer");
    }
  };

  const handleRecentUrlClick = (url: string) => {
    onChange(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && validation.isValid && onSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={urlInputId} className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Recipe URL
        </Label>

        <div className="relative">
          <Input
            id={urlInputId}
            type="url"
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`pr-20 ${
              value
                ? validation.isValid
                  ? "border-green-500"
                  : "border-red-500"
                : ""
            }`}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value &&
              (validation.isValid ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : validation.isUrl ? (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ))}

            {validation.isValid && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleOpenUrl}
                disabled={disabled}
                className="h-6 px-2"
                title="Open URL in new tab"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {validation.domain && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {validation.domain}
            </Badge>
            {validation.isValid && (
              <Badge variant="outline" className="text-xs text-green-600">
                Valid URL
              </Badge>
            )}
          </div>
        )}

        {validation.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validation.error}</AlertDescription>
          </Alert>
        )}
      </div>

      {showRecentUrls && recentUrls.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Recent URLs</Label>
          <div className="flex flex-wrap gap-2">
            {recentUrls.map((url) => {
              const domain = extractDomain(url);
              return (
                <Button
                  key={`recent-url-${url}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRecentUrlClick(url)}
                  disabled={disabled}
                  className="h-auto p-2 text-xs"
                >
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    <span className="truncate max-w-[120px]" title={url}>
                      {domain}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function validateUrl(input: string): UrlValidation {
  if (!input.trim()) {
    return { isValid: false, isUrl: false };
  }

  try {
    const url = new URL(input.trim());

    if (!["http:", "https:"].includes(url.protocol)) {
      return {
        isValid: false,
        isUrl: true,
        error: "Only HTTP and HTTPS URLs are supported",
      };
    }

    if (
      !url.hostname ||
      url.hostname === "localhost" ||
      url.hostname.includes("127.0.0.1")
    ) {
      return {
        isValid: false,
        isUrl: true,
        domain: url.hostname,
        error: "Local URLs are not supported",
      };
    }

    return {
      isValid: true,
      isUrl: true,
      domain: url.hostname,
    };
  } catch {
    // Check if it looks like a URL but is malformed
    if (
      input.includes(".") &&
      (input.startsWith("http") || input.includes("www"))
    ) {
      return {
        isValid: false,
        isUrl: true,
        error: "Invalid URL format",
      };
    }

    return {
      isValid: false,
      isUrl: false,
      error: "Please enter a valid URL",
    };
  }
}

function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
