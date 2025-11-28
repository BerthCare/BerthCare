import type { TokenProvider } from './types';

export interface RequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
}

export async function applyAuthHeader(headers: Record<string, string>, tokenProvider?: TokenProvider): Promise<Record<string, string>> {
  if (!tokenProvider) {
    return headers;
  }

  const token = await tokenProvider.getAccessToken();
  if (!token) {
    return headers;
  }

  return { ...headers, Authorization: `Bearer ${token}` };
}
