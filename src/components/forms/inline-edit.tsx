"use client";

import { Check, Edit, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export enum InlineEditType {
  TEXT = "text",
  NUMBER = "number",
  TEXTAREA = "textarea",
}

interface InlineEditProps {
  id?: string;
  value: string | number;
  onSave: (value: string | number) => void;
  type?: InlineEditType;
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  isEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  validation?: (value: string | number) => string | null;
  maxLength?: number;
  disabled?: boolean;
}

export function InlineEdit({
  id: _id,
  value,
  onSave,
  type = InlineEditType.TEXT,
  placeholder,
  className,
  displayClassName,
  isEditing: controlledEditing,
  onEditingChange,
  validation,
  maxLength,
  disabled = false,
}: InlineEditProps) {
  const [internalEditing, setInternalEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditing = controlledEditing ?? internalEditing;

  useEffect(() => {
    if (isEditing) {
      const ref = type === InlineEditType.TEXTAREA ? textareaRef : inputRef;
      ref.current?.focus();
      ref.current?.select();
    }
  }, [isEditing, type]);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const startEdit = () => {
    if (disabled) return;
    setEditValue(String(value));
    setError(null);
    if (controlledEditing === undefined) {
      setInternalEditing(true);
    }
    onEditingChange?.(true);
  };

  const cancelEdit = () => {
    setEditValue(String(value));
    setError(null);
    if (controlledEditing === undefined) {
      setInternalEditing(false);
    }
    onEditingChange?.(false);
  };

  const saveEdit = () => {
    const trimmedValue = editValue.trim();

    if (validation) {
      const validationError = validation(
        type === InlineEditType.NUMBER ? Number(trimmedValue) : trimmedValue,
      );
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (type === InlineEditType.NUMBER) {
      const numValue = Number(trimmedValue);
      if (Number.isNaN(numValue)) {
        setError("Please enter a valid number");
        return;
      }
      onSave(numValue);
    } else {
      onSave(trimmedValue);
    }

    setError(null);
    if (controlledEditing === undefined) {
      setInternalEditing(false);
    }
    onEditingChange?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== InlineEditType.TEXTAREA) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    } else if (
      e.key === "Enter" &&
      e.ctrlKey &&
      type === InlineEditType.TEXTAREA
    ) {
      e.preventDefault();
      saveEdit();
    }
  };

  if (isEditing) {
    if (type === InlineEditType.TEXTAREA) {
      return (
        <div className="space-y-2">
          <div className="flex gap-2 items-start">
            <Textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setEditValue(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              className={`${className} ${error ? "border-destructive" : ""}`}
              rows={3}
            />
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={saveEdit}
                className="h-8 w-8 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEdit}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Press Ctrl+Enter to save, Escape to cancel
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex gap-2 items-start">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEditValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            type={type === InlineEditType.NUMBER ? "number" : "text"}
            maxLength={maxLength}
            className={`${className} ${error ? "border-destructive" : ""}`}
          />
          <div className="flex gap-1 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={saveEdit}
              className="h-8 w-8 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEdit}
              className="h-8 w-8 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`group flex items-center gap-2 ${displayClassName} ${disabled ? "opacity-60" : "cursor-pointer hover:bg-muted/50"} rounded-sm p-1 -m-1 text-left w-full border-0 bg-transparent`}
      onClick={startEdit}
      disabled={disabled}
    >
      <span className="flex-1 min-w-0">
        {value || (
          <span className="text-muted-foreground italic">
            {placeholder || "Click to edit..."}
          </span>
        )}
      </span>
      {!disabled && (
        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
}

interface InlineSelectProps {
  id?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  disabled?: boolean;
}

export function InlineSelect({
  id: _id,
  value,
  options,
  onSave,
  placeholder,
  displayClassName,
  disabled = false,
}: InlineSelectProps) {
  const [isEditing, setIsEditing] = useState(false);

  const currentOption = options.find((opt) => opt.value === value);

  if (isEditing) {
    return (
      <div className="flex gap-2 items-center">
        <select
          value={value}
          onChange={(e) => {
            onSave(e.target.value);
            setIsEditing(false);
          }}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsEditing(false);
            }
          }}
          className="flex-1 px-3 py-1 border rounded-md text-sm"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`group flex items-center gap-2 ${displayClassName} ${disabled ? "opacity-60" : "cursor-pointer hover:bg-muted/50"} rounded-sm p-1 -m-1 text-left w-full border-0 bg-transparent`}
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
    >
      <span className="flex-1">
        {currentOption?.label || (
          <span className="text-muted-foreground italic">
            {placeholder || "Click to select..."}
          </span>
        )}
      </span>
      {!disabled && (
        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
