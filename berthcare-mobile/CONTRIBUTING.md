# Contributing to BerthCare Mobile

This mobile app delivers the three-screen experience; keep every change aligned to Product Vision Section 3 and Technical Blueprint Section 2.

## References

- Product philosophy: `../project-documentation/product-vision.md#3-core-philosophy`
- UX guardrails: `../project-documentation/technical-blueprint.md#2-experience-first-design-guardrails` (including guardrails list)

## Code Review Checklist

- [ ] Simplicity - Remove steps/UI; avoid new toggles; defaults over config (Product Vision Section 3.1).
- [ ] UX impact (Sarah) - Fewer taps; thumb-zone friendly; fits 3-screen/<=60s flow (Product Vision Section 3; Blueprint Section 2).
- [ ] Offline support - Works without network; local writes queued; no "No internet" blockers; clear save/sync state (Blueprint Section 2 guardrail 4).
- [ ] Performance - Transitions ~<300ms; no N+1; avoid heavy UI-thread work; prefetch/cache schedule/visits (Blueprint Section 2 guardrail 8).
- [ ] Security/Encryption - Encrypted in transit/at rest; no PHI/PII in logs; least-privilege tokens/keys; safe photo/secret storage (Product Vision 3.4; Blueprint reliability/security).
- [ ] Accessibility - Screen reader labels; large touch targets; keyboard/gesture parity; avoid color-only cues (Blueprint Section 2 guardrails 7, 10).

## Mobile-Specific Review Notes

- Offline-first: all flows work without network; write to local queue/SQLite; never block with offline modals.
- No explicit save: auto-save on change; restore exact state after app crash/background; visible save/sync status.
- Fast interactions: prefetch schedule/last visit; avoid spinners for cached data; keep transitions <~300ms.
- Accessibility: large touch targets, proper labels/hints, gesture/keyboard parity; test with screen reader.
- Media and storage: photos never touch the camera roll; compress/encrypt on device; use least-privilege access to uploads/exports.
- Error/resilience: graceful retries with idempotency keys; avoid noisy toasts for expected offline states.

## Good vs Bad Examples (Blueprint Section 2 guardrail references)

- Offline always works (Section 2, Guardrail 4)
  Good: Write visit updates to the local queue/SQLite, show "Saved locally" and sync when online; keep the UI usable.  
  Bad: Block submission with a modal "No internet, try again" and discard edits.
- No explicit save button (Section 2, Guardrail 2)
  Good: Auto-save on change and show clear save/sync status; reopen exactly where the user left off after a crash.  
  Bad: Add a "Save" button and risk losing edits when the app/background activity stops.
- Fast transitions (Section 2, Guardrail 8)
  Good: Prefetch today's schedule/last visit so tapping a client renders immediately while a background refresh runs.  
  Bad: Show a spinner while waiting for network before rendering cached schedule/visit data.
- Secure photos/storage (Section 2, Guardrail 6 + Product Vision 3.4)
  Good: Capture photos in-app, compress/encrypt, keep them out of the camera roll, and store in encrypted buckets with least-privilege IAM.  
  Bad: Save photos to the device gallery or a public S3 bucket, expose URLs, or use wildcard IAM roles.

## How to Use This Checklist in PRs

- The PR template at `.github/PULL_REQUEST_TEMPLATE.md` contains this checklist. Authors must check each item in the PR description.
- Reviewers: copy the "Code Review Checklist (Reviewer Outcome)" block from the template into a comment, add your initials, and mark Pass/Needs changes with notes.
- Always link specs/design tickets in "Links to Specs" so checklist answers trace to source materials.

## Engineering Rituals (confirm before merge)

- Repo init/scaffold: reference the initial scaffold commit or context when relevant.
- Branch/PR flow: short-lived branch, linked issue, at least one review.
- Review/testing gates: `npm run lint`, `npm run format:check`, `npm run type-check`, `npm test`; run E2E/Detox when flows change; rerun `npm run tokens:build:mobile` when design tokens change and commit outputs.
- Docs/diagrams: update this CONTRIBUTING, README, `ARCHITECTURE.md`, and any diagrams when navigation/data contracts change.
- Security/compliance: no secrets in source; configure API/Sentry via `EXPO_PUBLIC_*`/EAS secrets; keep PII out of logs/telemetry.
- Deployment verification/rollback: verify EAS build/update outputs, channel mapping (development/preview/production), and note rollback path (prior build or pausing OTA) in the PR when relevant.
