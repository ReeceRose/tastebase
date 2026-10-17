import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-card placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-ring/25 aria-invalid:border-destructive aria-invalid:ring-destructive/25 flex field-sizing-content min-h-24 w-full rounded-control border-2 px-4 py-3 text-base sm:text-body transition-[border-color,box-shadow] duration-150 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
