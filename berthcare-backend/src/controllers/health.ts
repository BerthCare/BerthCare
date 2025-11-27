import { Request, Response } from 'express';
import packageJson from '../../package.json';
import { HealthResponse } from '../types';

const version = typeof packageJson.version === 'string' ? packageJson.version : '0.0.0';

/**
 * Health check controller
 * Returns server health status and current timestamp
 */
export const getHealth = (req: Request, res: Response): void => {
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    version,
  };

  res.status(200).json(response);
};
