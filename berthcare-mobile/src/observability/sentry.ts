import * as Sentry from 'sentry-expo';
import type { Breadcrumb, Event, EventHint, SeverityLevel } from '@sentry/types';

type InitOptions = {
  dsn?: string;
  environment?: string;
  release?: string;
  debug?: boolean;
};

const REDACTED = '[redacted]';
const REDACTED_TAG = 'pii_redacted';

const MAX_BREADCRUMBS = 50;
const NOISY_CATEGORIES = ['console'];

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token'];
const SENSITIVE_FIELDS = ['email', 'phone', 'name', 'address', 'token', 'password'];

const scrubHeaders = (headers: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      sanitized[key] = REDACTED;
      return;
    }
    sanitized[key] = value;
  });
  return sanitized;
};

const scrubObject = (input?: Record<string, unknown>): { redacted: boolean; data: Record<string, unknown> } => {
  if (!input) {
    return { redacted: false, data: {} };
  }

  let redacted = false;
  const data: Record<string, unknown> = {};

  Object.entries(input).forEach(([key, value]) => {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      data[key] = REDACTED;
      redacted = true;
      return;
    }
    if (key.toLowerCase() === 'headers' && typeof value === 'object' && value !== null) {
      data[key] = scrubHeaders(value as Record<string, unknown>);
      redacted = true;
      return;
    }
    data[key] = value;
  });

  return { redacted, data };
};

const scrubEvent = (event: Event): Event => {
  let redacted = false;
  const scrubbedEvent: Event = { ...event };

  if (event.user) {
    const { redacted: userRedacted, data } = scrubObject(event.user as Record<string, unknown>);
    scrubbedEvent.user = data;
    redacted = redacted || userRedacted;
  }

  if (event.request?.headers) {
    scrubbedEvent.request = {
      ...event.request,
      headers: scrubHeaders(event.request.headers as Record<string, unknown>),
    };
    redacted = true;
  }

  if (event.extra) {
    const { redacted: extraRedacted, data } = scrubObject(event.extra);
    scrubbedEvent.extra = data;
    redacted = redacted || extraRedacted;
  }

  if (redacted) {
    scrubbedEvent.tags = { ...event.tags, [REDACTED_TAG]: 'true' };
  }

  return scrubbedEvent;
};

const scrubBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb | null => {
  if (NOISY_CATEGORIES.includes(breadcrumb.category ?? '')) {
    return null;
  }

  let redacted = false;
  const scrubbed: Breadcrumb = { ...breadcrumb };

  if (breadcrumb.data) {
    const { redacted: dataRedacted, data } = scrubObject(breadcrumb.data);
    scrubbed.data = data;
    redacted = redacted || dataRedacted;
  }

  if (redacted) {
    scrubbed.data = { ...scrubbed.data, [REDACTED_TAG]: true };
  }

  return scrubbed;
};

let isInitialized = false;

export const initSentry = ({ dsn, environment, release, debug }: InitOptions) => {
  if (!dsn) {
    console.warn('[observability] Sentry disabled: DSN not provided');
    return;
  }

  if (isInitialized) {
    return;
  }

  Sentry.init({
    dsn,
    release,
    environment,
    debug,
    enableNative: true,
    enableNativeCrashHandling: true,
    enableAutoSessionTracking: true,
    maxBreadcrumbs: MAX_BREADCRUMBS,
    sendDefaultPii: false,
    beforeSend(event: Event, hint?: EventHint) {
      return scrubEvent(event);
    },
    beforeBreadcrumb(breadcrumb: Breadcrumb, hint?: EventHint) {
      return scrubBreadcrumb(breadcrumb);
    },
  });

  // Default capture level remains info/error based on SDK; ensure console breadcrumbs are captured.
  Sentry.Native.setTags?.({ environment, release });

  isInitialized = true;
};

export const captureException = (error: unknown, level: SeverityLevel = 'error') => {
  Sentry.Native.captureException(error, { level });
};
