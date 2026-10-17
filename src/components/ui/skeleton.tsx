import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted animate-pulse rounded-control [animation-duration:1.6s]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
