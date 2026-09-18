import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import {
  Button,
  Card,
  H3,
  Paragraph,
  Separator,
  Spinner,
  Text,
  XStack,
  YStack,
} from 'tamagui';
import { Copy, Heart, LogOut, RefreshCw, UserCheck, UserPlus } from '../components/icons';
import { ThemedInput } from '../components/ui/ThemedInput';
import { useAuth } from '../context/auth-context';
import { api } from '../services/api';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { storage } from '../services/storage';

export default function CoupleScreen() {
  const router = useRouter();
  const { user, couple, refreshProfile, syncNow, logout } = useAuth();

  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Estados de diagnóstico de notificaciones push
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string>('Verificando...');
  const [isTestingPush, setIsTestingPush] = useState(false);

  const checkPushStatus = useCallback(async () => {
    try {
      const perms = await Notifications.getPermissionsAsync();
      setPushStatus(perms.granted ? 'Permitido ✅' : 'Denegado ❌');
      const savedToken = await storage.getItem('pixeldraw_push_token');
      if (savedToken) {
        setPushToken(savedToken);
      } else if (user?.id) {
        const token = await registerForPushNotificationsAsync(user.id);
        setPushToken(token);
      }
    } catch (e: any) {
      setPushStatus(`Error: ${e.message}`);
    }
  }, [user?.id]);

  // Sincronizar inmediatamente al abrir la pantalla
  useFocusEffect(
    useCallback(() => {
      syncNow();
      checkPushStatus();
    }, [syncNow, checkPushStatus])
  );

  const handleTestLocalNotification = async () => {
    try {
      setIsTestingPush(true);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '♥ PixelDraw Prueba Local',
          body: '¡El sistema de notificaciones de tu teléfono funciona correctamente!',
          sound: 'default',
        },
        trigger: null,
      });
      if (Platform.OS === 'android') {
        ToastAndroid.show('Notificación emitida con éxito', ToastAndroid.SHORT);
      } else {
        Alert.alert('Éxito', 'Notificación emitida.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo emitir la notificación');
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleRefreshPushToken = async () => {
    setIsTestingPush(true);
    try {
      const token = await registerForPushNotificationsAsync(user?.id);
      setPushToken(token);
      await checkPushStatus();
      if (token) {
        Alert.alert('Token listo', 'Token push obtenido y sincronizado con tu cuenta.');
      } else {
        Alert.alert('Aviso', 'No se pudo generar el token. Revisa si concediste los permisos de notificación.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsTestingPush(false);
    }
  };

  const isWaitingPartner = couple && (!couple.members || couple.members.length < 2);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await syncNow();
    } finally {
      setIsRefreshing(false);
    }
  }, [syncNow]);

  const handleCreateCouple = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setStatusMsg(null);
      await api.couples.create(user.id);
      await refreshProfile();
      setStatusMsg({
        type: 'success',
        text: '¡Pareja creada! Comparte el código de invitación con tu pareja.',
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al crear la pareja.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!user) return;
    if (!inviteCodeInput.trim()) {
      setStatusMsg({ type: 'error', text: 'Por favor ingresa un código de invitación.' });
      return;
    }

    try {
      setIsLoading(true);
      setStatusMsg(null);
      await api.couples.join(user.id, inviteCodeInput.trim().toUpperCase());
      await refreshProfile();
      setStatusMsg({
        type: 'success',
        text: '¡Te has vinculado exitosamente con tu pareja! ❤️',
      });
      setInviteCodeInput('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al unirse a la pareja.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!couple || !user) return;
    try {
      setIsLoading(true);
      setStatusMsg(null);
      await api.couples.regenerateCode(couple.id, user.id);
      await refreshProfile();
      setStatusMsg({ type: 'success', text: 'Nuevo código generado con éxito.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al regenerar código.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveCouple = async () => {
    if (!user) return;

    const performLeave = async () => {
      try {
        setIsLoading(true);
        await api.couples.leave(user.id);
        await refreshProfile();
        setStatusMsg({ type: 'success', text: 'Te has desvinculado de la pareja.' });
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err.message || 'Error al desvincularte.' });
      } finally {
        setIsLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('¿Estás seguro de que deseas desvincularte de tu pareja?')) {
        performLeave();
      }
    } else {
      Alert.alert(
        'Desvincular pareja',
        '¿Estás seguro de que deseas desvincularte de tu pareja?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Desvincular', style: 'destructive', onPress: performLeave },
        ]
      );
    }
  };

  const copyToClipboard = (text: string) => {
    if (Platform.OS === 'web' && navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      alert('¡Código copiado al portapapeles!');
    } else if (Platform.OS === 'android') {
      ToastAndroid.show(`Código ${text} copiado al portapapeles ❤️`, ToastAndroid.SHORT);
    } else {
      Alert.alert('Código Copiado', `El código ${text} ha sido copiado.`);
    }
  };

  if (!user) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$3">
        <Heart size={48} color="#e11d48" />
        <H3 textAlign="center">Inicia sesión para gestionar tu pareja</H3>
        <Button theme="active" backgroundColor="#e11d48" color="white" onPress={() => router.push('/auth')}>
          Iniciar Sesión
        </Button>
      </YStack>
    );
  }

  const partner = couple?.members?.find((m) => m.id !== user.id);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      style={{ flex: 1 }}
    >
      <Pressable onPress={Keyboard.dismiss} accessible={false} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: Platform.OS === 'android' ? 60 : 40,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#e11d48']}
            />
          }
        >
      <YStack gap="$4" maxWidth={440} width="100%" alignSelf="center">
        {/* Encabezado */}
        <YStack alignItems="center" gap="$2">
          <Heart size={36} color="#e11d48" />
          <XStack alignItems="center" gap="$2">
            <H3 textAlign="center">Estado de Pareja</H3>
            <Button
              size="$2"
              chromeless
              icon={isRefreshing ? <Spinner size="small" /> : <RefreshCw size={16} />}
              disabled={isRefreshing || isLoading}
              onPress={onRefresh}
              accessibilityLabel="Actualizar estado"
              aria-label="Actualizar estado"
            />
          </XStack>
          <Paragraph size="$2" color="$colorFocus" textAlign="center">
            Conectado como <Text fontWeight="bold">@{user.username}</Text>
          </Paragraph>
        </YStack>

        {statusMsg && (
          <Card
            backgroundColor={
              statusMsg.type === 'success'
                ? 'rgba(34, 197, 94, 0.15)'
                : 'rgba(225, 29, 72, 0.15)'
            }
            padding="$3"
            borderRadius="$3"
          >
            <Paragraph
              color={statusMsg.type === 'success' ? '#22c55e' : '#f43f5e'}
              size="$2"
              textAlign="center"
            >
              {statusMsg.text}
            </Paragraph>
          </Card>
        )}

        {/* Caso 1: Usuario ya está emparejado completamente */}
        {couple && partner && (
          <Card borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" gap="$3">
            <XStack alignItems="center" gap="$2">
              <UserCheck size={24} color="#22c55e" />
              <Text fontSize={18} fontWeight="bold" color="#22c55e">
                ¡Emparejados! 
              </Text>
            </XStack>

            <Separator />

            <YStack gap="$2">
              <XStack justifyContent="space-between">
                <Paragraph size="$2" color="$colorFocus">Tu Pareja:</Paragraph>
                <Text fontWeight="bold">@{partner.username}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Paragraph size="$2" color="$colorFocus">Correo:</Paragraph>
                <Text>{partner.email}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Paragraph size="$2" color="$colorFocus">Juntos desde:</Paragraph>
                <Text>
                  {new Date(couple.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </XStack>
            </YStack>

            <Separator marginVertical="$2" />

            <Button
              theme="red"
              icon={<LogOut size={16} />}
              disabled={isLoading}
              onPress={handleLeaveCouple}
            >
              Desvincularme de esta pareja
            </Button>
          </Card>
        )}

        {/* Caso 2: Creador esperando que su pareja se una */}
        {isWaitingPartner && (
          <Card borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" gap="$3">
            <XStack alignItems="center" gap="$2">
              <Spinner size="small" color="#e11d48" />
              <Text fontSize={16} fontWeight="bold">
                Esperando a tu pareja...
              </Text>
            </XStack>

            <Paragraph size="$2" color="$colorFocus">
              Comparte este código exclusivo con tu pareja para que se una a tu espacio:
            </Paragraph>

            <Card
              borderWidth={1}
              borderColor="$borderColor"
              padding="$3"
              backgroundColor="$backgroundHover"
              alignItems="center"
              borderRadius="$3"
            >
              <Text fontSize={24} fontWeight="bold" letterSpacing={2} color="#e11d48">
                {couple.inviteCode}
              </Text>
            </Card>

            <XStack gap="$2">
              <Button
                flex={1}
                theme="active"
                backgroundColor="#e11d48"
                color="white"
                icon={<Copy size={16} color="white" />}
                onPress={() => couple.inviteCode && copyToClipboard(couple.inviteCode)}
              >
                Copiar Código
              </Button>
              <Button
                chromeless
                icon={<RefreshCw size={16} />}
                disabled={isLoading}
                onPress={handleRegenerateCode}
                accessibilityLabel="Regenerar código"
              />
            </XStack>

            <Button
              size="$3"
              theme="active"
              icon={isRefreshing ? <Spinner size="small" /> : <RefreshCw size={16} />}
              disabled={isRefreshing || isLoading}
              onPress={onRefresh}
            >
              Comprobar si mi pareja ya se unió
            </Button>

            <Separator marginVertical="$2" />

            <Button
              theme="red"
              size="$3"
              chromeless
              disabled={isLoading}
              onPress={handleLeaveCouple}
            >
              Cancelar y salir
            </Button>
          </Card>
        )}

        {/* Caso 3: Usuario aún no tiene ninguna pareja */}
        {!couple && (
          <YStack gap="$4">
            {/* Opción A: Crear nueva pareja */}
            <Card borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" gap="$3">
              <XStack alignItems="center" gap="$2">
                <UserPlus size={20} color="#e11d48" />
                <Text fontWeight="bold" fontSize={16}>Crear Nueva Pareja</Text>
              </XStack>
              <Paragraph size="$2" color="$colorFocus">
                Genera un código único para enviárselo a tu pareja e invitarla.
              </Paragraph>
              <Button
                theme="active"
                backgroundColor="#e11d48"
                color="white"
                disabled={isLoading}
                onPress={handleCreateCouple}
              >
                {isLoading ? 'Creando...' : 'Generar Código de Invitación'}
              </Button>
            </Card>

            {/* Opción B: Unirse con código */}
            <Card borderWidth={1} borderColor="$borderColor" padding="$4" borderRadius="$4" gap="$3">
              <Text fontWeight="bold" fontSize={16}>Tengo un Código de Invitación</Text>
              <Paragraph size="$2" color="$colorFocus">
                Si tu pareja ya creó el espacio, pega aquí su código (ej. PX-4A9B1C).
              </Paragraph>
              <ThemedInput
                placeholder="PX-XXXXXX"
                autoCapitalize="characters"
                autoCorrect={false}
                value={inviteCodeInput}
                onChangeText={setInviteCodeInput}
                returnKeyType="done"
                onSubmitEditing={handleJoinCouple}
              />
              <Button
                theme="active"
                backgroundColor="#e11d48"
                color="white"
                disabled={isLoading}
                pressStyle={{ opacity: 0.85, scale: 0.98 }}
                onPress={handleJoinCouple}
              >
                {isLoading ? 'Vinculando...' : 'Unirme a mi Pareja'}
              </Button>
            </Card>
          </YStack>
        )}

        {/* Diagnóstico de Notificaciones Push */}
        <Card borderWidth={1} borderColor="$borderColor" padding="$3.5" borderRadius="$4" gap="$2.5" backgroundColor="$backgroundHover">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold" fontSize={14} color="#e11d48">
              🔔 Estado de Notificaciones Push
            </Text>
            <Text fontSize={12} color="$colorFocus">
              {pushStatus}
            </Text>
          </XStack>

          <Paragraph size="$1" color="$colorFocus" numberOfLines={2}>
            {pushToken
              ? `Token: ${pushToken.slice(0, 30)}...`
              : 'Token no detectado aún en este dispositivo.'}
          </Paragraph>

          <XStack gap="$2" flexWrap="wrap">
            {pushToken && (
              <Button
                size="$2"
                theme="active"
                flex={1}
                icon={<Copy size={14} />}
                onPress={() => {
                  copyToClipboard(pushToken);
                  Alert.alert('Token copiado', 'Copiado al portapapeles. Puedes probarlo en https://expo.dev/notifications');
                }}
              >
                Copiar Token
              </Button>
            )}

            <Button
              size="$2"
              theme="active"
              backgroundColor="#e11d48"
              color="white"
              flex={1}
              disabled={isTestingPush}
              onPress={handleTestLocalNotification}
            >
              Probar Notificación
            </Button>

            <Button
              size="$2"
              chromeless
              disabled={isTestingPush}
              icon={isTestingPush ? <Spinner size="small" /> : <RefreshCw size={14} />}
              onPress={handleRefreshPushToken}
            >
              Re-vincular
            </Button>
          </XStack>
        </Card>

        <Separator marginVertical="$3" />

        {/* Botón de Cerrar Sesión de la cuenta */}
        <Button
          size="$3"
          chromeless
          icon={<LogOut size={16} />}
          pressStyle={{ opacity: 0.7 }}
          onPress={async () => {
            await logout();
            router.replace('/auth');
          }}
        >
          Cerrar Sesión (@{user.username})
        </Button>
      </YStack>
    </ScrollView>
  </Pressable>
</KeyboardAvoidingView>
  );
}
