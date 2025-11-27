import { Request, Response } from 'express';
import { HealthResponse } from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json') as { version: string };

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
