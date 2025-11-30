import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import os from 'os';
import { Writable } from 'stream';
import { config } from '../../lib/config';

type CloudWatchStreamOptions = {
  logGroupName?: string;
  logStreamName?: string;
};

const REDACTED_REASON_PREFIX = '[CloudWatchTransport]';

const warn = (message: string, error?: unknown): void => {
  const reason =
    error instanceof Error
      ? (error.stack ?? error.message)
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);
  process.stderr.write(`${REDACTED_REASON_PREFIX} ${message}${reason ? ` - ${reason}` : ''}\n`);
};

const createClient = (): CloudWatchLogsClient | undefined => {
  if (!config.cloudwatchRegion) {
    warn('CLOUDWATCH_REGION is not set; skipping CloudWatch transport.');
    return undefined;
  }
  return new CloudWatchLogsClient({ region: config.cloudwatchRegion });
};

export const createCloudWatchStream = (
  options: CloudWatchStreamOptions = {}
): Writable | undefined => {
  if (config.logDestination !== 'cloudwatch') {
    return undefined;
  }

  const client = createClient();
  if (!client) {
    return undefined;
  }

  let nextSequenceToken: string | undefined;
  let setupPromise: Promise<void> | undefined;
  let chain = Promise.resolve();

  const ensureLogGroupAndStream = async (
    logGroupName: string,
    logStreamName: string
  ): Promise<void> => {
    if (!setupPromise) {
      setupPromise = (async () => {
        try {
          await client.send(new CreateLogGroupCommand({ logGroupName }));
        } catch (err) {
          const error = err as { name?: string; code?: string; message?: string };
          const code = error.code ?? error.name;
          if (code !== 'ResourceAlreadyExistsException') {
            warn(`Failed to create CloudWatch log group ${logGroupName}`, error);
            const message = error.message ?? JSON.stringify(error);
            throw new Error(message);
          }
        }

        try {
          await client.send(new CreateLogStreamCommand({ logGroupName, logStreamName }));
        } catch (err) {
          const error = err as { name?: string; code?: string; message?: string };
          const code = error.code ?? error.name;
          if (code !== 'ResourceAlreadyExistsException') {
            warn(`Failed to create CloudWatch log stream ${logStreamName}`, error);
            const message = error.message ?? JSON.stringify(error);
            throw new Error(message);
          }
        }
      })();
    }

    return setupPromise;
  };

  const putLogEvent = async (
    logGroupName: string,
    logStreamName: string,
    message: string
  ): Promise<void> => {
    await ensureLogGroupAndStream(logGroupName, logStreamName);

    const command = new PutLogEventsCommand({
      logGroupName,
      logStreamName,
      logEvents: [
        {
          message,
          timestamp: Date.now(),
        },
      ],
      sequenceToken: nextSequenceToken,
    });

    const response = await client.send(command);
    nextSequenceToken = response.nextSequenceToken;
  };

  const defaultLogGroup = config.cloudwatchLogGroup || 'berthcare-backend';
  const defaultLogStream =
    process.env.CLOUDWATCH_LOG_STREAM ||
    process.env.ECS_TASK_FAMILY ||
    `${config.serviceName || 'berthcare-backend'}/${config.nodeEnv ?? 'development'}/${os.hostname()}`;

  const logGroupName = options.logGroupName || defaultLogGroup;
  const logStreamName = options.logStreamName || defaultLogStream;

  return new Writable({
    write(chunk: Buffer, _encoding, callback) {
      const message = chunk.toString('utf8');

      // Serialize writes to preserve sequence tokens.
      chain = chain
        .then(async () => {
          try {
            await putLogEvent(logGroupName, logStreamName, message);
          } catch (error) {
            warn('Failed to send log to CloudWatch', error);
          }
        })
        .finally(() => callback());
    },
  });
};
