# Design Document: Mobile API Client

## Overview

The Mobile API Client is a centralized HTTP communication layer for the BerthCare React Native mobile application. It provides a singleton instance that handles all network requests to the backend REST API, with built-in support for environment-based configuration, authentication via JWT tokens, automatic retry logic with exponential backoff, and comprehensive error handling.

The client is built on top of the native `fetch` API (via React Native) with a lightweight wrapper that adds interceptor patterns, retry logic, and typed error handling. This approach minimizes dependencies while providing the flexibility needed for offline-first mobile development.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mobile Application                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Today Screen │  │ Visit Screen │  │ Alert Screen │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API Client (Singleton)                │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              Request Pipeline                    │    │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │    │   │
│  │  │  │ Request  │→ │ Auth     │→ │ Fetch with   │  │    │   │
│  │  │  │ Builder  │  │ Intercept│  │ Timeout      │  │    │   │
│  │  │  └──────────┘  └──────────┘  └──────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              Response Pipeline                   │    │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │    │   │
│  │  │  │ Response │← │ 401      │← │ Retry        │  │    │   │
│  │  │  │ Parser   │  │ Handler  │  │ Logic        │  │    │   │
│  │  │  └──────────┘  └──────────┘  └──────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              Configuration                       │    │   │
│  │  │  • Base URL (dev/staging/prod)                  │    │   │
│  │  │  • Timeout (30s default)                        │    │   │
│  │  │  • Retry settings (max 3, exponential backoff)  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS (TLS 1.3)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                         │
│                    AWS ca-central-1                              │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### ApiClient Class

The main singleton class that provides HTTP methods and manages the request/response lifecycle.

```typescript
interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;  // Default: 30000ms
  retryConfig?: RetryConfig;
}

interface RetryConfig {
  maxRetries: number;      // Default: 3
  initialDelayMs: number;  // Default: 1000
  maxDelayMs: number;      // Default: 60000
  backoffMultiplier: number; // Default: 2
}

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  skipAuth?: boolean;
  skipRetry?: boolean;
}

class ApiClient {
  private static instance: ApiClient;
  private config: ApiClientConfig;
  private tokenProvider: TokenProvider | null;
  
  static getInstance(): ApiClient;
  static configure(config: ApiClientConfig): void;
  
  setTokenProvider(provider: TokenProvider): void;
  
  get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
}
```

### TokenProvider Interface

Abstraction for token management, allowing the auth module (Phase 1) to plug in.

```typescript
interface TokenProvider {
  getAccessToken(): Promise<string | null>;
  refreshToken(): Promise<string | null>;
  clearTokens(): Promise<void>;
}
```

### ApiResponse Type

Wrapper for successful responses with metadata.

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}
```

### ApiError Class

Structured error type for all API failures.

```typescript
type ApiErrorType = 
  | 'NetworkError'
  | 'TimeoutError'
  | 'AuthenticationError'
  | 'ServerError'
  | 'ClientError'
  | 'CancelledError';

class ApiError extends Error {
  type: ApiErrorType;
  status?: number;
  originalError?: Error;
  isRetryable: boolean;
  
  constructor(type: ApiErrorType, message: string, options?: {
    status?: number;
    originalError?: Error;
  });
  
  static isApiError(error: unknown): error is ApiError;
}
```

### Environment Configuration

```typescript
interface EnvironmentConfig {
  development: {
    baseUrl: string;
  };
  staging: {
    baseUrl: string;
  };
  production: {
    baseUrl: string;
  };
}

// Example configuration
const environments: EnvironmentConfig = {
  development: {
    baseUrl: 'http://localhost:3000/api',
  },
  staging: {
    baseUrl: 'https://staging-api.berthcare.ca/api',
  },
  production: {
    baseUrl: 'https://api.berthcare.ca/api',
  },
};
```

## Data Models

### Request Flow State

```typescript
interface RequestState {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  timeout: number;
  retryCount: number;
  startTime: number;
  abortController: AbortController;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
```

### Token Refresh Queue

For handling concurrent 401 responses:

```typescript
interface PendingRequest {
  resolve: (value: ApiResponse<unknown>) => void;
  reject: (error: ApiError) => void;
  retry: () => Promise<ApiResponse<unknown>>;
}

interface TokenRefreshState {
  isRefreshing: boolean;
  pendingRequests: PendingRequest[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Base URL prepending consistency
*For any* relative path and configured base URL, the API_Client SHALL produce a complete URL by prepending the base URL to the path exactly once
**Validates: Requirements 2.5**

Property 2: Authorization header injection
*For any* request where an Access_Token exists, the resulting request headers SHALL contain an Authorization header with the format "Bearer {token}"
**Validates: Requirements 3.1**

Property 3: Header preservation
*For any* request with custom headers provided by the caller, the final request headers SHALL contain all original custom headers in addition to any headers added by interceptors
**Validates: Requirements 3.3**

Property 4: Exponential backoff timing
*For any* retry sequence, the delay before retry N SHALL equal min(initialDelay * (backoffMultiplier ^ (N-1)), maxDelay)
**Validates: Requirements 5.3**

Property 5: Retry count limit
*For any* failing request that exhausts retries, the total number of attempts SHALL equal maxRetries + 1 (initial attempt plus retries)
**Validates: Requirements 5.4**

Property 6: Idempotent request retry
*For any* GET, PUT, or DELETE request that fails with a retryable error, the API_Client SHALL retry the request
**Validates: Requirements 5.1**

Property 7: Non-idempotent request no-retry
*For any* POST request that fails with a network error, the API_Client SHALL NOT automatically retry the request
**Validates: Requirements 5.2**

Property 8: Timeout enforcement
*For any* request, if the response is not received within the configured timeout, the request SHALL be aborted and a TimeoutError SHALL be returned
**Validates: Requirements 6.2**

Property 9: Error type categorization
*For any* error response, the returned ApiError SHALL have a type that correctly categorizes the error based on its cause (network, timeout, auth, server, client, cancelled)
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

Property 10: Request cancellation
*For any* cancelled request, the API_Client SHALL abort the in-flight request and return a CancelledError without invoking success callbacks
**Validates: Requirements 8.2, 8.3, 8.4**

## Error Handling

### Error Classification

| HTTP Status | Error Type | Retryable | Action |
|-------------|------------|-----------|--------|
| Network failure | NetworkError | Yes (idempotent) | Retry with backoff |
| Timeout | TimeoutError | Yes (idempotent) | Retry with backoff |
| 401 | AuthenticationError | Yes (once) | Refresh token, retry |
| 400, 403, 404, 422 | ClientError | No | Return immediately |
| 500, 502, 503, 504 | ServerError | Yes (idempotent) | Retry with backoff |
| Cancelled | CancelledError | No | Return immediately |

### Retry Decision Flow

```
┌─────────────────┐
│  Request Failed │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No      ┌─────────────────┐
│ Is Retryable?   │────────────▶│ Return Error    │
└────────┬────────┘             └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐     No      ┌─────────────────┐
│ Is Idempotent?  │────────────▶│ Return Error    │
│ (GET/PUT/DELETE)│             │ (POST not safe) │
└────────┬────────┘             └─────────────────┘
         │ Yes
         ▼
┌─────────────────┐     No      ┌─────────────────┐
│ Retries < Max?  │────────────▶│ Return Error    │
└────────┬────────┘             │ (Max retries)   │
         │ Yes                  └─────────────────┘
         ▼
┌─────────────────┐
│ Wait (backoff)  │
│ Then Retry      │
└─────────────────┘
```

### 401 Token Refresh Flow

```
┌─────────────────┐
│ 401 Response    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Yes     ┌─────────────────┐
│ Already         │────────────▶│ Queue Request   │
│ Refreshing?     │             │ Wait for Result │
└────────┬────────┘             └─────────────────┘
         │ No
         ▼
┌─────────────────┐
│ Set Refreshing  │
│ = true          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     Fail    ┌─────────────────┐
│ Call            │────────────▶│ Clear Tokens    │
│ refreshToken()  │             │ Reject All      │
└────────┬────────┘             │ Signal Logout   │
         │ Success              └─────────────────┘
         ▼
┌─────────────────┐
│ Retry Original  │
│ + All Queued    │
└─────────────────┘
```

## Testing Strategy

### Property-Based Testing

The API client will use `fast-check` for property-based testing to verify correctness properties across a wide range of inputs.

**Test Configuration:**
- Minimum 100 iterations per property test
- Each property test tagged with: `**Feature: mobile-api-client, Property {number}: {property_text}**`

**Key Properties to Test:**
1. URL construction (base URL + path combinations)
2. Header merging (custom headers preserved)
3. Exponential backoff timing calculations
4. Retry behavior based on method and error type
5. Error type classification

### Unit Tests

Unit tests will cover:
- Singleton instance behavior
- Configuration validation
- Request building (headers, body serialization)
- Response parsing
- Error construction
- Timeout handling
- Cancellation handling

### Integration Tests (Mock Server)

Using `msw` (Mock Service Worker) for realistic API mocking:
- Successful request/response cycles
- 401 → token refresh → retry flow
- Retry sequences with various error codes
- Concurrent request handling during token refresh
- Timeout scenarios

### Test File Structure

```
berthcare-mobile/
├── src/
│   └── lib/
│       └── api/
│           ├── __tests__/
│           │   ├── api-client.test.ts        # Unit tests
│           │   ├── api-client.property.ts    # Property-based tests
│           │   └── api-client.integration.ts # Integration tests
│           ├── api-client.ts
│           ├── api-error.ts
│           ├── config.ts
│           ├── interceptors.ts
│           ├── retry.ts
│           └── index.ts
```

## Implementation Updates (2025-11-28)
- Architecture diagram above remains valid; implemented pipeline is config → interceptors → fetch with timeout/cancel → retry → response handling.
- Defaults match blueprint: 30s timeout, exponential backoff (1s start, x2, cap 60s), retries only for idempotent methods, HTTPS endpoints for staging/production (dev on localhost).
- Added request cancellation (AbortController) and property tests covering timeout and cancellation flows; no deviations from design intent.
- Added MSW-backed integration tests for end-to-end request/response, idempotent retry on 5xx, and timeout behavior.
- No blueprint deviations: auth header injection, 401 refresh queue, and typed ApiError categories implemented as specified.
