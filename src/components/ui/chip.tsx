import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type * as React from "react";
import { ChipVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        [ChipVariant.FILTER]:
          "min-h-9 border-2 border-foreground px-3.5 text-sm font-semibold cursor-pointer hover:bg-foreground/5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90",
        [ChipVariant.FACT]: "bg-foreground/10 px-3.5 py-1.5 text-meta tabular",
        [ChipVariant.TAG]:
          "border-2 border-foreground px-3 py-1 text-meta hover:bg-foreground/5",
      },
    },
    defaultVariants: {
      variant: ChipVariant.FILTER,
    },
  },
);

interface ChipProps extends React.ComponentProps<"button"> {
  variant?: ChipVariant;
  asChild?: boolean;
}

function Chip({
  className,
  variant = ChipVariant.FILTER,
  asChild = false,
  type,
  ...props
}: ChipProps) {
  if (asChild) {
    return (
      <Slot
        data-slot="chip"
        className={cn(chipVariants({ variant }), className)}
        {...props}
      />
    );
  }

  if (variant === ChipVariant.FILTER) {
    return (
      <button
        type={type ?? "button"}
        data-slot="chip"
        className={cn(chipVariants({ variant }), className)}
        {...props}
      />
    );
  }

  return (
    <span data-slot="chip" className={cn(chipVariants({ variant }), className)}>
      {props.children}
    </span>
  );
}

export { Chip, chipVariants };
