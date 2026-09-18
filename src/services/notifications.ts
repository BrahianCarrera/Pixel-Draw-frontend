import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { api, Artwork } from './api';
import { storage } from './storage';
import { widgetService } from './widget-service';

export const BACKGROUND_NOTIFICATION_TASK = 'PIXELDRAW_BACKGROUND_NOTIFICATION_TASK';
const PUSH_TOKEN_STORAGE_KEY = 'pixeldraw_push_token';
const EAS_PROJECT_ID = 'bc2172a7-5ed0-43b6-8fe2-aa6ebe890a1d';

// ─── Configure Global Foreground Notification Handler ────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Background Notification Task (Headless) ──────────────────────────────────
// Executes when a push notification is delivered and app is closed or backgrounded.

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error }: { data: any; executionInfo?: any; error?: any }) => {
    if (error) {
      console.warn('[NotificationTask] Error in background notification task:', error);
      return;
    }

    try {
      // The push payload data can be in data or data.notification.data depending on OS
      const notificationData =
        data?.notification?.data ||
        data?.data ||
        data?.body?.data ||
        data;

      console.log('[NotificationTask] Background push received:', JSON.stringify(notificationData));

      // 1. If payload directly includes artwork data, update widget immediately
      if (notificationData?.artwork && Array.isArray(notificationData.artwork.grid)) {
        await widgetService.updateLatestDrawing(notificationData.artwork as Artwork);
        return;
      }

      // 2. If payload indicates a new drawing, attempt to fetch latest status
      if (notificationData?.type === 'NEW_DRAWING' || notificationData?.type === 'ARTWORK_CREATED') {
        const token = await storage.getItem('pixeldraw_token');
        if (token) {
          const syncData = await api.sync.getStatus();
          if (syncData?.latestArtwork) {
            await widgetService.updateLatestDrawing(syncData.latestArtwork, syncData.user?.id);
          }
        }
      }
    } catch (err) {
      console.warn('[NotificationTask] Failed to process background notification:', err);
    }
  }
);

// Register the background task with the Notifications module
if (Platform.OS !== 'web') {
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch((err) => {
    console.warn('[NotificationTask] Failed to register background task:', err);
  });
}

// ─── Notification Registration & Permissions ─────────────────────────────────

export async function registerForPushNotificationsAsync(userId?: number): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    if (!Device.isDevice) {
      console.log('[Push] Must use a physical device for push notifications');
      return null;
    }

    // Configure Android notification channel (Required for Android 8+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('pixeldraw-drawings', {
        name: 'Dibujos de tu pareja',
        description: 'Notificaciones cuando tu pareja dibuja algo nuevo',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e11d48',
        enableLights: true,
        enableVibrate: true,
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Permission not granted for push notifications');
      return null;
    }

    // Acquire Expo push token
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });
    const token = tokenResponse.data;

    // Persist locally
    await storage.setItem(PUSH_TOKEN_STORAGE_KEY, token);

    // Sync to backend if userId is available
    if (userId && token) {
      await api.users.savePushToken(userId, token);
    }

    return token;
  } catch (err) {
    console.warn('[Push] Error getting push token:', err);
    return null;
  }
}

// ─── Foreground & Response Listeners ─────────────────────────────────────────

export function setupNotificationListeners(options?: {
  onNewDrawingReceived?: (artwork?: Artwork) => void;
  onNotificationTapped?: (data: any) => void;
}) {
  if (Platform.OS === 'web') return () => {};

  // 1. Foreground listener: when a notification arrives while app is open
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    async (notification) => {
      const data = notification.request.content.data;
      if (data?.artwork) {
        await widgetService.updateLatestDrawing(data.artwork as Artwork);
        options?.onNewDrawingReceived?.(data.artwork as Artwork);
      } else if (data?.type === 'NEW_DRAWING') {
        options?.onNewDrawingReceived?.();
      }
    }
  );

  // 2. Response listener: when user taps on the notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      options?.onNotificationTapped?.(data);
    }
  );

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
