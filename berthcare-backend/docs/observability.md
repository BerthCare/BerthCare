# Observability

## Logging transport defaults

| Destination      | When to use                                       | Env vars                                                                            | Notes / fallback                                                 |
| ---------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| stdout (default) | All envs; ECS `awslogs` ships to CloudWatch       | none                                                                                | JSON logs; dev gets `pino-pretty`                                |
| cloudwatch       | Non-ECS jobs or when app-managed delivery desired | `LOG_DESTINATION=cloudwatch`, `CLOUDWATCH_REGION`, optional `CLOUDWATCH_LOG_GROUP`  | Falls back to stdout if region/permissions missing               |
| datadog          | Datadog logging enabled                           | `LOG_DESTINATION=datadog`, `DATADOG_API_KEY`, `DATADOG_SITE` or `DATADOG_AGENT_URL` | Prefers agent; HTTP intake fallback; reverts to stdout on errors |


## Configuration defaults

- **dev/test:** stdout JSON (pretty in dev) at level `debug`.
- **staging/prod:** stdout JSON at `info`, shipped via ECS `awslogs`; Datadog opt-in via `LOG_DESTINATION=datadog` + credentials.

## Logging usage

- Import `logger` or `createLogger({ context })` from `src/observability/logger`.
- Within requests, call `getRequestLogger()` from `src/middleware/logging` to inherit `requestId`/route context.
- Emit structured logs: `logger.info({ event: 'thing', userId }, 'action happened')`.

## Redaction rules

- Headers: `authorization`, `cookie`, `set-cookie` are redacted.
- Keys matching password/secret/token/apiKey/credential/session/auth/email/phone/name/address patterns are redacted. For `name`, the match is on the exact key `name` (e.g., `{ name: 'Alice' }` → `[REDACTED]`), while keys like `serviceName` or `fileName` are left intact.
- Values matching emails, phone numbers, JWT/bearer tokens, or credential-like strings are redacted.
- Long strings are truncated at ~512 chars with `[truncated]` suffix when not redacted.
- Request log allowlist: method, normalized route, status, duration, requestId, userAgent, content length.

## Data protection

- No PII or secrets in logs; sanitize headers/payloads and truncate long values.
- Preserve `requestId`/trace context in log metadata for correlation.

## Test error endpoint

- **Route:** `GET /observability/test-error` (non-production only; returns 404 in production).
- **Purpose:** emit a controlled unhandled error to verify logger + middleware; response includes `x-request-id` header.
- Expected log shape (`http.error`):
  
  ```json
  {
    "event": "http.error",
    "requestId": "<from header or generated>",
    "method": "GET",
    "route": "/observability/test-error",
    "statusCode": 500,
    "stack": "<stack trace>",
    "msg": "Unhandled error"
  }
  ```
  
- Capture the `requestId` from the response header to correlate logs in CloudWatch/Datadog.

## CloudWatch Insights starter queries

- 4xx/5xx rates (per route):
  
  ```sql
  fields @timestamp, route, statusCode
  | filter event = 'http.request'
  | stats count(*) as total, sum(statusCode >= 500) as errors, sum(statusCode >= 400 and statusCode < 500) as client_errors by route, bin(1m)
  | sort @timestamp desc
  ```
  
- p95/p99 latency by route:
  
  ```sql
  fields @timestamp, route, durationMs
  | filter event = 'http.request'
  | stats pct(durationMs, 95) as p95, pct(durationMs, 99) as p99, avg(durationMs) as avg by route, bin(5m)
  | sort @timestamp desc
  ```
  
- Warning/error spikes:
  
  ```sql
  fields @timestamp, level, msg, requestId, route
  | filter level in ['warn', 'error', 'fatal']
  | stats count(*) as total by level, bin(5m)
  | sort @timestamp desc
  ```
  
- Error correlation lookup (given requestId):
  
  ```sql
  filter requestId = 'REQ_ID_HERE'
  | sort @timestamp asc
  ```

## Verification steps (CloudWatch/Datadog)

1. **Trigger test error:** `curl -i http://<host>/observability/test-error` (non-prod only). Copy the `x-request-id` response header.
2. CloudWatch lookup:
   - Open CloudWatch Logs Insights → select log group `berthcare-backend/<environment>`.
   - Run the correlation query above with the captured `requestId`.
   - Confirm an `http.error` entry with route `/observability/test-error`, status `500`, and stack present.
3. Datadog lookup (if `LOG_DESTINATION=datadog`):
   - In Logs Explorer, filter `service:berthcare-backend requestId:<captured>` (and `env:<environment>` if set).
   - Verify the log contains `event:http.error`, route, status, and stack.
4. **Record results:** note timestamp, requestId, environment, and dashboard/URL used for visibility (**Property 5: Dashboard visibility**).

## Runbook: Datadog key rotation / delivery failures

- **Rotate API key:** create new Datadog API key; update `DATADOG_API_KEY` in runtime secrets/parameter store; redeploy; confirm ingestion in Datadog Logs (filter by `service:berthcare-backend env:<env>`). Remove old key after validation.
- **Agent path preferred:** set `DATADOG_AGENT_URL` where available (reduces egress and improves resilience); fallback to HTTP intake when unset.
- Common failure checks:
  - Missing API key/site → logs fall back to stdout (see stderr warnings).
  - 4xx from Datadog intake → verify key/site, ensure region matches (`datadoghq.com`, `datadoghq.eu`, etc.).
  - 5xx/timeout → transport will retry on next write; monitor stdout for backlog; consider agent.
  - CloudWatch transport issues → confirm `CLOUDWATCH_REGION` and IAM permissions; fallback is stdout (ECS `awslogs` already ships stdout/stderr).
