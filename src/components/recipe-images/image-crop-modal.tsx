"use client";

import {
  Camera,
  Crop,
  Maximize,
  Monitor,
  RotateCw,
  Smartphone,
  Square,
  ZoomIn,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  originalFilename: string;
  onCropComplete: (croppedImageData: {
    blob: Blob;
    filename: string;
    width: number;
    height: number;
  }) => void;
}

const ASPECT_RATIOS = [
  { name: "Free", value: null, icon: <Maximize className="h-3 w-3" /> },
  { name: "Square", value: 1, icon: <Square className="h-3 w-3" /> },
  { name: "4:3", value: 4 / 3, icon: <Camera className="h-3 w-3" /> },
  { name: "16:9", value: 16 / 9, icon: <Monitor className="h-3 w-3" /> },
  { name: "3:4", value: 3 / 4, icon: <Smartphone className="h-3 w-3" /> },
];

export function ImageCropModal({
  isOpen,
  onOpenChange,
  imageUrl,
  originalFilename,
  onCropComplete,
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState([1]);
  const [rotation, setRotation] = useState(0);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(
    null,
  );
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [_isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [_imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Calculate display size
    const displayWidth = Math.min(600, img.naturalWidth * scale[0]);
    const displayHeight = (img.naturalHeight / img.naturalWidth) * displayWidth;

    // Set canvas size
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Apply transformations
    ctx.translate(displayWidth / 2, displayHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale[0], scale[0]);
    ctx.translate(-img.naturalWidth / 2, -img.naturalHeight / 2);

    // Draw image
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

    // Restore context
    ctx.restore();

    // Draw crop overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw crop border
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // Draw resize handles
    const handleSize = 8;
    ctx.fillStyle = "#3b82f6";

    // Corner handles
    ctx.fillRect(
      cropArea.x - handleSize / 2,
      cropArea.y - handleSize / 2,
      handleSize,
      handleSize,
    );
    ctx.fillRect(
      cropArea.x + cropArea.width - handleSize / 2,
      cropArea.y - handleSize / 2,
      handleSize,
      handleSize,
    );
    ctx.fillRect(
      cropArea.x - handleSize / 2,
      cropArea.y + cropArea.height - handleSize / 2,
      handleSize,
      handleSize,
    );
    ctx.fillRect(
      cropArea.x + cropArea.width - handleSize / 2,
      cropArea.y + cropArea.height - handleSize / 2,
      handleSize,
      handleSize,
    );
  }, [imageLoaded, scale, rotation, cropArea]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleImageLoad = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });

    // Initialize crop area to center of image
    const size = Math.min(img.naturalWidth, img.naturalHeight) * 0.6;
    setCropArea({
      x: (600 - size) / 2,
      y: ((img.naturalHeight / img.naturalWidth) * 600 - size) / 2,
      width: size,
      height: size,
    });

    setImageLoaded(true);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on crop area
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDragging) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newX = Math.max(
      0,
      Math.min(canvas.width - cropArea.width, x - dragStart.x),
    );
    const newY = Math.max(
      0,
      Math.min(canvas.height - cropArea.height, y - dragStart.y),
    );

    setCropArea((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleAspectRatioChange = (aspectRatio: number | null) => {
    setSelectedAspectRatio(aspectRatio);

    if (aspectRatio) {
      const currentArea = cropArea.width * cropArea.height;
      const newHeight = Math.sqrt(currentArea / aspectRatio);
      const newWidth = newHeight * aspectRatio;

      setCropArea((prev) => ({
        ...prev,
        width: Math.min(newWidth, canvasRef.current?.width || 400),
        height: Math.min(newHeight, canvasRef.current?.height || 400),
      }));
    }
  };

  const applyCrop = async () => {
    if (!canvasRef.current || !imageRef.current) return;

    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not get canvas context");

      // Calculate actual crop dimensions relative to original image
      const scaleX = img.naturalWidth / canvasRef.current.width;
      const scaleY = img.naturalHeight / canvasRef.current.height;

      const actualCrop = {
        x: cropArea.x * scaleX,
        y: cropArea.y * scaleY,
        width: cropArea.width * scaleX,
        height: cropArea.height * scaleY,
      };

      // Set output canvas size
      canvas.width = actualCrop.width;
      canvas.height = actualCrop.height;

      // Apply rotation if needed
      if (rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-actualCrop.width / 2, -actualCrop.height / 2);
      }

      // Draw cropped image
      ctx.drawImage(
        img,
        actualCrop.x,
        actualCrop.y,
        actualCrop.width,
        actualCrop.height,
        0,
        0,
        actualCrop.width,
        actualCrop.height,
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error("Failed to process image");
            return;
          }

          const croppedFilename = originalFilename.replace(
            /(\.[^.]+)$/,
            `_cropped_${Date.now()}$1`,
          );

          onCropComplete({
            blob,
            filename: croppedFilename,
            width: Math.round(actualCrop.width),
            height: Math.round(actualCrop.height),
          });

          onOpenChange(false);
          toast.success("Image cropped successfully!");
        },
        "image/jpeg",
        0.9,
      );
    } catch (error) {
      toast.error("Failed to crop image");
      console.error("Crop error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Image
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area, aspect ratio, and zoom to get the perfect
            image for your recipe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Image Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4">
                <div className="relative overflow-hidden rounded-lg bg-muted">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />

                  {/* Hidden image for loading */}
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    onLoad={handleImageLoad}
                    className="hidden"
                    alt="Crop source"
                  />

                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-sm text-muted-foreground">
                        Loading image...
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Aspect Ratio */}
            <div>
              <Label className="text-sm font-medium">Aspect Ratio</Label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <Button
                    key={ratio.name}
                    variant={
                      selectedAspectRatio === ratio.value
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleAspectRatioChange(ratio.value)}
                    className="justify-start"
                  >
                    <div className="flex items-center gap-2">
                      {ratio.icon}
                      <span>{ratio.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Zoom */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom: {scale[0].toFixed(1)}x
              </Label>
              <div className="mt-2">
                <Slider
                  value={scale}
                  onValueChange={setScale}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Rotation */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Rotation: {rotation}°
              </Label>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((prev) => prev - 90)}
                >
                  -90°
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(0)}
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((prev) => prev + 90)}
                >
                  +90°
                </Button>
              </div>
            </div>

            {/* Crop Info */}
            {imageLoaded && (
              <div>
                <Label className="text-sm font-medium">Crop Area</Label>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div>
                    Size: {Math.round(cropArea.width)} ×{" "}
                    {Math.round(cropArea.height)}
                  </div>
                  <div>
                    Position: {Math.round(cropArea.x)}, {Math.round(cropArea.y)}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {Math.round((cropArea.width * cropArea.height) / 1000)}K
                    pixels
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={applyCrop} disabled={isProcessing || !imageLoaded}>
            {isProcessing ? "Processing..." : "Apply Crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
