// JavaScript wrapper for Expo config resolution to avoid .ts import issues in Node.
const APP_IDENTIFIER = 'com.berthcare.mobile';

const buildSentryRelease = (appVersion, buildNumber, gitSha) => {
  const buildSuffix =
    typeof buildNumber === 'number' ? buildNumber.toString() : buildNumber;
  const base = `${APP_IDENTIFIER}@${appVersion}+${buildSuffix}`;
  return gitSha ? `${base}-${gitSha.slice(0, 7)}` : base;
};

module.exports = {
  APP_IDENTIFIER,
  buildSentryRelease,
};
