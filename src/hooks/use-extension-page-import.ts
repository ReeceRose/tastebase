"use client";

import { useEffect, useRef } from "react";
import type {
  CapturedImage,
  CapturedPage,
  ExtensionPhotoProgress,
  PhotoSuggestion,
} from "@/lib/types/import-types";

// The Tastebase browser extension opens /recipes/new?from=extension and
// injects the page the user was viewing, sending photo progress while it
// gathers photos. Either side may load first, so the page announces itself
// and the extension re-sends when it hears that.
// Keep these names in sync with extensions/chrome/background.js.
const PAGE_EVENT = "tastebase:extension-page";
const READY_EVENT = "tastebase:extension-ready";
const PROGRESS_EVENT = "tastebase:extension-progress";
const WAIT_MS = 15000;

function isCapturedImage(value: object | null): value is CapturedImage {
  if (!value) return false;
  const candidate = value as Record<string, string>;
  return (
    typeof candidate.data === "string" && typeof candidate.mimeType === "string"
  );
}

function toPhotoSuggestions(value: object | null): PhotoSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: Record<string, object | string | null>) => {
    if (!item || typeof item.url !== "string") return [];
    const image = item.image;
    return [
      {
        url: item.url,
        image:
          typeof image === "object" && isCapturedImage(image) ? image : null,
      },
    ];
  });
}

function toCapturedPage(detail: object | null): CapturedPage | null {
  if (!detail) return null;
  const candidate = detail as Record<string, string | object | null>;
  if (typeof candidate.url !== "string" || typeof candidate.html !== "string") {
    return null;
  }
  const image = candidate.image;
  return {
    url: candidate.url,
    html: candidate.html,
    image: typeof image === "object" && isCapturedImage(image) ? image : null,
    photos: toPhotoSuggestions(
      typeof candidate.photos === "object" ? candidate.photos : null,
    ),
  };
}

function toPhotoProgress(detail: object | null): ExtensionPhotoProgress | null {
  if (!detail) return null;
  const candidate = detail as Record<string, number>;
  if (
    typeof candidate.photosDone !== "number" ||
    typeof candidate.photosTotal !== "number"
  ) {
    return null;
  }
  return {
    photosDone: candidate.photosDone,
    photosTotal: candidate.photosTotal,
  };
}

interface ExtensionPageImportOptions {
  enabled: boolean;
  onPage: (page: CapturedPage) => void;
  onProgress: (progress: ExtensionPhotoProgress) => void;
  onTimeout: () => void;
}

export function useExtensionPageImport({
  enabled,
  onPage,
  onProgress,
  onTimeout,
}: ExtensionPageImportOptions) {
  const handled = useRef(false);
  const callbacks = useRef({ onPage, onProgress, onTimeout });

  useEffect(() => {
    callbacks.current = { onPage, onProgress, onTimeout };
  });

  useEffect(() => {
    if (!enabled) return;

    let timer = 0;
    const waitForExtension = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!handled.current) callbacks.current.onTimeout();
      }, WAIT_MS);
    };

    const listener = (event: Event) => {
      const page = toCapturedPage((event as CustomEvent<object | null>).detail);
      if (handled.current || !page) return;
      handled.current = true;
      window.clearTimeout(timer);
      window.history.replaceState(null, "", window.location.pathname);
      callbacks.current.onPage(page);
    };
    const progressListener = (event: Event) => {
      const progress = toPhotoProgress(
        (event as CustomEvent<object | null>).detail,
      );
      if (handled.current || !progress) return;
      waitForExtension();
      callbacks.current.onProgress(progress);
    };

    waitForExtension();
    window.addEventListener(PAGE_EVENT, listener);
    window.addEventListener(PROGRESS_EVENT, progressListener);
    window.dispatchEvent(new Event(READY_EVENT));
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(PAGE_EVENT, listener);
      window.removeEventListener(PROGRESS_EVENT, progressListener);
    };
  }, [enabled]);
}
