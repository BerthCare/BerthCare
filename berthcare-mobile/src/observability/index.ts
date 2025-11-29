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

  try {
    initSentry({
      dsn: sentryConfig.dsn,
      environment: sentryConfig.environment,
      release: sentryConfig.release,
    });
  } catch (error) {
    console.warn('[observability] Failed to initialize Sentry', error);
  }
};
