import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

/**
 * Android-specific Button component
 * Uses Material Design patterns: Roboto font, Material blue, elevation
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
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' ? styles.primaryText : styles.secondaryText,
          disabled && styles.disabledText,
        ]}
      >
        {title.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4, // Material Design uses less rounded corners
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    elevation: 2, // Android elevation for shadow
  } as ViewStyle,
  disabledButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
    elevation: 0,
  } as ViewStyle,
  disabledText: {
    color: '#9E9E9E',
  } as TextStyle,
  primaryButton: {
    backgroundColor: '#2196F3', // Material blue
  } as ViewStyle,
  primaryText: {
    color: '#FFFFFF',
  } as TextStyle,
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2196F3',
    elevation: 0,
  } as ViewStyle,
  secondaryText: {
    color: '#2196F3',
  } as TextStyle,
  text: {
    fontSize: 14, // Material Design button text size
    fontWeight: '500',
    letterSpacing: 1.25, // Material Design letter spacing
  } as TextStyle,
});
