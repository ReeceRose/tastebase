"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Info,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ButtonVariant, MessageType } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ActionFeedbackAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  external?: boolean;
  shortcut?: string;
}

export interface ActionFeedbackProps {
  type: MessageType;
  title: string;
  description?: string;
  actions?: ActionFeedbackAction[];
  details?: string[];
  className?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const feedbackConfig = {
  [MessageType.SUCCESS]: {
    icon: CheckCircle2,
    iconColor: "text-green-600",
    borderColor: "border-green-200",
    bgColor: "bg-green-50",
    titleColor: "text-green-900",
    descriptionColor: "text-green-700",
  },
  [MessageType.ERROR]: {
    icon: XCircle,
    iconColor: "text-red-600",
    borderColor: "border-red-200",
    bgColor: "bg-red-50",
    titleColor: "text-red-900",
    descriptionColor: "text-red-700",
  },
  [MessageType.WARNING]: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    borderColor: "border-yellow-200",
    bgColor: "bg-yellow-50",
    titleColor: "text-yellow-900",
    descriptionColor: "text-yellow-700",
  },
  [MessageType.INFO]: {
    icon: Info,
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50",
    titleColor: "text-blue-900",
    descriptionColor: "text-blue-700",
  },
};

export function ActionFeedback({
  type,
  title,
  description,
  actions = [],
  details = [],
  className,
  onDismiss,
  autoHide = false,
  autoHideDelay = 5000,
}: ActionFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const config = feedbackConfig[type];
  const Icon = config.icon;

  // Auto-hide functionality
  useState(() => {
    if (autoHide && type === MessageType.SUCCESS) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  });

  if (!isVisible) return null;

  const handleActionClick = (action: ActionFeedbackAction) => {
    action.onClick();
    if (
      type === MessageType.SUCCESS &&
      !actions.some((a) => a.label.toLowerCase().includes("stay"))
    ) {
      // Auto-dismiss after action unless it's a "stay" action
      setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, 1000);
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 ease-in-out",
        config.borderColor,
        config.bgColor,
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Icon
            className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)}
          />
          <div className="flex-1 min-w-0">
            <CardTitle className={cn("text-base", config.titleColor)}>
              {title}
            </CardTitle>
            {description && (
              <CardDescription className={cn("mt-1", config.descriptionColor)}>
                {description}
              </CardDescription>
            )}
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              onClick={() => {
                setIsVisible(false);
                onDismiss();
              }}
            >
              <span className="sr-only">Dismiss</span>×
            </Button>
          )}
        </div>
      </CardHeader>

      {(actions.length > 0 || details.length > 0) && (
        <CardContent className="pt-0">
          {/* Details */}
          {details.length > 0 && (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs hover:bg-transparent"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Hide" : "Show"} details
                <ArrowRight
                  className={cn(
                    "h-3 w-3 ml-1 transition-transform",
                    showDetails && "rotate-90",
                  )}
                />
              </Button>

              {showDetails && (
                <div className="mt-2 p-3 rounded-md bg-white/50 border border-current/10">
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2">
                        <span className="text-current/50">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant || "default"}
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="h-8"
                >
                  <span>{action.label}</span>
                  {action.external && <ExternalLink className="h-3 w-3 ml-1" />}
                  {action.shortcut && (
                    <Badge variant="outline" className="ml-2 text-xs h-4 px-1">
                      {action.shortcut}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Pre-configured feedback components for common scenarios
export function RecipeCreatedFeedback({
  recipeId,
  recipeTitle,
  onDismiss,
}: {
  recipeId: string;
  recipeTitle: string;
  onDismiss?: () => void;
}) {
  const router = useRouter();

  return (
    <ActionFeedback
      type={MessageType.SUCCESS}
      title="Recipe created successfully!"
      description={`"${recipeTitle}" has been saved to your collection.`}
      actions={[
        {
          label: "View Recipe",
          onClick: () => router.push(`/recipes/${recipeId}`),
          variant: ButtonVariant.DEFAULT,
          shortcut: "Enter",
        },
        {
          label: "Create Another",
          onClick: () => router.push("/recipes/new"),
          variant: ButtonVariant.OUTLINE,
          shortcut: "Ctrl+N",
        },
        {
          label: "Back to Recipes",
          onClick: () => router.push("/recipes"),
          variant: ButtonVariant.GHOST,
        },
      ]}
      onDismiss={onDismiss}
      autoHide={true}
      autoHideDelay={8000}
    />
  );
}

export function RecipeUpdatedFeedback({
  recipeId,
  onDismiss,
}: {
  recipeId: string;
  onDismiss?: () => void;
}) {
  const router = useRouter();

  return (
    <ActionFeedback
      type={MessageType.SUCCESS}
      title="Recipe updated successfully!"
      description="Your changes have been saved."
      actions={[
        {
          label: "View Recipe",
          onClick: () => router.push(`/recipes/${recipeId}`),
          variant: ButtonVariant.DEFAULT,
        },
        {
          label: "Continue Editing",
          onClick: onDismiss || (() => {}),
          variant: ButtonVariant.OUTLINE,
        },
      ]}
      onDismiss={onDismiss}
      autoHide={true}
    />
  );
}

export function RecipeErrorFeedback({
  error,
  onRetry,
  onDismiss,
}: {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <ActionFeedback
      type={MessageType.ERROR}
      title="Something went wrong"
      description={error}
      actions={[
        ...(onRetry
          ? [
              {
                label: "Try Again",
                onClick: onRetry,
                variant: ButtonVariant.DEFAULT,
                shortcut: "Ctrl+R",
              },
            ]
          : []),
        {
          label: "Get Help",
          onClick: () => window.open("/help", "_blank"),
          variant: ButtonVariant.OUTLINE,
          external: true,
        },
      ]}
      details={[
        "Check your internet connection",
        "Make sure all required fields are filled",
        "Try refreshing the page if the problem persists",
      ]}
      onDismiss={onDismiss}
    />
  );
}

export function ImageUploadFeedback({
  uploadedCount,
  totalCount,
  onManageImages,
  onUploadMore,
  onDismiss,
}: {
  uploadedCount: number;
  totalCount: number;
  onManageImages?: () => void;
  onUploadMore?: () => void;
  onDismiss?: () => void;
}) {
  const hasFailures = uploadedCount < totalCount;

  return (
    <ActionFeedback
      type={hasFailures ? MessageType.WARNING : MessageType.SUCCESS}
      title={
        hasFailures
          ? `${uploadedCount} of ${totalCount} images uploaded`
          : `${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded successfully!`
      }
      description={
        hasFailures
          ? "Some images couldn't be uploaded. You can try uploading them again."
          : "Your images are ready to use in your recipe."
      }
      actions={[
        ...(onManageImages
          ? [
              {
                label: "Manage Images",
                onClick: onManageImages,
                variant: ButtonVariant.DEFAULT,
              },
            ]
          : []),
        ...(onUploadMore
          ? [
              {
                label: hasFailures ? "Retry Failed" : "Upload More",
                onClick: onUploadMore,
                variant: ButtonVariant.OUTLINE,
              },
            ]
          : []),
      ]}
      details={
        hasFailures
          ? [
              "Common issues: file too large, unsupported format, or network error",
              "Supported formats: JPEG, PNG, WebP",
              "Maximum file size: 10MB per image",
            ]
          : undefined
      }
      onDismiss={onDismiss}
      autoHide={!hasFailures}
    />
  );
}
