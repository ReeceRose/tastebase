"use client";

import { useEffect, useRef, useState } from "react";
import { RecipeExportPreviewSkeleton } from "@/components/skeletons/recipe-export-preview-skeleton";
import { Button } from "@/components/ui/button";
import { useRecipePdf } from "@/hooks/use-recipe-pdf";
import { ButtonVariant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { drawPdfPages } from "@/lib/utils/pdf-preview";

interface RecipeExportPreviewProps {
  url: string;
  onRetry: () => void;
}

export function RecipeExportPreview({
  url,
  onRetry,
}: RecipeExportPreviewProps) {
  const { file, isLoading, failed } = useRecipePdf(url);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [drawnFile, setDrawnFile] = useState<Blob | null>(null);
  const [drawFailed, setDrawFailed] = useState(false);

  useEffect(() => {
    const container = pagesRef.current;
    if (!file || !container) return;
    let cancelled = false;
    setDrawFailed(false);

    drawPdfPages(file, container.clientWidth, () => cancelled)
      .then((canvases) => {
        if (cancelled) return;
        container.replaceChildren(...canvases);
        setDrawnFile(file);
      })
      .catch(() => {
        if (!cancelled) setDrawFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  if (failed || drawFailed) {
    return (
      <div className="space-y-3 rounded-control bg-card p-6 text-center">
        <p className="text-body">That preview didn't load.</p>
        <Button variant={ButtonVariant.OUTLINE} onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  const isBusy = isLoading || file !== drawnFile;

  return (
    <div aria-busy={isBusy}>
      {drawnFile === null && <RecipeExportPreviewSkeleton />}
      <div
        ref={pagesRef}
        className={cn(
          "space-y-3 transition-opacity duration-150",
          isBusy && "opacity-50",
        )}
      />
    </div>
  );
}
