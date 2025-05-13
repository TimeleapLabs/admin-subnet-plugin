import sharp from "sharp";
import fs from "fs";

/**
 * Convert RGB565 buffer (Little-Endian) to RGB888
 */
function rgb565ToRgb888(buffer: Buffer, width: number, height: number): Buffer {
  if (buffer.length !== width * height * 2) {
    throw new Error(
      `Invalid buffer size: Expected ${width * height * 2}, got ${buffer.length}`,
    );
  }

  const rgb888 = Buffer.alloc(width * height * 3, 0); // Fill with black

  for (let i = 0; i < width * height; i++) {
    const pixel = buffer.readUInt16BE(i * 2); // ESP32 outputs Little-Endian RGB565

    // Extract R, G, B components
    const r = (pixel & 0xf800) >> 8; // 5-bit to 8-bit
    const g = (pixel & 0x7e0) >> 3; // 6-bit to 8-bit
    const b = (pixel & 0x1f) << 3; // 5-bit to 8-bit

    rgb888[i * 3] = Math.round(r);
    rgb888[i * 3 + 1] = Math.round(g);
    rgb888[i * 3 + 2] = Math.round(b);
  }

  return rgb888;
}

/**
 * Convert RGB565 to JPEG
 */
async function convertRGB565ToJPEG(
  rgb565Buffer: Buffer,
  width: number,
  height: number,
) {
  const rgb888Buffer = rgb565ToRgb888(rgb565Buffer, width, height);
  await sharp(rgb888Buffer, {
    raw: { width, height, channels: 3 },
  })
    .jpeg()
    .toFile("output.jpg");
}

// ESP32-CAM QVGA Settings
const width = 320;
const height = 240;
const rgb565Buffer = fs.readFileSync("image.raw"); // Read RGB565 buffer from ESP32

convertRGB565ToJPEG(rgb565Buffer, width, height);
