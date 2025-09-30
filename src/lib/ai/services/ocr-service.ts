import sharp from "sharp";
import { createScheduler, createWorker, OEM, PSM } from "tesseract.js";
import { createOperationLogger, logError } from "@/lib/logging/logger";

const logger = createOperationLogger("ocr-service");

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
  imageInfo?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export interface OCROptions {
  language?: string;
  psm?: PSM;
  oem?: OEM;
  preprocess?: boolean;
  enhanceContrast?: boolean;
  removeNoise?: boolean;
}

// Module-level state
let scheduler: ReturnType<typeof createScheduler> | null = null;
let isInitialized = false;

export async function initialize(): Promise<void> {
  if (isInitialized) return;

  try {
    logger.info({}, "Initializing OCR service");

    // Create a scheduler with 2 workers for better performance
    scheduler = createScheduler();

    const numWorkers = 2;
    const workers = [];

    for (let i = 0; i < numWorkers; i++) {
      const worker = await createWorker("eng", OEM.LSTM_ONLY, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            logger.debug({ progress: m.progress }, "OCR recognition progress");
          }
        },
      });

      // Configure worker for better recipe text recognition
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?-'\"()[]{}/ ",
      });

      scheduler.addWorker(worker);
      workers.push(worker);
    }

    isInitialized = true;
    logger.info(
      { workerCount: numWorkers },
      "OCR service initialized successfully",
    );
  } catch (error) {
    logError(logger, "Failed to initialize OCR service", error as Error);
    throw error;
  }
}

export async function extractTextFromImage(
  imageBuffer: Buffer,
  options: OCROptions = {},
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    if (!isInitialized) {
      await initialize();
    }

    logger.info(
      {
        imageSize: imageBuffer.length,
        options,
      },
      "Starting OCR text extraction",
    );

    // Get image metadata
    const imageMetadata = await sharp(imageBuffer).metadata();
    const imageInfo = {
      width: imageMetadata.width || 0,
      height: imageMetadata.height || 0,
      format: imageMetadata.format || "unknown",
      size: imageBuffer.length,
    };

    // Preprocess image for better OCR accuracy
    const processedBuffer =
      options.preprocess !== false
        ? await preprocessImage(imageBuffer, options)
        : imageBuffer;

    // Extract text using Tesseract
    if (!scheduler) {
      throw new Error("OCR scheduler not initialized");
    }

    const { data } = await scheduler.addJob("recognize", processedBuffer);

    const processingTime = Date.now() - startTime;

    // Clean up the extracted text
    const cleanedText = cleanOCRText(data.text);

    const result: OCRResult = {
      text: cleanedText,
      confidence: data.confidence / 100, // Convert to 0-1 scale
      processingTime,
      imageInfo,
    };

    logger.info(
      {
        textLength: cleanedText.length,
        confidence: result.confidence,
        processingTime,
        imageInfo,
      },
      "OCR text extraction completed",
    );

    return result;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(logger, "OCR text extraction failed", error as Error, {
      processingTime,
      imageSize: imageBuffer.length,
    });

    return {
      text: "",
      confidence: 0,
      processingTime,
      imageInfo: {
        width: 0,
        height: 0,
        format: "unknown",
        size: imageBuffer.length,
      },
    };
  }
}

export async function extractTextFromImageUrl(
  url: string,
  options: OCROptions = {},
): Promise<OCRResult> {
  try {
    logger.info({ url }, "Fetching image from URL for OCR");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await extractTextFromImage(buffer, options);
  } catch (error) {
    logError(
      logger,
      "Failed to fetch and process image from URL",
      error as Error,
      { url },
    );
    throw error;
  }
}

async function preprocessImage(
  imageBuffer: Buffer,
  options: OCROptions,
): Promise<Buffer> {
  try {
    let processor = sharp(imageBuffer);

    // Convert to grayscale for better text recognition
    processor = processor.grayscale();

    // Enhance contrast if requested
    if (options.enhanceContrast !== false) {
      processor = processor.normalize();
    }

    // Increase DPI for better recognition (if image is small)
    const metadata = await sharp(imageBuffer).metadata();
    if (metadata.width && metadata.width < 1000) {
      const scaleFactor = Math.min(2, 1200 / metadata.width);
      processor = processor.resize({
        width: Math.round(metadata.width * scaleFactor),
        height: metadata.height
          ? Math.round(metadata.height * scaleFactor)
          : undefined,
        kernel: sharp.kernel.cubic,
      });
    }

    // Apply sharpening for text clarity
    processor = processor.sharpen({
      sigma: 1,
      m1: 0.5,
      m2: 2,
      x1: 2,
      y2: 10,
      y3: 20,
    });

    // Remove noise if requested
    if (options.removeNoise) {
      processor = processor.median(3);
    }

    const processedBuffer = await processor.png().toBuffer();

    logger.debug(
      {
        originalSize: imageBuffer.length,
        processedSize: processedBuffer.length,
      },
      "Image preprocessing completed",
    );

    return processedBuffer;
  } catch (error) {
    logger.warn({ error }, "Image preprocessing failed, using original");
    return imageBuffer;
  }
}

function cleanOCRText(rawText: string): string {
  return (
    rawText
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      // Fix common OCR errors in recipe text
      .replace(/\b0\b/g, "O") // Zero to O
      .replace(/\b1\b(?=\s*[a-z])/gi, "I") // 1 to I when followed by letters
      .replace(/\b5\b(?=\s*[a-z])/gi, "S") // 5 to S when followed by letters
      .replace(/\b8\b(?=\s*[a-z])/gi, "B") // 8 to B when followed by letters
      // Clean up line breaks
      .replace(/\n\s*\n/g, "\n")
      .trim()
  );
}

export async function terminate(): Promise<void> {
  if (scheduler) {
    try {
      await scheduler.terminate();
      scheduler = null;
      isInitialized = false;
      logger.info({}, "OCR service terminated");
    } catch (error) {
      logError(logger, "Error terminating OCR service", error as Error);
    }
  }
}

export function isServiceInitialized(): boolean {
  return isInitialized;
}
