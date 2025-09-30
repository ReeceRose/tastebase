"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { RecipeImage } from "@/db/schema.recipes";

interface RecipeImageLightboxProps {
  images: RecipeImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export function RecipeImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  onIndexChange,
}: RecipeImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const currentImage = images[currentIndex];

  // Reset state when opening or changing images
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setRotation(0);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Update external index when internal index changes
  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  }, [images.length]);

  const zoomIn = useCallback(
    () => setZoom((prev) => Math.min(prev + 0.25, 3)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoom((prev) => Math.max(prev - 0.25, 0.5)),
    [],
  );
  const rotate = useCallback(
    () => setRotation((prev) => (prev + 90) % 360),
    [],
  );
  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  const handleDownload = async () => {
    if (!currentImage) return;

    try {
      const response = await fetch(
        `/api/recipes/images/${currentImage.filename}`,
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = currentImage.originalName || currentImage.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          e.preventDefault();
          zoomOut();
          break;
        case "r":
        case "R":
          e.preventDefault();
          rotate();
          break;
        case "0":
          e.preventDefault();
          resetTransform();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    goToPrevious,
    goToNext,
    onClose,
    resetTransform,
    rotate,
    zoomIn,
    zoomOut,
  ]);

  // Mouse drag for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!currentImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Header with controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              {currentImage.isHero && (
                <Badge className="bg-yellow-500">Hero Image</Badge>
              )}
              <Badge variant="secondary">
                {currentIndex + 1} of {images.length}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <Button
                variant="secondary"
                size="sm"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                className="bg-black/50 hover:bg-black/70"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={zoomIn}
                disabled={zoom >= 3}
                className="bg-black/50 hover:bg-black/70"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={rotate}
                className="bg-black/50 hover:bg-black/70"
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={resetTransform}
                className="bg-black/50 hover:bg-black/70"
              >
                Reset
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="bg-black/50 hover:bg-black/70"
              >
                <Download className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="bg-black/50 hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Main image */}
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            role="img"
            aria-label="Zoomable recipe image"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            }}
          >
            <Image
              src={`/api/recipes/images/${currentImage.filename}`}
              alt={currentImage.altText || "Recipe image"}
              fill
              className="object-contain transition-transform duration-200"
              style={{
                transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              }}
              draggable={false}
              sizes="95vw"
            />
          </div>

          {/* Image info footer */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-black/70 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{currentImage.originalName}</h3>
                  {currentImage.altText && (
                    <p className="text-sm text-gray-300 mt-1">
                      {currentImage.altText}
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-300 text-right">
                  {currentImage.width && currentImage.height && (
                    <p>
                      {currentImage.width} × {currentImage.height}px
                    </p>
                  )}
                  <p>{Math.round(currentImage.fileSize / 1024)}KB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
              <div className="flex gap-2 bg-black/70 rounded-lg p-2 max-w-screen-md overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index);
                      setZoom(1);
                      setRotation(0);
                      setImagePosition({ x: 0, y: 0 });
                    }}
                    className={`relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? "border-white scale-110"
                        : "border-transparent hover:border-gray-400 hover:scale-105"
                    }`}
                  >
                    <Image
                      src={`/api/recipes/images/${image.filename}`}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                    {image.isHero && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard shortcuts help */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-0 text-xs text-gray-400 text-center">
            <p>← → Navigate • +/- Zoom • R Rotate • 0 Reset • Esc Close</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
