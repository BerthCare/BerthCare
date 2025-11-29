import * as Sentry from 'sentry-expo';

import { addBreadcrumb, captureException, captureMessage, recordUserAction } from '../logging';
import { initSentry } from '../sentry';

jest.mock('sentry-expo', () => {
  const init = jest.fn();
  const Native = {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    addBreadcrumb: jest.fn(),
    setTags: jest.fn(),
    nativeCrash: jest.fn(),
  };
  return { init, Native };
});

const getMockedNative = () => (Sentry as unknown as { Native: Record<string, jest.Mock> }).Native;
const getInitMock = () => (Sentry as unknown as { init: jest.Mock }).init;

describe('logging facade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ensure Native is restored in case a test overrides it
    (Sentry as unknown as { Native: unknown }).Native = getMockedNative();
  });

  it('forwards exceptions with allowed context and respects release/env tags', () => {
    initSentry({ dsn: 'test-dsn', environment: 'staging', release: '1.2.3' });
    const error = new Error('boom');

    captureException(error, {
      tags: { feature: 'today', pii: 'nope' },
      extra: { request_id: 'req-1', email: 'user@example.com' },
      fingerprint: ['abc'],
    });

    const native = getMockedNative();
    expect(native.captureException).toHaveBeenCalledWith(error, {
      tags: { feature: 'today' },
      extra: { request_id: 'req-1' },
      fingerprint: ['abc'],
    });

    const initMock = getInitMock();
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({
        release: '1.2.3',
        environment: 'staging',
      })
    );
    expect(native.setTags).toHaveBeenCalledWith({ environment: 'staging', release: '1.2.3' });
  });

  it('captures messages with level and filtered context', () => {
    captureMessage('hello', 'warning', {
      tags: { feature: 'alert', user_id: '42', pii: 'skip' },
      extra: { request_id: 'req-2', endpoint: '/alerts', secret: 'nope' },
    });

    const native = getMockedNative();
    expect(native.captureMessage).toHaveBeenCalledWith('hello', {
      level: 'warning',
      tags: { feature: 'alert', user_id: '42' },
      extra: { request_id: 'req-2', endpoint: '/alerts' },
      fingerprint: undefined,
    });
  });

  it('records breadcrumbs via addBreadcrumb and recordUserAction', () => {
    addBreadcrumb({ category: 'api.request', message: 'GET /foo' });
    recordUserAction('pressed button', { source: 'home', secret: 'hidden' });

    const native = getMockedNative();
    expect(native.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'api.request', message: 'GET /foo' })
    );
    expect(native.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'user',
        message: 'pressed button',
        data: { source: 'home', secret: 'hidden' },
      })
    );
  });

  it('falls back to console logging when Sentry Native is unavailable', () => {
    const originalNative = getMockedNative();
    (Sentry as unknown as { Native?: unknown }).Native = undefined;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => captureMessage('offline', 'info')).not.toThrow();
    expect(() => captureException(new Error('offline'))).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    (Sentry as unknown as { Native: unknown }).Native = originalNative;
  });
});
