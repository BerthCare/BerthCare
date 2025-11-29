import * as Sentry from 'sentry-expo';
import type { Breadcrumb, SeverityLevel } from '@sentry/types';

type LogTags = Record<string, string>;
type LogExtras = Record<string, unknown>;

type LogContext = {
  tags?: LogTags;
  extra?: LogExtras;
  fingerprint?: string[];
};

type UserContext = {
  id?: string;
  anonymousId?: string;
  sessionId?: string;
};

// Allowlist keys to avoid accidental PII; expand deliberately when new telemetry is required.
const ALLOWED_TAG_KEYS = ['feature', 'screen', 'flow', 'env', 'release', 'build', 'platform', 'user_id'];
const ALLOWED_EXTRA_KEYS = ['request_id', 'status', 'endpoint', 'action', 'source', 'device_id', 'version'];
const ALLOWED_USER_KEYS = ['id', 'anonymousId', 'sessionId'];

const filterByKeys = <T>(
  input: Record<string, T> | undefined,
  allowed: string[],
): Record<string, T> | undefined => {
  if (!input) return undefined;
  const entries = Object.entries(input).filter(([key]) => allowed.includes(key));
  return entries.length ? Object.fromEntries(entries) : undefined;
};

const withContext = (context?: LogContext) => {
  const tags = filterByKeys(context?.tags, ALLOWED_TAG_KEYS);
  const extra = filterByKeys(context?.extra, ALLOWED_EXTRA_KEYS);
  return { tags, extra, fingerprint: context?.fingerprint };
};

const isSentryAvailable = () => Boolean(Sentry.Native);

const sanitizeUser = (user?: UserContext): UserContext | undefined => {
  if (!user) return undefined;
  const entries = Object.entries(user).filter(([key]) => ALLOWED_USER_KEYS.includes(key));
  return entries.length ? (Object.fromEntries(entries) as UserContext) : undefined;
};

export const captureException = (error: unknown, context?: LogContext) => {
  if (isSentryAvailable()) {
    Sentry.Native.captureException(error, withContext(context));
    return;
  }
  console.error('[observability] captureException', error, withContext(context));
};

export const captureMessage = (
  message: string,
  level: SeverityLevel = 'info',
  context?: LogContext,
) => {
  if (isSentryAvailable()) {
    Sentry.Native.captureMessage(message, { level, ...withContext(context) });
    return;
  }
  const logMethod = level === 'error' || level === 'fatal' ? 'error' : 'log';
  console[logMethod]('[observability] captureMessage', { message, level, context: withContext(context) });
};

export const addBreadcrumb = (breadcrumb: Breadcrumb) => {
  if (isSentryAvailable()) {
    Sentry.Native.addBreadcrumb(breadcrumb);
    return;
  }
  console.log('[observability] breadcrumb', breadcrumb);
};

export const recordUserAction = (label: string, data?: Record<string, unknown>) => {
  addBreadcrumb({
    category: 'user',
    message: label,
    data,
    level: 'info',
  });
};

export const setUserContext = (user?: UserContext) => {
  const sanitized = sanitizeUser(user);
  if (isSentryAvailable()) {
    Sentry.Native.setUser(sanitized ?? null);
    return;
  }
  console.log('[observability] setUserContext', sanitized);
};
