import fs from 'fs';
import zlib from 'zlib';

function createPNG(width: number, height: number, bgColor: [number, number, number]) {
  // Simple uncompressed RGBA PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression method
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw Image Data (with filter byte 0 at start of each scanline)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Distance from center
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = width / 2;

      // Draw stylized icon with cyan & amber runner emblem
      let r = bgColor[0];
      let g = bgColor[1];
      let b = bgColor[2];
      let a = 255;

      // Inner glowing circle
      if (dist < maxDist * 0.75) {
        // Gradient
        r = Math.floor(6 + (x / width) * 50);
        g = Math.floor(182 - (y / height) * 80);
        b = Math.floor(212 + (y / height) * 40);
      }

      // Center gold coin accent
      if (dist < maxDist * 0.3) {
        r = 245;
        g = 158;
        b = 11;
      }

      rawData[pixelOffset] = Math.min(255, Math.max(0, r));
      rawData[pixelOffset + 1] = Math.min(255, Math.max(0, g));
      rawData[pixelOffset + 2] = Math.min(255, Math.max(0, b));
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type: string, data: Buffer) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 table
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Generate the required PWA icons
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

fs.writeFileSync('./public/pwa-192x192.png', createPNG(192, 192, [15, 23, 42]));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512, 512, [15, 23, 42]));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPNG(512, 512, [10, 15, 26]));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180, [15, 23, 42]));
console.log('PWA PNG assets successfully generated.');
