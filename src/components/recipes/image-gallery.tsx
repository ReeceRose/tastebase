import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AIGeneratedBadge } from "@/components/ui/recipe-image-generator";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { NavigationDirection } from "@/lib/types";
import type { RecipeImage } from "@/lib/types/recipe-types";

interface ImageGalleryProps {
  images: RecipeImage[];
  className?: string;
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isAIGenerated = (image: RecipeImage): boolean => {
    if (!image.metadata || typeof image.metadata !== "object") {
      return false;
    }
    const metadata = image.metadata as Record<string, unknown>;
    return metadata.source === "ai-generated";
  };

  if (images.length === 0) {
    return null;
  }

  const heroImage = images.find((img) => img.isHero) || images[0];
  const galleryImages = images.filter((img) => !img.isHero).slice(0, 4);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (direction: NavigationDirection) => {
    if (selectedImageIndex === null) return;

    const newIndex =
      direction === NavigationDirection.NEXT
        ? (selectedImageIndex + 1) % images.length
        : (selectedImageIndex - 1 + images.length) % images.length;

    setSelectedImageIndex(newIndex);
  };

  return (
    <>
      <div className={`space-y-4 ${className || ""}`}>
        {heroImage && (
          <Card
            className="overflow-hidden cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <div className="aspect-[4/3] relative max-h-80">
              <Image
                src={`/api/recipes/images/${heroImage.filename}`}
                alt={heroImage.altText || "Recipe image"}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              {isAIGenerated(heroImage) && (
                <div className="absolute top-2 left-2">
                  <AIGeneratedBadge className="text-xs" />
                </div>
              )}
            </div>
          </Card>
        )}

        {galleryImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {galleryImages.map((image, _index) => {
              // Find the correct index in the full images array
              const fullArrayIndex = images.findIndex(
                (img) => img.id === image.id,
              );
              return (
                <Card
                  key={image.id}
                  className="overflow-hidden cursor-pointer group aspect-square"
                  onClick={() => openLightbox(fullArrayIndex)}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={`/api/recipes/images/${image.filename}`}
                      alt={image.altText || "Recipe image"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 768px) 50vw, 200px"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    {isAIGenerated(image) && (
                      <div className="absolute top-1 left-1">
                        <AIGeneratedBadge className="text-xs scale-75" />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 bg-black/95">
          <VisuallyHidden>
            <DialogTitle>Recipe Image Lightbox</DialogTitle>
          </VisuallyHidden>
          <div className="relative h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => navigateLightbox(NavigationDirection.PREV)}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => navigateLightbox(NavigationDirection.NEXT)}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {selectedImageIndex !== null && images[selectedImageIndex] && (
              <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
                <Image
                  src={`/api/recipes/images/${images[selectedImageIndex].filename}`}
                  alt={images[selectedImageIndex].altText || "Recipe image"}
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />

                {isAIGenerated(images[selectedImageIndex]) && (
                  <div className="absolute top-4 left-4">
                    <AIGeneratedBadge />
                  </div>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
