import { ConfigContext, ExpoConfig } from '@expo/config';

import { APP_IDENTIFIER, buildSentryRelease } from './src/observability/release';

const projectId = '5a324903-de4d-41bb-8d29-ab44b5c2f621';

const resolveEnvironment = (profile?: string): 'development' | 'staging' | 'production' => {
  if (profile === 'production') return 'production';
  if (profile === 'preview') return 'staging';
  return 'development';
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const appVersion = process.env.APP_VERSION ?? '1.0.0';
  const iosBuildNumber = process.env.IOS_BUILD_NUMBER ?? '1';
  const parsedVersionCode = Number.parseInt(process.env.ANDROID_VERSION_CODE ?? '1', 10);
  const androidVersionCode = Number.isNaN(parsedVersionCode) ? 1 : parsedVersionCode;
  const gitSha = process.env.EAS_BUILD_GIT_COMMIT_HASH;
  const environment =
    process.env.EXPO_PUBLIC_ENV ?? resolveEnvironment(process.env.EAS_BUILD_PROFILE);
  const sentryRelease =
    process.env.SENTRY_RELEASE ?? buildSentryRelease(appVersion, iosBuildNumber, gitSha);
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? '';

  const configResult: ExpoConfig & {
    hooks?: {
      postPublish?: {
        file: string;
        config: Record<string, unknown>;
      }[];
    };
  } = {
    ...config,
    name: 'berthcare-mobile',
    slug: 'berthcare-mobile',
    version: appVersion,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    updates: {
      url: `https://u.expo.dev/${projectId}`,
      fallbackToCacheTimeout: 0,
      checkAutomatically: 'ON_LOAD',
      enabled: true,
    },
    runtimeVersion: appVersion,
    ios: {
      supportsTablet: true,
      bundleIdentifier: APP_IDENTIFIER,
      buildNumber: iosBuildNumber,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: APP_IDENTIFIER,
      versionCode: androidVersionCode,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId,
      },
      sentry: {
        dsn: sentryDsn,
        environment,
        release: sentryRelease,
      },
    },
    owner: 'merylnlamera',
    plugins: [
      'expo-secure-store',
      [
        'sentry-expo',
        {
          organization: process.env.SENTRY_ORG ?? '__SENTRY_ORG__',
          project: process.env.SENTRY_PROJECT ?? '__SENTRY_PROJECT__',
          url: process.env.SENTRY_URL ?? 'https://sentry.io/',
        },
      ],
    ],
  };

  configResult.hooks = {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: process.env.SENTRY_ORG ?? '__SENTRY_ORG__',
          project: process.env.SENTRY_PROJECT ?? '__SENTRY_PROJECT__',
          authToken: process.env.SENTRY_AUTH_TOKEN,
          url: process.env.SENTRY_URL ?? 'https://sentry.io/',
          release: sentryRelease,
        },
      },
    ],
  };

  return configResult;
};
