import * as Font from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TamaguiProvider, Theme } from 'tamagui';
import tamaguiConfig from '../../tamagui.config';
import { ServerStatusBanner } from '../components/ui/ServerStatusBanner';
import { PX } from '../constants/pixelTheme';
import { AuthProvider } from '../context/auth-context';
import { ServerStatusProvider } from '../context/server-status-context';
import '../services/notifications';
import { setupNotificationListeners } from '../services/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Register the Android widget task handler at app startup.
// Must be called before the component tree mounts.
if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('../services/widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [fontsLoaded] = Font.useFonts({
    PressStart2P: require('../../assets/fonts/PressStart2P.ttf'),
  });

  useEffect(() => {
    const cleanup = setupNotificationListeners({
      onNotificationTapped: () => {
        router.push('/');
      },
    });
    return cleanup;
  }, [router]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Synchronize Android window background to prevent white flickering
    SystemUI.setBackgroundColorAsync(isDark ? PX.colors.bg : PX.colors.bgLight).catch(() => {});
  }, [isDark]);

  // Keep splash visible while the font is loading
  if (!fontsLoaded) {
    return null;
  }

  const headerBg = isDark ? '#111118' : '#f0f0f8';
  const contentBg = isDark ? PX.colors.bg : PX.colors.bgLight;

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={isDark ? 'dark' : 'light'}>
        <Theme name={isDark ? 'dark' : 'light'}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <ServerStatusProvider>
            <AuthProvider>
              <ServerStatusBanner />
              <SafeAreaView
                style={{
                  flex: 1,
                  backgroundColor: contentBg,
                }}
                edges={['bottom']}
              >
                <Stack
                  screenOptions={{
                    headerStyle: {
                      backgroundColor: headerBg,
                    },
                    headerTintColor: PX.colors.accent,
                    headerTitleStyle: {
                      fontFamily: PX.fonts.pixel,
                      fontSize: PX.font.sm,
                    },
                    headerShadowVisible: false,
                    // Pixel-art: 2px bottom border instead of shadow
                    headerTitleAlign: 'center',
                    contentStyle: {
                      backgroundColor: contentBg,
                    },
                  }}
                >
                  <Stack.Screen
                    name="index"
                    options={{
                      headerTitle: '♥ PixelDraw',
            
                    }}
                  />
                  <Stack.Screen
                    name="auth"
                    options={{
                      title: 'Acceso',
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="draw"
                    options={{
                      title: 'Lienzo',
                    }}
                  />
                  <Stack.Screen
                    name="gallery"
                    options={{
                      title: 'Galería',
                    }}
                  />
                  <Stack.Screen
                    name="couple"
                    options={{
                      title: 'Mi Pareja',
                    }}
                  />
                </Stack>
              </SafeAreaView>
            </AuthProvider>
          </ServerStatusProvider>
        </Theme>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
