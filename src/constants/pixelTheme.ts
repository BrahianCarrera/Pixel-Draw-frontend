/**
 * Pixel Art Design System for PixelDraw
 * All colors, spacing, fonts, and borders for the retro pixel look.
 */

import { Platform } from 'react-native';

/**
 * Press Start 2P renders tiny at physical pixel sizes because it was
 * designed for high-density native screens.  On web (96 dpi CSS pixels)
 * we scale every font token up by ~1.75× so it stays comfortably readable.
 */
const WEB_SCALE = 1.75;
const isWeb = Platform.OS === 'web';

export const PX = {
  // ── Colors ────────────────────────────────────────────────────────────────
  colors: {
    bg: '#0f0f11',
    bgCard: '#1a1a24',
    bgCardAlt: '#141420',
    accent: '#e11d48',
    accentHover: '#be123c',
    gold: '#facc15',
    white: '#ffffff',
    text: '#ffffff',
    textMuted: '#94a3b8',
    textDim: '#64748b',
    border: '#2e2e44',
    borderAccent: '#e11d48',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    // light theme
    bgLight: '#f0f0f8',
    bgCardLight: '#ffffff',
    borderLight: '#c4c4d8',
    textLight: '#0f0f11',
    textMutedLight: '#4b4b6b',
  },

  // ── Typography ────────────────────────────────────────────────────────────
  fonts: {
    pixel: 'PressStart2P',
  },

  // ── Sizes — native (phone): increased for clear readability; web: ~1.4× larger ────────
  font: {
    xxs:  isWeb ? 10 : 8,
    xs:   isWeb ? 12 : 9,
    sm:   isWeb ? 14 : 11,
    base: isWeb ? 16 : 12,
    md:   isWeb ? 18 : 13,
    lg:   isWeb ? 21 : 15,
    xl:   isWeb ? 25 : 18,
    '2xl': isWeb ? 28 : 20,
  },

  // ── Spacing ───────────────────────────────────────────────────────────────
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },

  // ── Borders (pixel art = always 2px solid, sharp corners) ────────────────
  border: {
    width: 2,
    radius: 0, // sharp pixel corners
    radiusSm: 2,
  },

  // ── Shadows (pixel art retro drop-shadow style) ───────────────────────────
  shadow: {
    // Solid 2px offset shadow in dark color — no blur
    pixel: (color = '#e11d48') => ({
      shadowColor: color,
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 4,
    }),
  },
} as const;

/** Returns the correct bg / text token for the current color scheme */
export function pxColors(isDark: boolean) {
  return {
    bg: isDark ? PX.colors.bg : PX.colors.bgLight,
    bgCard: isDark ? PX.colors.bgCard : PX.colors.bgCardLight,
    text: isDark ? PX.colors.text : PX.colors.textLight,
    textMuted: isDark ? PX.colors.textMuted : PX.colors.textMutedLight,
    border: isDark ? PX.colors.border : PX.colors.borderLight,
  };
}
