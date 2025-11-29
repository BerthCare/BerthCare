import * as Sentry from '@sentry/react-native';

import { addBreadcrumb, captureException, captureMessage, recordUserAction } from '../logging';
import { initSentry } from '../sentry';

jest.mock('@sentry/react-native', () => {
  const mockScope = {
    setTag: jest.fn(),
  };
  return {
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    addBreadcrumb: jest.fn(),
    setUser: jest.fn(),
    configureScope: jest.fn((cb) => cb(mockScope)),
    nativeCrash: jest.fn(),
    getCurrentHub: jest.fn(() => ({})),
  };
});

const getSentryMock = () => Sentry as unknown as Record<string, jest.Mock>;

describe('logging facade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards exceptions with allowed context and respects release/env tags', () => {
    initSentry({ dsn: 'test-dsn', environment: 'staging', release: '1.2.3' });
    const error = new Error('boom');

    captureException(error, {
      tags: { feature: 'today', pii: 'nope' },
      extra: { request_id: 'req-1', email: 'user@example.com' },
      fingerprint: ['abc'],
    });

    const sentry = getSentryMock();
    expect(sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { feature: 'today' },
      extra: { request_id: 'req-1' },
      fingerprint: ['abc'],
    });

    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        release: '1.2.3',
        environment: 'staging',
      })
    );
  });

  it('captures messages with level and filtered context', () => {
    captureMessage('hello', 'warning', {
      tags: { feature: 'alert', user_id: '42', pii: 'skip' },
      extra: { request_id: 'req-2', endpoint: '/alerts', secret: 'nope' },
    });

    const sentry = getSentryMock();
    expect(sentry.captureMessage).toHaveBeenCalledWith('hello', {
      level: 'warning',
      tags: { feature: 'alert', user_id: '42' },
      extra: { request_id: 'req-2', endpoint: '/alerts' },
      fingerprint: undefined,
    });
  });

  it('records breadcrumbs via addBreadcrumb and recordUserAction', () => {
    addBreadcrumb({ category: 'api.request', message: 'GET /foo' });
    recordUserAction('pressed button', { source: 'home', secret: 'hidden' });

    const sentry = getSentryMock();
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'api.request', message: 'GET /foo' })
    );
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'user',
        message: 'pressed button',
        data: { source: 'home', secret: 'hidden' },
      })
    );
  });

  it('falls back to console logging when Sentry is unavailable', () => {
    const sentry = getSentryMock();
    const originalCapture = sentry.captureException;
    sentry.captureException = undefined as unknown as jest.Mock;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => captureMessage('offline', 'info')).not.toThrow();
    expect(() => captureException(new Error('offline'))).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    sentry.captureException = originalCapture as jest.Mock;
  });
});
