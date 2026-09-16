import React, { useState } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Paragraph, Card } from 'tamagui';
import { Heart } from '../components/icons';
import { PixelCanvas } from '../components/canvas/PixelCanvas';
import { ThemedInput } from '../components/ui/ThemedInput';
import { useDemoArtworks } from '../context/demo-artwork-context';

export default function DrawScreen() {
  const router = useRouter();
  const { saveArtwork } = useDemoArtworks();

  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSaveArtwork = async (grid: string[][]) => {
    try {
      setIsSaving(true);
      setStatusMsg(null);

      saveArtwork(title, grid);

      const successText = 'Demo guardada en esta sesión.';
      setStatusMsg({ type: 'success', text: successText });

      if (Platform.OS === 'web') {
        alert(successText);
      } else if (Platform.OS === 'android') {
        ToastAndroid.show(successText, ToastAndroid.SHORT);
      } else {
        Alert.alert('Guardado', successText);
      }

      router.replace('/gallery');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al guardar la demo.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack paddingHorizontal="$4" paddingTop="$3" gap="$2">
        <XStack alignItems="center" gap="$2">
          <Heart size={20} color="#e11d48" />
          <ThemedInput
            flex={1}
            placeholder="Título del dibujo"
            value={title}
            onChangeText={setTitle}
            size="$3"
            returnKeyType="done"
            blurOnSubmit={true}
            maxLength={50}
          />
        </XStack>

        {statusMsg && (
          <Card
            backgroundColor={
              statusMsg.type === 'success'
                ? 'rgba(34, 197, 94, 0.15)'
                : 'rgba(225, 29, 72, 0.15)'
            }
            padding="$2.5"
            borderRadius="$3"
          >
            <Paragraph
              color={statusMsg.type === 'success' ? '#22c55e' : '#f43f5e'}
              size="$2"
            >
              {statusMsg.text}
            </Paragraph>
          </Card>
        )}
      </YStack>

      <PixelCanvas
        onSave={handleSaveArtwork}
        isSaving={isSaving}
        saveLabel="Guardar demo"
        savingLabel="Guardando demo..."
      />
    </YStack>
  );
}
