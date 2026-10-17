import type * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center rounded-tile bg-card px-6 py-14 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="mb-6 size-20 rounded-full bg-muted ring-8 ring-muted/50"
      />
      <h2 className="text-heading">{title}</h2>
      {description && (
        <p className="mt-2 max-w-[46ch] text-muted-foreground">{description}</p>
      )}
      {action && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>
      )}
    </div>
  );
}
