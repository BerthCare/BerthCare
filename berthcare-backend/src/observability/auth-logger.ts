import { logger } from './logger';

export type AuthLogPayload = {
  caregiverId?: string;
  deviceId?: string;
  reason?: string;
  status?: string;
  tokenId?: string;
  rotatedFromId?: string;
  ipAddress?: string;
  userAgent?: string;
  event: string;
};

export const authLogger = {
  info(payload: AuthLogPayload, message: string) {
    logger.info(payload, message);
  },
  warn(payload: AuthLogPayload, message: string) {
    logger.warn(payload, message);
  },
  error(payload: AuthLogPayload, message: string) {
    logger.error(payload, message);
  },
};
