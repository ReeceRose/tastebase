import type { ImageProcessingMethod } from "@/lib/types";

export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file size (max 20MB for images/PDFs)
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File is too large (max 20MB)",
    };
  }

  // Check file type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error:
        "Invalid file type. Please use JPEG, PNG, WebP, HEIC, or PDF files.",
    };
  }

  return { isValid: true };
}

export function getProcessingMethodInfo(method: ImageProcessingMethod): {
  name: string;
  description: string;
  privacy: "local" | "cloud";
  accuracy: "basic" | "good" | "excellent";
  cost: "free" | string;
} {
  switch (method) {
    case "ocr":
      return {
        name: "Local Text Extraction",
        description:
          "Process images and PDFs locally using OCR and text extraction",
        privacy: "local",
        accuracy: "basic",
        cost: "free",
      };
    case "ai-vision":
      return {
        name: "AI Vision",
        description: "Use cloud AI services for advanced image understanding",
        privacy: "cloud",
        accuracy: "excellent",
        cost: "~$0.01-0.05 per image",
      };
    default:
      return {
        name: "Automatic",
        description:
          "Automatically choose the best method for images and PDFs based on your settings",
        privacy: "local",
        accuracy: "good",
        cost: "free",
      };
  }
}
