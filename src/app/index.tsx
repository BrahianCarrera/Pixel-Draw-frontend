import React from 'react';
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { useRouter } from '../context/router-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  YStack,
  XStack,
  Text,
  Paragraph,
  Card,
  Button,
  H2,
  H4,
  Separator,
} from 'tamagui';
import {
  Heart,
  Paintbrush,
  ImageIcon,
  Calendar,
  UserIcon,
  ClockFading,
  Sparkles,
  Star,
} from '../components/icons';
import { PixelPreview } from '../components/canvas/PixelPreview';
import { useDemoArtworks } from '../context/demo-artwork-context';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { artworks, latestArtwork } = useDemoArtworks();

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" maxWidth={520} width="100%" alignSelf="center">
          <Card borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" gap="$3">
            <XStack alignItems="center" gap="$2">
              <Heart size={30} color="#e11d48" />
              <YStack flex={1}>
                <XStack alignItems="center" gap="$1">
                  <H2 color="#e11d48">PixelDraw</H2>
                  <Sparkles size={24} color="#facc15" />
                </XStack>
                <Paragraph size="$2" color="$colorFocus">
                  Demo de portfolio con editor pixel art, Tamagui y Skia.
                </Paragraph>
              </YStack>
            </XStack>

            <Paragraph color="$colorFocus">
              Esta variante elimina login, backend y sincronización para que cualquiera pueda probar el
              lienzo al instante.
            </Paragraph>

            <XStack gap="$2" flexWrap="wrap">
              <Button
                flex={1}
                minWidth={150}
                theme="active"
                backgroundColor="#e11d48"
                color="white"
                icon={<Paintbrush size={20} color="white" />}
                onPress={() => router.push('/draw')}
              >
                Probar editor
              </Button>
              <Button
                flex={1}
                minWidth={150}
                borderWidth={1}
                borderColor="$borderColor"
                icon={<ImageIcon size={20} />}
                onPress={() => router.push('/gallery')}
              >
                Ver galería
              </Button>
            </XStack>
          </Card>

          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack alignItems="center" gap="$2">
                <ClockFading size={18} color="#e11d48" />
                <H4>Último dibujo</H4>
              </XStack>
              <XStack alignItems="center" gap="$1">
                <Star size={16} color="#facc15" />
                <Paragraph size="$2" color="$colorFocus">
                  {artworks.length} piezas
                </Paragraph>
              </XStack>
            </XStack>

            {latestArtwork && (
              <Card borderWidth={1} borderColor="$borderColor" padding="$3.5" borderRadius="$4" gap="$3">
                <View style={styles.previewCenter}>
                  <PixelPreview grid={latestArtwork.grid} size={280} borderRadius={10} />
                </View>

                <Separator />

                <XStack justifyContent="space-between" alignItems="center" gap="$3">
                  <YStack flex={1} gap="$1">
                    <Text fontWeight="bold" fontSize={16} numberOfLines={1}>
                      {latestArtwork.name}
                    </Text>
                    <XStack gap="$3" flexWrap="wrap">
                      <XStack alignItems="center" gap="$1">
                        <UserIcon size={12} color="#888" />
                        <Paragraph size="$1" color="$colorFocus">
                          @{latestArtwork.author.username}
                        </Paragraph>
                      </XStack>
                      <XStack alignItems="center" gap="$1">
                        <Calendar size={12} color="#888" />
                        <Paragraph size="$1" color="$colorFocus">
                          {new Date(latestArtwork.createdAt).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Paragraph>
                      </XStack>
                    </XStack>
                  </YStack>

                  <Button
                    size="$3"
                    theme="active"
                    backgroundColor="#e11d48"
                    color="white"
                    icon={<Paintbrush size={20} color="white" />}
                    onPress={() => router.push('/draw')}
                  >
                    Crear
                  </Button>
                </XStack>
              </Card>
            )}
          </YStack>
        </YStack>
      </ScrollView>

      <YStack
        borderTopWidth={1}
        borderTopColor="$borderColor"
        backgroundColor={isDark ? '#121214' : '#ffffff'}
        paddingHorizontal="$4"
        paddingTop="$3"
        paddingBottom={12 + insets.bottom}
        style={styles.bottomBar}
      >
        <XStack gap="$2" maxWidth={520} width="100%" alignSelf="center">
          <Button
            flex={1}
            size="$4"
            theme="active"
            backgroundColor="#e11d48"
            color="white"
            icon={<Paintbrush size={22} color="white" />}
            onPress={() => router.push('/draw')}
          >
            Dibujar
          </Button>
          <Button
            flex={1}
            size="$4"
            borderWidth={1}
            borderColor="$borderColor"
            icon={<ImageIcon size={22} />}
            onPress={() => router.push('/gallery')}
          >
            Galería
          </Button>
        </XStack>
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  previewCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bottomBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
});
