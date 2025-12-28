# Backlog: Wire Detox E2E Suite (MOB-E2E-001)

- **Priority:** P1 (before first production release)
- **Assignee:** Mobile engineer (TBD)
- **Status:** Open

## Scope

- Platforms: iOS Simulator (Xcode 16.1+) and Android Emulator (SDK 35–36), using custom dev client or release build artifacts.
- CI: Add a Detox job to `.github/workflows/ci.yml` (mobile) to run on PRs to `main` with cached builds where possible; artifact uploads for failing runs.
- Metro handling: ensure Detox starts Metro on a non-conflicting port (or reuses running instance) to avoid clashes with Jest/unit runs in CI.
- Scripts/config: add Detox config, build/test scripts (e.g., `npm run e2e:ios`, `npm run e2e:android`), device configs per platform, and a minimal smoke test (launch app, reach Today screen).

## Acceptance Criteria

- Detox configuration present and runnable locally for both iOS and Android with documented prerequisites.
- CI job added to mobile workflow that builds and runs the Detox smoke suite on both platforms (or platform-matrix) and gates merges when enabled.
- Metro/startup conflicts handled (explicit port or reuse strategy documented); CI runs reliably without hanging on port binding.
- README updated with E2E commands and prerequisites; failure artifacts (logs/video) available from CI on test failures.

## Notes

- Reuse existing Expo custom dev client flow; consider separate build profile for Detox if needed.
- Keep the initial suite to a fast smoke (app launch, Today screen visible) to maintain CI times; expand cases after stability.
