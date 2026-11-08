"use client";

import { useEffect, useState } from "react";

export function useRecipePdf(url: string) {
  const [file, setFile] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setFailed(false);

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("PDF request failed");
        return response.blob();
      })
      .then((blob) => {
        setFile(blob);
        setIsLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFailed(true);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [url]);

  return { file, isLoading, failed };
}
