import React, { forwardRef } from 'react';
import { useColorScheme, Platform, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Input, InputProps } from 'tamagui';

export interface ThemedInputProps extends InputProps {
  // Allows overriding any Tamagui Input or React Native TextInput prop
}

/**
 * ThemedInput provides dark/light theme integration for text inputs,
 * solving common Android bugs like invisible/low-contrast placeholders,
 * default unstyled cursors, and awkward Android font padding.
 */
export const ThemedInput = forwardRef<RNTextInput, ThemedInputProps>((props, ref) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Destructure style and style-related props to prevent array styles on Web DOM CSSStyleDeclaration
  const {
    style: customStyle,
    placeholderTextColor: customPlaceholderTextColor,
    color: customColor,
    backgroundColor: customBgColor,
    borderColor: customBorderColor,
    borderWidth = 1,
    borderRadius = 10,
    selectionColor = '#e11d48',
    cursorColor = '#e11d48',
    focusStyle: customFocusStyle,
    ...restProps
  } = props;

  // Contrast-checked colors for both themes on Android, iOS, and Web
  const placeholderColor = customPlaceholderTextColor ?? (isDark ? '#94a3b8' : '#9ca3af');
  const textColor = customColor ?? (isDark ? '#f8fafc' : '#0f172a');
  const bgColor = customBgColor ?? (isDark ? '#18181f' : '#ffffff');
  const borderColor = customBorderColor ?? (isDark ? '#2e2e38' : '#cbd5e1');

  // Ensure style is ALWAYS a flat object (never an array) to prevent
  // "Failed to set an indexed property [0] on 'CSSStyleDeclaration'" on Web
  const flattenedStyle = StyleSheet.flatten([
    Platform.OS === 'ios' ? ({ borderCurve: 'continuous' } as any) : undefined,
    Platform.OS === 'android' ? ({ includeFontPadding: false } as any) : undefined,
    customStyle,
  ]);

  return (
    <Input
      ref={ref as any}
      placeholderTextColor={placeholderColor as any}
      color={textColor as any}
      backgroundColor={bgColor as any}
      borderColor={borderColor as any}
      borderWidth={borderWidth}
      borderRadius={borderRadius}
      selectionColor={selectionColor as any}
      cursorColor={cursorColor as any}
      paddingVertical={Platform.OS === 'android' ? 10 : 12}
      paddingHorizontal={14}
      fontSize={15}
      focusStyle={{
        borderColor: '#e11d48',
        borderWidth: 1.5,
        backgroundColor: isDark ? '#20202a' : '#ffffff',
        ...customFocusStyle,
      }}
      style={flattenedStyle as any}
      {...restProps}
    />
  );
});

ThemedInput.displayName = 'ThemedInput';
export default ThemedInput;
