import type { Request, Response } from 'express';
import type { AuthService } from '../services/auth';
import { authService } from '../services/auth';
import { setRequestUser } from '../middleware/logging';

const extractClientMeta = (req: Request) => ({
  ipAddress: (req.ip || req.headers['x-forwarded-for']?.toString()) ?? undefined,
  userAgent: req.get('user-agent') ?? undefined,
});

export const createAuthController = (service: AuthService = authService) => {
  const postLogin = async (req: Request, res: Response): Promise<void> => {
    const { email, password, deviceId } = req.body ?? {};
    if (!email || !password || !deviceId) {
      res.status(400).json({ error: { message: 'email, password, and deviceId are required' } });
      return;
    }

    const meta = extractClientMeta(req);
    const result = await service.login({ email, password, deviceId, ...meta });
    setRequestUser(result.userId ?? email);

    res.status(200).json({
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessExpiresAt.toISOString(),
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.refreshExpiresAt.toISOString(),
    });
  };

  const postRefresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken, deviceId } = req.body ?? {};
    if (!refreshToken || !deviceId) {
      res.status(400).json({ error: { message: 'refreshToken and deviceId are required' } });
      return;
    }

    const meta = extractClientMeta(req);
    const result = await service.refresh({ token: refreshToken, deviceId, ...meta });

    res.status(200).json({
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessExpiresAt.toISOString(),
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.refreshExpiresAt?.toISOString(),
    });
  };

  return { postLogin, postRefresh };
};

const defaultController = createAuthController();
export const postLogin = defaultController.postLogin;
export const postRefresh = defaultController.postRefresh;
