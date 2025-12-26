import jwt, { type JwtPayload } from 'jsonwebtoken';
import { config } from './config';

type AccessClaims = JwtPayload & {
  sub: string;
  deviceId: string;
  role?: string;
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
export type { AccessClaims, RefreshClaims, SignedToken };

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

export const signAccessToken = (
  userId: string,
  deviceId: string,
  role?: string
): SignedToken<AccessClaims> => {
  const issuedAt = nowSeconds(); // approximate, actual iat set by jsonwebtoken
  const expiresAt = new Date((issuedAt + config.jwtAccessTtlSeconds) * 1000);
  const claims: AccessClaims = {
    sub: userId,
    deviceId,
    ...(role ? { role } : {}),
  };

  const token = jwt.sign(claims, getSecret(), {
    ...baseOptions,
    expiresIn: config.jwtAccessTtlSeconds,
    mutatePayload: false,
  });

  return { token, expiresAt, claims };
};

export const signRefreshToken = (
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

  return Promise.resolve({ token, expiresAt, claims });
};

const verifyToken = <T extends JwtPayload>(token: string): T => {
  const payload = jwt.verify(token, getSecret(), baseOptions);
  if (typeof payload === 'string' || payload === null) {
    throw new Error('JWT payload is not an object');
  }
  return payload as T;
};

export const verifyAccessToken = (token: string): Promise<AccessClaims> => {
  try {
    const payload = verifyToken<JwtPayload>(token);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.sub !== 'string' ||
      typeof (payload as Record<string, unknown>).deviceId !== 'string'
    ) {
      return Promise.reject(new Error('Invalid access token claims'));
    }
    return Promise.resolve(payload as AccessClaims);
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error(String(err)));
  }
};

export const verifyRefreshToken = (token: string): Promise<RefreshClaims> => {
  try {
    const payload = verifyToken<JwtPayload>(token);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.sub !== 'string' ||
      typeof (payload as Record<string, unknown>).deviceId !== 'string' ||
      typeof (payload as Record<string, unknown>).jti !== 'string'
    ) {
      return Promise.reject(new Error('Invalid refresh token claims'));
    }
    return Promise.resolve(payload as RefreshClaims);
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error(String(err)));
  }
};
