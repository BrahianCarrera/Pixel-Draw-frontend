import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Spinner } from 'tamagui';
import { PixelPreview } from '../components/canvas/PixelPreview';
import { Heart, ImageIcon, Paintbrush, RefreshCw, Sparkles, Users, X } from '../components/icons';
import { PixelBadge, PixelButton, PixelCard, PixelDivider, PixelText } from '../components/ui/Pixel';
import { PX, pxColors } from '../constants/pixelTheme';
import { useAuth } from '../context/auth-context';

export default function HomeScreen() {
  const router = useRouter();
  const { user, couple, latestArtwork, syncNow, isLoading: isAuthLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const c = pxColors(isDark);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sync on focus
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
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <Spinner size="large" color={PX.colors.accent} />
      </View>
    );
  }

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg, padding: PX.space.xl }]}>
        {/* Big pixel heart */}
        <Text style={styles.bigEmoji}>♥</Text>
        <PixelText size="xl" color={PX.colors.accent} style={styles.landingTitle}>
          PIXEL{'\n'}DRAW
        </PixelText>
        <PixelText size="xs" color={c.textMuted} style={styles.landingSubtitle}>
          Dibuja píxeles{'\n'}para tu amor ❤
        </PixelText>
        <PixelButton
          label="INICIAR SESIÓN"
          onPress={() => router.push('/auth')}
          size="lg"
          fullWidth
          style={{ marginTop: PX.space['2xl'] }}
        />
      </View>
    );
  }

  const partner = couple?.members?.find((m) => m.id !== user.id);

  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[PX.colors.accent]}
            progressBackgroundColor={isDark ? '#1e1e24' : '#f0f0f8'}
            tintColor={PX.colors.accent}
          />
        }
      >
        <View style={styles.inner}>

          {/* ── Status card ─────────────────────────────────────────────── */}
          <PixelCard style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <View style={styles.usernameRow}>
                  <PixelText size="sm" color={PX.colors.accent}>
                    @{user.username}
                  </PixelText>
                  <Sparkles size={16} color={PX.colors.gold} style={{ marginLeft: 6 }} />
                </View>
                <View style={styles.partnerRow}>
                  {partner ? (
                    <>
                      <Heart size={12} color={PX.colors.accent} />
                      <PixelText size="xxs" color={c.textMuted} style={{ marginLeft: 6 }}>
                        con @{partner.username}
                      </PixelText>
                    </>
                  ) : (
                    <>
                      <X size={12} color={PX.colors.textDim} />
                      <PixelText size="xxs" color={c.textMuted} style={{ marginLeft: 6 }}>
                        sin pareja vinculada
                      </PixelText>
                    </>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/couple')}
                style={[styles.iconBtn, { borderColor: c.border }]}
              >
                <Users size={18} color={PX.colors.accent} />
              </TouchableOpacity>
            </View>
          </PixelCard>

          {/* ── Section header ──────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <PixelText size="xs" color={c.text}>
              ULTIMO DIBUJO
            </PixelText>
            <View style={styles.sectionActions}>
              <TouchableOpacity onPress={onRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <Spinner size="small" color={PX.colors.accent} />
                ) : (
                  <RefreshCw size={14} color={c.textMuted} />
                )}
              </TouchableOpacity>
              
            </View>
          </View>

          {/* ── Main artwork area ────────────────────────────────────────── */}
          {!couple ? (
            // No couple linked
            <PixelCard accentBorder style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>💕</Text>
              <PixelText size="xs" color={PX.colors.accent} style={styles.emptyTitle}>
                VINCULA TU CUENTA
              </PixelText>
              <PixelText size="xxs" color={c.textMuted} style={styles.emptyBody}>
                Genera un código{'\n'}y compártelo con tu pareja
              </PixelText>
              <PixelButton
                label="VINCULAR"
                onPress={() => router.push('/couple')}
                style={{ marginTop: PX.space.md }}
              />
            </PixelCard>
          ) : latestArtwork ? (
            // Has artwork
            <PixelCard style={styles.artCard}>
              {/* Author badge */}
              <View style={styles.artBadgeRow}>
                {latestArtwork.authorId === user.id ? (
                  <PixelBadge label="TÚ" bgColor={PX.colors.accent} />
                ) : (
                  <PixelBadge
                    label={latestArtwork.author?.username?.toUpperCase() ?? 'PAREJA'}
                    bgColor={PX.colors.bgCard}
                    color={PX.colors.accent}
                  />
                )}
                <PixelText size="xxs" color={c.textMuted}>
                  {new Date(latestArtwork.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </PixelText>
              </View>

              {/* Canvas preview */}
              <View style={styles.canvasWrap}>
                <PixelPreview grid={latestArtwork.grid} size={280} borderRadius={0} />
                {/* Pixel corner decorations */}
                <View style={[styles.corner, styles.cornerTL, { borderColor: PX.colors.accent }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: PX.colors.accent }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: PX.colors.accent }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: PX.colors.accent }]} />
              </View>

              <PixelDivider />

              {/* Title + CTA */}
              <View style={styles.artMeta}>
                <PixelText size="xs" color={c.text} numberOfLines={1} style={styles.artTitle}>
                  {latestArtwork.name || 'DIBUJO DE AMOR'}
                </PixelText>
                <PixelButton
                  label="RESPONDER"
                  onPress={() => router.push('/draw')}
                  size="sm"
                  icon={<Paintbrush size={14} color={PX.colors.white} />}
                />
              </View>
            </PixelCard>
          ) : (
            // Coupled but no artwork yet
            <PixelCard accentBorder style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🎨</Text>
              <PixelText size="xs" color={c.text} style={styles.emptyTitle}>
                LIENZO VACÍO
              </PixelText>
              <PixelText size="xxs" color={c.textMuted} style={styles.emptyBody}>
                ¡Sé el primero en{'\n'}dibujar algo lindo!
              </PixelText>
              <PixelButton
                label="CREAR"
                onPress={() => router.push('/draw')}
                icon={<Paintbrush size={14} color={PX.colors.white} />}
                style={{ marginTop: PX.space.md }}
              />
            </PixelCard>
          )}
        </View>
      </ScrollView>

      {/* ── Bottom action bar ───────────────────────────────────────────── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: isDark ? '#111118' : '#f0f0f8',
            borderTopColor: PX.colors.accent,
          },
        ]}
      >
        <View style={styles.bottomInner}>
          <PixelButton
            label="DIBUJAR"
            onPress={() => router.push('/draw')}
            size="lg"
            fullWidth={false}
            icon={<Paintbrush size={16} color={PX.colors.white} />}
            style={styles.bottomBtn}
          />
          <PixelButton
            label="GALERIA"
            variant="secondary"
            onPress={() => router.push('/gallery')}
            size="lg"
            fullWidth={false}
            icon={<ImageIcon size={16} color={PX.colors.accent} />}
            style={styles.bottomBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: PX.space.lg, paddingBottom: PX.space['2xl'] },
  inner: { maxWidth: 480, width: '100%', alignSelf: 'center', gap: PX.space.lg },

  // Landing
  landingTitle: { textAlign: 'center', marginTop: PX.space.md, lineHeight: 40 },
  landingSubtitle: { textAlign: 'center', marginTop: PX.space.md },
  bigEmoji: { fontSize: 64 },

  // Status card
  statusCard: { padding: PX.space.md },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLeft: { gap: 6 },
  usernameRow: { flexDirection: 'row', alignItems: 'center' },
  partnerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderRadius: PX.border.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionActions: { flexDirection: 'row', alignItems: 'center' },

  // Empty card
  emptyCard: { alignItems: 'center', padding: PX.space.xl, gap: PX.space.sm },
  emptyEmoji: { fontSize: 48, marginBottom: PX.space.xs },
  emptyTitle: { textAlign: 'center' },
  emptyBody: { textAlign: 'center', lineHeight: 20 },

  // Art card
  artCard: { padding: PX.space.md, gap: PX.space.sm },
  artBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canvasWrap: { position: 'relative', alignItems: 'center' },
  artMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  artTitle: { flex: 1, marginRight: PX.space.sm },

  // Pixel corner decorations
  corner: { position: 'absolute', width: 12, height: 12, borderWidth: 2 },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },

  // Bottom bar
  bottomBar: {
    borderTopWidth: 2,
    paddingHorizontal: PX.space.lg,
    paddingVertical: PX.space.sm,
    paddingBottom: PX.space.md,
  },
  bottomInner: {
    flexDirection: 'row',
    gap: PX.space.sm,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  bottomBtn: { flex: 1 },
});
