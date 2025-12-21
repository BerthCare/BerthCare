import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from '../../observability/logger';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24h
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30d
const OFFLINE_GRACE_SECONDS = 60 * 60 * 24 * 7; // 7d

export type AccessTokenClaims = {
  sub: string;
  deviceId: string;
  role: string;
  iat: number;
  exp: number;
};

export type SignedAccessToken = {
  token: string;
  expiresAt: Date;
};

export type RefreshTokenSecret = {
  token: string;
  secret: string;
  tokenId: string;
  expiresAt: Date;
  lastSeenAt: Date;
};

const resolveJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    logger.error(
      { event: 'auth.config.missing_secret', providedLength: secret?.length ?? 0 },
      'JWT_SECRET is required and must be at least 32 characters'
    );
    throw Object.assign(new Error('JWT secret not configured'), { status: 500 });
  }
  return secret.trim();
};

export const signAccessToken = (caregiverId: string, deviceId: string, role: string): SignedAccessToken => {
  const secret = resolveJwtSecret();
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
  const token = jwt.sign({ sub: caregiverId, deviceId, role }, secret, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
  return { token, expiresAt };
};

export const verifyAccessToken = (token: string): AccessTokenClaims => {
  const secret = resolveJwtSecret();
  return jwt.verify(token, secret) as AccessTokenClaims;
};

export const generateRefreshToken = (): RefreshTokenSecret => {
  const tokenId = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString('base64url');
  const token = `${tokenId}.${secret}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  return { token, secret, tokenId, expiresAt, lastSeenAt: now };
};

export const hashRefreshSecret = (secret: string, salt: string): string => {
  return crypto.createHash('sha256').update(`${salt}:${secret}`).digest('hex');
};

export const offlineGraceExceeded = (lastSeenAt: Date | null | undefined): boolean => {
  if (!lastSeenAt) return true;
  const elapsedSeconds = (Date.now() - lastSeenAt.getTime()) / 1000;
  return elapsedSeconds > OFFLINE_GRACE_SECONDS;
};

export const getRefreshExpiry = (): Date => {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
};
