import React, { useState } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Paragraph,
  Card,
} from 'tamagui';
import { Heart } from '../components/icons';
import { useAuth } from '../context/auth-context';
import { api } from '../services/api';
import { widgetService } from '../services/widget-service';
import { PixelCanvas } from '../components/canvas/PixelCanvas';
import { ThemedInput } from '../components/ui/ThemedInput';

export default function DrawScreen() {
  const router = useRouter();
  const { user, couple, syncNow } = useAuth();

  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSaveArtwork = async (grid: string[][]) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (!couple || !couple.id) {
      const msg = 'Debes estar vinculado a una pareja antes de enviar un dibujo.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Sin pareja vinculada', msg);
      }
      router.push('/couple');
      return;
    }

    try {
      setIsSaving(true);
      setStatusMsg(null);

      const created = await api.artworks.create({
        name: title.trim() || 'Dibujo con amor',
        width: grid.length,
        height: grid[0]?.length || grid.length,
        grid,
        coupleId: couple.id,
        authorId: user.id,
      });

      // Actualizar widget de pantalla de inicio inmediatamente
      await widgetService.updateLatestDrawing(created, user.id);

      // Sincronizar estado global inmediatamente
      await syncNow();

      const successText = '¡Tu dibujo ha sido enviado con éxito a tu pareja! ❤️';
      setStatusMsg({ type: 'success', text: successText });

      if (Platform.OS === 'web') {
        alert(successText);
      } else if (Platform.OS === 'android') {
        ToastAndroid.show(successText, ToastAndroid.SHORT);
      } else {
        Alert.alert('¡Enviado!', successText);
      }

      router.replace('/');
    } catch (err: any) {
      const errorText = err.message || 'Error al guardar el dibujo.';
      setStatusMsg({ type: 'error', text: errorText });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Barra de Título del Dibujo */}
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

      {/* Lienzo Interactivo */}
      <PixelCanvas onSave={handleSaveArtwork} isSaving={isSaving} />
    </YStack>
  );
}
