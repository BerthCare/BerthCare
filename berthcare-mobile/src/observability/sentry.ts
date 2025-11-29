import * as Sentry from '@sentry/react-native';
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

const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
// Phone detection: require at least 7 digits (ignore separators) and word boundaries to avoid matching versions/timestamps.
const phonePattern = /\b\+?(?:\d[\s().-]?){6,}\d\b/;
const streetTypePattern =
  /\b(?:st|street|rd|road|ave|avenue|blvd|boulevard|dr|drive|ln|lane|ct|court|trl|trail|way|pkwy|parkway|pl|place)\b/i;

const isPhoneLike = (value: string): boolean => {
  const digits = (value.match(/\d/g) ?? []).length;
  if (digits < 7) return false;
  if (/\d{4}-\d{2}-\d{2}/.test(value) || /[T\s]\d{1,2}:\d{2}/.test(value)) {
    return false; // avoid timestamps/dates
  }
  return phonePattern.test(value);
};

const isAddressLike = (value: string): boolean => {
  // Conservative: require number + alphabetic street name + street type to avoid "123 items" or versions.
  const addressPattern =
    /\b\d{1,6}\s+[A-Za-z]+(?:\s+[A-Za-z]+)*\s+(?:St|Street|Rd|Road|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Trl|Trail|Way|Pkwy|Parkway|Pl|Place)\b/i;
  return addressPattern.test(value) && streetTypePattern.test(value);
};

const redactIfSensitiveString = (value: unknown): { value: unknown; redacted: boolean } => {
  if (typeof value !== 'string') {
    return { value, redacted: false };
  }

  if (emailRegex.test(value) || isPhoneLike(value) || isAddressLike(value)) {
    return { value: REDACTED, redacted: true };
  }

  return { value, redacted: false };
};

const scrubHeaders = (
  headers: Record<string, unknown>
): { headers: Record<string, string>; redacted: boolean } => {
  const sanitized: Record<string, string> = {};
  let redacted = false;
  Object.entries(headers).forEach(([key, value]) => {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      sanitized[key] = REDACTED;
      redacted = true;
      return;
    }
    sanitized[key] = String(value);
  });
  return { headers: sanitized, redacted };
};

const scrubObject = (
  input?: Record<string, unknown>
): { redacted: boolean; data: Record<string, unknown> } => {
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
      const { headers, redacted: headersRedacted } = scrubHeaders(value as Record<string, unknown>);
      data[key] = headers;
      redacted = redacted || headersRedacted;
      return;
    }
    const { value: maybeRedactedValue, redacted: valueRedacted } = redactIfSensitiveString(value);
    data[key] = maybeRedactedValue;
    redacted = redacted || valueRedacted;
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
    const { headers, redacted: headersRedacted } = scrubHeaders(
      event.request.headers as Record<string, unknown>
    );
    scrubbedEvent.request = {
      ...event.request,
      headers,
    };
    redacted = redacted || headersRedacted;
  }

  if (event.extra) {
    const { redacted: extraRedacted, data } = scrubObject(event.extra);
    scrubbedEvent.extra = data;
    redacted = redacted || extraRedacted;
  }

  if (event.contexts) {
    const { redacted: contextsRedacted, data } = scrubObject(
      event.contexts as Record<string, unknown>
    );
    scrubbedEvent.contexts = data as typeof event.contexts;
    redacted = redacted || contextsRedacted;
  }

  if (event.request?.data) {
    const { value: requestData, redacted: requestDataRedacted } = redactIfSensitiveString(
      event.request.data
    );
    scrubbedEvent.request = {
      ...scrubbedEvent.request,
      data: requestDataRedacted ? REDACTED : requestData,
    };
    redacted = redacted || requestDataRedacted;
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

  const options: Record<string, unknown> = {
    dsn,
    debug: Boolean(debug),
    enableNative: true,
    enableNativeCrashHandling: true,
    enableAutoSessionTracking: true,
    maxBreadcrumbs: MAX_BREADCRUMBS,
    sendDefaultPii: false,
    beforeSend(event: Event, _hint?: EventHint) {
      return scrubEvent(event);
    },
    beforeBreadcrumb(breadcrumb: Breadcrumb, _hint?: EventHint) {
      return scrubBreadcrumb(breadcrumb);
    },
  };

  if (environment) {
    options.environment = environment;
  }

  if (release) {
    options.release = release;
  }

  Sentry.init(options);

  // Default capture level remains info/error based on SDK; ensure console breadcrumbs are captured.
  const scope = (
    Sentry as unknown as {
      getCurrentScope?: () => { setTag: (k: string, v: string) => void } | null;
    }
  ).getCurrentScope?.();
  if (scope) {
    if (environment) scope.setTag('environment', environment);
    if (release) scope.setTag('release', release);
  }

  isInitialized = true;
};

export const captureException = (error: unknown, level: SeverityLevel = 'error') => {
  Sentry.captureException(error, { level });
};

// Exported for tests.
export const __testables = {
  scrubEvent,
  scrubBreadcrumb,
};
