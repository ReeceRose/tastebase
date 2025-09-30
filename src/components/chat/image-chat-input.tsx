"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ImageChatInputProps {
  onImageSelect: (file: File, description?: string) => void;
  disabled?: boolean;
  maxSize?: number; // in MB
}

export function ImageChatInput({
  onImageSelect,
  disabled = false,
  maxSize = 10,
}: ImageChatInputProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      return;
    }

    // Call onImageSelect when file is processed (no longer auto-submits)
    setIsProcessing(true);
    try {
      await onImageSelect(file);
    } catch (error) {
      console.error("Failed to process image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* Upload area */}
      {/* biome-ignore lint/a11y/useSemanticElements: div with drag-and-drop functionality requires non-button element */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleUploadClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleUploadClick();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Upload image"
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          "hover:border-primary hover:bg-muted/50",
          isDragOver && "border-primary bg-muted/50",
          isProcessing && "border-green-500 bg-green-50 dark:bg-green-950",
          (disabled || isProcessing) && "cursor-not-allowed opacity-50",
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-green-600 animate-spin" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Processing image...
            </p>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag & drop an image
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {maxSize}MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
