# Backend Deployment Guide

## Overview
- Scope: canonical guide for backend branching, pull requests, deployments (dev/staging/prod), and rollback; applies to all backend contributors.
- Alignment: follow Technical Blueprint §9 (Build Strategy & Milestones) — see `../project-documentation/technical-blueprint.md#9-build-strategy--milestones` — and existing engineering rituals/runbooks.

## Branching Strategy
- `main` is the production-ready branch; protect it from direct pushes and update it only via reviewed PR merges.
- All work starts from short-lived feature branches off `main` (e.g., `feature/<short-description>`); merge back via PR once reviewed and checks are green.

## Pull Request Process
- Open a PR from your feature branch into `main`; include links to related specs/issues and use the backend PR template.
- Request at least one reviewer; address feedback and update the PR until approved.
- Ensure required checks (lint/type-check/tests/CI) are green; rerun as needed after changes (branch protection blocks merge if checks fail).
- Merge via the PR (no direct pushes to `main`); keep branches short-lived and delete after merge.

## Deployment Process
- Dev: merges to `main` that touch `berthcare-backend/**` auto-deploy via `.github/workflows/backend-deploy-dev.yml`; monitor in GitHub Actions (“Deploy Backend to Dev”) and ECS service `berthcare-dev-backend` (see runbook for CLI/console checks).
- Staging: manual trigger via Actions `workflow_dispatch` on the staging deploy workflow (mirror of dev) from the release commit/tag; release owner/backend engineer triggers after CI green, migrations reviewed/backward-compatible, env secrets/params set, and rollback plan confirmed.
- Production: manual trigger (workflow_dispatch or approved release/tag) by release owner with product/engineering approval; require staging green, smoke tests passed, stakeholder comms posted (e.g., #eng and incident channel on standby), DB migrations reviewed/ready, and rollback path identified before starting.

## Rollback
- Identify last known good version: use the last green deploy for the target environment (GitHub Actions run, release tag, or ECS task definition revision) and confirm it passed health checks.
- Revert offending change: `git revert <bad_sha>` (or a range) on a branch, open a PR, merge to `main`; this creates a corrective commit and preserves history. If urgent, revert via a hotfix branch merged immediately with review.
- Redeploy: dev auto-deploys on merge to `main`; trigger staging/prod manually (same workflow with environment-specific role/service). If ECS revision rollback is faster, deploy the prior task definition revision noted in the runbook.
- Verify after rollback: check app health endpoint, ECS/ALB target health, and logs/alerts (CloudWatch/Sentry/Datadog). Confirm database migrations are in the expected state (no forward-only changes applied that would block the older version) before closing the incident.

## References
- Branch protection setup: project-documentation/branch-protection-setup.md
- PR template: berthcare-backend/.github/PULL_REQUEST_TEMPLATE.md
- Backend CI: .github/workflows/backend-ci.yml
- Backend deploy (dev): .github/workflows/backend-deploy-dev.yml
- Deploy runbook: project-documentation/backend-deploy-runbook.md
