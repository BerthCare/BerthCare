import React from 'react';
import { render } from '@testing-library/react-native';
import TodayScreen from '../today/screen';
import VisitScreen from '../visit/screen';
import type { AuthState } from '@/lib/auth';

const mockAuthState: AuthState = {
  isAuthenticated: true,
  isOffline: false,
  requiresReauth: false,
  accessToken: 'token123',
};

describe('Screen read-only enforcement', () => {
  describe('TodayScreen', () => {
    it('displays read-only warning when offline grace expired', () => {
      const offlineAccess = {
        canContinue: false,
        readOnly: true,
        reason: 'OfflineGracePeriodExpired' as const,
      };

      const { getByText } = render(
        <TodayScreen
          authState={mockAuthState}
          authConfigured={true}
          baseUrl="http://localhost:3000"
          offlineAccess={offlineAccess}
          navigation={{} as any}
          route={{} as any}
        />
      );

      expect(getByText(/offline/i)).toBeTruthy();
      expect(getByText(/session has expired/i)).toBeTruthy();
    });

    it('does not display warning when offline access is allowed', () => {
      const offlineAccess = {
        canContinue: true,
        readOnly: false,
      };

      const { queryByText } = render(
        <TodayScreen
          authState={mockAuthState}
          authConfigured={true}
          baseUrl="http://localhost:3000"
          offlineAccess={offlineAccess}
          navigation={{} as any}
          route={{} as any}
        />
      );

      expect(queryByText(/offline/i)).toBeFalsy();
      expect(queryByText(/session has expired/i)).toBeFalsy();
    });

    it('does not display warning when offline access is undefined', () => {
      const { queryByText } = render(
        <TodayScreen
          authState={mockAuthState}
          authConfigured={true}
          baseUrl="http://localhost:3000"
          navigation={{} as any}
          route={{} as any}
        />
      );

      expect(queryByText(/offline/i)).toBeFalsy();
      expect(queryByText(/session has expired/i)).toBeFalsy();
    });

    it('displays different message for NoTokens reason', () => {
      const offlineAccess = {
        canContinue: false,
        readOnly: true,
        reason: 'NoTokens' as const,
      };

      const { getByText } = render(
        <TodayScreen
          authState={mockAuthState}
          authConfigured={true}
          baseUrl="http://localhost:3000"
          offlineAccess={offlineAccess}
          navigation={{} as any}
          route={{} as any}
        />
      );

      expect(getByText(/not authenticated/i)).toBeTruthy();
    });
  });

  describe('VisitScreen', () => {
    it('displays read-only warning when offline grace expired', () => {
      const offlineAccess = {
        canContinue: false,
        readOnly: true,
        reason: 'OfflineGracePeriodExpired' as const,
      };

      const { getByText } = render(
        <VisitScreen authState={mockAuthState} offlineAccess={offlineAccess} />
      );

      expect(getByText(/offline/i)).toBeTruthy();
      expect(getByText(/session has expired/i)).toBeTruthy();
    });

    it('displays "Edits are disabled" message when read-only', () => {
      const offlineAccess = {
        canContinue: false,
        readOnly: true,
        reason: 'OfflineGracePeriodExpired' as const,
      };

      const { getByText } = render(
        <VisitScreen authState={mockAuthState} offlineAccess={offlineAccess} />
      );

      expect(getByText(/Edits are disabled/i)).toBeTruthy();
    });

    it('does not display warning when offline access is allowed', () => {
      const offlineAccess = {
        canContinue: true,
        readOnly: false,
      };

      const { queryByText } = render(
        <VisitScreen authState={mockAuthState} offlineAccess={offlineAccess} />
      );

      expect(queryByText(/offline/i)).toBeFalsy();
      expect(queryByText(/Edits are disabled/i)).toBeFalsy();
    });

    it('does not display warning when offline access is undefined', () => {
      const { queryByText } = render(
        <VisitScreen authState={mockAuthState} />
      );

      expect(queryByText(/offline/i)).toBeFalsy();
      expect(queryByText(/Edits are disabled/i)).toBeFalsy();
    });
  });
});
