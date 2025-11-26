/**
 * API request and response type definitions
 *
 * This file contains TypeScript type definitions for API communication
 * including request payloads, response structures, and error types.
 */

// Placeholder for API types - to be implemented during API integration
export interface ApiResponse<T = unknown> {
  // TODO: Define standard API response structure
  data?: T;
  error?: string;
  success: boolean;
}

export interface ApiError {
  // TODO: Define API error structure
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  // TODO: Define paginated response structure
  items: T[];
  total: number;
  page: number;
  limit: number;
}
