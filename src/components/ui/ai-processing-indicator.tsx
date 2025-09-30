"use client";

import {
  Bot,
  CheckCircle,
  Globe,
  Loader2,
  Search,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface ProcessingStage {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  progress: number;
  duration?: number; // Expected duration in ms
}

export interface AIProcessingStatus {
  stage: string;
  progress: number;
  message: string;
  isComplete: boolean;
  isError: boolean;
  startTime: number;
}

interface AIProcessingIndicatorProps {
  status: AIProcessingStatus;
  onCancel?: () => void;
  showEstimate?: boolean;
  compact?: boolean;
}

const DEFAULT_STAGES: Record<string, ProcessingStage> = {
  fetching: {
    id: "fetching",
    label: "Fetching Recipe",
    description: "Downloading recipe from URL...",
    icon: Globe,
    progress: 0,
    duration: 2000,
  },
  extracting: {
    id: "extracting",
    label: "Extracting Data",
    description: "Finding recipe information...",
    icon: Search,
    progress: 30,
    duration: 1000,
  },
  analyzing: {
    id: "analyzing",
    label: "AI Analysis",
    description: "Processing with AI...",
    icon: Bot,
    progress: 30,
    duration: 5500, // Match actual AI processing time
  },
  structuring: {
    id: "structuring",
    label: "Structuring",
    description: "Organizing recipe data...",
    icon: Sparkles,
    progress: 90,
    duration: 1000,
  },
  complete: {
    id: "complete",
    label: "Complete",
    description: "Recipe parsed successfully!",
    icon: CheckCircle,
    progress: 100,
    duration: 0,
  },
  error: {
    id: "error",
    label: "Error",
    description: "Failed to process recipe",
    icon: XCircle,
    progress: 0,
    duration: 0,
  },
};

export function AIProcessingIndicator({
  status,
  onCancel,
  showEstimate = true,
  compact = false,
}: AIProcessingIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState<number | null>(
    null,
  );

  const currentStage = DEFAULT_STAGES[status.stage] || DEFAULT_STAGES.analyzing;
  const IconComponent = currentStage.icon;

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - status.startTime;
      setElapsedTime(elapsed);

      // Calculate estimated remaining time
      if (
        showEstimate &&
        currentStage.duration &&
        !status.isComplete &&
        !status.isError
      ) {
        const stageProgress = Math.max(
          0,
          status.progress - currentStage.progress,
        );
        const stageMaxProgress =
          currentStage.progress === 0
            ? 30
            : currentStage.progress === 30
              ? 30
              : currentStage.progress === 60
                ? 30
                : 10;

        if (stageProgress > 0) {
          const stageCompletion = stageProgress / stageMaxProgress;
          const remaining = currentStage.duration * (1 - stageCompletion);
          setEstimatedRemaining(Math.max(1000, remaining));
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [
    status.startTime,
    status.progress,
    status.isComplete,
    status.isError,
    currentStage,
    showEstimate,
  ]);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          {status.isError ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : status.isComplete ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          )}
          <span className="text-sm font-medium">{currentStage.label}</span>
        </div>

        {!status.isComplete && !status.isError && (
          <Progress value={status.progress} className="flex-1 max-w-32" />
        )}

        {onCancel && !status.isComplete && !status.isError && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  status.isError
                    ? "bg-red-100 text-red-600"
                    : status.isComplete
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                }`}
              >
                {status.isError ? (
                  <XCircle className="h-5 w-5" />
                ) : status.isComplete ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <IconComponent className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{currentStage.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {status.message || currentStage.description}
                </p>
              </div>
            </div>

            {onCancel && !status.isComplete && !status.isError && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {!status.isComplete && !status.isError && (
            <div className="space-y-2">
              <Progress value={status.progress} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(status.progress)}% complete</span>
                {showEstimate && estimatedRemaining && (
                  <span>
                    ~{Math.ceil(estimatedRemaining / 1000)}s remaining
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stage Indicators */}
          <div className="flex items-center gap-2">
            {Object.values(DEFAULT_STAGES)
              .filter((stage) => !["complete", "error"].includes(stage.id))
              .map((stage) => {
                const isActive = stage.id === status.stage;
                const isCompleted = status.progress > stage.progress;

                return (
                  <Badge
                    key={stage.id}
                    variant={
                      isActive
                        ? "default"
                        : isCompleted
                          ? "secondary"
                          : "outline"
                    }
                    className={`text-xs ${
                      isActive
                        ? "bg-blue-500"
                        : isCompleted
                          ? "bg-green-500"
                          : ""
                    }`}
                  >
                    {stage.label}
                  </Badge>
                );
              })}
          </div>

          {/* Timing Information */}
          {showEstimate && (
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>Elapsed: {Math.round(elapsedTime / 1000)}s</span>
              {status.isComplete && (
                <span>Total time: {Math.round(elapsedTime / 1000)}s</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for managing processing status
export function useAIProcessingStatus() {
  const [status, setStatus] = useState<AIProcessingStatus>({
    stage: "fetching",
    progress: 0,
    message: "",
    isComplete: false,
    isError: false,
    startTime: Date.now(),
  });

  const startProcessing = () => {
    setStatus({
      stage: "fetching",
      progress: 0,
      message: "Starting AI processing...",
      isComplete: false,
      isError: false,
      startTime: Date.now(),
    });
  };

  const updateStatus = (updates: Partial<AIProcessingStatus>) => {
    setStatus((prev) => ({ ...prev, ...updates }));
  };

  const completeProcessing = (message?: string) => {
    setStatus((prev) => ({
      ...prev,
      stage: "complete",
      progress: 100,
      message: message || "Processing completed successfully!",
      isComplete: true,
      isError: false,
    }));
  };

  const errorProcessing = (message: string) => {
    setStatus((prev) => ({
      ...prev,
      stage: "error",
      progress: 0,
      message,
      isComplete: false,
      isError: true,
    }));
  };

  return {
    status,
    startProcessing,
    updateStatus,
    completeProcessing,
    errorProcessing,
  };
}
