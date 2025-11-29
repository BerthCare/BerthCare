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
    ...(sentryConfig.environment ? { environment: sentryConfig.environment } : {}),
    ...(sentryConfig.release ? { release: sentryConfig.release } : {}),
  };

  try {
    initSentry(options);
  } catch (error) {
    console.warn('[observability] Failed to initialize Sentry', error);
  }
};
