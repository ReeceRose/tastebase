import type * as React from "react";
import { cn } from "@/lib/utils";

interface EditorFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function EditorField({
  id,
  label,
  hint,
  error,
  className,
  children,
}: EditorFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-meta">
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-caption text-destructive"
        >
          {error}
        </p>
      ) : (
        hint && (
          <p className="text-caption font-normal text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

interface EditorSectionProps {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function EditorSectionCard({
  id,
  title,
  description,
  action,
  children,
}: EditorSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 rounded-tile bg-card p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`${id}-title`} className="text-heading">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-[60ch] text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
