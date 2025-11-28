# BerthCare Backend

[![Backend CI](https://github.com/BerthCare/BerthCare/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/BerthCare/BerthCare/actions/workflows/backend-ci.yml)
[![Deploy to Dev](https://github.com/BerthCare/BerthCare/actions/workflows/backend-deploy-dev.yml/badge.svg?branch=main)](https://github.com/BerthCare/BerthCare/actions/workflows/backend-deploy-dev.yml)

TypeScript/Express API scaffold for the BerthCare mobile client, with Prisma for PostgreSQL access and a basic health endpoint.

## Prerequisites

- Node.js 20+
- PostgreSQL instance (local or remote)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
3. Configure environment variables in `.env`:
   - `DATABASE_URL` (required): PostgreSQL connection string.
   - `PORT` (optional): HTTP port; defaults to 3000.
   - `NODE_ENV` (optional): runtime environment (e.g., development, production).
4. Start the database and ensure it is reachable via `DATABASE_URL`.

### Prisma workflow

1. Generate Prisma client (after `DATABASE_URL` is set):
   ```bash
   npx prisma generate
   ```
2. Create and apply migrations locally:
   ```bash
   npx prisma migrate dev --name <migration_name>
   ```
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

## Deployment (Dev)

- **Workflow:** `.github/workflows/backend-deploy-dev.yml`.
- **Triggers:** pushes to `main` that touch `berthcare-backend/**` or the workflow file, plus manual `workflow_dispatch`.
- **Auth:** GitHub OIDC with `aws-actions/configure-aws-credentials@v4` (no static AWS keys). Role: `github-actions-deploy-dev` in `secrets.AWS_ACCOUNT_ID` account, region `ca-central-1`.
- **Runtime routing:** ALB enforces HTTPS (TLS 1.3 policy) and redirects HTTP :80 → :443.
- **Images:** Pushed to ECR as `${ACCOUNT_ID}.dkr.ecr.ca-central-1.amazonaws.com/berthcare-backend:{SHA,latest}`; ECS service `berthcare-dev-backend` is updated with the new task definition.

### Required environment variables & secrets

- App/runtime: `DATABASE_URL` (required for Prisma), `PORT` (optional, defaults 3000).
- GitHub Actions secrets:
  - `AWS_ACCOUNT_ID` – target AWS account for the deploy role.
  - `SLACK_WEBHOOK_URL` – used by the notification step.
- AWS credentials are obtained via OIDC; no long-lived access keys are required.

### Rollback procedures

- **To a previous task revision:** In ECS console, open `berthcare-dev-backend` service → Deployments → select a previous task definition revision → "Force new deployment".
- **To a previous image/commit:** Re-run the deploy workflow against an earlier commit SHA (Actions → Deploy Backend to Dev → "Run workflow" and provide the commit SHA) to push and roll back the service to that image.

After rollback, verify the service is healthy (`/health`) via the ALB and that ECS shows a stable deployment.
