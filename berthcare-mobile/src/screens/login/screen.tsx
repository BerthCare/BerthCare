import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AuthErrorType } from '@/lib/auth';
import { AuthService } from '@/lib/auth';
import type { RootStackScreenProps } from '@/types/navigation';
import Button from '@ui/Button';
import { palette } from '@ui/palette';

type LoginScreenProps = RootStackScreenProps<'Login'> & {
  onLoginSuccess?: () => void;
};

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isSubmittingRef = useRef(false);
  const isDisabled = email.trim().length === 0 || password.trim().length === 0;
  const isButtonDisabled = isDisabled || isSubmitting;
  const showError = errorMessage.length > 0;
  const inputStyles = [
    styles.input,
    isSubmitting && styles.inputDisabled,
    showError && styles.inputError,
  ];

  const resolveErrorMessage = (errorType?: AuthErrorType): string => {
    switch (errorType) {
      case 'InvalidCredentials':
        return 'Invalid email or password';
      case 'NetworkError':
        return 'Check your connection and try again';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const clearErrorIfNeeded = useCallback(() => {
    if (errorMessage) {
      setErrorMessage('');
    }
  }, [errorMessage]);

  const handleEmailChange = useCallback(
    (value: string) => {
      clearErrorIfNeeded();
      setEmail(value);
    },
    [clearErrorIfNeeded]
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      clearErrorIfNeeded();
      setPassword(value);
    },
    [clearErrorIfNeeded]
  );

  const handleLogin = useCallback(async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (trimmedEmail.length === 0 || trimmedPassword.length === 0) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await AuthService.getInstance().login(trimmedEmail, trimmedPassword);

      if (!result.success) {
        setErrorMessage(resolveErrorMessage(result.error?.type));
      } else {
        onLoginSuccess?.();
      }
    } catch {
      setErrorMessage(resolveErrorMessage());
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [email, onLoginSuccess, password]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View>
          <Text style={styles.title}>Log In</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              accessibilityState={{ disabled: isSubmitting, invalid: showError }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              keyboardType="email-address"
              onChangeText={handleEmailChange}
              placeholder="you@example.com"
              placeholderTextColor={palette.textPlaceholder}
              style={inputStyles}
              value={email}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              accessibilityState={{ disabled: isSubmitting, invalid: showError }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              onChangeText={handlePasswordChange}
              placeholder="Password"
              placeholderTextColor={palette.textPlaceholder}
              secureTextEntry
              style={inputStyles}
              value={password}
            />
            {showError ? (
              <Text
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={styles.errorText}
              >
                {errorMessage}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.spacer} />
        <View style={styles.buttonContainer}>
          <Button
            disabled={isButtonDisabled}
            loading={isSubmitting}
            onPress={handleLogin}
            testID="login-button"
            title="Log In"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'stretch',
  },
  container: {
    backgroundColor: palette.background,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  errorText: {
    color: palette.stateErrorText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    color: palette.textPrimary,
    fontSize: 17,
    lineHeight: 26,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputDisabled: {
    opacity: 0.4,
  },
  inputError: {
    borderColor: palette.stateError,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 24,
  },
});
