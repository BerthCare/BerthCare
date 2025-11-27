import { Request, Response } from 'express';
import { HealthResponse } from '../types';

/**
 * Health check controller
 * Returns server health status and current timestamp
 */
export const getHealth = (req: Request, res: Response): void => {
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
};
