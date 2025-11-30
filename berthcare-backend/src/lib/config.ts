const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  return defaultValue;
};

const parsePositiveInt = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
};

const resolveLogLevel = (nodeEnv: string): string => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    return 'debug';
  }
  return 'info';
};

const nodeEnv = process.env.NODE_ENV || 'development';
const DEFAULT_ACCESS_TTL_SECONDS = 60 * 60 * 24; // 24h
const DEFAULT_REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30d
const DEFAULT_BCRYPT_SALT_ROUNDS = 10;

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL,
  logLevel: resolveLogLevel(nodeEnv),
  logDestination: process.env.LOG_DESTINATION || 'stdout',
  serviceName: process.env.SERVICE_NAME || 'berthcare-backend',
  cloudwatchLogGroup: process.env.CLOUDWATCH_LOG_GROUP || 'berthcare-backend',
  cloudwatchRegion: process.env.CLOUDWATCH_REGION,
  datadogApiKey: process.env.DATADOG_API_KEY,
  datadogSite: process.env.DATADOG_SITE || 'datadoghq.com',
  logEnableRequestLogs: parseBoolean(process.env.LOG_ENABLE_REQUEST_LOGS, true),
  allowEphemeralHostnames: parseBoolean(process.env.ALLOW_EPHEMERAL_HOSTNAMES, false),
  jwtSecret: process.env.JWT_SECRET || '',
  jwtIssuer: process.env.JWT_ISSUER || 'berthcare-backend',
  jwtAudience: process.env.JWT_AUDIENCE || 'berthcare-mobile',
  jwtAccessTtlSeconds: parsePositiveInt(process.env.JWT_ACCESS_TTL, DEFAULT_ACCESS_TTL_SECONDS),
  jwtRefreshTtlSeconds: parsePositiveInt(process.env.JWT_REFRESH_TTL, DEFAULT_REFRESH_TTL_SECONDS),
  bcryptSaltRounds: parsePositiveInt(process.env.BCRYPT_SALT_ROUNDS, DEFAULT_BCRYPT_SALT_ROUNDS),
};
