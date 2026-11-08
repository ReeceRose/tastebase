const MAX_PIXEL_RATIO = 2;

async function loadPdfjs() {
  // Loading the worker code sets globalThis.pdfjsWorker, which makes pdf.js
  // run on the main thread. A one-recipe PDF is small enough for that, and it
  // avoids serving a separate worker file that has to match this version.
  await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
  return import("pdfjs-dist/legacy/build/pdf.mjs");
}

export async function drawPdfPages(
  file: Blob,
  width: number,
  isCancelled: () => boolean,
): Promise<HTMLCanvasElement[]> {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const canvases: HTMLCanvasElement[] = [];

  try {
    const pdf = await task.promise;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

    for (let number = 1; number <= pdf.numPages; number += 1) {
      if (isCancelled()) break;
      const page = await pdf.getPage(number);
      const scale = (width * pixelRatio) / page.getViewport({ scale: 1 }).width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.className = "block h-auto w-full rounded-control";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `Page ${number} of ${pdf.numPages}`);
      await page.render({ canvas, viewport }).promise;
      canvases.push(canvas);
    }
  } finally {
    await task.destroy();
  }

  return canvases;
}
