import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

// Builds every raster icon from public/logo.svg. Run after changing the logo:
//   pnpm exec tsx scripts/generate-icons.ts

const LEEK = "#234a2f";
const logo = readFileSync("public/logo.svg");

async function renderMark(size: number): Promise<Buffer> {
  return sharp(logo, { density: 72 * (size / 100) * 4 })
    .resize(size, size)
    .png()
    .toBuffer();
}

async function renderTile(size: number, markScale: number): Promise<Buffer> {
  const markSize = Math.round(size * markScale);
  const offset = Math.round((size - markSize) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background: LEEK },
  })
    .composite([
      { input: await renderMark(markSize), left: offset, top: offset },
    ])
    .png()
    .toBuffer();
}

function packIco(images: Buffer[], sizes: number[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let dataOffset = 6 + 16 * images.length;
  const entries = images.map((image, index) => {
    const entry = Buffer.alloc(16);
    const size = sizes[index] >= 256 ? 0 : sizes[index];
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    dataOffset += image.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images]);
}

async function main() {
  const icoSizes = [16, 32, 48];
  const icoImages = await Promise.all(icoSizes.map(renderMark));
  writeFileSync("src/app/favicon.ico", packIco(icoImages, icoSizes));

  writeFileSync("public/logo.png", await renderMark(512));
  writeFileSync("src/app/apple-icon.png", await renderTile(180, 0.6));
  writeFileSync("public/icons/icon-192.png", await renderTile(192, 0.6));
  writeFileSync("public/icons/icon-512.png", await renderTile(512, 0.6));
  writeFileSync(
    "public/icons/icon-maskable-512.png",
    await renderTile(512, 0.48),
  );
}

main();
