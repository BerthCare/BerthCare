# BerthCare Backend

[![Backend CI](https://github.com/BerthCare/BerthCare/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/BerthCare/BerthCare/actions/workflows/backend-ci.yml)

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
4. Generate Prisma client (after `DATABASE_URL` is set):
   ```bash
   npx prisma generate
   ```
5. Start the database and ensure it is reachable via `DATABASE_URL`.

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
