import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionSpacing } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  spacing?: SectionSpacing;
  className?: string;
  headerClassName?: string;
}

export function Section({
  title,
  description,
  children,
  action,
  spacing = SectionSpacing.DEFAULT,
  className,
  headerClassName,
}: SectionProps) {
  const spacingClass = {
    [SectionSpacing.COMPACT]: "space-y-3",
    [SectionSpacing.DEFAULT]: "space-y-4",
    [SectionSpacing.SPACIOUS]: "space-y-6",
  }[spacing];

  return (
    <section className={cn(spacingClass, className)}>
      {(title || description || action) && (
        <div
          className={cn("flex items-center justify-between", headerClassName)}
        >
          <div className="space-y-1">
            {title && (
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>

          {action && (
            <Button
              variant="ghost"
              size="sm"
              asChild={!!action.href}
              onClick={action.onClick}
              className="cursor-pointer"
            >
              {action.href ? (
                <Link href={action.href} className="flex items-center gap-2">
                  {action.label}
                  {action.icon && <action.icon className="h-4 w-4" />}
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  {action.label}
                  {action.icon && <action.icon className="h-4 w-4" />}
                </span>
              )}
            </Button>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
