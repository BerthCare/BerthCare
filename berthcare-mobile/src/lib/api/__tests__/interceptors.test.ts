import { ApiError } from '../api-error';
import { handle401Response } from '../interceptors';
import type { TokenProvider } from '../types';

describe('handle401Response', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('refreshes token then retries once for a single 401', async () => {
    const tokenProvider: TokenProvider = {
      getAccessToken: jest.fn(),
      refreshToken: jest.fn().mockResolvedValue('new-token'),
      clearTokens: jest.fn(),
    };
    const retryFn = jest.fn().mockResolvedValue('ok');

    const result = await handle401Response(tokenProvider, retryFn);

    expect(result).toBe('ok');
    expect(tokenProvider.refreshToken).toHaveBeenCalledTimes(1);
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(tokenProvider.clearTokens).not.toHaveBeenCalled();
  });

  it('queues concurrent 401s and retries them after a single refresh', async () => {
    let refreshResolve: (value: string | null) => void = () => {};
    const refreshPromise = new Promise<string | null>((resolve) => {
      refreshResolve = resolve;
    });

    const tokenProvider: TokenProvider = {
      getAccessToken: jest.fn(),
      refreshToken: jest.fn(() => refreshPromise),
      clearTokens: jest.fn(),
    };

    const retryFn = jest.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');

    const first = handle401Response(tokenProvider, retryFn);
    const second = handle401Response(tokenProvider, retryFn);

    expect(retryFn).not.toHaveBeenCalled();
    refreshResolve('new-token');

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe('first');
    expect(secondResult).toBe('second');
    expect(tokenProvider.refreshToken).toHaveBeenCalledTimes(1);
    expect(retryFn).toHaveBeenCalledTimes(2);
    expect(tokenProvider.clearTokens).not.toHaveBeenCalled();
  });

  it('clears tokens and rejects when refresh fails', async () => {
    const tokenProvider: TokenProvider = {
      getAccessToken: jest.fn(),
      refreshToken: jest.fn().mockResolvedValue(null),
      clearTokens: jest.fn(),
    };
    const retryFn = jest.fn();

    await expect(handle401Response(tokenProvider, retryFn)).rejects.toBeInstanceOf(ApiError);
    expect(tokenProvider.clearTokens).toHaveBeenCalledTimes(1);
    expect(retryFn).not.toHaveBeenCalled();
  });
});
