import os from 'os';
import pino, { stdTimeFunctions, type Logger, type LoggerOptions } from 'pino';
import { config } from '../lib/config';
import { sanitizePayload } from './redaction';
import { createCloudWatchStream } from './transport/cloudwatch';
import { createDatadogStream } from './transport/datadog';

type LoggerContext = Record<string, unknown>;

const writeStderr = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const serviceName = config.serviceName || process.env.npm_package_name || 'berthcare-backend';
const version = process.env.npm_package_version || '0.0.0';

const normalizeRoute = (path?: string): string | undefined => {
  if (!path) return undefined;
  try {
    const url = new URL(path, 'http://localhost');
    return url.pathname;
  } catch {
    // If parsing fails (e.g., path-only), fall back to stripping query by hand.
    return path.split('?')[0];
  }
};

const resolveTransport = (): LoggerOptions['transport'] | undefined => {
  if (config.nodeEnv === 'development' && config.logDestination === 'stdout') {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        singleLine: true,
      },
    };
  }

  return undefined; // stdout JSON by default
};

const resolveStream = () => {
  if (config.logDestination === 'datadog') {
    return createDatadogStream();
  }
  if (config.logDestination === 'cloudwatch') {
    return createCloudWatchStream();
  }

  return undefined;
};

const buildLoggerOptions = (): LoggerOptions => {
  const options: LoggerOptions = {
    level: config.logLevel,
    base: {
      service: serviceName,
      environment: config.nodeEnv,
      version,
      pid: process.pid,
      hostname: os.hostname(),
    },
    timestamp: stdTimeFunctions.isoTime,
    serializers: {
      req: (req: {
        method?: string;
        url?: string;
        originalUrl?: string;
        id?: string;
        requestId?: string;
      }) => ({
        method: req.method,
        route: normalizeRoute(req.url ?? req.originalUrl),
        id: req.id ?? req.requestId,
      }),
      res: (res: { statusCode?: number }) => ({
        statusCode: res.statusCode,
      }),
      err: pino.stdSerializers.err,
    },
    formatters: {
      log: (object) => sanitizePayload(object),
    },
  };

  const transport = resolveTransport();
  if (transport) {
    options.transport = transport;
  }

  return options;
};

const createBaseLogger = (): Logger => {
  try {
    const stream = resolveStream();
    const options = buildLoggerOptions();
    return stream ? pino(options, stream) : pino(options);
  } catch (error) {
    // Ensure logging still works even if transports fail to initialize.
    const reason =
      error instanceof Error
        ? (error.stack ?? error.message)
        : typeof error === 'string'
          ? error
          : JSON.stringify(error);
    writeStderr(`Logger initialization failed; falling back to stdout. Reason: ${reason}`);
    return pino({
      level: 'info',
      base: {
        service: serviceName,
        environment: config.nodeEnv,
        version,
        pid: process.pid,
        hostname: os.hostname(),
      },
      timestamp: stdTimeFunctions.isoTime,
      formatters: {
        log: (object) => sanitizePayload(object),
      },
    });
  }
};

const rootLogger = createBaseLogger();

export const createLogger = (context?: LoggerContext): Logger => {
  if (!context || Object.keys(context).length === 0) {
    return rootLogger;
  }
  return rootLogger.child(context);
};

export const logger = rootLogger;
