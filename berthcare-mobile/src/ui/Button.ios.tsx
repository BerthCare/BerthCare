import React from 'react';
import {
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { palette } from '@ui/palette';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

/**
 * iOS-specific Button component
 * Uses BerthCare tokens with iOS interaction defaults
 */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const showDisabledStyle = disabled && !loading;
  const indicatorColor = variant === 'primary' ? palette.textInverse : palette.brandBlue;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      style={[
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        showDisabledStyle && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.6}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} size={20} />
      ) : (
        <Text
          style={[styles.text, variant === 'primary' ? styles.primaryText : styles.secondaryText]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  } as ViewStyle,
  disabledButton: {
    opacity: 0.4,
  } as ViewStyle,
  primaryButton: {
    backgroundColor: palette.brandBlue,
  } as ViewStyle,
  primaryText: {
    color: palette.textInverse,
  } as TextStyle,
  secondaryButton: {
    backgroundColor: palette.transparent,
    borderWidth: 2,
    borderColor: palette.brandBlue,
  } as ViewStyle,
  secondaryText: {
    color: palette.brandBlue,
  } as TextStyle,
  text: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,
});
