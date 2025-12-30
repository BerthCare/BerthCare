import { canPerformWrites, getReadOnlyMessage } from '../offline-access';

describe('offlineAccess helpers', () => {
  describe('canPerformWrites', () => {
    it('returns true when offlineAccess is undefined', () => {
      expect(canPerformWrites()).toBe(true);
    });

    it('returns true when offlineAccess.readOnly is false', () => {
      const state = { canContinue: true, readOnly: false };
      expect(canPerformWrites(state)).toBe(true);
    });

    it('returns false when offlineAccess.readOnly is true', () => {
      const state = {
        canContinue: false,
        readOnly: true,
        reason: 'OfflineGracePeriodExpired',
      };
      expect(canPerformWrites(state)).toBe(false);
    });

    it('returns false for all read-only reasons', () => {
      const reasons = [
        'OfflineGracePeriodExpired',
        'NoTokens',
        'TokensExpired',
      ] as const;

      reasons.forEach((reason) => {
        const state = { canContinue: false, readOnly: true, reason };
        expect(canPerformWrites(state)).toBe(false);
      });
    });
  });

  describe('getReadOnlyMessage', () => {
    it('returns empty string when offlineAccess is undefined', () => {
      expect(getReadOnlyMessage()).toBe('');
    });

    it('returns empty string when readOnly is false', () => {
      const state = { canContinue: true, readOnly: false };
      expect(getReadOnlyMessage(state)).toBe('');
    });

    it('returns message for OfflineGracePeriodExpired', () => {
      const state = {
        canContinue: false,
        readOnly: true,
        reason: 'OfflineGracePeriodExpired',
      };
      const msg = getReadOnlyMessage(state);
      expect(msg).toContain('offline');
      expect(msg).toContain('session has expired');
    });

    it('returns message for NoTokens', () => {
      const state = { canContinue: false, readOnly: true, reason: 'NoTokens' };
      const msg = getReadOnlyMessage(state);
      expect(msg).toContain('not authenticated');
    });

    it('returns message for TokensExpired', () => {
      const state = {
        canContinue: false,
        readOnly: true,
        reason: 'TokensExpired',
      };
      const msg = getReadOnlyMessage(state);
      expect(msg).toContain('session has expired');
    });

    it('returns generic message for unknown reason', () => {
      const state = { canContinue: false, readOnly: true, reason: undefined };
      const msg = getReadOnlyMessage(state);
      expect(msg).toContain('cannot make changes');
    });
  });
});
