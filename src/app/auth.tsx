import React, { useState, useRef } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  TextInput as RNTextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  Paragraph,
  Tabs,
  SizableText,
} from 'tamagui';
import { Heart } from '../components/icons';
import { useAuth } from '../context/auth-context';
import { ThemedInput } from '../components/ui/ThemedInput';

export default function AuthScreen() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Field refs for fluid keyboard navigation on Android & iOS
  const loginPasswordRef = useRef<RNTextInput>(null);
  const regUsernameRef = useRef<RNTextInput>(null);
  const regPasswordRef = useRef<RNTextInput>(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!emailOrUsername.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      await login(emailOrUsername.trim(), password);
      router.replace('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !username.trim() || !password.trim()) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);
      await register(email.trim(), username.trim(), password);
      router.replace('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      style={{ flex: 1 }}
    >
      <Pressable onPress={Keyboard.dismiss} accessible={false} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 20,
            paddingBottom: Platform.OS === 'android' ? 40 : 20,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$4" maxWidth={420} width="100%" alignSelf="center">
            {/* Encabezado */}
            <YStack alignItems="center" gap="$2">
              <XStack alignItems="center" gap="$2">
                <Heart size={36} color="#e11d48" />
                <Text fontSize={28} fontWeight="bold" color="#e11d48">
                  PixelDraw
                </Text>
              </XStack>
              <Paragraph textAlign="center" color="$colorFocus">
                Comparte dibujos y notas de amor en tiempo real con tu pareja.
              </Paragraph>
            </YStack>

            {/* Tarjeta de Formulario */}
            <Card
              borderWidth={1}
              borderColor="$borderColor"
              padding="$4"
              borderRadius="$4"
              style={Platform.OS === 'ios' ? { borderCurve: 'continuous' } : undefined}
            >
              <Tabs
                value={activeTab}
                onValueChange={(val) => {
                  setActiveTab(val as 'login' | 'register');
                  setErrorMsg(null);
                }}
                orientation="horizontal"
                flexDirection="column"
                width="100%"
              >
                <Tabs.List marginBottom="$4" width="100%">
                  <Tabs.Tab flex={1} value="login">
                    <SizableText>Iniciar Sesión</SizableText>
                  </Tabs.Tab>
                  <Tabs.Tab flex={1} value="register">
                    <SizableText>Crear Cuenta</SizableText>
                  </Tabs.Tab>
                </Tabs.List>

                {errorMsg && (
                  <Card
                    backgroundColor="rgba(225, 29, 72, 0.15)"
                    padding="$3"
                    borderRadius="$3"
                    marginBottom="$3"
                  >
                    <Paragraph color="#f43f5e" size="$2">
                      {errorMsg}
                    </Paragraph>
                  </Card>
                )}

                {/* Pestaña: Iniciar Sesión */}
                <Tabs.Content value="login">
                  <YStack gap="$3">
                    <YStack gap="$1">
                      <Paragraph size="$2">Correo o Usuario</Paragraph>
                      <ThemedInput
                        placeholder="ej. pareja@pixeldraw.io o usuario"
                        value={emailOrUsername}
                        onChangeText={setEmailOrUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        onSubmitEditing={() => loginPasswordRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </YStack>

                    <YStack gap="$1">
                      <Paragraph size="$2">Contraseña</Paragraph>
                      <ThemedInput
                        ref={loginPasswordRef}
                        placeholder="••••••••"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                      />
                    </YStack>

                    <Button
                      marginTop="$2"
                      theme="active"
                      backgroundColor="#e11d48"
                      color="white"
                      disabled={isLoading}
                      pressStyle={{ opacity: 0.85, scale: 0.98 }}
                      onPress={handleLogin}
                    >
                      {isLoading ? 'Iniciando sesión...' : 'Entrar'}
                    </Button>
                  </YStack>
                </Tabs.Content>

                {/* Pestaña: Registro */}
                <Tabs.Content value="register">
                  <YStack gap="$3">
                    <YStack gap="$1">
                      <Paragraph size="$2">Correo Electrónico</Paragraph>
                      <ThemedInput
                        placeholder="amor@pixeldraw.io"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="emailAddress"
                        value={email}
                        onChangeText={setEmail}
                        returnKeyType="next"
                        onSubmitEditing={() => regUsernameRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </YStack>

                    <YStack gap="$1">
                      <Paragraph size="$2">Nombre de Usuario</Paragraph>
                      <ThemedInput
                        ref={regUsernameRef}
                        placeholder="mi_amor_123"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={username}
                        onChangeText={setUsername}
                        returnKeyType="next"
                        onSubmitEditing={() => regPasswordRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </YStack>

                    <YStack gap="$1">
                      <Paragraph size="$2">Contraseña</Paragraph>
                      <ThemedInput
                        ref={regPasswordRef}
                        placeholder="Mínimo 6 caracteres"
                        secureTextEntry
                        textContentType="newPassword"
                        value={password}
                        onChangeText={setPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleRegister}
                      />
                    </YStack>

                    <Button
                      marginTop="$2"
                      theme="active"
                      backgroundColor="#e11d48"
                      color="white"
                      disabled={isLoading}
                      pressStyle={{ opacity: 0.85, scale: 0.98 }}
                      onPress={handleRegister}
                    >
                      {isLoading ? 'Registrando...' : 'Registrarme'}
                    </Button>
                  </YStack>
                </Tabs.Content>
              </Tabs>
            </Card>
          </YStack>
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
