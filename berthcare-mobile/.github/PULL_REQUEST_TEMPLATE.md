## Description
<!-- Describe your changes in detail -->

## Links to Specs
<!-- Link to relevant spec documents, tickets, or design docs -->
- 

## Code Review Checklist
- [ ] Simplicity - Remove steps/UI; avoid new toggles; defaults over config (Product Vision Section 3.1).
- [ ] UX impact (Sarah) - Fewer taps; thumb-zone friendly; fits 3-screen/<=60s flow (Product Vision Section 3; Blueprint Section 2).
- [ ] Offline support - Works without network; local writes queued; no "No internet" blockers; clear save/sync state (Blueprint Section 2 guardrail 4).
- [ ] Performance - Transitions ~<300ms; no N+1; avoid heavy UI-thread work; prefetch/cache schedule/visits (Blueprint Section 2 guardrail 8).
- [ ] Security/Encryption - Encrypted in transit/at rest; no PHI/PII in logs; least-privilege tokens/keys; safe photo/secret storage (Product Vision 3.4; Blueprint reliability/security).
- [ ] Accessibility - Screen reader labels; large touch targets; keyboard/gesture parity; avoid color-only cues (Blueprint Section 2 guardrails 7, 10).

## Code Review Checklist (Reviewer Outcome)
<!-- Reviewers: copy this block into a PR comment and fill it out with your initials -->
- Reviewer: [initials]
- Simplicity: Pass / Needs changes — notes
- UX impact (Sarah): Pass / Needs changes — notes
- Offline support: Pass / Needs changes — notes
- Performance: Pass / Needs changes — notes
- Security/Encryption: Pass / Needs changes — notes
- Accessibility: Pass / Needs changes — notes

## Engineering Rituals (confirm in PR)
- [ ] Repo init/scaffold commit reference included when relevant
- [ ] Branch/PR flow followed (short-lived branch, linked issue, 1+ review)
- [ ] Review/testing gates run (lint, format check, type-check, unit/E2E as applicable)
- [ ] Docs/README updated and architecture diagram referenced/updated if behavior changed
- [ ] Security scans/compliance noted; secrets/PII kept out of code/logs; tokens/secrets in EAS config
- [ ] Deployment verification/rollback plan stated (EAS channel/build rollback path)

## Test Plan
<!-- Describe how you tested your changes -->
- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] Integration tests (if applicable)

## Review Checklist (Mobile Design Tokens)
- [ ] `npm run tokens:build:mobile` run and generated artifacts (`src/theme/generated/*`) committed
- [ ] Token parity/type checks passing (no inline literals in sample components)
- [ ] Sample components use tokens (no hard-coded design values)
- [ ] Docs updated where needed (token build instructions, regeneration notes)

## Screenshots
<!-- Add before/after screenshots for UI changes. Include both iOS and Android when applicable. -->
- iOS:
- Android:
