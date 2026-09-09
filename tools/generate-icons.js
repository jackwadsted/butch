// Generates icons/icon16.png, icons/icon48.png, icons/icon128.png
// Run once with: node generate-icons.js
// No npm dependencies required.

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// CRC32 — required for valid PNG chunks
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePNG(width, height, drawFn) {
  // drawFn(x, y, w, h) → [r, g, b, a]
  const raw = Buffer.allocUnsafe((1 + width * 4) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const i = rowStart + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

function drawIcon(x, y, w, h) {
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const r = Math.min(w, h) / 2;

  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Transparent outside the circle
  if (dist > r - 0.5) return [0, 0, 0, 0];

  // Thin border ring
  if (dist > r - 1.5) return [80, 70, 180, 255];

  // Background: indigo #6366f1
  const bg = [99, 102, 241, 255];
  const white = [255, 255, 255, 255];

  // Center dot
  if (dist < r * 0.08) return white;

  // Hour hand: points toward 10 (angle = -60° from 12 o'clock)
  // Minute hand: points toward 2 (angle = +60° from 12 o'clock)
  const handWidth = Math.max(0.8, r * 0.10);

  function onSegment(ax, ay, bx, by, px, py, halfWidth) {
    const abx = bx - ax, aby = by - ay;
    const len2 = abx * abx + aby * aby;
    if (len2 === 0) return false;
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len2));
    const nearX = ax + t * abx;
    const nearY = ay + t * aby;
    const ddx = px - nearX, ddy = py - nearY;
    return Math.sqrt(ddx * ddx + ddy * ddy) < halfWidth;
  }

  const hourAngle = -Math.PI / 3; // 10 o'clock
  const minuteAngle = Math.PI / 3; // 2 o'clock

  const hourLen = r * 0.48;
  const minuteLen = r * 0.65;

  if (onSegment(cx, cy, cx + Math.sin(hourAngle) * hourLen, cy - Math.cos(hourAngle) * hourLen, x, y, handWidth)) {
    return white;
  }
  if (onSegment(cx, cy, cx + Math.sin(minuteAngle) * minuteLen, cy - Math.cos(minuteAngle) * minuteLen, x, y, handWidth)) {
    return white;
  }

  return bg;
}

const outDir = path.join(__dirname, 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const png = makePNG(size, size, drawIcon);
  const outPath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Created icons/icon${size}.png`);
}
