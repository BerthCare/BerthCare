# Tasks: Implement 7-Day Offline Grace Period (Mobile)

**Input**: Design documents from `/specs/004-offline-grace-period-mobile/`  
**Prerequisites**: plan.md, spec.md  
**Tests**: Required per spec (unit tests for offline grace; UI tests for soft block + read-only).  
**Organization**: Tasks grouped by user story and engineering rituals.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup & Alignment

- [ ] T001 Review Technical Blueprint sections for UX Guardrail 4 and Offline Capability.
- [ ] T002 Review design reference for Today Schedule offline edge case.
- [ ] T003 Audit current AuthService offline logic, storage keys, and auth state usage.

---

## Phase 2: User Story 1 - Keep working offline within grace (Priority: P1)

**Goal**: Allow cached access when offline within 7-day grace.

- [ ] T004 [P] Update AuthService offline grace decisioning to use access token expiry timestamps during `restoreAuthState`.
- [ ] T005 [P] Expose offline access decision to app shell (AuthState flag or new OfflineAccessState) and wire into `berthcare-mobile/src/App.tsx`.
- [ ] T006 [P] Ensure offline state sets `authState.isOffline = true` without forcing reauth while within grace.

---

## Phase 3: User Story 2 - Soft block after grace expires (Priority: P1)

**Goal**: Provide a dismissible "Connect to internet to continue" message and read-only mode.

- [ ] T007 [P] Add `OfflineGraceBanner` (or inline callout) component with dismiss action and accessibility labels.
- [ ] T008 [P] Show banner when offline grace expired (Today + Visit screens or a global shell).
- [ ] T009 [P] Enforce read-only mode for cached data (disable edits, creation, and sync actions) while grace expired.

---

## Phase 4: User Story 3 - Recover when back online (Priority: P2)

**Goal**: Refresh on reconnect and clear soft block on success.

- [ ] T010 [P] Listen for connectivity restoration and trigger token refresh.
- [ ] T011 [P] Clear soft block and read-only mode on refresh success; route to Login on failure.

---

## Phase 5: Tests & QA

- [ ] T012 [P] Add unit tests for offline grace logic in `berthcare-mobile/src/lib/auth/__tests__/`.
- [ ] T013 [P] Add UI tests for banner display, dismissal, and read-only enforcement.
- [ ] T014 Run `npm test` and `npm run lint` in `berthcare-mobile` and capture results.

---

## Phase 6: Documentation & Governance

- [ ] T015 Update `berthcare-mobile/src/lib/auth/README.md` with offline grace usage and UI behavior.
- [ ] T016 Reference Technical Blueprint sections in relevant doc blocks or README updates.
- [ ] T017 Reference architecture diagrams in docs where applicable (Technical Blueprint diagrams or links).
- [ ] T018 Update `berthcare-mobile/ARCHITECTURE.md` if auth gating or navigation flow changes.
- [ ] T019 Update any screen-level README (Today/Visit) to document read-only behavior under grace expiry.

---

## Phase 7: Engineering Rituals & Release Hygiene

- [ ] T020 Initialize/confirm repo hygiene and create feature branch `004-offline-grace-period-mobile`.
- [ ] T021 Commit scaffolds/spec-kit artifacts (`spec.md`, `plan.md`, `tasks.md`) with a clear message.
- [ ] T022 Open PR with summary, acceptance criteria coverage, test evidence, risk notes, and rollback steps.
- [ ] T023 Complete code review feedback and re-run tests/lint gates.
- [ ] T024 Run security scan (`npm audit` or org-approved tool) and document findings/waivers.
- [ ] T025 Complete compliance checklist if applicable (or document N/A) for auth/offline behavior.
- [ ] T026 Deployment verification: test offline/online transitions on device/simulator and validate rollback plan (revert PR, re-run tests).
- [ ] T027 Merge PR after all gates pass and update tracking in `IMPLEMENTATION_PLAN.md` if required.

---

## Dependencies & Execution Order

- Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7.
- Marked [P] tasks can run concurrently after prerequisites.
