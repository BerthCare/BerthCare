import { Router } from 'express';
import { authService, AuthError, type AuthHandler } from '../services/auth';
import { refreshService, RefreshError, RefreshService } from '../services/refresh';
import { getBody } from '../lib/http';

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const createAuthRouter = (
  authSvc: AuthHandler = authService,
  refreshSvc: RefreshService = refreshService
) => {
  const router = Router();

  router.post('/login', async (req, res, next) => {
    const body = getBody(req);
    const email = typeof body.email === 'string' ? body.email : undefined;
    const password = typeof body.password === 'string' ? body.password : undefined;
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId : undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: { message: 'Invalid email' } });
    }
    if (!password) {
      return res.status(400).json({ error: { message: 'Password is required' } });
    }
    if (!deviceId || !isUuid(deviceId)) {
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
    const body = getBody(req);
    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : undefined;
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId : undefined;
    const rotate = Boolean(body.rotate);

    if (!refreshToken) {
      return res.status(400).json({ error: { message: 'refreshToken is required' } });
    }

    if (!deviceId || !isUuid(deviceId)) {
      return res.status(400).json({ error: { message: 'Invalid deviceId' } });
    }

    try {
      const result = await refreshSvc.refresh({
        token: refreshToken,
        deviceId,
        rotate,
      });

      return res.status(200).json({
        accessToken: result.accessToken,
        accessExpiresAt: result.accessExpiresAt.toISOString(),
        ...(result.refreshToken && {
          refreshToken: result.refreshToken,
          refreshExpiresAt: result.refreshExpiresAt?.toISOString(),
        }),
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
