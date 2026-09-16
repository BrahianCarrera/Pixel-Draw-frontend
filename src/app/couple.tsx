import React from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Card, Paragraph, H3, Separator } from 'tamagui';
import { Heart, UserCheck, Paintbrush, ImageIcon } from '../components/icons';

export default function CoupleScreen() {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40,
        justifyContent: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap="$4" maxWidth={440} width="100%" alignSelf="center">
        <YStack alignItems="center" gap="$2">
          <Heart size={36} color="#e11d48" />
          <H3 textAlign="center">Modo portfolio</H3>
          <Paragraph size="$2" color="$colorFocus" textAlign="center">
            La conexión de pareja está representada con datos de ejemplo para mantener la demo
            rápida, privada y sin servidor.
          </Paragraph>
        </YStack>

        <Card borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" gap="$3">
          <XStack alignItems="center" gap="$2">
            <UserCheck size={24} color="#22c55e" />
            <Text fontSize={18} fontWeight="bold" color="#22c55e">
              Emparejamiento simulado
            </Text>
          </XStack>

          <Separator />

          <YStack gap="$2">
            <XStack justifyContent="space-between">
              <Paragraph size="$2" color="$colorFocus">Usuario demo:</Paragraph>
              <Text fontWeight="bold">@portfolio_demo</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Paragraph size="$2" color="$colorFocus">Pareja demo:</Paragraph>
              <Text fontWeight="bold">@pixel_muse</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Paragraph size="$2" color="$colorFocus">Backend:</Paragraph>
              <Text>Desactivado</Text>
            </XStack>
          </YStack>

          <Separator marginVertical="$2" />

          <XStack gap="$2" flexWrap="wrap">
            <Button
              flex={1}
              minWidth={150}
              theme="active"
              backgroundColor="#e11d48"
              color="white"
              icon={<Paintbrush size={18} color="white" />}
              onPress={() => router.push('/draw')}
            >
              Dibujar
            </Button>
            <Button
              flex={1}
              minWidth={150}
              borderWidth={1}
              borderColor="$borderColor"
              icon={<ImageIcon size={18} />}
              onPress={() => router.push('/gallery')}
            >
              Galería
            </Button>
          </XStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}
