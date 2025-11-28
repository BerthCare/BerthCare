/**
 * Common TypeScript type definitions for API responses
 */

/**
 * Health check endpoint response
 */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  version: string;
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Generic API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  data: T;
  success: true;
}
