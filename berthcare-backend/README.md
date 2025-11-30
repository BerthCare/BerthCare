# BerthCare Backend

[![Backend CI](https://github.com/BerthCare/BerthCare/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/BerthCare/BerthCare/actions/workflows/backend-ci.yml)
[![Deploy to Dev](https://github.com/BerthCare/BerthCare/actions/workflows/backend-deploy-dev.yml/badge.svg?branch=main)](https://github.com/BerthCare/BerthCare/actions/workflows/backend-deploy-dev.yml)

## Overview

TypeScript/Express API supporting the BerthCare mobile client, with Prisma for PostgreSQL access and health/audit endpoints.

## Architecture / Technical Blueprint

See the end-to-end system diagram in the Technical Blueprint: [Architecture Overview](../project-documentation/technical-blueprint.md#the-simplest-thing-that-could-possibly-work).

## Prerequisites

- Node.js 20+
- PostgreSQL instance (local or remote)
- Docker (optional — easiest way to run PostgreSQL for integration tests)

## How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file and set variables:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` (required) PostgreSQL connection string
   - `PORT` (optional) defaults 3000
   - `NODE_ENV` (optional) e.g., development, production
   - `LOG_LEVEL` (optional) defaults `debug` in dev/test, `info` in prod
   - `LOG_DESTINATION` (optional) `stdout` (default), `cloudwatch`, or `datadog`
   - `SERVICE_NAME` (optional) service identifier; default `berthcare-backend`
   - `ALLOW_EPHEMERAL_HOSTNAMES` (optional) set `true` to include hostnames in CloudWatch stream names; default `false` to avoid high-cardinality streams
   - Auth: `JWT_SECRET` (required), `JWT_ISSUER` (default `berthcare-backend`), `JWT_AUDIENCE` (default `berthcare-mobile`), `JWT_ACCESS_TTL` seconds (default 86400), `JWT_REFRESH_TTL` seconds (default 2592000), `BCRYPT_SALT_ROUNDS` (default 10)
   - CloudWatch: `CLOUDWATCH_LOG_GROUP` (default `berthcare-backend`), `CLOUDWATCH_REGION`
   - Datadog: `DATADOG_API_KEY`, `DATADOG_SITE` (`datadoghq.com` default), optional `DATADOG_AGENT_URL`
   - `LOG_ENABLE_REQUEST_LOGS` (optional) toggle request logging

3. Start PostgreSQL and ensure it is reachable via `DATABASE_URL`.
4. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
5. Apply local migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
6. Start the dev server (ts-node-dev):
   ```bash
   npm run dev
   ```
   The API listens on `PORT` (defaults 3000) and exposes `GET /health`.

## How to Run Tests

- Full suite (unit + property tests):
  ```bash
  npm test
  ```
  Uses ts-jest with fast-check properties; run `npx prisma generate` first so generated types are present.
- Unit only (no integration DB dependency):
  ```bash
  npm run test:unit
  ```
- Integration tests (need PostgreSQL reachable at `DATABASE_URL` and migrations applied):

  ```bash
  # Option 1: start Postgres via Docker
  docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=berthcare_test postgres:16
  npx prisma migrate deploy
  npm run test:integration

  # Option 2: use an existing Postgres instance
  export DATABASE_URL="postgresql://user:password@host:5432/berthcare_test"
  npx prisma migrate deploy
  npm run test:integration
  ```

## Auth configuration and device binding

- Tokens: access token TTL default 24h (`JWT_ACCESS_TTL`), refresh token TTL default 30d (`JWT_REFRESH_TTL`); issuer/audience default to `berthcare-backend`/`berthcare-mobile`.
- Secrets: set `JWT_SECRET` per environment; never log or return secrets, password hashes, or raw refresh tokens.
- Device ID: `/api/auth/login` requires a valid UUID `deviceId`; refresh tokens are scoped to `(userId, deviceId)` and are rotated/revoked per device.
- Revocation: `refreshTokenRepository` supports per-device revocation (`revokeByDevice`) and full-user revocation (`revokeAllForUser`), used for password resets/account disable.
- Endpoints: `POST /api/auth/login` issues access/refresh; `POST /api/auth/refresh` validates signature/iss/aud/exp, enforces device match, and updates lastUsed/rotation.

### Prisma workflow

1. Generate Prisma client (after `DATABASE_URL` is set):
   ```bash
   npx prisma generate
   ```
2. Create and apply migrations locally:
   ```bash
   npx prisma migrate dev --name <descriptive-name>
   # e.g., first migration: npx prisma migrate dev --name create-initial-schema
   ```
   Use a descriptive name per change (e.g., `add-alerts-table`).
3. Deploy migrations to another environment:
   ```bash
   npx prisma migrate deploy
   ```

The Prisma schema lives in `prisma/schema.prisma`, and generated client output is under `src/generated/prisma`. See `.kiro/specs/prisma-database-schema/design.md` for the architecture diagram and schema design context.

## Scripts

- `npm run dev` – start the server in watch mode with ts-node-dev.
- `npm run build` – compile TypeScript to `dist/`.
- `npm start` – run the compiled server from `dist/`.
- `npm test` – run Jest test suite (includes fast-check property tests).
- `npm run lint` – run ESLint against the TypeScript sources.

## Running the server

Development:

```bash
npm run dev
```

Production build + start:

```bash
npm run build
npm start
```

The server binds to `PORT` (or 3000 by default) and exposes `GET /health` for a basic status check.

## Database notes

- Prisma schema is located at `prisma/schema.prisma`.
- `DATABASE_URL` should point to your PostgreSQL database (e.g., `postgresql://user:password@localhost:5432/berthcare`).
- Run `npx prisma generate` whenever the schema changes to update the generated client.

## Observability and logging

- Default transport: structured JSON logs to stdout; ECS `awslogs` driver ships stdout/stderr to CloudWatch (`berthcare-backend/<environment>`), so services do not need to manage CloudWatch directly. Pretty-print is enabled in development.
- Optional CloudWatch transport: set `LOG_DESTINATION=cloudwatch` with `CLOUDWATCH_REGION`; the app will send logs via `@aws-sdk/client-cloudwatch-logs` (fallback to stdout if region/permissions are missing).
- Optional Datadog: set `LOG_DESTINATION=datadog` with `DATADOG_API_KEY` and `DATADOG_SITE` (or `DATADOG_AGENT_URL`); the app sends via agent when available, otherwise HTTP; falls back to stdout on failure.
- Redaction: headers (`authorization`, `cookie`, `set-cookie`) and credential/PII-like fields are redacted; long strings are truncated; request logging is allowlisted to method/route/status/duration/requestId/userAgent.
- Usage: import `logger` or `createLogger({ context })` from `src/observability/logger`, or use `getRequestLogger()` from the request context in handlers.
- See `docs/observability.md` for transport table, verification steps, and queries; avoid logging PII/secrets.

## How to Deploy (dev / staging / prod)

- **Dev (automated):** GitHub Actions workflow `.github/workflows/backend-deploy-dev.yml` builds/pushes the image (ECR) and updates ECS service `berthcare-dev-backend` (cluster `berthcare-dev-cluster`) on pushes to `main` touching `berthcare-backend/**`, or via `workflow_dispatch`. Auth via GitHub OIDC role `github-actions-deploy-dev` in `secrets.AWS_ACCOUNT_ID` (region `ca-central-1`).
- **Staging/Prod:** Not automated yet—mirror the dev workflow with environment-specific role, cluster, service, and ECR repo. Use the same pattern: build → push → render task definition with `/health` check → update ECS → wait stable.

### Required secrets / environment

- App/runtime: `DATABASE_URL` (required), `JWT_SECRET` (required for auth), `PORT` (optional; defaults 3000).
- GitHub Actions secrets (dev): `AWS_ACCOUNT_ID`, `SLACK_WEBHOOK_URL`. Roles use OIDC; no static AWS keys.

### Rollback

- Fast: re-run the deploy workflow against a prior commit SHA (Actions → Deploy Backend to Dev → "Run workflow" → `ref=<old_sha>`).
- ECS revision: select a previous task definition for service `berthcare-dev-backend` in ECS and force a new deployment.
- After rollback: confirm `/health` via ALB and ECS service stability.

### Runbook

- See `project-documentation/backend-deploy-runbook.md` for manual trigger, status checks, and rollback commands.

## Contributing / Engineering Rituals

- Branch/PR flow: use short branches (e.g., `feature/<topic>`), keep PRs small, link issues, and require at least one review before merge.
- Required gates before merging: `npm run lint`, `npm run type-check`, `npm test` (or `npm run test:integration` when touching DB flows), plus `npx prisma generate`/migrations committed when schema changes.
- Docs/diagrams: update this README and any affected diagrams/links (e.g., Technical Blueprint references, `docs/observability.md`) when behavior, endpoints, or logging change.
- Security/compliance: never commit secrets (`.env` is local only); ensure logs avoid PII/secrets (see Observability notes); prefer GitHub OIDC for AWS access.
- Deployment verification: confirm backend CI + deploy workflow green, ECS service stable, and `/health` responding after deploy; rollback via prior SHA or task definition per runbook.
