import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { LatestDrawWidgetAndroid } from '../widgets/LatestDrawWidgetAndroid';
import { storage } from './storage';

const WIDGET_DATA_KEY = 'pixeldraw_widget_data';

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
 * Saves widget data to storage so it can be read when the system
 * requests a widget update (e.g. after a reboot).
 */
export async function saveAndroidWidgetData(data: AndroidWidgetData): Promise<void> {
  try {
    await storage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[AndroidWidgetTask] Failed to save widget data:', err);
  }
}

/**
 * Reads the last saved widget data from storage.
 */
export async function loadAndroidWidgetData(): Promise<AndroidWidgetData> {
  try {
    const raw = await storage.getItem(WIDGET_DATA_KEY);
    if (raw) {
      return JSON.parse(raw) as AndroidWidgetData;
    }
  } catch (err) {
    console.warn('[AndroidWidgetTask] Failed to load widget data:', err);
  }
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
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await loadAndroidWidgetData();
      renderWidget(<LatestDrawWidgetAndroid {...data} />);
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
