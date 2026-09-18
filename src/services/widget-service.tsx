import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import React from 'react';
import LatestDrawWidget from '../widgets/LatestDrawWidget';
import { LatestDrawWidgetAndroid } from '../widgets/LatestDrawWidgetAndroid';
import type { Artwork } from './api';
import { saveAndroidWidgetData, type AndroidWidgetData } from './widget-task-handler';

// ─── Pure-JS CRC32 ────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data: Uint8Array, start = 0, end = data.length): number {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ─── Adler-32 (for zlib) ─────────────────────────────────────────────────────

function adler32(data: Uint8Array): number {
  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < data.length; i++) {
    s1 = (s1 + data[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  return ((s2 << 16) | s1) >>> 0;
}

// ─── Pure-JS Base64 encoder ──────────────────────────────────────────────────

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    base64 += chars[b0 >> 2];
    base64 += chars[((b0 & 3) << 4) | (b1 >> 4)];
    base64 += i + 1 < len ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    base64 += i + 2 < len ? chars[b2 & 63] : '=';
  }
  return base64;
}

// ─── PNG chunk helper ────────────────────────────────────────────────────────

function writeUint32BE(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = (value >>> 24) & 0xff;
  buf[offset + 1] = (value >>> 16) & 0xff;
  buf[offset + 2] = (value >>> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new Uint8Array(type.split('').map((c) => c.charCodeAt(0)));
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  writeUint32BE(chunk, 0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  const crc = crc32(chunk, 4, 4 + 4 + data.length);
  writeUint32BE(chunk, 8 + data.length, crc);
  return chunk;
}

// ─── Uncompressed store-mode PNG generator ───────────────────────────────────

/**
 * Generates a lossless RGBA PNG from a pixel grid.
 * Uses zlib store-mode (deflate level 0) — no compression library needed.
 * Output is universally supported: iOS UIImage + Android BitmapFactory.
 */
export function generatePngBase64(
  grid: string[][],
  width = 128,
  height = 128
): string {
  const gridRows = grid.length;
  const gridCols = grid[0]?.length || 1;

  // Build raw scanline data: filter byte (0 = None) + 4 bytes per pixel (RGBA)
  const scanlineSize = 1 + width * 4; // filter byte + RGBA
  const rawData = new Uint8Array(scanlineSize * height);

  for (let y = 0; y < height; y++) {
    const gridY = Math.floor((y / height) * gridRows);
    rawData[y * scanlineSize] = 0; // filter type None
    for (let x = 0; x < width; x++) {
      const gridX = Math.floor((x / width) * gridCols);
      const colorHex = grid[gridY]?.[gridX] || '#ffffff';

      let r = 255, g = 255, b = 255;
      if (colorHex.startsWith('#')) {
        const hex = colorHex.slice(1);
        if (hex.length === 6) {
          r = parseInt(hex.slice(0, 2), 16) || 0;
          g = parseInt(hex.slice(2, 4), 16) || 0;
          b = parseInt(hex.slice(4, 6), 16) || 0;
        } else if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16) || 0;
          g = parseInt(hex[1] + hex[1], 16) || 0;
          b = parseInt(hex[2] + hex[2], 16) || 0;
        }
      }

      const offset = y * scanlineSize + 1 + x * 4;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
      rawData[offset + 3] = 255; // fully opaque
    }
  }

  // Wrap in zlib store-mode stream
  // Format: 2-byte zlib header + deflate non-compressed blocks + 4-byte adler32
  const BLOCK_SIZE = 65535;
  const numBlocks = Math.ceil(rawData.length / BLOCK_SIZE);
  // Each block: 1 byte BFINAL|BTYPE + 2 bytes LEN + 2 bytes NLEN + data
  const deflateSize = numBlocks * 5 + rawData.length;
  const zlibSize = 2 + deflateSize + 4; // header + deflate + adler32
  const zlib = new Uint8Array(zlibSize);

  // zlib header: CM=8 (deflate), CINFO=7 (32K window), FCHECK so header%31=0
  zlib[0] = 0x78;
  zlib[1] = 0x01; // no compression (fastest)

  let pos = 2;
  for (let b = 0; b < numBlocks; b++) {
    const start = b * BLOCK_SIZE;
    const end = Math.min(start + BLOCK_SIZE, rawData.length);
    const len = end - start;
    const isFinal = b === numBlocks - 1 ? 1 : 0;

    zlib[pos++] = isFinal; // BFINAL + BTYPE=00 (no compression)
    zlib[pos++] = len & 0xff;
    zlib[pos++] = (len >> 8) & 0xff;
    zlib[pos++] = (~len) & 0xff;
    zlib[pos++] = ((~len) >> 8) & 0xff;
    zlib.set(rawData.subarray(start, end), pos);
    pos += len;
  }

  // Adler-32 checksum
  const checksum = adler32(rawData);
  zlib[pos++] = (checksum >>> 24) & 0xff;
  zlib[pos++] = (checksum >>> 16) & 0xff;
  zlib[pos++] = (checksum >>> 8) & 0xff;
  zlib[pos++] = checksum & 0xff;

  // ── Assemble PNG ──────────────────────────────────────────────────────────

  // PNG signature
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bit depth=8, color type=2 (RGB) → use 6 (RGBA) for transparency
  const ihdrData = new Uint8Array(13);
  writeUint32BE(ihdrData, 0, width);
  writeUint32BE(ihdrData, 4, height);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace: none
  const ihdr = pngChunk('IHDR', ihdrData);

  const idat = pngChunk('IDAT', zlib);
  const iend = pngChunk('IEND', new Uint8Array(0));

  // Concatenate all parts
  const totalSize = signature.length + ihdr.length + idat.length + iend.length;
  const png = new Uint8Array(totalSize);
  let off = 0;
  png.set(signature, off); off += signature.length;
  png.set(ihdr, off);      off += ihdr.length;
  png.set(idat, off);      off += idat.length;
  png.set(iend, off);

  return uint8ArrayToBase64(png);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const isToday = new Date().toDateString() === date.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Hoy ${timeStr}` : `${date.getDate()}/${date.getMonth() + 1} ${timeStr}`;
  } catch {
    return '';
  }
}

const WIDGET_IMG_SIZE = 128; // px — enough for widget thumbnails

// ─── Widget Service ───────────────────────────────────────────────────────────

export const widgetService = {
  /**
   * Updates the home screen widget snapshot with the latest artwork.
   */
  async updateLatestDrawing(artwork: Artwork | null, currentUserId?: number): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      if (!artwork || !Array.isArray(artwork.grid) || artwork.grid.length === 0) {
        await this._clearWidgetState();
        return;
      }

      const isMyDrawing = currentUserId ? artwork.authorId === currentUserId : false;
      const authorName = artwork.author?.username || 'Tu pareja';
      const title = artwork.name?.trim() || 'Dibujo con amor';
      const createdAt = formatDate(artwork.updatedAt || artwork.createdAt);

      // Generate PNG base64 once (used differently per platform)
      const pngBase64 = generatePngBase64(artwork.grid, WIDGET_IMG_SIZE, WIDGET_IMG_SIZE);

      // ── iOS: expo-widgets (SwiftUI UIImage via file URI) ──────────────────
      if (Platform.OS === 'ios') {
        let imageUri: string | undefined = undefined;
        const pngTargetDir = `${FileSystem.cacheDirectory}pixeldraw_widget/`;
        const pngTargetFile = `${pngTargetDir}latest_draw.png`;

        try {
          await FileSystem.makeDirectoryAsync(pngTargetDir, { intermediates: true });
          await FileSystem.writeAsStringAsync(pngTargetFile, pngBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const info = await FileSystem.getInfoAsync(pngTargetFile);
          if (info.exists) {
            imageUri = pngTargetFile;
          }
        } catch (fileErr) {
          console.warn('[WidgetService] Error saving iOS widget PNG file:', fileErr);
        }

        LatestDrawWidget.updateSnapshot({
          hasDrawing: true,
          title,
          authorName,
          createdAt,
          imageUri,
          isMyDrawing,
        });
      }

      // ── Android: react-native-android-widget (ImageWidget data URI) ───────
      if (Platform.OS === 'android') {
        // ImageWidget only accepts data URIs — embed the PNG directly
        const imageDataUri = `data:image/png;base64,${pngBase64}`;

        const widgetData: AndroidWidgetData = {
          hasDrawing: true,
          title,
          authorName,
          createdAt,
          imageDataUri,
          isMyDrawing,
        };

        // Persist so task handler can restore on boot/system widget update
        await saveAndroidWidgetData(widgetData);

        const { requestWidgetUpdate } = require('react-native-android-widget');
        await requestWidgetUpdate({
          widgetName: 'LatestDrawWidget',
          renderWidget: () => (
            <LatestDrawWidgetAndroid {...widgetData} />
          ),
        });
      }
    } catch (err) {
      console.warn('[WidgetService] Failed to update widget snapshot:', err);
    }
  },

  /**
   * Clears widget state (e.g. on user logout)
   */
  async clearWidget(): Promise<void> {
    if (Platform.OS === 'web') return;
    await this._clearWidgetState();
  },

  async _clearWidgetState(): Promise<void> {
    const emptyData: AndroidWidgetData = {
      hasDrawing: false,
      title: 'PixelDraw',
      authorName: '',
      createdAt: '',
      imageDataUri: undefined,
      isMyDrawing: false,
    };

    try {
      if (Platform.OS === 'ios') {
        LatestDrawWidget.updateSnapshot({
          hasDrawing: false,
          title: 'PixelDraw',
          authorName: '',
          createdAt: '',
          imageUri: undefined,
          isMyDrawing: false,
        });
      }

      if (Platform.OS === 'android') {
        await saveAndroidWidgetData(emptyData);
        const { requestWidgetUpdate } = require('react-native-android-widget');
        await requestWidgetUpdate({
          widgetName: 'LatestDrawWidget',
          renderWidget: () => <LatestDrawWidgetAndroid {...emptyData} />,
        });
      }
    } catch (err) {
      console.warn('[WidgetService] Failed to clear widget:', err);
    }
  },
};
