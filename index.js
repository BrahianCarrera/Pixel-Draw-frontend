import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/services/widget-task-handler';

// Register Android widget task handler at the top-level bundle entry point.
// When Android adds or updates the widget on the home screen while the app is closed,
// React Native starts a HeadlessJS background task from this root entry file.
// Registering here ensures the widget handler is always available to render the widget
// immediately, even before the user has ever launched the app or after a device reboot.
if (Platform.OS === 'android') {
  registerWidgetTaskHandler(widgetTaskHandler);
}

// Load Expo Router entry point
import 'expo-router/entry';
