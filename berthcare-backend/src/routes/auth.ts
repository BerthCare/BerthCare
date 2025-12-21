import { Router } from 'express';
import { createAuthController } from '../controllers/auth';
import { rateLimit } from '../middleware/rate-limit';
import type { AuthService } from '../services/auth';
import { authService } from '../services/auth';

export const createAuthRouter = (service: AuthService = authService) => {
  const router = Router();
  const { postLogin, postRefresh } = createAuthController(service);
  const loginLimiter = rateLimit({ windowMs: 60_000, max: 10 });
  const refreshLimiter = rateLimit({ windowMs: 60_000, max: 30 });

  router.post('/login', loginLimiter, (req, res, next) => {
    // Bind controller to service instance
    postLogin(req, res).catch(next);
  });
  router.post('/refresh', refreshLimiter, (req, res, next) => {
    postRefresh(req, res).catch(next);
  });

  return router;
};

export const authRouter = createAuthRouter();
