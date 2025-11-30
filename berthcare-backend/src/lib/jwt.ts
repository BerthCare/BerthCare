import jwt, { type JwtPayload } from 'jsonwebtoken';
import { config } from './config';

type AccessClaims = JwtPayload & {
  sub: string;
  deviceId: string;
  [key: string]: unknown;
};

type RefreshClaims = JwtPayload & {
  sub: string;
  deviceId: string;
  jti: string;
};

type SignedToken<TClaims extends JwtPayload> = {
  token: string;
  expiresAt: Date;
  claims: TClaims;
};

const getSecret = (): string => {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return config.jwtSecret;
};

const baseOptions = {
  algorithm: 'HS256' as const,
  issuer: config.jwtIssuer,
  audience: config.jwtAudience,
};

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const signAccessToken = async (
  userId: string,
  deviceId: string,
  extraClaims: Record<string, unknown> = {}
): Promise<SignedToken<AccessClaims>> => {
  const issuedAt = nowSeconds(); // approximate, actual iat set by jsonwebtoken
  const expiresAt = new Date((issuedAt + config.jwtAccessTtlSeconds) * 1000);
  const claims: AccessClaims = {
    sub: userId,
    deviceId,
    ...extraClaims,
  };

  const token = jwt.sign(claims, getSecret(), {
    ...baseOptions,
    expiresIn: config.jwtAccessTtlSeconds,
    mutatePayload: false,
  });

  return { token, expiresAt, claims };
};

export const signRefreshToken = async (
  userId: string,
  deviceId: string,
  jti: string
): Promise<SignedToken<RefreshClaims>> => {
  const issuedAt = nowSeconds();
  const expiresAt = new Date((issuedAt + config.jwtRefreshTtlSeconds) * 1000);
  const claims: RefreshClaims = {
    sub: userId,
    deviceId,
    jti,
  };

  const token = jwt.sign(claims, getSecret(), {
    ...baseOptions,
    expiresIn: config.jwtRefreshTtlSeconds,
    mutatePayload: false,
  });

  return { token, expiresAt, claims };
};

const verifyToken = <T extends JwtPayload>(token: string): T => {
  const payload = jwt.verify(token, getSecret(), baseOptions) as JwtPayload | string;
  if (typeof payload === 'string') {
    throw new Error('JWT payload is not an object');
  }
  return payload as T;
};

export const verifyAccessToken = async (token: string): Promise<AccessClaims> => {
  return verifyToken<AccessClaims>(token);
};

export const verifyRefreshToken = async (token: string): Promise<RefreshClaims> => {
  return verifyToken<RefreshClaims>(token);
};
