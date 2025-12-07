import os from 'os';
import { Writable } from 'stream';
import { config } from '../../lib/config';

const serviceName = config.serviceName || process.env.npm_package_name || 'berthcare-backend';
const version = process.env.npm_package_version || '0.0.0';

type DatadogEndpoint = {
  url: string;
  headers: Record<string, string>;
};

const warn = (message: string, error?: unknown): void => {
  const reason =
    error instanceof Error
      ? (error.stack ?? error.message)
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);
  process.stderr.write(`[DatadogTransport] ${message}${reason ? ` - ${reason}` : ''}\n`);
};

const buildEndpoint = (): DatadogEndpoint | undefined => {
  if (config.logDestination !== 'datadog') {
    return undefined;
  }

  const agentUrl = process.env.DATADOG_AGENT_URL;
  if (agentUrl) {
    return {
      url: `${agentUrl.replace(/\/$/, '')}/api/v2/logs`,
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const apiKey = config.datadogApiKey;
  if (!apiKey) {
    warn('DATADOG_API_KEY is not set; falling back to stdout.');
    return undefined;
  }

  const site = config.datadogSite || 'datadoghq.com';

  return {
    url: `https://http-intake.logs.${site}/api/v2/logs`,
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': apiKey,
    },
  };
};

export const createDatadogStream = (): Writable | undefined => {
  const endpoint = buildEndpoint();
  if (!endpoint) return undefined;

  const { url, headers } = endpoint;
  const ddtags = [`service:${serviceName}`, `env:${config.nodeEnv}`, `version:${version}`]
    .filter(Boolean)
    .join(',');

  const batchSize = Number(process.env.DD_BATCH_SIZE || 50);
  const flushIntervalMs = Number(process.env.DD_FLUSH_INTERVAL_MS || 250);
  const maxInFlightRequests = Number(process.env.DD_MAX_IN_FLIGHT || 3);
  // Allow overriding request timeout via env; default 30s if missing/invalid.
  const ddRequestTimeoutMsEnv = Number.parseInt(process.env.DD_REQUEST_TIMEOUT_MS || '', 10);
  const timeoutMs =
    Number.isFinite(ddRequestTimeoutMsEnv) && ddRequestTimeoutMsEnv > 0
      ? Math.min(ddRequestTimeoutMsEnv, 60000)
      : 30000;
  // Allow overriding drain timeout via env; default 10s if missing/invalid. Cap to 60s to avoid unbounded waits.
  const ddDrainTimeoutMsEnv = Number.parseInt(process.env.DATADOG_DRAIN_TIMEOUT_MS || '', 10);
  const defaultDrainTimeoutMs =
    Number.isFinite(ddDrainTimeoutMsEnv) && ddDrainTimeoutMsEnv > 0
      ? Math.min(ddDrainTimeoutMsEnv, 60000)
      : 10000;

  let buffer: Record<string, unknown>[] = [];
  let timer: NodeJS.Timeout | null = null;
  const queue: Record<string, unknown>[][] = [];
  let inFlight = 0;

  const buildEntry = (body: string): Record<string, unknown> => {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      return {
        message: parsed,
        ddtags,
        ddsource: 'pino',
        hostname: (parsed.hostname as string | undefined) ?? os.hostname(),
        service: (parsed.service as string | undefined) ?? serviceName,
        status: parsed.level,
        env: config.nodeEnv,
        version: (parsed.version as string | undefined) ?? version,
      };
    } catch {
      return {
        message: body,
        ddtags,
        ddsource: 'pino',
        hostname: os.hostname(),
        service: serviceName,
        env: config.nodeEnv,
        version,
      };
    }
  };

  const sendBatch = async (batch: Record<string, unknown>[]): Promise<void> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(batch),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        warn(`Datadog responded with ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      warn('Failed to send log to Datadog', error);
    }
  };

  const startDrain = (): void => {
    while (inFlight < maxInFlightRequests && queue.length > 0) {
      const batch = queue.shift();
      if (!batch?.length) continue;
      inFlight += 1;
      void sendBatch(batch)
        .catch((error) => warn('Datadog batch failed', error))
        .finally(() => {
          inFlight -= 1;
          startDrain();
        });
    }
  };

  const flushBuffer = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (buffer.length === 0) return;
    queue.push(buffer);
    buffer = [];
    startDrain();
  };

  const scheduleFlush = (): void => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      flushBuffer();
    }, flushIntervalMs);
  };

  const waitForDrain = (maxWaitMs = defaultDrainTimeoutMs): Promise<void> =>
    new Promise((resolve) => {
      const deadline = Date.now() + maxWaitMs;
      const check = () => {
        if (buffer.length === 0 && queue.length === 0 && inFlight === 0) {
          resolve();
          return;
        }
        if (Date.now() >= deadline) {
          warn('Drain timeout exceeded, proceeding with shutdown');
          resolve();
          return;
        }
        setTimeout(check, 50);
      };
      check();
    });

  return new Writable({
    highWaterMark: 1024 * 64,
    write(chunk: Buffer, _encoding, callback) {
      const entry = buildEntry(chunk.toString('utf8'));
      buffer.push(entry);
      if (buffer.length >= batchSize) {
        flushBuffer();
      } else {
        scheduleFlush();
      }
      callback();
    },
    final(callback) {
      flushBuffer();
      void waitForDrain().then(() => callback());
    },
    destroy(_error, callback) {
      flushBuffer();
      void waitForDrain().then(() => callback(_error));
    },
  });
};
