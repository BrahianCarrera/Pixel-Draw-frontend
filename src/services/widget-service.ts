import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { widgetsDirectory } from 'expo-widgets';
import LatestDrawWidget from '../widgets/LatestDrawWidget';
import type { Artwork } from './api';

/**
 * Pure JavaScript Base64 encoder for Uint8Array (no Buffer dependency)
 */
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

/**
 * Generates an uncompressed 32-bit BMP (BGRA) image from a pixel grid.
 * BMP is natively supported by UIImage(contentsOfFile:) on iOS and BitmapFactory on Android.
 */
export function generateBmpBase64(
  grid: string[][],
  width = 256,
  height = 256
): string {
  const rowSize = width * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  const buffer = new Uint8Array(fileSize);
  const view = new DataView(buffer.buffer);

  // BMP Header (14 bytes)
  buffer[0] = 0x42; // 'B'
  buffer[1] = 0x4d; // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 54, true); // Offset to pixel data

  // DIB Header / BITMAPINFOHEADER (40 bytes)
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // positive = bottom-to-top standard
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 32, true); // 32 bits per pixel (BGRA)
  view.setUint32(30, 0, true); // BI_RGB (uncompressed)
  view.setUint32(34, pixelDataSize, true);
  view.setInt32(38, 2835, true); // 72 DPI
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  const gridRows = grid.length;
  const gridCols = grid[0]?.length || 1;

  for (let y = 0; y < height; y++) {
    // BMP is bottom-to-top with positive height
    const gridY = Math.floor(((height - 1 - y) / height) * gridRows);
    for (let x = 0; x < width; x++) {
      const gridX = Math.floor((x / width) * gridCols);
      const colorHex = grid[gridY]?.[gridX] || '#ffffff';

      let r = 255;
      let g = 255;
      let b = 255;
      const a = 255;

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

      const offset = 54 + y * rowSize + x * 4;
      buffer[offset] = b;
      buffer[offset + 1] = g;
      buffer[offset + 2] = r;
      buffer[offset + 3] = a;
    }
  }

  return uint8ArrayToBase64(buffer);
}

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

export const widgetService = {
  /**
   * Updates the home screen widget snapshot with the latest artwork.
   */
  async updateLatestDrawing(artwork: Artwork | null, currentUserId?: number): Promise<void> {
    // Widgets are native mobile features (iOS / Android)
    if (Platform.OS === 'web') {
      return;
    }

    try {
      if (!artwork || !artwork.grid || !Array.isArray(artwork.grid) || artwork.grid.length === 0) {
        LatestDrawWidget.updateSnapshot({
          hasDrawing: false,
          title: 'PixelDraw',
          authorName: '',
          createdAt: '',
          imageUri: undefined,
          isMyDrawing: false,
        });
        return;
      }

      let imageUri: string | undefined = undefined;

      // Check if widgets directory is available for sharing images
      if (widgetsDirectory) {
        try {
          const dir = widgetsDirectory.endsWith('/') ? widgetsDirectory : `${widgetsDirectory}/`;
          const targetFile = `${dir}latest_draw.bmp`;
          const base64Data = generateBmpBase64(artwork.grid, 256, 256);

          await FileSystem.writeAsStringAsync(targetFile, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          imageUri = targetFile;
        } catch (fileErr) {
          console.warn('[WidgetService] Error saving widget BMP file:', fileErr);
        }
      }

      const isMyDrawing = currentUserId ? artwork.authorId === currentUserId : false;
      const authorName = artwork.author?.username || 'Tu pareja';
      const title = artwork.name?.trim() || 'Dibujo con amor';
      const createdAt = formatDate(artwork.updatedAt || artwork.createdAt);

      LatestDrawWidget.updateSnapshot({
        hasDrawing: true,
        title,
        authorName,
        createdAt,
        imageUri,
        isMyDrawing,
      });
    } catch (err) {
      console.warn('[WidgetService] Failed to update widget snapshot:', err);
    }
  },

  /**
   * Clears widget state (e.g. on user logout)
   */
  async clearWidget(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      LatestDrawWidget.updateSnapshot({
        hasDrawing: false,
        title: 'PixelDraw',
        authorName: '',
        createdAt: '',
        imageUri: undefined,
        isMyDrawing: false,
      });
    } catch (err) {
      console.warn('[WidgetService] Failed to clear widget:', err);
    }
  },
};
