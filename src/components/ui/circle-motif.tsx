import { cn } from "@/lib/utils";

export const TILE_MOTIF_MOTION =
  "transition-[scale] duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]";

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
