import type { Server } from 'http';
import fc from 'fast-check';
import { createApp, startServer } from '../index';
import { logger } from '../observability/logger';

describe('Feature: backend-repository-setup, Property 1: Port Configuration Consistency', () => {
  const originalPort = process.env.PORT;

  afterAll(() => {
    process.env.PORT = originalPort;
  });

  it('respects PORT environment variable across valid port range', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 65535 }), (port) => {
        const app = createApp();
        const dummyServer = { close: jest.fn() } as unknown as Server;
        const listenMock = jest.spyOn(app, 'listen').mockImplementation(((
          listenPort: number,
          callback?: () => void
        ) => {
          callback?.();
          return dummyServer;
        }) as unknown as typeof app.listen);

        const logMock = jest.spyOn(logger, 'info').mockImplementation(() => {});

        const previousPort = process.env.PORT;
        process.env.PORT = String(port);

        try {
          const { port: boundPort, server } = startServer(app);

          expect(boundPort).toBe(port);
          expect(listenMock).toHaveBeenCalledWith(port, expect.any(Function));
          expect(server).toBe(dummyServer);
          expect(logMock).toHaveBeenCalledWith(
            expect.objectContaining({ event: 'server.start', port }),
            'Server is running'
          );
        } finally {
          process.env.PORT = previousPort;
          listenMock.mockRestore();
          logMock.mockRestore();
        }
      }),
      { numRuns: 100 }
    );
  });
});
