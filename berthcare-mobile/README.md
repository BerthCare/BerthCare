# BerthCare Mobile

[![Mobile CI](https://github.com/BerthCare/BerthCare/actions/workflows/berthcare-mobile/.github/workflows/ci.yml/badge.svg)](https://github.com/BerthCare/BerthCare/actions/workflows/berthcare-mobile/.github/workflows/ci.yml)

React Native + Expo (SDK 54, RN 0.81, TypeScript 5.9) app that helps caregivers log home care visits in under 60 seconds across three flows: **Today**, **Visit**, and **Alert**. Built with an offline-first data layer, Expo custom dev builds, and OTA updates for rapid pilot releases.

## Stack and Decisions
- Expo with `expo-dev-client` for fast onboarding, OTA updates, and native module flexibility (camera, SQLite, GPS, secure storage).
- Strict TypeScript, ESLint/Prettier, Jest + React Native Testing Library.
- Navigation ready, platform-specific components supported via `.ios.tsx`/`.android.tsx`.
- Repository layout keeps screens, shared UI, data (api/db/sync/storage), and types isolated for clarity.

## Prerequisites
- Node.js ≥ 18, npm ≥ 9 (or yarn ≥ 1.22)
- Git + Expo CLI (via `npx expo …`; installs with dependencies)
- **iOS (macOS only):** Xcode 15+, Command Line Tools, CocoaPods (`sudo gem install cocoapods`)
- **Android:** Android Studio with SDK/platform-tools + one AVD; JDK 17+ (`/Applications/Android Studio.app/Contents/jbr/Contents/Home` works on macOS)
- Expo account for EAS builds/updates (`eas login`)

## Quick Start (≈30 minutes)
1. Clone and enter the app:  
   ```bash
   git clone https://github.com/BerthCare/BerthCare.git
   cd BerthCare/berthcare-mobile
   ```
2. Install dependencies: `npm install`
3. (macOS) Install pods for native iOS code: `npx pod-install`
4. Start Metro (optional if using run commands): `npm start`
5. Run on iOS Simulator: `npm run ios`  
   - First run performs an Expo prebuild and installs pods.
6. Run on Android Emulator: `npm run android`  
   - Start an emulator first (`emulator -avd <name>`) or use Android Studio’s Device Manager.
7. You should see “BerthCare / Mobile App Initialized”. Edit `src/App.tsx` and confirm Fast Refresh updates live.

## Common Scripts
| Command | Purpose |
| --- | --- |
| `npm start` | Expo dev server + Metro bundler |
| `npm run ios` / `npm run android` | Build + launch custom dev client on simulator/emulator |
| `npm run lint` / `npm run lint:fix` | ESLint checks / auto-fix |
| `npm run format` / `npm run format:check` | Prettier format / verify |
| `npm run type-check` | TypeScript strict type checking |
| `npm run tokens:build:mobile` | Regenerate mobile design tokens (writes `src/theme/generated/*` from `design-documentation/assets/design-tokens.json`) |
| `npm test` / `npm run test:watch` | Jest + RNTL test suite |
| `npm run build:dev:ios|android` | EAS development build (custom dev client) |
| `npm run build:preview:ios|android` | EAS preview/internal builds |
| `npm run build:prod:ios|android` / `npm run build:all` | Production builds |
| `npm run update:preview|production \"Message\"` | OTA updates to preview/production channels |

## Project Structure
```
src/
├── App.tsx               # Root component
├── screens/              # today/, visit/, alert/ screens
├── ui/                   # Shared primitives (Button, Text, Card)
├── data/                 # api/, db/, sync/, storage/ for offline-first data
├── navigation/           # Navigation configuration
├── types/                # Shared TS types (models, navigation)
└── assets/               # Images, fonts
```
Naming stays simple (folder implies context), and path aliases are provided via `tsconfig.json` (`@/`, `@screens/`, `@ui/`, `@data/`, `@navigation/`, `@types/`, `@assets/`).

## Design Tokens (Mobile)
- Source: `../design-documentation/assets/design-tokens.json`
- Build: `npm run tokens:build:mobile`
- Outputs: `src/theme/generated/tokens.raw.json`, `tokens.ts`, `tokens.d.ts` (committed)
- Entry point: `src/theme/tokens.ts` (`colors`, `spacing`, `typography`, `animations`)
- CI guard: token build runs in CI with `git diff --exit-code src/theme/generated` to catch drift
- Rerun when: upstream design tokens change or parity/type tests fail locally/CI

## API Client (in progress)
- Location: `src/lib/api/` (scaffolded) with planned `ApiClient`, `config`, `interceptors`, `retry`, and typed `ApiError`.
- Scope: centralized fetch wrapper for schedule/visit flows (see `project-documentation/technical-blueprint.md#5-key-flows--sequencing`) with TLS 1.3, JWT auth, and audit-friendly error handling per `#6-non-functional-requirements-as-experience`.
- Environment configuration:
  - Base URLs live in `src/lib/api/config.ts` with dev/staging/prod entries. Defaults: `development → http://localhost:3000/api`, `staging → https://staging-api.berthcare.ca/api`, `production → https://api.berthcare.ca/api`.
  - Selection order: explicit `RequestOptions.baseUrl` override → `EXPO_PUBLIC_API_BASE_URL` env → map keyed by `EXPO_PUBLIC_API_ENV` → Expo `Updates.channel` (`development|preview|production`) → fallback to `__DEV__ ? development : production`.
  - Expo build/update mapping: `expo start` uses `development`; `eas build --profile preview` and `eas update --branch preview` use `staging`; `eas build --profile production` and `eas update --branch production` use `production`.
- Behavior (planned): auth header injection via secure token provider, 30s default timeout with AbortController, exponential backoff (idempotent methods only), 401 refresh queue, cancellation support, and property-based tests under `src/lib/api/__tests__/`.

## Database Architecture (Local-First with Encryption)
- **Engine:** `react-native-quick-sqlite` with SQLCipher enabled; AES-256 at rest.
- **Key management:** 256-bit key generated via `crypto.getRandomValues` and stored only in secure storage (`expo-secure-store`, Keychain/Keystore). Key is never logged or bundled.
- **Initialization flow:** `DatabaseService.initialize()` → open DB → apply `PRAGMA key = ?` → create schema + indexes → run migrations → ready flag set.
- **Schema:** Six tables (schedules, clients, visits, photos, sync_queue, audit_logs) with indexes for common queries. See `.kiro/specs/sqlite-encryption-setup/design.md` for diagrams and properties.
- **Repositories:** Typed repositories per entity for CRUD + domain queries; base repository handles JSON serialization/deserialization of complex fields.
- **Transactions:** `databaseService.transaction(async () => { ... })` delegates to quick-sqlite for atomic operations.

### Using the DatabaseService
```ts
import { databaseService } from '@data/db';

async function bootDatabase() {
  await databaseService.initialize();
}

async function loadToday(caregiverId: string, dateISO: string) {
  const schedules = await databaseService.schedules.findByDateAndCaregiver(dateISO, caregiverId);
  return schedules;
}

async function logAudit(entityType: string, entityId: string, actorId: string, payload: unknown) {
  await databaseService.auditLogs.create({
    // Note: crypto.randomUUID is not available in React Native by default. See guidance below.
    id: crypto.randomUUID(),
    entityType,
    entityId,
    action: 'updated',
    actorId,
    actorType: 'system',
    before: null,
    after: JSON.stringify(payload),
    deviceId: 'mobile',
    createdAt: new Date().toISOString(),
  });
}
```

### Encryption Notes
- The encryption key is fetched or created on first launch via `getOrCreateEncryptionKey` and stored securely; database files remain unreadable without it.
- Initialization errors (e.g., wrong key) are logged and block further data access until resolved.
- Tests include properties for encryption unreadability, schema idempotence, and repository CRUD guarantees.

### UUID generation in React Native/Expo
`crypto.randomUUID()` is not available in Hermes/JSC by default. Use one of these options:
1) **Expo SDK with `expo-crypto`:** If your SDK version supports `expo-crypto`'s `randomUUID()`, call that instead.
2) **Polyfill + uuid package (works across RN/Expo):**
   ```bash
   npm install react-native-get-random-values uuid
   ```
   ```ts
   import 'react-native-get-random-values';
   import { v4 as uuidv4 } from 'uuid';

   const id = uuidv4();
   ```
Ensure the polyfill import (`react-native-get-random-values`) runs before any UUID generation.

## Development Workflow
- **Fast Refresh:** Enabled by default. If it stops reloading, press `r` in Metro or `Cmd+R` / `RR` in simulators.
- **Debugging:** Open dev menu with `Cmd+D` (iOS) or `Cmd+M` / `Ctrl+M` (Android). Use Chrome DevTools or React Native Debugger.
- **Testing/Quality:** Run `npm test`, `npm run lint`, `npm run type-check`, and `npm run format:check` before pushing.
- **Native changes:** `expo run:*` handles prebuilds; rerun after adding native modules/assets. If caches misbehave, `npx expo prebuild --clean --platform ios|android`.

## Platform-Specific Code
- File extensions: `.ios.tsx`/`.ios.ts`, `.android.tsx`/`.android.ts`, shared fallback `.tsx`/`.ts`.
- Example:
  ```ts
  import Button from '@/ui/Button'; // loads Button.ios.tsx or Button.android.tsx automatically
  ```
- Metro is configured to resolve these extensions (`metro.config.js`).

## Builds and OTA Updates (EAS)
1. Sign in: `eas login`
2. Builds: use scripts above or `eas build --profile <development|preview|production> --platform ios|android|all`
3. OTA updates: `eas update --branch preview|production --message "Summary"` (scripts wrap these)
4. Build performance target: <5 minutes for production builds. Last measurement (2025-11-26): Android production via EAS succeeded in ~5–10 minutes end-to-end (queue included); iOS production requires a paid Apple Developer account.

## Observability (Sentry)
- Configuration files:
  - `sentry.properties` (placeholders only; secrets via env).
  - `app.config.ts` provides `extra.sentry` (dsn, environment, release) for runtime; no Expo plugin is used to avoid embedding tokens.
- Environment variables:
  - `EXPO_PUBLIC_SENTRY_DSN` (preferred) or `SENTRY_DSN` for runtime init
  - `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_URL` (optional) for CLI/uploads
- Release/environment: derived from app version + build number (+ git sha) via `buildSentryRelease`; `EXPO_PUBLIC_ENV` or `EAS_BUILD_PROFILE` sets environment
- Source maps: `npm run sentry:upload-sourcemaps -- --release <release>` uses `@sentry/cli` (no tokens in config). If bundles aren’t present, the script validates auth by creating/finalizing the release. CI job `sentry-upload` runs this on PRs with secrets.
- Dependencies: `@sentry/react-native` (runtime SDK) and `@sentry/cli` (source map uploads in CI/EAS).
- Privacy posture: `sendDefaultPii=false`; user context allowlist (`id`, `anonymousId`, `sessionId`); tags/extra allowlists guard telemetry. `beforeSend`/`beforeBreadcrumb` scrub tokens, emails, phones, addresses, headers; redacted events tagged `pii_redacted=true`; noisy breadcrumbs (e.g., console) dropped.
- Dev crash trigger: in dev builds a “Trigger test crash” button on the home screen calls `triggerTestCrash()` to emit a JS error and native crash (when available) for end-to-end validation with symbolication.
- Runbook (Sentry):
  - Outage: if Sentry is down, the app stays running (console fallback). Pause noise by setting `EXPO_PUBLIC_SENTRY_DSN` empty and rebuilding; re-enable once Sentry recovers.
  - Rotate auth token: create a new Sentry auth token (org→Auth Tokens) scoped for uploads, update GitHub secrets `SENTRY_AUTH_TOKEN` and EAS project secret of the same name, then rerun CI to verify.
  - Validate source maps: run `npm run sentry:upload-sourcemaps -- --release <release>` with the same release as the app build. In Sentry, check Project Settings → Source Maps for the release; confirm artifacts exist for ios/android and stacks are symbolicated.
- PII compliance checklist (status: ✅):
  - `sendDefaultPii=false` in `initSentry`.
  - Redaction: `beforeSend`/`beforeBreadcrumb` scrub tokens/emails/phones/addresses/headers/free-text; tag `pii_redacted=true` when applied.
  - All user context is opaque IDs only (`setUserContext` allowlist).
  - Secrets/config: DSN/org/project/auth only via env; `sentry.properties` holds placeholders; no secrets committed.
  - Tests: `redaction.test.ts` and `logging.test.ts` validate scrubbing, allowlists, and breadcrumb handling.

## Troubleshooting
- **Metro port conflict (8081/19000):** `lsof -ti:8081 -ti:19000 | xargs kill -9` then `npm start -- --clear`.
- **Pods missing / iOS errors:** `npx pod-install` then rerun `npm run ios`. Ensure Xcode Command Line Tools are installed.
- **Android SDK/Java issues:** Set env vars  
  ```bash
  export ANDROID_HOME="$HOME/Library/Android/sdk"
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$JAVA_HOME/bin"
  ```
- **No devices found:** `emulator -list-avds` then `emulator -avd <name>` (or start via Android Studio).
- **Stuck cache:** `rm -rf .expo` (optional), `npm start -- --clear`, reinstall dependencies if needed.

## More Documentation
- Architecture rationale: `ARCHITECTURE.md` (Expo vs bare RN, stack decisions)
- Contribution guidelines: `CONTRIBUTING.md`
- Full setup spec: `.kiro/specs/mobile-repository-setup`

## License
Proprietary — BerthCare
