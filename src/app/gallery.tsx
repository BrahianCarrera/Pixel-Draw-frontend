import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  View,
  StyleSheet,
  useColorScheme,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Paragraph,
  Card,
  Button,
  Spinner,
  H3,
  Separator,
} from 'tamagui';
import { Heart, Plus, Calendar, UserIcon, X, RefreshCw, Star } from '../components/icons';
import { useAuth } from '../context/auth-context';
import { api, Artwork } from '../services/api';
import { PixelPreview } from '../components/canvas/PixelPreview';

export default function GalleryScreen() {
  const router = useRouter();
  const { user, couple, latestArtwork, syncNow } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  const fetchArtworks = useCallback(async () => {
    if (!couple?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.artworks.getCoupleArtworks(couple.id, 1, 10);
      setArtworks(data.artworks);
    } catch (err) {
      console.warn('Error al obtener la galería:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [couple?.id]);

  // Recargar al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      syncNow();
      fetchArtworks();
    }, [syncNow, fetchArtworks])
  );

  // Si el auto-sync global detecta un nuevo dibujo, refrescar la lista en tiempo real
  useEffect(() => {
    if (latestArtwork?.id) {
      fetchArtworks();
    }
  }, [latestArtwork?.id, fetchArtworks]);

  const onRefresh = () => {
    setIsRefreshing(true);
    syncNow();
    fetchArtworks();
  };

  if (!user) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$3">
        <Heart size={48} color="#e11d48" />
        <H3 textAlign="center">Inicia sesión para ver tu galería</H3>
        <Button theme="active" backgroundColor="#e11d48" color="white" onPress={() => router.push('/auth')}>
          Iniciar Sesión
        </Button>
      </YStack>
    );
  }

  if (!couple) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$3">
        <Heart size={48} color="#e11d48" />
        <H3 textAlign="center">Aún no estás en una pareja</H3>
        <Paragraph textAlign="center" color="$colorFocus">
          Vincula tu cuenta con tu pareja para empezar a compartir dibujos.
        </Paragraph>
        <Button theme="active" backgroundColor="#e11d48" color="white" onPress={() => router.push('/couple')}>
          Vincular Pareja
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#e11d48']}
            progressBackgroundColor={isDark ? '#1e1e24' : '#ffffff'}
          />
        }
      >
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
          <YStack>
            <XStack alignItems="center" gap="$1">
            <H3>Nuestra Galería </H3> 
            <Star size={24} color="#facc15" />
            </XStack>
            <Paragraph size="$2" color="$colorFocus">
              {artworks.length} {artworks.length === 1 ? 'dibujo compartido' : 'dibujos compartidos'}
            </Paragraph>
          </YStack>

          <XStack gap="$2" alignItems="center">
            <Button
              size="$3"
              chromeless
              icon={isRefreshing ? <Spinner size="small" /> : <RefreshCw size={16} />}
              disabled={isRefreshing || isLoading}
              onPress={onRefresh}
              accessibilityLabel="Actualizar galería"
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

        {isLoading ? (
          <YStack padding="$6" alignItems="center">
            <Spinner size="large" color="#e11d48" />
            <Paragraph marginTop="$2">Cargando recuerdos...</Paragraph>
          </YStack>
        ) : artworks.length === 0 ? (
          <Card borderWidth={1} borderColor="$borderColor" padding="$6" alignItems="center" gap="$3" borderRadius="$4">
            <Heart size={40} color="#fda4af" />
            <Text fontWeight="bold">Tu galería está vacía</Text>
            <Paragraph textAlign="center" color="$colorFocus" size="$2">
              Sé el primero en enviarle un dibujo romántico a tu pareja.
            </Paragraph>
            <Button theme="active" backgroundColor="#e11d48" color="white" onPress={() => router.push('/draw')}>
              Crear Primer Dibujo
            </Button>
          </Card>
        ) : (
          <XStack flexWrap="wrap" gap="$3" justifyContent="space-between">
            {artworks.map((art) => {
              const isMine = art.authorId === user.id;
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
                            {isMine ? 'Tú' : art.author?.username || 'Pareja'}
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

      {/* Modal de Detalle / Zoom */}
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
                  {selectedArtwork?.name || 'Dibujo de Pareja'}
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
                  <Text fontWeight="bold">
                    {selectedArtwork?.authorId === user?.id
                      ? 'Tú'
                      : selectedArtwork?.author?.username || 'Tu Pareja'}
                  </Text>
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
