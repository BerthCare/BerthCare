# Contributing to BerthCare Infrastructure

Infrastructure changes must preserve the product experience by keeping backends secure, reliable, and zero-downtime, aligned to Product Vision Section 3 and Technical Blueprint Section 2.

## References

- Product philosophy: `../project-documentation/product-vision.md#3-core-philosophy`
- UX guardrails: `../project-documentation/technical-blueprint.md#2-experience-first-design-guardrails` (guardrails list)

## Code Review Checklist

- For infra reviews, interpret the product/UX/accessibility items below through uptime, latency, data protection, and operational simplicity. See "Infra-Specific Review Notes" and "Good vs Bad Examples" for how to apply them.
- [ ] Simplicity - Remove steps/UI; avoid new toggles; defaults over config (Product Vision Section 3.1).
- [ ] UX impact (Sarah) - Fewer taps; thumb-zone friendly; fits 3-screen/<=60s flow (Product Vision Section 3; Blueprint Section 2).
- [ ] Offline support - Works without network; local writes queued; no "No internet" blockers; clear save/sync state (Blueprint Section 2 guardrail 4).
- [ ] Performance - Transitions ~<300ms; no N+1; avoid heavy UI-thread work; prefetch/cache schedule/visits (Blueprint Section 2 guardrail 8).
- [ ] Security/Encryption - Encrypted in transit/at rest; no PHI/PII in logs; least-privilege tokens/keys; safe photo/secret storage (Product Vision 3.4; Blueprint reliability/security).
- [ ] Accessibility - Screen reader labels; large touch targets; keyboard/gesture parity; avoid color-only cues (Blueprint Section 2 guardrails 7, 10).

## Infra-Specific Review Notes

- Least privilege everywhere: tighten IAM roles, avoid wildcards, scope bucket and DB access; prefer OIDC for CI.
- Encrypted state/backends: Terraform state, S3 buckets, RDS/DB storage, and in-flight traffic must stay encrypted.
- Zero-downtime mindset: use rolling/blue-green strategies; avoid destructive changes to live resources; plan/apply with clear rollback.
- Observability and logs: no PHI/PII in logs/metrics; ensure log sinks are restricted and encrypted.
- Resilience: validate backups/snapshots and restore paths; ensure plans include failure/rollback steps.

## Good vs Bad Examples (Blueprint Section 2 guardrail references)

- Offline always works (Section 2, Guardrail 4)
  Good: Keep API endpoints and sync queues available during infra changes (rolling updates, health checks, circuit breakers).  
  Bad: Apply changes that force downtime for sync services, causing "No internet" blockers in the app.
- Fast paths / low latency (Section 2, Guardrail 8)
  Good: Place caches/DBs in-region with proper indexes and connection pooling to keep p99 low for app transitions.  
  Bad: Introduce cross-region calls or unindexed queries that add 300ms+ to the critical path.
- Least-privilege + encryption (Section 2, Guardrail 6 + Product Vision 3.4)
  Good: Encrypt state/backends, scoped IAM for buckets/DB, signed URLs with short TTLs, ALB/CloudFront TLS enforcement.  
  Bad: Public/wildcard IAM on buckets or DB, plaintext state, or unencrypted traffic between services.
- Zero-downtime changes (Section 2, Guardrail 8 for responsiveness)
  Good: Blue/green or rolling deploys with health checks and rollback steps; DB migrations applied with safe defaults.  
  Bad: In-place deletes/renames without backfill, or force-replace resources that drop availability.

## How to Use This Checklist in PRs

- The PR template at `.github/PULL_REQUEST_TEMPLATE.md` contains this checklist. Authors must check each item in the PR description.
- Reviewers: copy the "Code Review Checklist (Reviewer Outcome)" block from the template into a comment, add your initials, and mark Pass/Needs changes with notes.
- Link specs/design tickets in "Links to Specs" so checklist answers trace back to source material.

## Engineering Rituals (confirm before merge)

- Repo init/scaffold: reference the initial scaffold commit or context when relevant.
- Branch/PR flow: short-lived branch (e.g., `infra/<topic>`), linked issue, at least one review.
- Review/testing gates: `terraform fmt -recursive`, `terraform validate`, `go test ./...` under `tests/`; include `terraform plan` output for the target workspace/env.
- Docs/diagrams: update this CONTRIBUTING, README, and relevant diagrams when modules, networking, or state layouts change.
- Security/compliance: no plaintext secrets; enforce TLS, tagging, region constraints; validate IAM least privilege; confirm encrypted state/backends.
- Deployment/plan verification and rollback: reviewers read the plan; apply only the reviewed plan; note rollback/restore path (state versioning, backups) in the PR.
