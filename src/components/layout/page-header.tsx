import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    href?: string;
    onClick?: () => void;
    variant?:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "link"
      | "ghost";
  }>;
  stats?: Array<{
    label: string;
    value: string | number;
    type: "metric" | "status" | "progress";
    status?: "success" | "warning" | "info" | "muted";
  }>;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions = [],
  stats = [],
  breadcrumbs = [],
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumbs.length > 0 && (
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li
                key={`breadcrumb-${crumb.label}-${index}`}
                className="flex items-center"
              >
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground max-w-2xl">{description}</p>
          )}
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <Button
                key={`action-${action.label}-${index}`}
                variant={action.variant || "secondary"}
                size="sm"
                asChild={!!action.href}
                onClick={action.onClick}
                className="cursor-pointer"
              >
                {action.href ? (
                  <Link href={action.href} className="flex items-center gap-2">
                    {action.icon && <action.icon className="h-4 w-4" />}
                    {action.label}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2">
                    {action.icon && <action.icon className="h-4 w-4" />}
                    {action.label}
                  </span>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {stat.label}:
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  stat.status === "success"
                    ? "text-chart-1"
                    : stat.status === "warning"
                      ? "text-chart-3"
                      : stat.status === "info"
                        ? "text-chart-4"
                        : "text-foreground",
                )}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
