# BerthCare Monorepo

Single repository containing BerthCare’s mobile app, backend API, and infrastructure code.

## Structure
- `berthcare-mobile/` – React Native + Expo app. See `berthcare-mobile/README.md`.
- `berthcare-backend/` – Node.js/Express + Prisma API. See `berthcare-backend/README.md`.
- `berthcare-infrastructure/` – Terraform modules, environments, and tests. See `berthcare-infrastructure/README.md`.
- `design-documentation/`, `project-documentation/` – shared docs and artifacts.

## Quick Start
- Mobile: `cd berthcare-mobile && npm install && npm start` (or `npm run ios` / `npm run android`).
- Backend: `cd berthcare-backend && npm install && npm test && npm run start` (ensure `.env` is set; see `.env.example`).
- Infrastructure: `cd berthcare-infrastructure && terraform init` (state backends in `environments/*/backend.hcl`; run tests with `cd tests && go test ./...`).

## CI
`./.github/workflows/ci.yml` currently runs lint, type-check, format, and tests for the mobile app. Extend with backend/infrastructure jobs as needed.
