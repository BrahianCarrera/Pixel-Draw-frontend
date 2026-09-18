import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { Spinner } from 'tamagui';
import { PixelPreview } from '../components/canvas/PixelPreview';
import { Heart, Paintbrush, Plus, RefreshCw, X } from '../components/icons';
import {
  PixelBadge,
  PixelButton,
  PixelCard,
  PixelDivider,
  PixelText,
} from '../components/ui/Pixel';
import { PX, pxColors } from '../constants/pixelTheme';
import { useAuth } from '../context/auth-context';
import { api, Artwork } from '../services/api';
import {
  getDominantColors,
  getFillPercent,
  isNew,
  timeAgo,
} from '../utils/artworkStats';

// ─── Card with web hover-zoom ─────────────────────────────────────────────────

interface ArtCardProps {
  art: Artwork;
  isMine: boolean;
  onPress: () => void;
  isDark: boolean;
  previewSize: number;
  isSingleCol: boolean;
}

function ArtCard({ art, isMine, onPress, isDark, previewSize, isSingleCol }: ArtCardProps) {
  const c = pxColors(isDark);

  // Derived stats (memoised per card instance)
  const palette  = useMemo(() => getDominantColors(art.grid, 5), [art.grid]);
  const fillPct  = useMemo(() => getFillPercent(art.grid),       [art.grid]);
  const ago      = timeAgo(art.createdAt);
  const fresh    = isNew(art.createdAt);
  const dims     = `${art.width ?? art.grid[0]?.length ?? '?'}×${art.height ?? art.grid.length ?? '?'}`;

  // Border colour: red = mine, indigo = theirs
  const borderColor = isMine ? PX.colors.accent : '#6366f1';

  // Web-only hover scale via Animated
  const scale = useRef(new Animated.Value(1)).current;
  const onHoverIn  = () =>
    Platform.OS === 'web' &&
    Animated.spring(scale, { toValue: 1.04, useNativeDriver: true, speed: 40 }).start();
  const onHoverOut = () =>
    Platform.OS === 'web' &&
    Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable
      onPress={onPress}
      // @ts-ignore — onHoverIn/Out are web-only React Native Web props
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={[styles.gridItem, isSingleCol && styles.gridItemFull]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          style={[
            styles.gridCard,
            {
              backgroundColor: c.bgCard,
              borderWidth: 2,
              borderColor,
              borderRadius: PX.border.radiusSm,
              // Pixel drop-shadow — matches border color
              shadowColor: borderColor,
              shadowOffset: { width: 3, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            },
          ]}
        >
          {/* ── Canvas preview (no overlay badges) ───────────────────────── */}
          <View style={styles.previewWrap}>
            <PixelPreview grid={art.grid} size={previewSize} borderRadius={0} />
          </View>

          {/* ── Color palette strip ────────────────────────────────────── */}
          {palette.length > 0 && (
            <View style={styles.paletteRow}>
              {palette.map((color, i) => (
                <View
                  key={i}
                  style={[
                    styles.paletteSwatch,
                    {
                      backgroundColor: color,
                      borderColor: c.border,
                      flex: i === palette.length - 1 ? 1 : 0,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          <PixelDivider />

          {/* ── Meta & Bottom Rows ────────────────────────────────────── */}
          <View style={[styles.meta, isSingleCol ? styles.metaSingleCol : styles.metaFixed]}>
            {/* Row 1: Title */}
            <View style={styles.titleRow}>
              <PixelText size="xs" numberOfLines={1} style={styles.artTitleText}>
                {art.name ? art.name.toUpperCase() : 'SIN TÍTULO'}
              </PixelText>
            </View>

            {/* Row 2: Badges and TimeAgo */}
            <View style={styles.badgesBottomRow}>
              <View style={styles.badgesLeftGroup}>
                <PixelBadge
                  label={isMine ? 'TÚ' : (art.author?.username?.toUpperCase() ?? 'PAREJA')}
                  bgColor={isMine ? PX.colors.accent : '#6366f1'}
                  color={PX.colors.white}
                  numberOfLines={1}
                  style={styles.authorBadge}
                />
                {fresh && (
                  <PixelBadge
                    label="NEW"
                    bgColor={PX.colors.gold}
                    color="#000000"
                  />
                )}
                <View style={[styles.dimsPill, { borderColor: c.border }]}>
                  <PixelText size="xxs" color={c.textMuted}>
                    {dims}
                  </PixelText>
                </View>
              </View>

              <PixelText size="xxs" color={c.textMuted} style={styles.timeAgoText} numberOfLines={1}>
                {ago}
              </PixelText>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function GalleryScreen() {
  const router = useRouter();
  const { user, couple, latestArtwork, syncNow } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const c = pxColors(isDark);
  const { width: windowWidth } = useWindowDimensions();

  // On phones (< 600px wide or non-web), show 1 drawing per row
  const isSingleCol = Platform.OS !== 'web' || windowWidth < 600;
  // Dynamic preview size to fill the card nicely
  const previewSize = useMemo(() => {
    if (isSingleCol) {
      // Content has padding around it; leave room for card padding & borders
      const availableWidth = Math.min(windowWidth - 48, 580);
      return Math.max(220, Math.floor(availableWidth - 16));
    }
    // Web desktop 2-col layout
    return 180;
  }, [isSingleCol, windowWidth]);

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  const fetchArtworks = useCallback(async () => {
    if (!couple?.id) { setIsLoading(false); return; }
    try {
      const data = await api.artworks.getCoupleArtworks(couple.id, 1, 10);
      setArtworks(data.artworks);
    } catch (err) {
      console.warn('Error al obtener la galería:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [couple?.id]);

  useFocusEffect(
    useCallback(() => { syncNow(); fetchArtworks(); }, [syncNow, fetchArtworks])
  );

  useEffect(() => {
    if (latestArtwork?.id) fetchArtworks();
  }, [latestArtwork?.id, fetchArtworks]);

  const onRefresh = () => { setIsRefreshing(true); syncNow(); fetchArtworks(); };

  // Selected artwork derived stats for modal
  const selPalette = useMemo(
    () => selectedArtwork ? getDominantColors(selectedArtwork.grid, 7) : [],
    [selectedArtwork]
  );
  const selFill = useMemo(
    () => selectedArtwork ? getFillPercent(selectedArtwork.grid) : 0,
    [selectedArtwork]
  );

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg, padding: PX.space.xl }]}>
        <Heart size={48} color={PX.colors.accent} />
        <PixelText size="sm" style={{ marginTop: PX.space.lg, textAlign: 'center' }}>
          INICIA SESIÓN
        </PixelText>
        <PixelButton label="ACCEDER" onPress={() => router.push('/auth')} style={{ marginTop: PX.space.lg }} />
      </View>
    );
  }

  // ── No couple ─────────────────────────────────────────────────────────────
  if (!couple) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg, padding: PX.space.xl }]}>
        <Text style={{ fontSize: 48 }}>💕</Text>
        <PixelText size="sm" style={{ marginTop: PX.space.lg, textAlign: 'center' }}>SIN PAREJA</PixelText>
        <PixelText size="xxs" color={c.textMuted} style={{ marginTop: PX.space.sm, textAlign: 'center' }}>
          Vincula tu cuenta para{'\n'}ver la galería compartida
        </PixelText>
        <PixelButton label="VINCULAR" onPress={() => router.push('/couple')} style={{ marginTop: PX.space.lg }} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <PixelText size="md">★ GALERIA</PixelText>
            <PixelText size="xxs" color={c.textMuted} style={{ marginTop: 6 }}>
              {artworks.length} {artworks.length === 1 ? 'dibujo' : 'dibujos'}
            </PixelText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onRefresh} disabled={isRefreshing || isLoading}>
              {isRefreshing || isLoading
                ? <Spinner size="small" color={PX.colors.accent} />
                : <RefreshCw size={16} color={c.textMuted} />}
            </TouchableOpacity>
            <PixelButton
              label="NUEVA"
              size="sm"
              onPress={() => router.push('/draw')}
              icon={<Plus size={12} color={PX.colors.white} />}
              style={{ marginLeft: PX.space.sm }}
            />
          </View>
        </View>

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        {isLoading ? (
          <View style={styles.center}>
            <Spinner size="large" color={PX.colors.accent} />
            <PixelText size="xxs" color={c.textMuted} style={{ marginTop: PX.space.md }}>CARGANDO...</PixelText>
          </View>
        ) : artworks.length === 0 ? (
          <PixelCard accentBorder style={styles.emptyCard}>
            <Text style={{ fontSize: 40 }}>🎨</Text>
            <PixelText size="xs" style={{ marginTop: PX.space.sm }}>GALERÍA VACÍA</PixelText>
            <PixelText size="xxs" color={c.textMuted} style={styles.emptyBody}>
              Sé el primero en{'\n'}compartir un dibujo
            </PixelText>
            <PixelButton label="CREAR" onPress={() => router.push('/draw')} style={{ marginTop: PX.space.md }} />
          </PixelCard>
        ) : (
          <View style={[styles.grid, isSingleCol && styles.gridSingleCol]}>
            {artworks.map((art) => (
              <ArtCard
                key={art.id}
                art={art}
                isMine={art.authorId === user.id}
                onPress={() => setSelectedArtwork(art)}
                isDark={isDark}
                previewSize={previewSize}
                isSingleCol={isSingleCol}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Detail Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={!!selectedArtwork}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedArtwork(null)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setSelectedArtwork(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalWrap}
          >
            <PixelCard style={styles.modalCard} accentBorder>
              {/* Header */}
              <View style={styles.modalHeader}>
                <PixelText size="sm" numberOfLines={1} style={{ flex: 1 }}>
                  {selectedArtwork?.name?.toUpperCase() || 'DIBUJO'}
                </PixelText>
                {selectedArtwork && isNew(selectedArtwork.createdAt) && (
                  <View style={{ marginRight: PX.space.sm }}>
                    <PixelBadge label="NEW" bgColor={PX.colors.gold} color="#000000" />
                  </View>
                )}
                <TouchableOpacity onPress={() => setSelectedArtwork(null)}>
                  <X size={20} color={c.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Canvas */}
              <View style={styles.modalCanvas}>
                {selectedArtwork && (
                  <PixelPreview grid={selectedArtwork.grid} size={280} borderRadius={0} />
                )}
              </View>

              {/* Palette strip (7 colors in modal) */}
              {selPalette.length > 0 && (
                <View style={[styles.paletteRow, { height: 16, marginTop: -PX.space.xs }]}>
                  {selPalette.map((color, i) => (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor: color,
                        borderWidth: 1,
                        borderColor: c.border,
                      }}
                    />
                  ))}
                </View>
              )}

              <PixelDivider color={PX.colors.accent} />

              {/* Info grid */}
              <View style={{ gap: PX.space.xs }}>
                <View style={styles.infoRow}>
                  <PixelText size="xxs" color={c.textMuted}>AUTOR</PixelText>
                  <PixelText size="xxs">
                    {selectedArtwork?.authorId === user?.id
                      ? 'TÚ'
                      : selectedArtwork?.author?.username?.toUpperCase() || 'PAREJA'}
                  </PixelText>
                </View>
                <View style={styles.infoRow}>
                  <PixelText size="xxs" color={c.textMuted}>FECHA</PixelText>
                  <PixelText size="xxs">
                    {selectedArtwork && timeAgo(selectedArtwork.createdAt)}
                  </PixelText>
                </View>
                <View style={styles.infoRow}>
                  <PixelText size="xxs" color={c.textMuted}>TAMAÑO</PixelText>
                  <PixelText size="xxs">
                    {selectedArtwork
                      ? `${selectedArtwork.width ?? selectedArtwork.grid[0]?.length}×${selectedArtwork.height ?? selectedArtwork.grid.length}`
                      : '—'}
                  </PixelText>
                </View>
                {/* Fill progress bar */}
                <View style={styles.infoRow}>
                  <PixelText size="xxs" color={c.textMuted}>RELLENO</PixelText>
                  <View style={styles.fillBarWrap}>
                    <View
                      style={[
                        styles.fillBarInner,
                        { width: `${selFill}%` as any, backgroundColor: PX.colors.accent },
                      ]}
                    />
                    <PixelText size="xxs" color={c.textMuted} style={styles.fillPct}>
                      {selFill}%
                    </PixelText>
                  </View>
                </View>
              </View>

              {/* CTAs */}
              <View style={styles.modalActions}>
                <PixelButton
                  label="RESPONDER"
                  fullWidth
                  icon={<Paintbrush size={14} color={PX.colors.white} />}
                  onPress={() => { setSelectedArtwork(null); router.push('/draw'); }}
                />
                <PixelButton
                  label="CERRAR"
                  variant="secondary"
                  fullWidth
                  onPress={() => setSelectedArtwork(null)}
                />
              </View>
            </PixelCard>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const SWATCH_HEIGHT = 10;

const styles = StyleSheet.create({
  flex:          { flex: 1 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: PX.space.xl },
  scrollContent: {
    padding: PX.space.lg,
    paddingBottom: PX.space['3xl'],
    // On web: center and cap width so cards don't stretch across the viewport
    ...(Platform.OS === 'web' && {
      maxWidth: 700,
      alignSelf: 'center' as const,
      width: '100%',
    }),
  },

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: PX.space.lg },
  headerActions: { flexDirection: 'row', alignItems: 'center' },

  // Grid
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: PX.space.md, justifyContent: 'space-between' },
  gridSingleCol: { flexDirection: 'column', flexWrap: 'nowrap' },
  gridItem:      { width: '48%', marginBottom: PX.space.md },
  gridItemFull:  { width: '100%', marginBottom: PX.space.md },
  gridCard:      { overflow: 'hidden' },
  previewWrap:   { position: 'relative', alignItems: 'center', justifyContent: 'center' },

  // Color palette strip below preview
  paletteRow:    { flexDirection: 'row', height: SWATCH_HEIGHT },
  paletteSwatch: { width: 28, height: SWATCH_HEIGHT, borderWidth: 0.5 },

  // Meta section & Bottom Badges
  meta:          { padding: PX.space.sm, gap: 6 },
  metaFixed:     { height: 74, justifyContent: 'space-between' },
  metaSingleCol: { minHeight: 68, justifyContent: 'space-between' },
  titleRow: {
    width: '100%',
    height: 24,
    justifyContent: 'center',
  },
  artTitleText: {
    width: '100%',
  },
  badgesBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 28,
  },
  badgesLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 5,
    marginRight: 6,
    overflow: 'hidden',
  },
  authorBadge: {
    maxWidth: 95,
  },
  dimsPill: {
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: PX.border.radiusSm,
  },
  timeAgoText: {
    flexShrink: 0,
    textAlign: 'right',
  },

  // Empty
  emptyCard: { alignItems: 'center', padding: PX.space.xl, margin: PX.space.lg },
  emptyBody: { textAlign: 'center', marginTop: PX.space.xs, lineHeight: 18 },

  // Modal
  backdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: PX.space.lg },
  modalWrap:     { width: '100%', maxWidth: 380 },
  modalCard:     { padding: PX.space.md, gap: PX.space.sm },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalCanvas:   { alignItems: 'center', paddingVertical: PX.space.sm },
  modalActions:  { gap: PX.space.xs, marginTop: PX.space.xs },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Fill progress bar
  fillBarWrap:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fillBarInner:  { height: 8, maxWidth: 80, minWidth: 2, borderWidth: 1, borderColor: PX.colors.accentHover },
  fillPct:       { minWidth: 30, textAlign: 'right' },
});
