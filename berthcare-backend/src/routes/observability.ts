import { Router } from 'express';
import { config } from '../lib/config';

export const observabilityRouter = Router();

observabilityRouter.get('/test-error', (_req, res) => {
  if (config.nodeEnv === 'production') {
    // Avoid exposing test failures in production environments.
    return res.status(404).json({ error: { message: 'Not found' } });
  }

  throw new Error('intentional-test-error');
});
