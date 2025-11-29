import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

type TokenButtonProps = {
  label: string;
  disabled?: boolean;
  onPress?: () => void;
};

// Placeholder sample to verify token consumption; styles will be refined once tokens are generated.
export function TokenButton({ label, disabled = false, onPress }: TokenButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={[styles.label, disabled && styles.disabledLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
  } as ViewStyle,
  pressed: {
    opacity: 0.92,
  } as ViewStyle,
  disabled: {
    opacity: 0.48,
  } as ViewStyle,
  label: {
    color: colors.text.onPrimary,
    fontSize: typography.button.default.size,
    fontWeight: typography.button.default.weight as TextStyle['fontWeight'],
    lineHeight: typography.button.default.lineHeight,
  } as TextStyle,
  disabledLabel: {
    color: colors.text.onPrimary,
  } as TextStyle,
});
