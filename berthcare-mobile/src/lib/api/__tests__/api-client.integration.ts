import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ApiClient } from '../api-client';
import { ApiError } from '../api-error';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ApiClient integration with msw mock server', () => {
  it('performs a full request/response cycle', async () => {
    server.use(
      http.get('http://localhost/api/hello', () =>
        HttpResponse.json({ message: 'hi' }, { status: 200 })
      )
    );

    const client = ApiClient.configure({
      baseUrl: 'http://localhost/api',
      retry: {
        maxRetries: 0,
        initialDelayMs: 0,
        maxDelayMs: 0,
        backoffMultiplier: 1,
      },
      timeoutMs: 5000,
    });

    const { promise } = client.get('/hello');
    const response = await promise;

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ message: 'hi' });
  });

  it('retries idempotent requests on server errors until success', async () => {
    let callCount = 0;
    server.use(
      http.get('http://localhost/api/retry', () => {
        callCount += 1;
        if (callCount < 3) {
          return HttpResponse.json({ error: 'temporary' }, { status: 500 });
        }
        return HttpResponse.json({ ok: true }, { status: 200 });
      })
    );

    const client = ApiClient.configure({
      baseUrl: 'http://localhost/api',
      retry: {
        maxRetries: 2,
        initialDelayMs: 0,
        maxDelayMs: 0,
        backoffMultiplier: 1,
      },
      timeoutMs: 5000,
    });

    const { promise } = client.get('/retry');
    const response = await promise;

    expect(callCount).toBe(3); // initial + 2 retries
    expect(response.data).toEqual({ ok: true });
  });

  it('enforces timeout and surfaces TimeoutError', async () => {
    server.use(
      http.get('http://localhost/api/slow', async () => {
        await sleep(50);
        return HttpResponse.json({ slow: true }, { status: 200 });
      })
    );

    const client = ApiClient.configure({
      baseUrl: 'http://localhost/api',
      retry: {
        maxRetries: 0,
        initialDelayMs: 0,
        maxDelayMs: 0,
        backoffMultiplier: 1,
      },
      timeoutMs: 10,
    });

    const { promise } = client.get('/slow');

    let caught: ApiError | undefined;
    try {
      await promise;
    } catch (error) {
      caught = error as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.type).toBe('TimeoutError');
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
