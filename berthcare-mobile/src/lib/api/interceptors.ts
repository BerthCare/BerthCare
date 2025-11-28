import type { TokenProvider } from './types';

export interface RequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
}

function logRequest(context?: RequestContext, hasToken?: boolean): void {
  if (!context) {
    return;
  }

  const headerKeys = Object.keys(context.headers || {});
  const tokenState = hasToken ? 'token:yes' : 'token:no';
  // Debug-level request logging (no payloads or tokens).
  // eslint-disable-next-line no-console
  console.debug(`[api] ${context.method.toUpperCase()} ${context.url} headers=${headerKeys.join(',')} ${tokenState}`);
}

export async function applyAuthHeader(
  headers: Record<string, string>,
  tokenProvider?: TokenProvider,
  context?: RequestContext,
): Promise<Record<string, string>> {
  if (!tokenProvider) {
    logRequest(context, false);
    return headers;
  }

  const token = await tokenProvider.getAccessToken();
  logRequest(context, Boolean(token));

  if (!token) {
    return headers;
  }

  // Preserve caller-provided headers; only inject Authorization if absent.
  if ('Authorization' in headers) {
    return headers;
  }

  return { ...headers, Authorization: `Bearer ${token}` };
}
