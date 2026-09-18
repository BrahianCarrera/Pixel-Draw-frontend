import React, { useState, useRef } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Spinner } from 'tamagui';
import { useAuth } from '../context/auth-context';
import { ThemedInput } from '../components/ui/ThemedInput';
import { PixelButton, PixelCard, PixelDivider, PixelText } from '../components/ui/Pixel';
import { PX, pxColors } from '../constants/pixelTheme';

type Tab = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const { login, register } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const c = pxColors(isDark);

  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Field refs for fluid keyboard navigation
  const loginPasswordRef = useRef<RNTextInput>(null);
  const regUsernameRef = useRef<RNTextInput>(null);
  const regPasswordRef = useRef<RNTextInput>(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!emailOrUsername.trim() || !password.trim()) {
      setErrorMsg('Completa todos los campos.');
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
      setErrorMsg('Completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Contraseña mínimo 6 caracteres.');
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

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setErrorMsg(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <Pressable onPress={Keyboard.dismiss} accessible={false} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Platform.OS === 'android' ? 40 : 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>

            {/* ── Logo / Header ───────────────────────────────────────── */}
            <View style={styles.logoArea}>
              <Text style={styles.logoHeart}>♥</Text>
              <PixelText size="xl" color={PX.colors.accent} style={styles.logoTitle}>
                PIXEL{'\n'}DRAW
              </PixelText>
              <PixelText size="xxs" color={c.textMuted} style={styles.logoSub}>
                Dibujos de amor en píxeles
              </PixelText>
            </View>

            {/* ── Tab switcher ─────────────────────────────────────────── */}
            <View style={[styles.tabBar, { borderColor: c.border }]}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  activeTab === 'login' && {
                    backgroundColor: PX.colors.accent,
                    borderColor: PX.colors.accentHover,
                  },
                  activeTab !== 'login' && { borderColor: 'transparent' },
                ]}
                onPress={() => switchTab('login')}
                activeOpacity={0.8}
              >
                <PixelText
                  size="xs"
                  color={activeTab === 'login' ? PX.colors.white : c.textMuted}
                >
                  ENTRAR
                </PixelText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  activeTab === 'register' && {
                    backgroundColor: PX.colors.accent,
                    borderColor: PX.colors.accentHover,
                  },
                  activeTab !== 'register' && { borderColor: 'transparent' },
                ]}
                onPress={() => switchTab('register')}
                activeOpacity={0.8}
              >
                <PixelText
                  size="xs"
                  color={activeTab === 'register' ? PX.colors.white : c.textMuted}
                >
                  CREAR
                </PixelText>
              </TouchableOpacity>
            </View>

            {/* ── Form card ────────────────────────────────────────────── */}
            <PixelCard accentBorder style={styles.formCard}>

              {/* Error banner */}
              {errorMsg && (
                <View style={styles.errorBanner}>
                  <PixelText size="xxs" color={PX.colors.danger}>
                    ✕ {errorMsg}
                  </PixelText>
                </View>
              )}

              {activeTab === 'login' ? (
                /* ── Login form ─── */
                <View style={styles.formFields}>
                  <View>
                    <PixelText size="xxs" color={c.textMuted} style={styles.label}>
                      USUARIO O EMAIL
                    </PixelText>
                    <ThemedInput
                      placeholder="pareja@pixeldraw.io"
                      value={emailOrUsername}
                      onChangeText={setEmailOrUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => loginPasswordRef.current?.focus()}
                      blurOnSubmit={false}
                      borderRadius={PX.border.radiusSm}
                      borderWidth={PX.border.width}
                    />
                  </View>
                  <View>
                    <PixelText size="xxs" color={c.textMuted} style={styles.label}>
                      CONTRASEÑA
                    </PixelText>
                    <ThemedInput
                      ref={loginPasswordRef}
                      placeholder="••••••••"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      borderRadius={PX.border.radiusSm}
                      borderWidth={PX.border.width}
                    />
                  </View>
                  <PixelButton
                    label={isLoading ? 'CARGANDO...' : 'ENTRAR →'}
                    onPress={handleLogin}
                    disabled={isLoading}
                    fullWidth
                    size="lg"
                    icon={isLoading ? <Spinner size="small" color={PX.colors.white} /> : undefined}
                  />
                </View>
              ) : (
                /* ── Register form ─── */
                <View style={styles.formFields}>
                  <View>
                    <PixelText size="xxs" color={c.textMuted} style={styles.label}>
                      EMAIL
                    </PixelText>
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
                      borderRadius={PX.border.radiusSm}
                      borderWidth={PX.border.width}
                    />
                  </View>
                  <View>
                    <PixelText size="xxs" color={c.textMuted} style={styles.label}>
                      USUARIO
                    </PixelText>
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
                      borderRadius={PX.border.radiusSm}
                      borderWidth={PX.border.width}
                    />
                  </View>
                  <View>
                    <PixelText size="xxs" color={c.textMuted} style={styles.label}>
                      CONTRASEÑA
                    </PixelText>
                    <ThemedInput
                      ref={regPasswordRef}
                      placeholder="Mín. 6 caracteres"
                      secureTextEntry
                      textContentType="newPassword"
                      value={password}
                      onChangeText={setPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleRegister}
                      borderRadius={PX.border.radiusSm}
                      borderWidth={PX.border.width}
                    />
                  </View>
                  <PixelButton
                    label={isLoading ? 'CARGANDO...' : 'REGISTRARME →'}
                    onPress={handleRegister}
                    disabled={isLoading}
                    fullWidth
                    size="lg"
                    icon={isLoading ? <Spinner size="small" color={PX.colors.white} /> : undefined}
                  />
                </View>
              )}
            </PixelCard>

            <PixelText size="xxs" color={c.textMuted} style={styles.footer}>
              ♥ PixelDraw — hecho con amor
            </PixelText>
          </View>
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: PX.space.xl },
  inner: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    gap: PX.space.lg,
  },

  // Logo
  logoArea: { alignItems: 'center', gap: PX.space.sm },
  logoHeart: { fontSize: 52 },
  logoTitle: { textAlign: 'center', lineHeight: 40 },
  logoSub: { textAlign: 'center' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: PX.border.radiusSm,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: PX.space.sm,
    alignItems: 'center',
    borderWidth: 0,
  },

  // Form
  formCard: { padding: PX.space.lg },
  formFields: { gap: PX.space.md },
  label: { marginBottom: 6 },

  // Error
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 2,
    borderColor: PX.colors.danger,
    padding: PX.space.sm,
    marginBottom: PX.space.sm,
    borderRadius: PX.border.radiusSm,
  },

  footer: { textAlign: 'center' },
});
