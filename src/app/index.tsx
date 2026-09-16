import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, View, StyleSheet, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  YStack,
  XStack,
  Text,
  Paragraph,
  Card,
  Button,
  Spinner,
  H2,
  H4,
  Separator,
} from 'tamagui';
import {
  Heart,
  Paintbrush,
  ImageIcon,
  Users,
  Calendar,
  UserIcon,
  RefreshCw,
  ClockFading,
  Sparkles,
  X,
} from '../components/icons';
import { useAuth } from '../context/auth-context';
import { PixelPreview } from '../components/canvas/PixelPreview';

export default function HomeScreen() {
  const router = useRouter();
  const { user, couple, latestArtwork, syncNow, isLoading: isAuthLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sincronizar automáticamente al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      syncNow();
    }, [syncNow])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await syncNow();
    setIsRefreshing(false);
  };

  if (isAuthLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="#e11d48" />
      </YStack>
    );
  }

  // Si no está autenticado
  if (!user) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$4">
        <Heart size={64} color="#e11d48" />
        <H2 textAlign="center" color="#e11d48">PixelDraw</H2>
        <Paragraph textAlign="center" maxWidth={320} color="$colorFocus">
          Dibuja en tiempo real y comparte notas de amor en píxeles directamente con tu pareja.
        </Paragraph>
        <Button
          size="$4"
          theme="active"
          backgroundColor="#e11d48"
          color="white"
          onPress={() => router.push('/auth')}
        >
          Iniciar Sesión / Registrarme
        </Button>
      </YStack>
    );
  }

  const partner = couple?.members?.find((m) => m.id !== user.id);

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#e11d48']}
            progressBackgroundColor={isDark ? '#1e1e24' : '#ffffff'}
          />
        }
      >
      <YStack gap="$4" maxWidth={480} width="100%" alignSelf="center">
        {/* Banner superior de Estado de Pareja */}
        <Card borderWidth={1} borderColor="$borderColor" padding="$3" borderRadius="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <YStack gap="$1">
              <XStack>
              <Text fontSize={20} fontWeight="bold">
                ¡Hola, @{user.username}! 
              </Text>
              <Sparkles size={24} color="#facc15" style={{ marginLeft: 4, marginTop: 2 }} />
              </XStack>
              
              <XStack alignItems="center" gap="$1">
              {partner ? (
                <XStack alignItems="center" gap="$2">
                <Heart size={16} color="#e11d48" /> 
                <Paragraph size="$2" color="$colorFocus">
                  Estás vinculado con @{partner.username}
                </Paragraph>
              </XStack>
              ) : (
                <XStack alignItems="center" gap="$2">
                <X size={16} color="#e11d48" /> 
                <Paragraph size="$2" color="$colorFocus">
                  Aún no tienes pareja vinculada.
              </Paragraph>
                </XStack>
              )}
              
              </XStack>
            </YStack>

            <Button
              size="$2"
              theme="active"
              chromeless
              icon={<Users size={24} />}
              onPress={() => router.push('/couple')}
            >
              Pareja
            </Button>
          </XStack>
        </Card>

        {/* Tarjeta Principal: Último dibujo de la pareja */}
        <YStack gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$2">
              <ClockFading size={18} color="#e11d48" />
              <H4>Ultimo Dibujo</H4>
            </XStack>
            <XStack alignItems="center" gap="$1">
              <Button
                size="$2"
                chromeless
                icon={isRefreshing ? <Spinner size="small" /> : <RefreshCw size={14} />}
                disabled={isRefreshing}
                onPress={onRefresh}
                accessibilityLabel="Actualizar lienzo"
              />
              {latestArtwork && (
                <Button
                  size="$2"
                  chromeless
                  onPress={() => router.push('/gallery')}
                >
                  Ver galería
                </Button>
              )}
            </XStack>
          </XStack>

          {!couple ? (
            <Card borderWidth={1} borderColor="$borderColor" padding="$5" alignItems="center" gap="$3" borderRadius="$4">
              <Heart size={36} color="#fda4af" />
              <Text fontWeight="bold" textAlign="center">
                Vincula tu cuenta para compartir dibujos
              </Text>
              <Paragraph textAlign="center" color="$colorFocus" size="$2">
                Genera un código o ingresa el de tu pareja para sincronizar su lienzo.
              </Paragraph>
              <Button
                theme="active"
                backgroundColor="#e11d48"
                color="white"
                onPress={() => router.push('/couple')}
              >
                Vincular Pareja
              </Button>
            </Card>
          ) : latestArtwork ? (
            <Card borderWidth={1} borderColor="$borderColor" padding="$3.5" borderRadius="$4" gap="$3">
              <View style={styles.previewCenter}>
                <PixelPreview grid={latestArtwork.grid} size={280} borderRadius={10} />
              </View>

              <Separator />

              <XStack justifyContent="space-between" alignItems="center">
                <YStack gap="$1">
                  <Text fontWeight="bold" fontSize={16}>
                    {latestArtwork.name || 'Dibujo de amor'}
                  </Text>
                  <XStack gap="$3">
                    <XStack alignItems="center" gap="$1">
                      <UserIcon size={12} color="#888" />
                      <Paragraph size="$1" color="$colorFocus">
                        {latestArtwork.authorId === user.id
                          ? 'Tú'
                          : latestArtwork.author?.username || 'Tu Pareja'}
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
                  icon={<Paintbrush size={24} color="white" />}
                  
                  onPress={() => router.push('/draw')}
                >
                  Responder
                </Button>
              </XStack>
            </Card>
          ) : (
            <Card borderWidth={1} borderColor="$borderColor" padding="$5" alignItems="center" gap="$3" borderRadius="$4">
              <Heart size={40} color="#fda4af" />
              <Text fontWeight="bold">El lienzo está esperando su primer dibujo</Text>
              <Paragraph textAlign="center" color="$colorFocus" size="$2">
                Dibuja algo lindo para que aparezca aquí cuando tu pareja abra la app.
              </Paragraph>
              <Button
                theme="active"
                backgroundColor="#e11d48"
                color="white"
                icon={<Paintbrush size={24} color="white" />}
                onPress={() => router.push('/draw')}
              >
                Crear Primer Dibujo
              </Button>
            </Card>
          )}
        </YStack>

      </YStack>
    </ScrollView>

    {/* Barra inferior fija de Accesos Rápidos respetando la navbar / safe area */}
    <YStack
      borderTopWidth={1}
      borderTopColor="$borderColor"
      backgroundColor={isDark ? '#121214' : '#ffffff'}
      paddingHorizontal="$4"
      paddingTop="$3"
      paddingBottom={12}
      style={styles.bottomBar}
    >
      <XStack gap="$2" maxWidth={480} width="100%" alignSelf="center">
        <Button
          flex={1}
          size="$4"
          theme="active"
          backgroundColor="#e11d48"
          color="white"
          icon={<Paintbrush size={24} color="white" />}
          onPress={() => router.push('/draw')}
        >
          Dibujar
        </Button>
        <Button
          flex={1}
          size="$4"
          borderWidth={1}
          borderColor="$borderColor"
          icon={<ImageIcon size={24} />}
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
    paddingBottom: 24,
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
