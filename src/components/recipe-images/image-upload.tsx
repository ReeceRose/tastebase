"use client";

import {
  CheckCircle2,
  FileImage,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { uploadRecipeImage } from "@/lib/server-actions/recipe-image-actions";

interface UploadedFile {
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl: string;
  smallUrl: string;
  fileSize: number;
  width?: number;
  height?: number;
}

interface ImageUploadProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
}

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  className,
}: ImageUploadProps) {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [_dragCounter, setDragCounter] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      if (uploads.length >= maxFiles) {
        const errorMsg = `Maximum ${maxFiles} images allowed`;
        setError(errorMsg);
        onUploadError?.(errorMsg);
        return;
      }

      setUploading(true);
      setError(null);
      setSuccessMessage(null);
      setUploadProgress(0);

      try {
        const fileArray = Array.from(files);

        for (
          let i = 0;
          i < fileArray.length && uploads.length + i < maxFiles;
          i++
        ) {
          const file = fileArray[i];

          const formData = new FormData();
          formData.append("file", file);

          const result = await uploadRecipeImage(formData);

          if (!result.success) {
            throw new Error(result.error || "Upload failed");
          }

          if (!result.file) {
            throw new Error("Upload succeeded but no file data returned");
          }

          const uploadedFile: UploadedFile = result.file;

          setUploads((prev) => [...prev, uploadedFile]);
          onUploadComplete?.(uploadedFile);

          setUploadProgress(((i + 1) / fileArray.length) * 100);
        }

        const uploadedCount = Math.min(
          fileArray.length,
          maxFiles - uploads.length,
        );
        setSuccessMessage(
          `${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded successfully!`,
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setError(errorMsg);
        onUploadError?.(errorMsg);
        setTimeout(() => setError(null), 5000);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [uploads.length, maxFiles, onUploadComplete, onUploadError],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasImages = Array.from(e.dataTransfer.items).some((item) =>
        item.type.startsWith("image/"),
      );
      if (hasImages) {
        setDragActive(true);
      }
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter <= 0) {
        setDragActive(false);
        return 0;
      }
      return newCounter;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setDragCounter(0);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const imageFiles = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith("image/"),
        );

        if (imageFiles.length === 0) {
          setError("Please drop only image files (JPEG, PNG, WebP)");
          setTimeout(() => setError(null), 3000);
          return;
        }

        handleUpload(imageFiles);
      }
    },
    [handleUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleUpload(e.target.files);
        e.target.value = ""; // Reset input
      }
    },
    [handleUpload],
  );

  const removeUpload = useCallback((filename: string) => {
    setUploads((prev) => prev.filter((upload) => upload.filename !== filename));
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <Card
        className={`relative border-2 border-dashed transition-all duration-200 ${
          dragActive
            ? "border-primary bg-primary/10 shadow-lg scale-105"
            : uploading
              ? "border-blue-300 bg-blue-50/50"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
        } ${dragActive ? "animate-pulse" : ""}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 mb-4 transition-all duration-200">
            {uploading ? (
              <div className="relative">
                <Loader2 className="w-full h-full animate-spin text-blue-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-full opacity-20 animate-ping" />
                </div>
              </div>
            ) : dragActive ? (
              <FileImage className="w-full h-full text-primary animate-bounce" />
            ) : (
              <Upload className="w-full h-full text-muted-foreground" />
            )}
          </div>

          <div className="space-y-2">
            <p
              className={`text-sm font-medium transition-colors ${
                dragActive ? "text-primary" : uploading ? "text-blue-600" : ""
              }`}
            >
              {uploading
                ? "Uploading images..."
                : dragActive
                  ? "Drop your images here!"
                  : "Drop recipe images here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP up to 10MB each. Maximum {maxFiles} images.
            </p>
          </div>

          {!uploading && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={openFileDialog}
            >
              Browse Files
            </Button>
          )}

          {uploading && (
            <div className="mt-4 space-y-2">
              <Progress
                value={uploadProgress}
                className="w-full max-w-xs mx-auto"
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(uploadProgress)}% complete
              </p>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mt-4 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {uploads.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium">
            Uploaded Images ({uploads.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploads.map((upload) => (
              <Card key={upload.filename} className="overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={upload.thumbnailUrl}
                    alt={upload.originalName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => removeUpload(upload.filename)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-3">
                  <p
                    className="text-xs font-medium truncate"
                    title={upload.originalName}
                  >
                    {upload.originalName}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <ImageIcon className="h-3 w-3" />
                    <span>{formatFileSize(upload.fileSize)}</span>
                    {upload.width && upload.height && (
                      <span>
                        {upload.width}×{upload.height}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
