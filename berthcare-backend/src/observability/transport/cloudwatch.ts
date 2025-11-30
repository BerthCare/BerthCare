import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
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

  const handleResourceCreation = async (
    promise: Promise<unknown>,
    resourceType: string,
    resourceName: string
  ): Promise<void> => {
    try {
      await promise;
    } catch (err) {
      const error = err as { name?: string; code?: string; message?: string };
      const code = error.code ?? error.name;
      if (code === 'ResourceAlreadyExistsException') {
        return;
      }
      warn(`Failed to create CloudWatch ${resourceType} ${resourceName}`, error);
      const message = error.message ?? JSON.stringify(error);
      throw new Error(message);
    }
  };

  const ensureLogGroupAndStream = async (
    logGroupName: string,
    logStreamName: string
  ): Promise<void> => {
    if (!setupPromise) {
      setupPromise = (async () => {
        await handleResourceCreation(
          client.send(new CreateLogGroupCommand({ logGroupName })),
          'log group',
          logGroupName
        );

        await handleResourceCreation(
          client.send(new CreateLogStreamCommand({ logGroupName, logStreamName })),
          'log stream',
          logStreamName
        );
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
  const hostname =
    config.allowEphemeralHostnames === true && process.env.HOSTNAME
      ? process.env.HOSTNAME
      : undefined;
  const defaultLogStream =
    process.env.CLOUDWATCH_LOG_STREAM ||
    process.env.ECS_TASK_FAMILY ||
    process.env.ECS_TASK_ID ||
    hostname ||
    `${config.serviceName || 'berthcare-backend'}/${config.nodeEnv ?? 'development'}`;

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
    final(callback) {
      chain
        .catch((error) => {
          warn('Failed to flush CloudWatch log chain before shutdown', error);
        })
        .finally(() => {
          try {
            client.destroy();
          } catch (error) {
            warn('Failed to destroy CloudWatch client', error);
          }
          callback();
        });
    },
  });
};
