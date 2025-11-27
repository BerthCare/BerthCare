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
