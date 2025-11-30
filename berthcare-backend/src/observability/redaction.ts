const REDACTED_TEXT = '[REDACTED]';
const TRUNCATE_LENGTH = 512;

const sensitiveHeaderKeys = new Set(['authorization', 'cookie', 'set-cookie']);
const credentialKeyPatterns = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /api[-_]?key/i,
  /credential/i,
  /session/i,
  /auth/i,
];

const piiKeyPatterns = [
  /email/i,
  /phone/i,
  /tel/i,
  /(first[-_]?name|last[-_]?name|full[-_]?name|given[-_]?name|family[-_]?name|surname)/i,
  /^name$/i,
  /address/i,
  /street/i,
  /city/i,
  /postal/i,
  /zip/i,
];

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phonePattern = /\+?\d[\d\s().-]{6,}\d/;
const tokenPattern = /(bearer\s+[-A-Za-z0-9._~+/]+=*|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,})/i; // JWT/bearer-like
const credentialValuePattern =
  /(api[-_]?key|secret|password|token|session|credential)=?[-A-Za-z0-9._]{4,}/i;

const truncate = (value: string): string => {
  if (value.length <= TRUNCATE_LENGTH) {
    return value;
  }
  return `${value.slice(0, TRUNCATE_LENGTH)}... [truncated]`;
};

const shouldRedactKey = (key: string): boolean => {
  return (
    credentialKeyPatterns.some((pattern) => pattern.test(key)) ||
    piiKeyPatterns.some((pattern) => pattern.test(key))
  );
};

const sanitizeString = (value: string, keyHint?: string): string => {
  if (keyHint && shouldRedactKey(keyHint)) {
    return REDACTED_TEXT;
  }

  if (emailPattern.test(value)) {
    return REDACTED_TEXT;
  }

  if (phonePattern.test(value)) {
    return REDACTED_TEXT;
  }

  if (tokenPattern.test(value) || credentialValuePattern.test(value)) {
    return REDACTED_TEXT;
  }

  return truncate(value);
};

const sanitizeUnknown = (input: unknown, keyHint?: string): unknown => {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeString(input, keyHint);
  }

  if (Array.isArray(input)) {
    return input.map((value) => sanitizeUnknown(value, keyHint));
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(record)) {
      if (shouldRedactKey(key)) {
        sanitized[key] = REDACTED_TEXT;
        continue;
      }

      sanitized[key] = sanitizeUnknown(value, key);
    }

    return sanitized;
  }

  return input;
};

export const sanitizeHeaders = (
  headers: Record<string, string | string[] | undefined>
): Record<string, string | string[]> => {
  const sanitized: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase();

    if (sensitiveHeaderKeys.has(normalizedKey)) {
      sanitized[key] = Array.isArray(value) ? value.map(() => REDACTED_TEXT) : REDACTED_TEXT;
      continue;
    }

    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      sanitized[key] = value.map((entry) => sanitizeString(entry, key));
    } else {
      sanitized[key] = sanitizeString(value, key);
    }
  }

  return sanitized;
};

export const sanitizePayload = <T>(payload: T): T => {
  return sanitizeUnknown(payload) as T;
};

export { REDACTED_TEXT, TRUNCATE_LENGTH };
