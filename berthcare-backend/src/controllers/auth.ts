import type { Request, Response } from 'express';
import type { AuthHandler } from '../services/auth';
import { AuthError, authService } from '../services/auth';
import { RefreshError } from '../services/refresh';
import { getRequestLogger, setRequestUser } from '../middleware/logging';

const extractClientMeta = (req: Request) => ({
  ipAddress: (req.ip || req.headers['x-forwarded-for']?.toString()) ?? undefined,
  userAgent: req.get('user-agent') ?? undefined,
});

const getBody = (req: Request): Record<string, unknown> =>
  req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};

export const createAuthController = (service: AuthHandler = authService) => {
  const postLogin = async (req: Request, res: Response): Promise<void> => {
    const body = getBody(req);
    const email = typeof body.email === 'string' ? body.email : undefined;
    const password = typeof body.password === 'string' ? body.password : undefined;
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId : undefined;

    if (!email || !password || !deviceId) {
      res.status(400).json({ error: { message: 'email, password, and deviceId are required' } });
      return;
    }

    try {
      const meta = extractClientMeta(req);
      const result = await service.login({ email, password, deviceId, ...meta });
      setRequestUser(result.userId ?? email);

      res.status(200).json({
        accessToken: result.accessToken,
        accessTokenExpiresAt: result.accessExpiresAt.toISOString(),
        refreshToken: result.refreshToken,
        refreshTokenExpiresAt: result.refreshExpiresAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof AuthError) {
        const status = error.code === 'INVALID_DEVICE' ? 400 : 401;
        res.status(status).json({ error: { message: 'invalid credentials' } });
        return;
      }

      const logger = getRequestLogger();
      logger.error({ err: error }, 'Login failed unexpectedly');
      res.status(500).json({ error: { message: 'internal server error' } });
    }
  };

  const postRefresh = async (req: Request, res: Response): Promise<void> => {
    const body = getBody(req);
    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : undefined;
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId : undefined;

    if (!refreshToken || !deviceId) {
      res.status(400).json({ error: { message: 'refreshToken and deviceId are required' } });
      return;
    }

    try {
      const meta = extractClientMeta(req);
      const result = await service.refresh({ token: refreshToken, deviceId, ...meta });

      res.status(200).json({
        accessToken: result.accessToken,
        accessTokenExpiresAt: result.accessExpiresAt.toISOString(),
        refreshToken: result.refreshToken,
        refreshTokenExpiresAt: result.refreshExpiresAt?.toISOString(),
      });
    } catch (error) {
      if (error instanceof RefreshError) {
        const status =
          error.code === 'EXPIRED'
            ? 401
            : error.code === 'REVOKED' || error.code === 'DEVICE_MISMATCH'
              ? 403
              : 404;
        res.status(status).json({ error: { message: 'refresh failed' } });
        return;
      }

      const logger = getRequestLogger();
      logger.error({ err: error }, 'Refresh failed unexpectedly');
      res.status(500).json({ error: { message: 'internal server error' } });
    }
  };

  return { postLogin, postRefresh };
};

const defaultController = createAuthController();
export const postLogin = defaultController.postLogin;
export const postRefresh = defaultController.postRefresh;
