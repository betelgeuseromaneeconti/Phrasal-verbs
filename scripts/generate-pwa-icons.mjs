import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePNG(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  const pad = isMaskable ? Math.floor(width * 0.16) : Math.floor(width * 0.08);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    rawData[rowStart] = 0; // filter type 0
    for (let x = 0; x < width; x++) {
      const idx = rowStart + 1 + x * 4;
      // Dark slate background #0f172a
      let r = 15, g = 23, b = 42, a = 255;

      // Inner card with safe zone
      if (x >= pad && x < width - pad && y >= pad && y < height - pad) {
        r = 30; g = 41; b = 59; // #1e293b
        // Accent border #0284c7
        const bWidth = Math.max(2, Math.floor(width * 0.025));
        if (
          x < pad + bWidth ||
          x >= width - pad - bWidth ||
          y < pad + bWidth ||
          y >= height - pad - bWidth
        ) {
          r = 2; g = 132; b = 199;
        }
      }

      // Central monogram book bars
      const cx = width / 2;
      const cy = height / 2;
      const boxHalf = width * 0.22;
      if (Math.abs(x - cx) < boxHalf && Math.abs(y - cy) < boxHalf) {
        const relY = (y - (cy - boxHalf)) / (boxHalf * 2);
        const relX = (x - (cx - boxHalf)) / (boxHalf * 2);
        if (
          (relX > 0.12 && relX < 0.28 && relY > 0.1 && relY < 0.9) ||
          (relY > 0.1 && relY < 0.26 && relX > 0.12 && relX < 0.72) ||
          (relY > 0.44 && relY < 0.58 && relX > 0.12 && relX < 0.68) ||
          (relX > 0.68 && relX < 0.86 && relY > 0.44 && relY < 0.9)
        ) {
          r = 56; g = 189; b = 248; // #38bdf8 sky-400
        }
      }

      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
      rawData[idx + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const publicDir = path.resolve('public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
console.log('Generated PWA PNG icons successfully.');
