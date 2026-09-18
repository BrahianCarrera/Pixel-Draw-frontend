/**
 * Web stub for widget-service.
 *
 * expo-widgets, @expo/ui/swift-ui, and react-native-android-widget are
 * native-only packages. Metro resolves this file instead of widget-service.tsx
 * when bundling for the web platform, so native modules are never imported.
 */

export function generatePngBase64(_grid: string[][], _width?: number, _height?: number): string {
  return '';
}

export const widgetService = {
  async updateLatestDrawing(): Promise<void> {
    // no-op on web — home screen widgets are a native mobile feature
  },
  async clearWidget(): Promise<void> {
    // no-op on web
  },
  async _clearWidgetState(): Promise<void> {
    // no-op on web
  },
};
