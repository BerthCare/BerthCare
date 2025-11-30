jest.mock('@sentry/react-native', () => ({
  Native: {
    captureException: jest.fn(),
    setTags: jest.fn(),
    nativeCrash: jest.fn(),
  },
  init: jest.fn(),
}));

import type { Breadcrumb, Contexts, Event } from '@sentry/types';

import { __testables } from '../sentry';

const { scrubEvent, scrubBreadcrumb } = __testables;

describe('observability redaction', () => {
  it('redacts PII fields and tags events', () => {
    const event: Event = {
      user: { email: 'user@example.com', id: '123' },
      request: {
        url: 'https://api.example.com/clients',
        headers: { Authorization: 'Bearer secret', Accept: 'application/json' },
        data: { email: 'user@example.com', token: 'abcd', payload: { address: '123 Main St' } },
      },
      breadcrumbs: [
        { category: 'api', data: { token: 'secret' } },
        { category: 'navigation', data: { route: '/clients' } },
      ],
      extra: { token: 'abcd', feature: 'visit', notes: '123 Main St Avenue' },
      contexts: { device: { model: 'ios' }, address: { line1: '1 Infinite Loop' } } as Contexts,
      tags: { existing: 'keep' },
    };

    const scrubbed = scrubEvent(event);

    expect(scrubbed.user).toEqual({ email: '[redacted]', id: '123' });
    expect(scrubbed.request?.headers?.Authorization).toBe('[redacted]');
    expect(scrubbed.request?.data).toBe('[redacted]');
    expect(scrubbed.extra).toMatchObject({ token: '[redacted]', feature: 'visit' });
    expect(scrubbed.contexts).toMatchObject({
      device: { model: 'ios' },
      address: '[redacted]',
    });
    expect(scrubbed.tags?.pii_redacted).toBe('true');
    expect(scrubbed.tags?.existing).toBe('keep');
  });

  it('does not redact version numbers or timestamps (false positives avoided)', () => {
    const event: Event = {
      extra: {
        version: '1.2.3',
        timestamp: '2025-11-29 12:30:45',
        summary: 'Processed 123 items',
      },
    };

    const scrubbed = scrubEvent(event);
    expect(scrubbed.extra).toMatchObject({
      version: '1.2.3',
      timestamp: '2025-11-29 12:30:45',
      summary: 'Processed 123 items',
    });
    expect(scrubbed.tags?.pii_redacted).toBeUndefined();
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
    expect(scrubbed?.data).toMatchObject({
      route: '/clients/123',
      email: '[redacted]',
      pii_redacted: true,
    });
  });

  it('drops noisy breadcrumb categories', () => {
    const breadcrumb: Breadcrumb = { category: 'console', message: 'log' };
    expect(scrubBreadcrumb(breadcrumb)).toBeNull();
  });
});
