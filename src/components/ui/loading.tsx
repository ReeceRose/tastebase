import { ComponentSize } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: ComponentSize;
  text?: string;
  className?: string;
}

export function Loading({
  size = ComponentSize.MD,
  text,
  className,
}: LoadingProps) {
  const sizeClasses = {
    [ComponentSize.SM]: "h-4 w-4",
    [ComponentSize.MD]: "h-8 w-8",
    [ComponentSize.LG]: "h-12 w-12",
  };

  return (
    <div
      className={cn("flex items-center justify-center space-x-2", className)}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size],
        )}
      />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loading size={ComponentSize.LG} />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
