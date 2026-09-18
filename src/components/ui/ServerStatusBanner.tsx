import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useServerStatus } from '../../context/server-status-context';
import { RefreshCw, Sparkles, X, Clock } from '../icons';

export const ServerStatusBanner: React.FC = () => {
  const {
    status,
    isWaking,
    isOnline,
    isOffline,
    message,
    attempt,
    maxAttempts,
    retryNow,
    dismiss,
  } = useServerStatus();

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 8);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (status === 'idle') {
    return null;
  }

  if (isOnline) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: topPadding },
          styles.onlineContainer,
          isDark && styles.onlineContainerDark,
        ]}
      >
        <View style={styles.leftRow}>
          <Sparkles size={16} color="#ffffff" />
          <Text style={styles.onlineText}>
            {message || 'Servidor conectado y listo'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
          accessibilityLabel="Cerrar notificación"
        >
          <X size={14} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
    );
  }

  if (isWaking) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: topPadding },
          styles.wakingContainer,
          isDark && styles.wakingContainerDark,
        ]}
      >
        <View style={styles.leftRow}>
          <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />
          <View style={styles.textColumn}>
            <Text style={styles.wakingTitle}>
              Despertando servidor en la nube...
            </Text>
            <Text style={styles.wakingSubtitle}>
              {message || `El servicio gratuito de Render está arrancando (${attempt}/${maxAttempts})`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
          accessibilityLabel="Cerrar notificación"
        >
          <X size={14} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
    );
  }

  if (isOffline) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: topPadding },
          styles.offlineContainer,
          isDark && styles.offlineContainerDark,
        ]}
      >
        <View style={styles.leftRow}>
          <Clock size={16} color="#ffffff" />
          <View style={styles.textColumn}>
            <Text style={styles.offlineTitle}>Servidor en reposo</Text>
            <Text style={styles.offlineSubtitle}>
              {message || 'El arranque tardó más de lo esperado.'}
            </Text>
          </View>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={retryNow}
            style={styles.retryBtn}
            accessibilityLabel="Reintentar conexión"
          >
            <RefreshCw size={12} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={dismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.closeBtn}
            accessibilityLabel="Cerrar notificación"
          >
            <X size={14} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  textColumn: {
    marginLeft: 8,
    flex: 1,
  },
  spinner: {
    marginRight: 2,
  },
  closeBtn: {
    padding: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  // retryText is defined below with pixel font
  // Waking
  wakingContainer: {
    backgroundColor: '#d97706', // amber-600
  },
  wakingContainerDark: {
    backgroundColor: '#b45309', // amber-700
  },
  wakingTitle: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'PressStart2P',
    lineHeight: 16,
  },
  wakingSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 7,
    fontFamily: 'PressStart2P',
    lineHeight: 14,
    marginTop: 2,
  },
  // Online
  onlineContainer: {
    backgroundColor: '#059669', // emerald-600
  },
  onlineContainerDark: {
    backgroundColor: '#047857', // emerald-700
  },
  onlineText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'PressStart2P',
    lineHeight: 16,
    marginLeft: 8,
  },
  // Offline
  offlineContainer: {
    backgroundColor: '#e11d48', // rose-600
  },
  offlineContainerDark: {
    backgroundColor: '#be123c', // rose-700
  },
  offlineTitle: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'PressStart2P',
    lineHeight: 16,
  },
  offlineSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 7,
    fontFamily: 'PressStart2P',
    lineHeight: 14,
    marginTop: 2,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 7,
    fontFamily: 'PressStart2P',
    lineHeight: 14,
  },
});
