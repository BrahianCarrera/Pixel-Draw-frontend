import React, { useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Modal,
  View,
  StyleSheet,
  useColorScheme,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Paragraph,
  Card,
  Button,
  H3,
  Separator,
} from 'tamagui';
import { Heart, Plus, Calendar, UserIcon, X, RotateCcw, Star } from '../components/icons';
import { PixelPreview } from '../components/canvas/PixelPreview';
import { DemoArtwork, useDemoArtworks } from '../context/demo-artwork-context';

export default function GalleryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { artworks, resetDemo } = useDemoArtworks();

  const [selectedArtwork, setSelectedArtwork] = useState<DemoArtwork | null>(null);

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
          <YStack flex={1}>
            <XStack alignItems="center" gap="$1">
              <H3>Galería demo</H3>
              <Star size={24} color="#facc15" />
            </XStack>
            <Paragraph size="$2" color="$colorFocus">
              {artworks.length} {artworks.length === 1 ? 'dibujo guardado' : 'dibujos guardados'}
            </Paragraph>
          </YStack>

          <XStack gap="$2" alignItems="center">
            <Button
              size="$3"
              chromeless
              icon={<RotateCcw size={16} />}
              onPress={resetDemo}
              aria-label="Reiniciar demo"
            />
            <Button
              size="$3"
              theme="active"
              backgroundColor="#e11d48"
              color="white"
              icon={<Plus size={16} color="white" />}
              onPress={() => router.push('/draw')}
            >
              Nuevo
            </Button>
          </XStack>
        </XStack>

        {artworks.length === 0 ? (
          <Card borderWidth={1} borderColor="$borderColor" padding="$6" alignItems="center" gap="$3" borderRadius="$4">
            <Heart size={40} color="#fda4af" />
            <Text fontWeight="bold">La galería demo está vacía</Text>
            <Paragraph textAlign="center" color="$colorFocus" size="$2">
              Crea un dibujo para verlo aparecer aquí sin iniciar sesión.
            </Paragraph>
            <Button theme="active" backgroundColor="#e11d48" color="white" onPress={() => router.push('/draw')}>
              Crear primer dibujo
            </Button>
          </Card>
        ) : (
          <XStack flexWrap="wrap" gap="$3" justifyContent="space-between">
            {artworks.map((art) => {
              const dateStr = new Date(art.createdAt).toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <TouchableOpacity
                  key={art.id}
                  style={styles.cardWrapper}
                  onPress={() => setSelectedArtwork(art)}
                  activeOpacity={0.8}
                >
                  <Card borderWidth={1} borderColor="$borderColor" padding="$2.5" borderRadius="$4" gap="$2">
                    <View style={styles.previewContainer}>
                      <PixelPreview grid={art.grid} size={150} />
                    </View>
                    <YStack gap="$1">
                      <Text fontWeight="bold" numberOfLines={1} fontSize={14}>
                        {art.name || 'Sin título'}
                      </Text>
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack alignItems="center" gap="$1">
                          <UserIcon size={12} color="#888" />
                          <Paragraph size="$1" color="$colorFocus">
                            @{art.author.username}
                          </Paragraph>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                          <Calendar size={12} color="#888" />
                          <Paragraph size="$1" color="$colorFocus">
                            {dateStr}
                          </Paragraph>
                        </XStack>
                      </XStack>
                    </YStack>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </XStack>
        )}
      </ScrollView>

      <Modal
        visible={!!selectedArtwork}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedArtwork(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedArtwork(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ width: '90%', maxWidth: 380 }}
          >
            <Card
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor={isDark ? '#18181f' : '#ffffff'}
              padding="$4"
              width="100%"
              borderRadius="$4"
              gap="$3"
              style={Platform.OS === 'ios' ? { borderCurve: 'continuous' } : undefined}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <H3 numberOfLines={1} flex={1}>
                  {selectedArtwork?.name || 'Dibujo demo'}
                </H3>
                <Button
                  size="$2"
                  circular
                  chromeless
                  icon={<X size={18} />}
                  pressStyle={{ opacity: 0.7 }}
                  onPress={() => setSelectedArtwork(null)}
                />
              </XStack>

              <View style={styles.modalCanvasContainer}>
                {selectedArtwork && (
                  <PixelPreview grid={selectedArtwork.grid} size={280} borderRadius={12} />
                )}
              </View>

              <Separator />

              <YStack gap="$1">
                <XStack justifyContent="space-between">
                  <Paragraph size="$2" color="$colorFocus">Creado por:</Paragraph>
                  <Text fontWeight="bold">@{selectedArtwork?.author.username}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Paragraph size="$2" color="$colorFocus">Fecha:</Paragraph>
                  <Text>
                    {selectedArtwork &&
                      new Date(selectedArtwork.createdAt).toLocaleString('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                  </Text>
                </XStack>
              </YStack>

              <Button
                theme="active"
                backgroundColor="#e11d48"
                color="white"
                pressStyle={{ opacity: 0.85, scale: 0.98 }}
                onPress={() => setSelectedArtwork(null)}
              >
                Cerrar
              </Button>
            </Card>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </YStack>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCanvasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
