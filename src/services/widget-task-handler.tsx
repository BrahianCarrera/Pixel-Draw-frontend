import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { LatestDrawWidgetAndroid } from '../widgets/LatestDrawWidgetAndroid';
import * as FileSystem from 'expo-file-system/legacy';
import { storage } from './storage';

const WIDGET_DATA_KEY = 'pixeldraw_widget_data';
const WIDGET_DATA_FILE = `${FileSystem.documentDirectory ?? ''}pixeldraw_widget_data.json`;

export interface AndroidWidgetData {
  hasDrawing: boolean;
  title: string;
  authorName: string;
  createdAt: string;
  /** PNG as data URI: "data:image/png;base64,..." */
  imageDataUri?: string;
  isMyDrawing?: boolean;
}

/**
 * Saves widget data to file system so it can be read when the system
 * requests a widget update (e.g. after a reboot or headless task).
 * Uses FileSystem to avoid Keystore/SecureStore 2KB size limits for base64 images.
 */
export async function saveAndroidWidgetData(data: AndroidWidgetData): Promise<void> {
  try {
    if (FileSystem.documentDirectory) {
      await FileSystem.writeAsStringAsync(WIDGET_DATA_FILE, JSON.stringify(data));
      return;
    }
  } catch (err) {
    console.warn('[AndroidWidgetTask] Failed to save widget data to file:', err);
  }
  try {
    await storage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
  } catch {}
}

/**
 * Reads the last saved widget data from file system or storage.
 */
export async function loadAndroidWidgetData(): Promise<AndroidWidgetData> {
  try {
    if (FileSystem.documentDirectory) {
      const info = await FileSystem.getInfoAsync(WIDGET_DATA_FILE);
      if (info.exists) {
        const raw = await FileSystem.readAsStringAsync(WIDGET_DATA_FILE);
        if (raw) {
          return JSON.parse(raw) as AndroidWidgetData;
        }
      }
    }
  } catch (err) {
    console.warn('[AndroidWidgetTask] Failed to load widget data from file:', err);
  }

  try {
    const raw = await storage.getItem(WIDGET_DATA_KEY);
    if (raw) {
      return JSON.parse(raw) as AndroidWidgetData;
    }
  } catch {}

  return {
    hasDrawing: false,
    title: 'PixelDraw',
    authorName: '',
    createdAt: '',
    imageDataUri: undefined,
    isMyDrawing: false,
  };
}

/**
 * Widget task handler — called by the Android system when the widget
 * needs to be added, updated, or resized.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const { widgetAction, renderWidget } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_RESIZED': {
      const data = await loadAndroidWidgetData();
      renderWidget(<LatestDrawWidgetAndroid {...data} />);
      break;
    }

    case 'WIDGET_UPDATE': {
      // 1. Immediately render cached data to avoid visual lag or blanks
      const cachedData = await loadAndroidWidgetData();
      renderWidget(<LatestDrawWidgetAndroid {...cachedData} />);

      // 2. Attempt to query latest drawing from backend
      try {
        const token = await storage.getItem('pixeldraw_token');
        if (token) {
          const { api } = require('./api');
          const { widgetService } = require('./widget-service');
          const syncData = await api.sync.getStatus();
          if (syncData?.latestArtwork) {
            await widgetService.updateLatestDrawing(syncData.latestArtwork, syncData.user?.id);
          }
        }
      } catch (e) {
        // Fallback silently if offline or server is hibernating
        console.log('[AndroidWidgetTask] Background sync skipped/failed:', e);
      }
      break;
    }

    case 'WIDGET_DELETED':
      // Widget removed from home screen — nothing to render
      break;

    case 'WIDGET_CLICK':
      // Deep-link into the app when widget is tapped (handled via clickAction="OPEN_APP")
      break;

    default: {
      // Render with stored data for any other actions
      const data = await loadAndroidWidgetData();
      renderWidget(<LatestDrawWidgetAndroid {...data} />);
    }
  }
}
