import { cn } from "@/lib/utils/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: "default" | "wide" | "full";
  padding?: "default" | "tight" | "loose";
  className?: string;
}

export function PageLayout({
  children,
  maxWidth = "default",
  padding = "default",
  className,
}: PageLayoutProps) {
  const maxWidthClasses = {
    default: "max-w-6xl",
    wide: "max-w-7xl",
    full: "max-w-none",
  };

  const paddingClasses = {
    default: "p-6",
    tight: "p-4",
    loose: "p-8",
  };

  return (
    <div
      className={cn(
        "mx-auto w-full space-y-6",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
