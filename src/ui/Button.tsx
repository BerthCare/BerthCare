import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

/**
 * Shared Button component
 * Platform-specific implementations will override this for iOS and Android
 */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' ? styles.primaryText : styles.secondaryText,
          disabled && styles.disabledText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  } as ViewStyle,
  disabledButton: {
    backgroundColor: '#E5E5E5',
    borderColor: '#E5E5E5',
  } as ViewStyle,
  disabledText: {
    color: '#999999',
  } as TextStyle,
  primaryButton: {
    backgroundColor: '#007AFF',
  } as ViewStyle,
  primaryText: {
    color: '#FFFFFF',
  } as TextStyle,
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  } as ViewStyle,
  secondaryText: {
    color: '#007AFF',
  } as TextStyle,
  text: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
});
