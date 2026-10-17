import type * as React from "react";
import { cn } from "@/lib/utils";

interface PanelProps extends React.ComponentProps<"section"> {
  title?: string;
  action?: React.ReactNode;
  subheading?: boolean;
}

function Panel({
  title,
  action,
  subheading = false,
  className,
  children,
  ...props
}: PanelProps) {
  const Heading = subheading ? "h3" : "h2";

  return (
    <section
      data-slot="panel"
      className={cn("bg-card text-card-foreground rounded-tile p-6", className)}
      {...props}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <Heading className="text-heading">{title}</Heading>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export { Panel };
