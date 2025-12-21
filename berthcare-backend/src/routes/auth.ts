import { Router } from 'express';
import { authService, AuthError, AuthService } from '../services/auth-service';
import { refreshService, RefreshError, RefreshService } from '../services/refresh-service';

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const createAuthRouter = (
  authSvc: AuthService = authService,
  refreshSvc: RefreshService = refreshService
) => {
  const router = Router();

  router.post('/login', async (req, res, next) => {
  const body = (req.body ?? {}) as Partial<{
    email: string;
    password: string;
    deviceId: string;
  }>;
  const { email, password, deviceId } = body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: { message: 'Invalid email' } });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: { message: 'Password is required' } });
  }
  if (!deviceId || typeof deviceId !== 'string' || !isUuid(deviceId)) {
    return res.status(400).json({ error: { message: 'Invalid deviceId' } });
  }

  try {
    const result = await authSvc.login({ email, password, deviceId });
    return res.status(200).json({
      accessToken: result.accessToken,
      accessExpiresAt: result.accessExpiresAt.toISOString(),
      refreshToken: result.refreshToken,
      refreshExpiresAt: result.refreshExpiresAt.toISOString(),
      userId: result.userId,
      deviceId: result.deviceId,
      jti: result.jti,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      const status = err.code === 'INVALID_CREDENTIALS' ? 401 : 400;
      return res.status(status).json({ error: { message: err.message } });
    }
    next(err);
  }
  });

  router.post('/refresh', async (req, res, next) => {
  const body = (req.body ?? {}) as Partial<{
    refreshToken: string;
    deviceId?: string;
    rotate?: boolean;
  }>;
  const { refreshToken, deviceId, rotate } = body;

  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ error: { message: 'refreshToken is required' } });
  }

  if (!deviceId || typeof deviceId !== 'string' || !isUuid(deviceId)) {
    return res.status(400).json({ error: { message: 'Invalid deviceId' } });
  }

  try {
    const result = await refreshSvc.refresh({
      token: refreshToken,
      deviceId,
      rotate: Boolean(rotate),
    });

    return res.status(200).json({
      accessToken: result.accessToken,
      accessExpiresAt: result.accessExpiresAt.toISOString(),
      refreshToken: result.refreshToken,
      refreshExpiresAt: result.refreshExpiresAt?.toISOString(),
      jti: result.jti,
      deviceId: result.deviceId,
      userId: result.userId,
    });
  } catch (err) {
    if (err instanceof RefreshError) {
      const status = err.code === 'DEVICE_MISMATCH' || err.code === 'REVOKED' ? 403 : 401;
      return res.status(status).json({ error: { message: err.message } });
    }
    // jsonwebtoken errors bubble as generic Errors; treat as 401
    if (
      (err as Error).name === 'JsonWebTokenError' ||
      (err as Error).name === 'TokenExpiredError'
    ) {
      return res.status(401).json({ error: { message: 'Invalid token' } });
    }
    next(err);
  }
  });

  return router;
};

const authRouter = createAuthRouter();

export { authRouter };
