"use client";

import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Info,
  Shield,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useId, useState } from "react";
import {
  AIProcessingIndicator,
  useAIProcessingStatus,
} from "@/components/ui/ai-processing-indicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { processRecipeImageAction } from "@/lib/server-actions/ai-image-processing-actions";
import { ImageProcessingMethod, type ImageProcessingResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  getProcessingMethodInfo,
  validateImageFile,
} from "@/lib/utils/image-processing-utils";

interface RecipeImageUploadProps {
  onImageProcessed: (result: ImageProcessingResult) => void;
  processingMethod?: ImageProcessingMethod;
  disabled?: boolean;
  className?: string;
}

interface ImagePreviewFile {
  file: File;
  preview: string;
  id: string;
}

export function RecipeImageUpload({
  onImageProcessed,
  processingMethod = ImageProcessingMethod.AUTO,
  disabled = false,
  className,
}: RecipeImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<ImagePreviewFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processingStatus = useAIProcessingStatus();
  const fileInputId = useId();

  const validateAndAddFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: ImagePreviewFile[] = [];
    let hasErrors = false;

    for (const file of fileArray) {
      const validation = validateImageFile(file);

      if (!validation.isValid) {
        setError(validation.error || "Invalid file");
        hasErrors = true;
        continue;
      }

      const preview = URL.createObjectURL(file);
      validFiles.push({
        file,
        preview,
        id: crypto.randomUUID(),
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      if (hasErrors) {
        // Clear error after showing valid files
        setTimeout(() => setError(null), 3000);
      } else {
        setError(null);
      }
    }
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setDragActive(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        validateAndAddFiles(droppedFiles);
      }
    },
    [disabled, validateAndAddFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        validateAndAddFiles(e.target.files);
        // Clear the input value so the same file can be selected again
        e.target.value = "";
      }
    },
    [validateAndAddFiles],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      // Clean up preview URL
      const removed = prev.find((f) => f.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  }, []);

  const processImages = useCallback(async () => {
    if (files.length === 0 || processing) return;

    setProcessing(true);
    setError(null);
    processingStatus.startProcessing();

    try {
      // For now, process the first image (can extend to batch processing later)
      const imageFile = files[0];

      // Update processing status based on method
      const stages =
        processingMethod === "ai-vision"
          ? [
              {
                stage: "uploading",
                progress: 10,
                message: "Preparing image for AI analysis...",
              },
              {
                stage: "ai-analysis",
                progress: 50,
                message: "AI analyzing recipe image...",
              },
              {
                stage: "structuring",
                progress: 90,
                message: "Structuring recipe data...",
              },
            ]
          : [
              {
                stage: "preprocessing",
                progress: 20,
                message: "Preprocessing image...",
              },
              {
                stage: "ocr-extraction",
                progress: 60,
                message: "Extracting text from image...",
              },
              {
                stage: "ai-parsing",
                progress: 90,
                message: "Parsing recipe data...",
              },
            ];

      // Simulate stage progression
      for (const stageInfo of stages) {
        processingStatus.updateStatus(stageInfo);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Process with the server action
      const actionResult = await processRecipeImageAction(
        imageFile.file,
        processingMethod,
      );

      if (!actionResult.success || !actionResult.data) {
        throw new Error(actionResult.error || "Failed to process image");
      }

      const result = actionResult.data;

      if (
        result.title ||
        result.ingredients?.length ||
        result.instructions?.length
      ) {
        processingStatus.completeProcessing("Recipe extracted successfully!");
        onImageProcessed(result);

        // Clear files after successful processing
        files.forEach((f) => {
          URL.revokeObjectURL(f.preview);
        });
        setFiles([]);
      } else {
        processingStatus.errorProcessing(
          "No recipe found in image. Please try a different image or manual entry.",
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process image. Please try again.";

      processingStatus.errorProcessing(errorMessage);
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  }, [files, processing, processingMethod, processingStatus, onImageProcessed]);

  const methodInfo = getProcessingMethodInfo(processingMethod);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Processing Method Indicator */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          {processingMethod === "ocr" || processingMethod === "auto" ? (
            <Shield className="h-4 w-4 text-green-600" />
          ) : (
            <Sparkles className="h-4 w-4 text-blue-600" />
          )}
          <span className="text-sm font-medium">{methodInfo.name}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {methodInfo.cost === "free" ? "Private & Free" : methodInfo.cost}
        </div>
      </div>

      {/* Upload Area */}
      <div className="space-y-2">
        <Label htmlFor={fileInputId}>Recipe Image or PDF</Label>
        <button
          type="button"
          className={cn(
            "w-full border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer bg-transparent",
            dragActive
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() =>
            !disabled && document.getElementById(fileInputId)?.click()
          }
          disabled={disabled}
        >
          <input
            id={fileInputId}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,application/pdf"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>

            <div className="space-y-2 text-center">
              <p className="text-base font-medium">
                Drop recipe images or PDFs here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Supports JPEG, PNG, WebP, HEIC, PDF • Max 20MB
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-3">
          <Label>Selected Files ({files.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {files.map((fileItem) => (
              <div key={fileItem.id} className="relative group">
                {fileItem.file.type === "application/pdf" ? (
                  // PDF Preview
                  <div className="w-full h-20 rounded-lg border bg-muted flex flex-col items-center justify-center p-2">
                    <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground truncate w-full text-center">
                      {fileItem.file.name}
                    </span>
                  </div>
                ) : (
                  // Image Preview
                  <Image
                    src={fileItem.preview}
                    alt="Recipe preview"
                    width={80}
                    height={80}
                    className="w-full h-20 object-cover rounded-lg border bg-muted"
                    unoptimized
                  />
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(fileItem.id);
                  }}
                  disabled={processing}
                >
                  <X className="h-3 w-3" />
                </Button>

                <div className="absolute bottom-1 left-1">
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {Math.round(fileItem.file.size / 1024)}KB
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Processing Status */}
      {processing && (
        <AIProcessingIndicator
          status={processingStatus.status}
          onCancel={() => {
            setProcessing(false);
            processingStatus.errorProcessing("Processing cancelled by user");
          }}
          showEstimate={true}
          compact={false}
        />
      )}

      {/* Process Button */}
      <div className="flex items-center justify-between">
        <Button
          onClick={processImages}
          disabled={files.length === 0 || processing || disabled}
          className="w-full"
        >
          {processing ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Processing Image...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Extract Recipe from Image{files.length > 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>

      {/* Method Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="space-y-1">
          <div>
            <strong>{methodInfo.name}:</strong> {methodInfo.description}
          </div>
          <div className="text-xs text-muted-foreground">
            Privacy: {methodInfo.privacy} • Cost: {methodInfo.cost} • Accuracy:{" "}
            {methodInfo.accuracy}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
