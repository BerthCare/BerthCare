# Contributing to BerthCare Backend

This backend serves the mobile experience and must uphold the product philosophy (Product Vision Section 3) and UX guardrails (Technical Blueprint Section 2).

## References
- Product philosophy: `../project-documentation/product-vision.md#3-core-philosophy`
- UX guardrails: `../project-documentation/technical-blueprint.md#2-experience-first-design-guardrails`

## Code Review Checklist
- [ ] Simplicity - Remove steps/UI; avoid new toggles; defaults over config (Product Vision Section 3.1).
- [ ] UX impact (Sarah) - Fewer taps; thumb-zone friendly; fits 3-screen/<=60s flow (Product Vision Section 3; Blueprint Section 2).
- [ ] Offline support - Works without network; local writes queued; no "No internet" blockers; clear save/sync state (Blueprint Section 2 guardrail 4).
- [ ] Performance - Transitions ~<300ms; no N+1; avoid heavy UI-thread work; prefetch/cache schedule/visits (Blueprint Section 2 guardrail 8).
- [ ] Security/Encryption - Encrypted in transit/at rest; no PHI/PII in logs; least-privilege tokens/keys; safe photo/secret storage (Product Vision 3.4; Blueprint reliability/security).
- [ ] Accessibility - Screen reader labels; large touch targets; keyboard/gesture parity; avoid color-only cues (Blueprint Section 2 guardrails 7, 10).

## Backend-Specific Review Notes
- Latency/throughput: budget API p99s to keep app transitions <300ms; avoid N+1 by preloading/joins; prefer pagination and indexed queries.
- Data access: minimize query count per request; measure DB calls in PRs touching new endpoints; ensure migrations include indexes for common filters.
- Logging/encryption: never log PHI/PII or secrets; redact sensitive fields; enforce HTTPS/TLS everywhere; storage/buckets encrypted at rest.
- Sync contracts: keep response payloads minimal; include stable IDs/timestamps for delta sync; avoid schema changes that break offline queues.

## Good vs Bad Examples (Blueprint Section 2 guardrail references)
- **Offline always works (Section 2, Guardrail 4)**  
  Good: API accepts queued writes with idempotency keys and returns sync receipts; client can retry without duplicate effects.  
  Bad: Reject queued writes with 409/412 and force a re-fetch before accepting changes.
- **Fast paths / no N+1 (Section 2, Guardrail 8)**  
  Good: Prefetch schedule and visits with batched queries; include last-visit summary in a single query to render instantly.  
  Bad: Per-visit queries inside a loop that add 100+ DB calls for a list page.
- **Secure logging/storage (Section 2, Guardrail 6 + Product Vision 3.4)**  
  Good: Structured logs with request IDs and redacted payloads; encrypted storage for photos and audit artifacts; least-privilege IAM.  
  Bad: Plaintext PHI in logs or public/wildcard access to storage where photos/exports live.
- **Encryption and storage (Section 2, Guardrail 6 + Product Vision 3.4)**  
  Good: Enforce TLS, encrypt buckets/DB, scoped IAM for photo/export access; signed URLs with short TTLs.  
  Bad: Public or wildcard access to storage, or unencrypted connections to DB/object storage.

## How to Use This Checklist in PRs
- The PR template at `.github/PULL_REQUEST_TEMPLATE.md` already contains the checklist. Authors must check each item in the PR description.
- Reviewers: copy the "Code Review Checklist (Reviewer Outcome)" block from the template into a comment, add your initials, and mark Pass/Needs changes with notes.
- Include links to relevant specs/design tickets in the "Links to Specs" section so checklist answers can be traced to sources.

## Engineering Rituals (confirm before merge)
- Repo init/scaffold: reference the initial scaffold commit or context when relevant.
- Branch/PR flow: short-lived branch, linked issue, at least one review.
- Review/testing gates: `npm run lint`, `npm run type-check`, `npm test` (and `npm run test:integration` when DB flows change); regenerate Prisma client when schema changes.
- Docs/diagrams: update this CONTRIBUTING, README, and any affected diagrams/observability docs when behavior, endpoints, or logging change.
- Security/compliance: no secrets in code; keep PHI/PII out of logs/metrics; prefer OIDC for cloud access; ensure TLS/encryption settings remain enforced.
- Deployment verification/rollback: confirm CI + deploy green, ECS service healthy, `/health` OK; document rollback path (prior task definition/SHA) in the PR when relevant.
