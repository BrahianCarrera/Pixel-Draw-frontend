import React, { useState, useMemo } from 'react';
import { useColorScheme, View, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TamaguiProvider, Theme, XStack, YStack, Text, Button } from 'tamagui';
import tamaguiConfig from './tamagui.config';
import { Heart, Paintbrush, ImageIcon, RotateCcw } from './src/components/icons';
import { DemoArtworkProvider } from './src/context/demo-artwork-context';
import { RouterContext, ScreenName } from './src/context/router-context';
import HomeScreen from './src/app/index';
import DrawScreen from './src/app/draw';
import GalleryScreen from './src/app/gallery';

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('home');

  const routerValue = useMemo(() => {
    const navigateTo = (screen: ScreenName) => setCurrentScreen(screen);
    const parseRoute = (path: string): ScreenName => {
      if (path.includes('draw')) return 'draw';
      if (path.includes('gallery')) return 'gallery';
      return 'home';
    };

    return {
      currentScreen,
      navigate: navigateTo,
      push: (route: string) => navigateTo(parseRoute(route)),
      replace: (route: string) => navigateTo(parseRoute(route)),
      back: () => navigateTo('home'),
    };
  }, [currentScreen]);

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={isDark ? 'dark' : 'light'}>
        <Theme name={isDark ? 'dark' : 'light'}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <DemoArtworkProvider>
            <RouterContext.Provider value={routerValue}>
              <SafeAreaView
                style={[
                  styles.safeArea,
                  { backgroundColor: isDark ? '#121214' : '#ffffff' },
                ]}
                edges={['top', 'left', 'right']}
              >
                {/* Header Navbar */}
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  paddingHorizontal="$4"
                  paddingVertical="$2.5"
                  borderBottomWidth={1}
                  borderBottomColor="$borderColor"
                  backgroundColor={isDark ? '#121214' : '#ffffff'}
                >
                  <TouchableOpacity
                    onPress={() => setCurrentScreen('home')}
                    activeOpacity={0.7}
                    style={styles.logoRow}
                  >
                    <Heart size={24} color="#e11d48" />
                    <Text fontWeight="bold" fontSize={18} color="#e11d48">
                      PixelDraw
                    </Text>
                  </TouchableOpacity>

                  {/* Navigation Tabs */}
                  <XStack gap="$1.5" alignItems="center">
                    <Button
                      size="$2.5"
                      theme={currentScreen === 'home' ? 'active' : undefined}
                      chromeless={currentScreen !== 'home'}
                      onPress={() => setCurrentScreen('home')}
                    >
                      Inicio
                    </Button>
                    <Button
                      size="$2.5"
                      theme={currentScreen === 'draw' ? 'active' : undefined}
                      chromeless={currentScreen !== 'draw'}
                      icon={<Paintbrush size={15} color={currentScreen === 'draw' ? 'white' : undefined} />}
                      onPress={() => setCurrentScreen('draw')}
                    >
                      Dibujar
                    </Button>
                    <Button
                      size="$2.5"
                      theme={currentScreen === 'gallery' ? 'active' : undefined}
                      chromeless={currentScreen !== 'gallery'}
                      icon={<ImageIcon size={15} color={currentScreen === 'gallery' ? 'white' : undefined} />}
                      onPress={() => setCurrentScreen('gallery')}
                    >
                      Galería
                    </Button>
                  </XStack>
                </XStack>

                {/* Main Screen Body */}
                <YStack flex={1} backgroundColor="$background">
                  {currentScreen === 'home' && <HomeScreen />}
                  {currentScreen === 'draw' && <DrawScreen />}
                  {currentScreen === 'gallery' && <GalleryScreen />}
                </YStack>
              </SafeAreaView>
            </RouterContext.Provider>
          </DemoArtworkProvider>
        </Theme>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
