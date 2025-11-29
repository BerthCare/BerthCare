import Constants from 'expo-constants';

import { initSentry } from './sentry';

type SentryExtra = {
  dsn?: string;
  environment?: string;
  release?: string;
};

export const setupObservability = () => {
  const sentryConfig = Constants?.expoConfig?.extra?.sentry as SentryExtra | undefined;

  if (!sentryConfig?.dsn) {
    console.warn('[observability] Skipping Sentry init: no DSN configured');
    return;
  }

  const options: { dsn: string; environment?: string; release?: string } = {
    dsn: sentryConfig.dsn,
  };

  if (sentryConfig.environment) {
    options.environment = sentryConfig.environment;
  }

  if (sentryConfig.release) {
    options.release = sentryConfig.release;
  }

  try {
    initSentry(options);
  } catch (error) {
    console.warn('[observability] Failed to initialize Sentry', error);
  }
};
