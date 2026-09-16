import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { TamaguiProvider, Theme, View } from 'tamagui';
import { AuthProvider } from '../context/auth-context';
import { ServerStatusProvider } from '../context/server-status-context';
import { ServerStatusBanner } from '../components/ui/ServerStatusBanner';
import tamaguiConfig from '../../tamagui.config';
import { Heart } from '../components/icons';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    // Synchronize Android window background to prevent white flickering
    SystemUI.setBackgroundColorAsync(isDark ? '#0f0f11' : '#f8fafc').catch(() => {});
  }, [isDark]);

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={isDark ? 'dark' : 'light'}>
        <Theme name={isDark ? 'dark' : 'light'}>
          <StatusBar
            style={isDark ? 'light' : 'dark'}
          />
          <ServerStatusProvider>
            <AuthProvider>
              <ServerStatusBanner />
              <SafeAreaView
                style={{
                  flex: 1,
                  backgroundColor: isDark ? '#121214' : '#ffffff',
                }}
                edges={['bottom']}
              >
              <Stack
                screenOptions={{
                  headerStyle: {
                    backgroundColor: isDark ? '#121214' : '#ffffff',
                  },
                  headerTintColor: isDark ? '#f43f5e' : '#e11d48',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                  headerShadowVisible: false,
                  contentStyle: {
                    backgroundColor: isDark ? '#0f0f11' : '#f8fafc',
                  },
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{
                    headerTitle: 'PixelDraw',
                    headerLeft: () => (
                        <View style={{ marginRight: 12 }}>
                           <Heart size={24} color="#e11d48" />
                        </View>
                    ),
                  }}
                />
                <Stack.Screen
                  name="auth"
                  options={{
                    title: 'Cuenta & Acceso',
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="draw"
                  options={{
                    title: 'Lienzo de Dibujo',
                  }}
                />
                <Stack.Screen
                  name="gallery"
                  options={{
                    title: 'Galería de Pareja',
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
