import React from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Card, Paragraph, H2 } from 'tamagui';
import { Heart, Paintbrush, ImageIcon } from '../components/icons';

export default function AuthScreen() {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap="$4" maxWidth={420} width="100%" alignSelf="center">
        <YStack alignItems="center" gap="$2">
          <XStack alignItems="center" gap="$2">
            <Heart size={36} color="#e11d48" />
            <H2 color="#e11d48">PixelDraw</H2>
          </XStack>
          <Paragraph textAlign="center" color="$colorFocus">
            Esta build de portfolio no incluye autenticación ni conexión al backend.
          </Paragraph>
        </YStack>

        <Card borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" gap="$3">
          <Text fontSize={18} fontWeight="bold">Modo demo activo</Text>
          <Paragraph color="$colorFocus">
            La experiencia abre directo al editor y guarda los dibujos localmente durante la sesión.
            Es una versión pensada para mostrar el producto en un portfolio o Snack.
          </Paragraph>

          <XStack gap="$2" flexWrap="wrap">
            <Button
              flex={1}
              minWidth={150}
              theme="active"
              backgroundColor="#e11d48"
              color="white"
              icon={<Paintbrush size={18} color="white" />}
              onPress={() => router.replace('/draw')}
            >
              Probar editor
            </Button>
            <Button
              flex={1}
              minWidth={150}
              borderWidth={1}
              borderColor="$borderColor"
              icon={<ImageIcon size={18} />}
              onPress={() => router.replace('/gallery')}
            >
              Galería
            </Button>
          </XStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}
