/**
 * Pixel Art UI primitives.
 *
 * PixelCard  — a card with chunky 2px border and optional pixel drop-shadow.
 * PixelButton — flat pixel art button with offset shadow on press.
 * PixelText   — text in the Press Start 2P bitmap font.
 * PixelBadge  — small inline label chip.
 * PixelDivider — 2px horizontal rule.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import { PX, pxColors } from '../../constants/pixelTheme';

// ─── PixelText ──────────────────────────────────────────────────────────────

interface PixelTextProps extends TextProps {
  size?: keyof typeof PX.font;
  color?: string;
  style?: TextStyle;
}

export function PixelText({
  size = 'sm',
  color,
  style,
  children,
  ...rest
}: PixelTextProps) {
  const isDark = useColorScheme() === 'dark';
  const c = pxColors(isDark);
  return (
    <Text
      style={[
        {
          fontFamily: PX.fonts.pixel,
          fontSize: PX.font[size],
          color: color ?? c.text,
          lineHeight: PX.font[size] * 2,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

// ─── PixelCard ──────────────────────────────────────────────────────────────

interface PixelCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: boolean;
  accentBorder?: boolean;
  padding?: number;
}

export function PixelCard({
  children,
  style,
  shadow = false,
  accentBorder = false,
  padding = PX.space.md,
}: PixelCardProps) {
  const isDark = useColorScheme() === 'dark';
  const c = pxColors(isDark);
  return (
    <View
      style={[
        {
          backgroundColor: c.bgCard,
          borderWidth: PX.border.width,
          borderColor: accentBorder ? PX.colors.accent : c.border,
          borderRadius: PX.border.radiusSm,
          padding,
        },
        shadow ? PX.shadow.pixel() : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── PixelButton ────────────────────────────────────────────────────────────

interface PixelButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const BTN_HEIGHT = { sm: 32, md: 44, lg: 52 } as const;
const BTN_FONT: Record<string, keyof typeof PX.font> = {
  sm: 'xs',
  md: 'sm',
  lg: 'base',
};

export function PixelButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  style,
  fullWidth = false,
}: PixelButtonProps) {
  const isDark = useColorScheme() === 'dark';
  const c = pxColors(isDark);

  const bgMap = {
    primary: PX.colors.accent,
    secondary: c.bgCard,
    ghost: 'transparent',
  };
  const textMap = {
    primary: PX.colors.white,
    secondary: PX.colors.accent,
    ghost: c.text,
  };
  const borderMap = {
    primary: PX.colors.accentHover,
    secondary: PX.colors.accent,
    ghost: c.border,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: disabled ? PX.colors.textDim : bgMap[variant],
          borderColor: disabled ? PX.colors.textDim : borderMap[variant],
          height: BTN_HEIGHT[size],
          paddingHorizontal: size === 'sm' ? PX.space.sm : PX.space.md,
          // Pixel press effect: shift down-right on press, remove shadow
          transform: pressed ? [{ translateX: 3 }, { translateY: 3 }] : [],
          // Solid offset shadow (only when not pressed)
          shadowColor: disabled
            ? 'transparent'
            : variant === 'primary'
              ? PX.colors.accentHover
              : PX.colors.border,
          shadowOffset: pressed
            ? { width: 0, height: 0 }
            : { width: 3, height: 3 },
          shadowOpacity: pressed ? 0 : 1,
          shadowRadius: 0,
          elevation: pressed ? 0 : 4,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {({ pressed }) => (
        <View style={styles.btnInner}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text
            style={{
              fontFamily: PX.fonts.pixel,
              fontSize: PX.font[BTN_FONT[size]],
              color: disabled ? PX.colors.textMuted : textMap[variant],
              lineHeight: PX.font[BTN_FONT[size]] * 2,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── PixelBadge ─────────────────────────────────────────────────────────────

interface PixelBadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  numberOfLines?: number;
  style?: ViewStyle;
}

export function PixelBadge({
  label,
  color = PX.colors.white,
  bgColor = PX.colors.accent,
  numberOfLines,
  style,
}: PixelBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor: color }, style]}>
      <Text
        numberOfLines={numberOfLines}
        style={{
          fontFamily: PX.fonts.pixel,
          fontSize: PX.font.xxs,
          color,
          lineHeight: PX.font.xxs * 1.8,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── PixelDivider ───────────────────────────────────────────────────────────

export function PixelDivider({ color }: { color?: string }) {
  const isDark = useColorScheme() === 'dark';
  const c = pxColors(isDark);
  return (
    <View
      style={{
        height: 2,
        backgroundColor: color ?? c.border,
        marginVertical: PX.space.sm,
      }}
    />
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    borderWidth: PX.border.width,
    borderRadius: PX.border.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderWidth: 1,
    borderRadius: PX.border.radiusSm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
