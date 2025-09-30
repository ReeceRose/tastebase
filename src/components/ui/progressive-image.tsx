"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ImageSize } from "@/lib/file-storage";
import { ImageLoading } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps
  extends Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    "src" | "onLoad" | "onError" | "loading" | "priority" | "sizes"
  > {
  src: string;
  filename?: string;
  sizes?: ImageSize[];
  fallbackSrc?: string;
  className?: string;
  skeletonClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

export function ProgressiveImage({
  src,
  filename,
  sizes = ["thumbnail", "small", "medium"],
  fallbackSrc,
  className,
  skeletonClassName,
  onLoad,
  onError,
  priority = false,
  alt,
  ...props
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [_loadedSizes, setLoadedSizes] = useState<Set<string>>(new Set());
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Handle image loading errors
  const handleImageError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);

    if (fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }

    onError?.();
  }, [fallbackSrc, onError]);

  // Generate image URLs for different sizes
  const getImageUrl = useCallback(
    (size: ImageSize) => {
      if (!filename) return src;
      const baseName = filename.split(".")[0];
      const extension = filename.split(".").pop();
      return `/api/recipes/images/${baseName}_${size}.${extension}`;
    },
    [filename, src],
  );

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!filename) return undefined;

    const srcSetEntries = sizes.map((size) => {
      const url = getImageUrl(size);
      const width = {
        thumbnail: "150w",
        small: "400w",
        medium: "800w",
        large: "1200w",
      }[size];
      return `${url} ${width}`;
    });

    return srcSetEntries.join(", ");
  };

  // Load images progressively
  const loadImageProgressively = useCallback(async () => {
    if (!filename || hasError) return;

    try {
      // Load smallest size first (thumbnail)
      const thumbnailUrl = getImageUrl("thumbnail");
      const thumbnailImg = new Image();

      thumbnailImg.onload = () => {
        setCurrentSrc(thumbnailUrl);
        setIsLoading(false);
        setLoadedSizes((prev) => new Set([...prev, "thumbnail"]));
      };

      thumbnailImg.onerror = () => {
        handleImageError();
      };

      thumbnailImg.src = thumbnailUrl;

      // Then load progressively larger sizes
      for (const size of sizes.slice(1)) {
        const imageUrl = getImageUrl(size);
        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = () => {
            setCurrentSrc(imageUrl);
            setLoadedSizes((prev) => new Set([...prev, size]));
            resolve(undefined);
          };

          img.onerror = reject;
          img.src = imageUrl;
        });
      }
    } catch (_error) {
      // If progressive loading fails, try original src
      if (src && src !== currentSrc) {
        const img = new Image();
        img.onload = () => {
          setCurrentSrc(src);
          setIsLoading(false);
        };
        img.onerror = handleImageError;
        img.src = src;
      } else {
        handleImageError();
      }
    }
  }, [
    filename,
    hasError,
    getImageUrl,
    handleImageError,
    src,
    currentSrc,
    sizes,
  ]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) {
      loadImageProgressively();
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadImageProgressively();
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: "50px",
      },
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, loadImageProgressively]);

  // Cleanup
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const shouldShowSkeleton = isLoading && !currentSrc && !hasError;

  if (shouldShowSkeleton) {
    return (
      <Skeleton
        className={cn("w-full h-full", skeletonClassName)}
        ref={imgRef}
      />
    );
  }

  if (hasError && !fallbackSrc) {
    return (
      <div
        className={cn(
          "w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm",
          className,
        )}
        ref={imgRef}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={currentSrc || src}
      srcSet={filename ? generateSrcSet() : undefined}
      sizes="(max-width: 400px) 150px, (max-width: 800px) 400px, 800px"
      alt={alt}
      className={cn(
        "transition-opacity duration-300",
        isLoading && "opacity-50",
        className,
      )}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading={priority ? ImageLoading.EAGER : ImageLoading.LAZY}
      {...props}
    />
  );
}

export function RecipeImage({
  filename,
  alt,
  className,
  priority = false,
  ...props
}: {
  filename: string;
  alt: string;
  className?: string;
  priority?: boolean;
} & Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "onLoad" | "onError" | "loading" | "priority" | "sizes"
>) {
  return (
    <ProgressiveImage
      src={`/api/recipes/images/${filename}`}
      filename={filename}
      alt={alt}
      className={className}
      priority={priority}
      fallbackSrc="/images/recipe-placeholder.jpg"
      {...props}
    />
  );
}
