// JavaScript wrapper for Expo config resolution to avoid .ts import issues in Node.
const APP_IDENTIFIER = 'com.berthcare.mobile';

/**
 * Builds a Sentry release identifier string.
 * @param {string} appVersion - The application version (e.g., "1.0.0")
 * @param {number|string} buildNumber - The build number
 * @param {string} [gitSha] - Optional git commit SHA (first 7 chars will be used)
 * @returns {string} Release string in format: com.berthcare.mobile@version+build[-sha]
 */
const buildSentryRelease = (appVersion, buildNumber, gitSha) => {
  if (!appVersion || typeof appVersion !== 'string') {
    throw new Error('buildSentryRelease: appVersion is required');
  }

  const safeBuild = buildNumber == null ? '0' : String(buildNumber);
  const base = `${APP_IDENTIFIER ?? 'berthcare-mobile'}@${appVersion}+${safeBuild}`;

  if (typeof gitSha !== 'string' || gitSha.length === 0) {
    return base;
  }

  return `${base}-${gitSha.slice(0, 7)}`;
};

module.exports = {
  APP_IDENTIFIER,
  buildSentryRelease,
};
