"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DebouncedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export function DebouncedInput({
  value: externalValue = "",
  onDebouncedChange,
  debounceMs = 300,
  className,
  onChange,
  ...props
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(externalValue);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  // Debounced change handler
  const debouncedChangeHandler = useCallback(
    (newValue: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onDebouncedChange?.(newValue);
      }, debounceMs);
    },
    [onDebouncedChange, debounceMs],
  );

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Call immediate onChange if provided
      onChange?.(e);

      // Trigger debounced change
      debouncedChangeHandler(newValue);
    },
    [onChange, debouncedChangeHandler],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={handleChange}
      className={cn(className)}
    />
  );
}
