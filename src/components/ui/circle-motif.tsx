import { cn } from "@/lib/utils";

interface CircleMotifProps {
  className?: string;
}

export function CircleMotif({ className }: CircleMotifProps) {
  return (
    <span
      aria-hidden
      data-slot="circle-motif"
      className={cn("pointer-events-none absolute rounded-full", className)}
    />
  );
}
