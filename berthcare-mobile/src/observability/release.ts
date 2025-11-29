export const APP_IDENTIFIER = 'com.berthcare.mobile';

export const buildSentryRelease = (
  appVersion: string,
  buildNumber: string | number,
  gitSha?: string,
): string => {
  const buildSuffix = typeof buildNumber === 'number' ? buildNumber.toString() : buildNumber;
  const base = `${APP_IDENTIFIER}@${appVersion}+${buildSuffix}`;
  return gitSha ? `${base}-${gitSha.slice(0, 7)}` : base;
};
