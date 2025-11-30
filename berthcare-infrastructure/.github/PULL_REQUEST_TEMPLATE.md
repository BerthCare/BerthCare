## Description
<!-- Describe your changes in detail -->

## Links to Specs
<!-- Link to relevant spec documents, tickets, or design docs -->
- 

## Code Review Checklist
- [ ] Simplicity [All] - Remove steps/config; prefer sane defaults over new switches (Product Vision Section 3.1).
- [ ] UX/Operational impact [Infra] - Reduce operational steps/runbook complexity; keep deploy/plan execution fast and reversible (Blueprint Section 2).
- [ ] Availability/Offline resilience [Infra] - Graceful degradation/queueing; no planned downtime; clear sync/health signals (Blueprint Section 2 guardrail 4).
- [ ] Performance [Infra] - Avoid blocking critical paths (deploy/apply/boot); keep latency low for control planes/data paths; no unnecessary retries/storms.
- [ ] Security/Encryption [All] - Encrypted in transit/at rest; least-privilege IAM/keys; no PHI/PII in logs; scoped secrets (Product Vision 3.4; Blueprint reliability/security).
- [ ] Accessibility/Ergonomics [Infra] - CLI/API ergonomics and automation friendliness; avoid fragile manual steps; clear docs/messages (Blueprint Section 2 guardrails 7, 10).

## Code Review Checklist (Reviewer Outcome)
<!-- Reviewers: at final review, copy/paste this block into the PR description or a single review comment, fill with your initials, and list any blocking items; this supplements inline code comments, not replace them. -->
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

If this PR includes infrastructure changes:
- [ ] (Infra) `terraform fmt`/`validate` run; `go test ./...` under `tests/` executed if applicable; plan reviewed
- [ ] (Infra) Docs/README updated and architecture diagram referenced/updated if topology changes
- [ ] (Infra) Security/compliance noted; least-privilege IAM/secret handling validated
- [ ] (Infra) Deployment/plan verification and rollback/restore path stated (plan file applied; state/version rollback noted)

## Test Plan
<!-- Describe how you tested your changes -->
- [ ] Terraform plan executed and reviewed
- [ ] Manual review performed (config changes validated)

## Screenshots
<!-- Not applicable for infrastructure changes. -->
- N/A
