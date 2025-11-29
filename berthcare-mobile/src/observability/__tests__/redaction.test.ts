jest.mock('sentry-expo', () => ({
  Native: {
    captureException: jest.fn(),
    setTags: jest.fn(),
    nativeCrash: jest.fn(),
  },
  init: jest.fn(),
}));

import type { Breadcrumb, Event } from '@sentry/types';

import { __testables } from '../sentry';

const { scrubEvent, scrubBreadcrumb } = __testables;

describe('observability redaction', () => {
  it('redacts PII fields and tags events', () => {
    const event: Event = {
      user: { email: 'user@example.com', id: '123' },
      request: {
        url: 'https://api.example.com/clients',
        headers: { Authorization: 'Bearer secret', Accept: 'application/json' },
        data: 'Contact at 555-555-1212',
      },
      extra: { token: 'abcd', feature: 'visit', notes: '123 Main St' },
      contexts: { device: 'ios', address: '1 Infinite Loop' } as Record<string, unknown>,
      tags: { existing: 'keep' },
    };

    const scrubbed = scrubEvent(event);

    expect(scrubbed.user).toEqual({ email: '[redacted]', id: '123' });
    expect(scrubbed.request?.headers?.Authorization).toBe('[redacted]');
    expect(scrubbed.request?.data).toBe('[redacted]');
    expect(scrubbed.extra).toMatchObject({ token: '[redacted]', feature: 'visit' });
    expect(scrubbed.contexts).toMatchObject({ device: 'ios', address: '[redacted]' });
    expect(scrubbed.tags?.pii_redacted).toBe('true');
    expect(scrubbed.tags?.existing).toBe('keep');
  });

  it('leaves safe fields untouched when no PII is present', () => {
    const event: Event = {
      user: { id: 'user-123' },
      extra: { request_id: 'req-1', feature: 'today' },
      tags: { feature: 'today' },
    };

    const scrubbed = scrubEvent(event);

    expect(scrubbed.user).toEqual({ id: 'user-123' });
    expect(scrubbed.extra).toMatchObject({ request_id: 'req-1', feature: 'today' });
    expect(scrubbed.tags?.pii_redacted).toBeUndefined();
  });

  it('redacts breadcrumb data and flags redaction', () => {
    const breadcrumb: Breadcrumb = {
      category: 'navigation',
      data: { route: '/clients/123', email: 'a@b.com' },
      level: 'info',
    };

    const scrubbed = scrubBreadcrumb(breadcrumb);
    expect(scrubbed?.data).toMatchObject({ route: '/clients/123', email: '[redacted]', pii_redacted: true });
  });

  it('drops noisy breadcrumb categories', () => {
    const breadcrumb: Breadcrumb = { category: 'console', message: 'log' };
    expect(scrubBreadcrumb(breadcrumb)).toBeNull();
  });
});
