"use client";

import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { forwardRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FormFieldType } from "@/lib/types";
import { cn } from "@/lib/utils";

// Type for shared input properties
type TextareaProps = React.ComponentProps<typeof Textarea>;

export interface SmartFormFieldProps {
  label: string;
  name: string;
  type?: FormFieldType;
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  error?: string;
  warning?: string;
  isValidating?: boolean;
  suggestions?: string[];
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export const SmartFormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  SmartFormFieldProps
>(
  (
    {
      label,
      name,
      type = FormFieldType.TEXT,
      value,
      onChange,
      onBlur,
      error,
      warning,
      isValidating,
      suggestions = [],
      placeholder,
      helpText,
      required,
      min,
      max,
      step,
      rows = 3,
      className,
      disabled,
    },
    ref,
  ) => {
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const inputValue =
        type === FormFieldType.NUMBER
          ? parseFloat(e.target.value) || 0
          : e.target.value;
      onChange(inputValue);
    };

    const applySuggestion = (suggestion: string) => {
      if (suggestion.startsWith('Try "') && suggestion.endsWith('"')) {
        const extractedValue = suggestion.slice(5, -1);
        onChange(extractedValue);
      } else if (
        suggestion.startsWith('Did you mean "') &&
        suggestion.endsWith('"?')
      ) {
        const extractedValue = suggestion.slice(14, -2);
        onChange(extractedValue);
      }
      setShowSuggestions(false);
    };

    const getFieldState = () => {
      if (isValidating) return "validating";
      if (error) return "error";
      if (warning) return "warning";
      if (value && !error && !warning) return "success";
      return "default";
    };

    const fieldState = getFieldState();

    const inputProps = {
      id: name,
      name,
      value: value || "",
      onChange: handleInputChange,
      onBlur: () => {
        onBlur?.();
        setShowSuggestions(false);
      },
      onFocus: () => {
        if (suggestions.length > 0) {
          setShowSuggestions(true);
        }
      },
      placeholder,
      disabled: disabled || isValidating,
      className: cn(
        "transition-all duration-200",
        fieldState === "error" &&
          "border-red-500 focus:border-red-500 focus:ring-red-500/20",
        fieldState === "warning" &&
          "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500/20",
        fieldState === "success" &&
          "border-green-500 focus:border-green-500 focus:ring-green-500/20",
        fieldState === "validating" &&
          "border-blue-500 focus:border-blue-500 focus:ring-blue-500/20",
      ),
      ...(type === FormFieldType.NUMBER && { min, max, step }),
    };

    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <Label htmlFor={name} className="flex items-center gap-2">
            {label}
            {required && <span className="text-red-500">*</span>}
            {helpText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{helpText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </Label>

          <div className="flex items-center gap-1">
            {isValidating && (
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            )}
            {fieldState === "success" && (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
            {fieldState === "error" && (
              <AlertCircle className="h-3 w-3 text-red-500" />
            )}
            {fieldState === "warning" && (
              <AlertCircle className="h-3 w-3 text-yellow-500" />
            )}
          </div>
        </div>

        <div className="relative">
          {type === FormFieldType.TEXTAREA ? (
            <Textarea
              {...(inputProps as Omit<TextareaProps, "rows">)}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              rows={rows}
            />
          ) : (
            <Input
              {...inputProps}
              type={type}
              ref={ref as React.Ref<HTMLInputElement>}
            />
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-border rounded-md shadow-lg">
              <div className="p-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Lightbulb className="h-3 w-3" />
                  Suggestions:
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion) => (
                    <button
                      key={`suggestion-${suggestion}`}
                      type="button"
                      className="w-full text-left text-xs p-2 rounded hover:bg-muted transition-colors"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Warning Message */}
        {warning && !error && (
          <div className="flex items-start gap-2 text-sm text-yellow-600">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {/* Character Count for Text Fields */}
        {(type === FormFieldType.TEXT || type === FormFieldType.TEXTAREA) &&
          value &&
          typeof value === "string" && (
            <div className="flex justify-end">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  value.length >
                    (type === FormFieldType.TEXTAREA ? 800 : 180) &&
                    "border-yellow-500 text-yellow-600",
                  value.length >
                    (type === FormFieldType.TEXTAREA ? 950 : 190) &&
                    "border-red-500 text-red-600",
                )}
              >
                {value.length}{" "}
                {type === FormFieldType.TEXTAREA ? "/ 1000" : "/ 200"}
              </Badge>
            </div>
          )}

        {/* Success Message for Valid Fields */}
        {fieldState === "success" && !warning && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>Looks good!</span>
          </div>
        )}

        {/* Validation State Indicator */}
        {isValidating && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Checking...</span>
          </div>
        )}
      </div>
    );
  },
);

SmartFormField.displayName = "SmartFormField";
