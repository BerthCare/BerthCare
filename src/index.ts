import cors from 'cors';
import express, { type Express } from 'express';
import type { Server } from 'http';
import { config } from './lib/config';
import { healthRouter } from './routes/health';

export const createApp = (): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/health', healthRouter);

  return app;
};

export const resolvePort = (portValue: unknown): number => {
  if (typeof portValue === 'number' && Number.isFinite(portValue)) {
    return portValue;
  }

  if (typeof portValue === 'string') {
    const parsed = parseInt(portValue, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 3000;
};

export const startServer = (
  app: Express = createApp(),
  portInput: unknown = process.env.PORT ?? config.port
): { app: Express; server: Server; port: number } => {
  const port = resolvePort(portInput);
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  return { app, server, port };
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
