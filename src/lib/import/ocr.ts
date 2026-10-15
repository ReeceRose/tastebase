import sharp from "sharp";
import { createWorker, OEM, type Worker } from "tesseract.js";
import { createOperationLogger } from "@/lib/logging/logger";

const logger = createOperationLogger("recipe-ocr");

const MIN_OCR_WIDTH = 1600;
const MAX_OCR_WIDTH = 3000;

export interface OcrResult {
  text: string;
  confidence: number;
}

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker("eng", OEM.LSTM_ONLY).catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

// Grayscale, auto-rotate from EXIF, stretch contrast and scale to a width
// Tesseract reads well. Phone photos of cookbooks benefit most from this.
async function prepareImage(image: Buffer): Promise<Buffer> {
  const pipeline = sharp(image).rotate().grayscale().normalize();
  const { width } = await sharp(image).metadata();

  if (width && width < MIN_OCR_WIDTH) {
    pipeline.resize({ width: MIN_OCR_WIDTH, kernel: sharp.kernel.cubic });
  } else if (width && width > MAX_OCR_WIDTH) {
    pipeline.resize({ width: MAX_OCR_WIDTH });
  }

  return pipeline.sharpen().png().toBuffer();
}

function cleanOcrText(text: string): string {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 1)
    .join("\n");
}

export async function extractTextFromImage(image: Buffer): Promise<OcrResult> {
  const startTime = Date.now();
  const worker = await getWorker();
  const prepared = await prepareImage(image);
  const { data } = await worker.recognize(prepared);
  const text = cleanOcrText(data.text);

  logger.info(
    {
      textLength: text.length,
      confidence: data.confidence,
      durationMs: Date.now() - startTime,
    },
    "OCR text extraction completed",
  );

  return { text, confidence: data.confidence / 100 };
}
