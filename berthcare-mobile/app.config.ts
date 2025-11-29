import { ConfigContext, ExpoConfig } from '@expo/config';

const projectId = '5a324903-de4d-41bb-8d29-ab44b5c2f621';
const appIdentifier = 'com.berthcare.mobile';

const resolveEnvironment = (profile?: string): 'development' | 'staging' | 'production' => {
  if (profile === 'production') return 'production';
  if (profile === 'preview') return 'staging';
  return 'development';
};

const buildSentryRelease = (appVersion: string, buildNumber: string, gitSha?: string) => {
  const base = `${appIdentifier}@${appVersion}+${buildNumber}`;
  return gitSha ? `${base}-${gitSha.slice(0, 7)}` : base;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const appVersion = process.env.APP_VERSION ?? '1.0.0';
  const iosBuildNumber = process.env.IOS_BUILD_NUMBER ?? '1';
  const parsedVersionCode = Number.parseInt(process.env.ANDROID_VERSION_CODE ?? '1', 10);
  const androidVersionCode = Number.isNaN(parsedVersionCode) ? 1 : parsedVersionCode;
  const gitSha = process.env.EAS_BUILD_GIT_COMMIT_HASH;
  const environment = process.env.EXPO_PUBLIC_ENV ?? resolveEnvironment(process.env.EAS_BUILD_PROFILE);
  const sentryRelease = process.env.SENTRY_RELEASE ?? buildSentryRelease(appVersion, iosBuildNumber, gitSha);
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? '';

  return {
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
      bundleIdentifier: appIdentifier,
      buildNumber: iosBuildNumber,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: appIdentifier,
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
    optimization: {
      web: {
        bundler: 'metro',
      },
    },
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
};
