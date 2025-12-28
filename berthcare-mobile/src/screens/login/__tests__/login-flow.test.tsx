import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import App from '@/App';
import { AuthService } from '@/lib/auth';
import type { RootStackScreenProps } from '@/types/navigation';
import LoginScreen from '@screens/login/screen';

jest.mock('@/lib/auth', () => {
  const secureStorage = {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  };

  return {
    AuthService: {
      configure: jest.fn(),
      getInstance: jest.fn(),
    },
    secureStorage,
    STORAGE_KEYS: {
      ACCESS_TOKEN: 'ACCESS_TOKEN',
      REFRESH_TOKEN: 'REFRESH_TOKEN',
      ACCESS_TOKEN_EXPIRY: 'ACCESS_TOKEN_EXPIRY',
      REFRESH_TOKEN_EXPIRY: 'REFRESH_TOKEN_EXPIRY',
      LAST_ONLINE_TIMESTAMP: 'LAST_ONLINE_TIMESTAMP',
    },
  };
});

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const createLoginScreenProps = (): RootStackScreenProps<'Login'> => ({
  navigation: {} as RootStackScreenProps<'Login'>['navigation'],
  route: { key: 'Login', name: 'Login' } as RootStackScreenProps<'Login'>['route'],
});

const getLoginButton = (getByTestId: (id: string) => ReactTestInstance) =>
  getByTestId('login-button');

describe('Login flow', () => {
  let authState: { isAuthenticated: boolean; isOffline: boolean; requiresReauth: boolean };
  let mockAuthService: {
    login: jest.Mock;
    restoreAuthState: jest.Mock;
    getAuthState: jest.Mock;
    subscribeAuthState: jest.Mock;
  };

  beforeEach(() => {
    authState = { isAuthenticated: false, isOffline: false, requiresReauth: false };
    mockAuthService = {
      login: jest.fn(),
      restoreAuthState: jest.fn(async () => authState),
      getAuthState: jest.fn(() => authState),
      subscribeAuthState: jest.fn((listener: (state: typeof authState) => void) => {
        listener(authState);
        return () => undefined;
      }),
    };

    (AuthService.getInstance as jest.Mock).mockReturnValue(mockAuthService);
    (AuthService.configure as jest.Mock).mockClear();
  });

  it('disables Log In button until inputs are filled', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <LoginScreen {...createLoginScreenProps()} />
    );

    expect(getLoginButton(getByTestId).props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@example.com');
    expect(getLoginButton(getByTestId).props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    expect(getLoginButton(getByTestId).props.accessibilityState?.disabled).toBe(false);
  });

  it('shows loading state while login is in progress', async () => {
    let resolveLogin: ((value: { success: boolean }) => void) | null = null;
    const loginPromise = new Promise<{ success: boolean }>((resolve) => {
      resolveLogin = resolve;
    });

    mockAuthService.login.mockReturnValue(loginPromise);

    const { getAllByText, getByPlaceholderText, getByTestId } = render(
      <LoginScreen {...createLoginScreenProps()} />
    );

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getLoginButton(getByTestId));

    await waitFor(() => {
      expect(getAllByText('Log In')).toHaveLength(1);
    });

    expect(mockAuthService.login).toHaveBeenCalledTimes(1);

    resolveLogin?.({ success: false });
    await act(async () => {
      await loginPromise;
    });
  });

  it('shows inline error for invalid credentials and clears on input change', async () => {
    mockAuthService.login.mockResolvedValue({
      success: false,
      error: { type: 'InvalidCredentials' },
    });

    const { getByPlaceholderText, getByTestId, queryByText } = render(
      <LoginScreen {...createLoginScreenProps()} />
    );

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getLoginButton(getByTestId));

    await waitFor(() => {
      expect(queryByText('Invalid email or password')).toBeTruthy();
    });

    expect(getLoginButton(getByTestId).props.accessibilityState?.disabled).toBe(false);

    fireEvent.changeText(getByPlaceholderText('Password'), 'password1234');

    await waitFor(() => {
      expect(queryByText('Invalid email or password')).toBeNull();
    });
  });

  it('shows network error message and allows retry with preserved inputs', async () => {
    mockAuthService.login
      .mockResolvedValueOnce({
        success: false,
        error: { type: 'NetworkError' },
      })
      .mockResolvedValueOnce({
        success: false,
        error: { type: 'NetworkError' },
      });

    const { getByPlaceholderText, getByTestId, queryByText } = render(
      <LoginScreen {...createLoginScreenProps()} />
    );

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getLoginButton(getByTestId));

    await waitFor(() => {
      expect(queryByText('Check your connection and try again')).toBeTruthy();
    });

    expect(getByPlaceholderText('you@example.com').props.value).toBe('user@example.com');
    expect(getByPlaceholderText('Password').props.value).toBe('password123');

    fireEvent.press(getLoginButton(getByTestId));

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledTimes(2);
    });
  });

  it('navigates to Today on successful login', async () => {
    mockAuthService.login.mockImplementation(async () => {
      authState = { ...authState, isAuthenticated: true, requiresReauth: false };
      return { success: true };
    });

    const { getByPlaceholderText, getByTestId, queryByText } = render(<App />);

    await act(async () => {
      await flushPromises();
    });

    expect(queryByText('BerthCare')).toBeNull();

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getLoginButton(getByTestId));

    await waitFor(() => {
      expect(queryByText('BerthCare')).toBeTruthy();
    });
  });
});
