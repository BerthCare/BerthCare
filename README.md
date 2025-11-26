# BerthCare Mobile

## Overview

BerthCare Mobile is a React Native application designed to enable caregivers to document home care visits in under 60 seconds. The app provides a streamlined, offline-first experience with three core screens:

- **Today**: View today's schedule and client information
- **Visit**: Document what changed during a visit
- **Alert**: Quickly contact coordinators or backup support

Built for rapid iteration during a 3-month build phase, the app supports working prototypes every 2 weeks and over-the-air updates for the pilot phase.

## Technology Stack

- **React Native** 0.72+
- **Expo** SDK 49+ with custom development builds
- **TypeScript** 5.0+
- **React Navigation** 6.x

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js) or **yarn** >= 1.22.0
- **Expo CLI** (will be installed with project dependencies)

### Platform-Specific Requirements

#### iOS Development

- **macOS** (required for iOS development)
- **Xcode** 14.0 or later ([Download from Mac App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **Xcode Command Line Tools**: Install via `xcode-select --install`
- **iOS Simulator**: Included with Xcode
- **CocoaPods**: Install via `sudo gem install cocoapods`

#### Android Development

- **Android Studio** ([Download](https://developer.android.com/studio))
- **Android SDK** (installed via Android Studio)
- **Android Emulator** (configured via Android Studio AVD Manager)
- **Java Development Kit (JDK)** 11 or later

### Verify Installation

```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Check npm version
npm --version   # Should be >= 9.0.0

# Check if Xcode is installed (macOS only)
xcodebuild -version

# Check if Android SDK is installed
echo $ANDROID_HOME  # Should point to Android SDK location
```

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd berthcare-mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   
   Or if using yarn:
   ```bash
   yarn install
   ```

3. **Install iOS dependencies** (macOS only):
   ```bash
   npx pod-install
   ```

## Running the App

### Start the Development Server

```bash
npm start
```

This starts the Expo development server. You'll see a QR code and several options.

### Run on iOS Simulator

```bash
npm run ios
```

This command will:
- Start the Metro bundler
- Build the app
- Launch the iOS Simulator
- Install and run the app

**Note**: Requires macOS with Xcode installed.

### Run on Android Emulator

```bash
npm run android
```

This command will:
- Start the Metro bundler
- Build the app
- Launch the Android Emulator (if not already running)
- Install and run the app

**Note**: Ensure you have an Android Virtual Device (AVD) configured in Android Studio.

### Run on Physical Device

1. Install the **Expo Go** app on your device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the development server:
   ```bash
   npm start
   ```

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Project Structure

```
berthcare-mobile/
├── src/
│   ├── screens/              # Screen-level components
│   │   ├── today/            # Today's schedule screen
│   │   │   └── screen.tsx
│   │   ├── visit/            # Visit documentation screen
│   │   │   └── screen.tsx
│   │   └── alert/            # Emergency alert screen
│   │       └── screen.tsx
│   ├── ui/                   # Shared UI primitives
│   │   ├── Button.tsx        # Shared button component
│   │   ├── Button.ios.tsx    # iOS-specific button
│   │   └── Button.android.tsx # Android-specific button
│   ├── data/                 # Data layer
│   │   ├── api/              # API client and endpoints
│   │   ├── db/               # SQLite setup and queries
│   │   ├── sync/             # Sync engine and queue management
│   │   └── storage/          # Secure storage utilities
│   ├── types/                # TypeScript type definitions
│   ├── assets/               # Static assets
│   │   ├── images/           # Images and icons
│   │   └── fonts/            # Custom fonts
│   ├── navigation/           # Navigation configuration
│   └── App.tsx               # Root component
├── assets/                   # Expo assets (splash, icon)
├── .gitignore               # Git ignore rules
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
├── app.json                 # Expo configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

### Folder Naming Conventions

- **Folders**: Use lowercase with hyphens (e.g., `today/`, `visit/`)
- **Files**: Use descriptive names without duplicating folder context (e.g., `screen.tsx`, not `today-screen.tsx`)
- **Components**: Use PascalCase (e.g., `Button.tsx`, `ClientCard.tsx`)

## Development Workflow

### Hot Reload

The app supports **Fast Refresh** (hot reload) for instant feedback:

1. Make changes to any `.tsx` or `.ts` file
2. Save the file
3. The app automatically updates without losing state

**Note**: Some changes (like native module modifications) require a full rebuild.

### Debugging

#### React Native Debugger

1. Install [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
2. Start the app
3. Press `Cmd+D` (iOS) or `Cmd+M` (Android) in the simulator
4. Select "Debug" from the menu

#### Chrome DevTools

1. Start the app
2. Press `Cmd+D` (iOS) or `Cmd+M` (Android)
3. Select "Debug with Chrome"
4. Open Chrome DevTools (`Cmd+Option+I`)

#### Console Logs

Use `console.log()`, `console.warn()`, or `console.error()` in your code. Logs appear in:
- Terminal running Metro bundler
- React Native Debugger console
- Chrome DevTools console

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

Run tests with coverage:

```bash
npm test -- --coverage
```

### Code Quality

#### Linting

Check for code quality issues:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint -- --fix
```

#### Type Checking

Run TypeScript type checker:

```bash
npm run type-check
```

#### Formatting

Format code with Prettier:

```bash
npm run format
```

Check if code is formatted:

```bash
npm run format -- --check
```

## Architecture

### Framework Decision: Expo with Custom Development Builds

The app uses **Expo SDK 49+** with **expo-dev-client** for custom development builds. This approach balances development speed with native flexibility.

#### Why Expo with Custom Dev Builds?

**Advantages:**
- **Over-the-air (OTA) updates**: Deploy fixes and features without app store approval (critical for 3-month pilot phase)
- **Simplified configuration**: Managed native dependencies reduce setup complexity
- **Custom native modules**: expo-dev-client allows adding custom native code when needed
- **Excellent developer experience**: Fast refresh, simplified debugging, and streamlined workflows
- **Native module support**: All required modules (camera, SQLite, GPS) available through Expo modules

**Trade-offs:**
- Slightly larger app size (~2-3MB overhead)
- Some native modules may require custom development builds
- Acceptable for MVP given the benefits of rapid iteration

#### Key Expo Modules Used

- **expo-camera**: In-app camera for visit documentation
- **expo-sqlite**: Local database for offline-first architecture
- **expo-location**: GPS for visit tracking
- **expo-secure-store**: Secure storage for authentication tokens
- **expo-file-system**: File operations for attachments
- **expo-crypto**: Encryption utilities

#### Alternative Considered

**Bare React Native** was considered for unrestricted native access but rejected because:
- OTA updates are critical for the pilot phase
- All required native functionality is available through Expo modules
- Development speed is prioritized during the 3-month build phase

## Troubleshooting

### Common Issues

#### Metro Bundler Issues

**Problem**: "Metro bundler failed to start" or port conflicts

**Solution**:
```bash
# Kill processes using port 8081
lsof -ti:8081 | xargs kill -9

# Clear Metro cache and restart
npm start -- --clear
```

#### iOS Build Failures

**Problem**: "Command PhaseScriptExecution failed with a nonzero exit code"

**Solution**:
```bash
# Clean iOS build
cd ios
rm -rf build
pod deinstall
pod install
cd ..

# Rebuild
npm run ios
```

**Problem**: "No bundle URL present"

**Solution**:
1. Ensure Metro bundler is running (`npm start`)
2. Reset the simulator: Device → Erase All Content and Settings
3. Rebuild: `npm run ios`

#### Android Build Failures

**Problem**: "SDK location not found"

**Solution**:
1. Create `android/local.properties` file
2. Add: `sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk` (macOS)
3. Or: `sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk` (Windows)

**Problem**: "Execution failed for task ':app:installDebug'"

**Solution**:
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Rebuild
npm run android
```

#### Dependency Issues

**Problem**: "Module not found" or "Cannot resolve module"

**Solution**:
```bash
# Clear all caches and reinstall
rm -rf node_modules
rm package-lock.json  # or yarn.lock
npm install

# Clear Metro cache
npm start -- --clear
```

#### TypeScript Errors

**Problem**: "Type errors in node_modules"

**Solution**:
```bash
# Ensure TypeScript version is correct
npm install typescript@^5.0.0

# Run type check
npm run type-check
```

#### Hot Reload Not Working

**Problem**: Changes not reflecting in the app

**Solution**:
1. Press `R` in the terminal running Metro to reload
2. Press `Cmd+R` (iOS) or `RR` (Android) in the simulator
3. Restart Metro bundler: `npm start -- --clear`

#### Simulator/Emulator Not Launching

**iOS Simulator**:
```bash
# List available simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "iPhone 14"

# Open Simulator app
open -a Simulator
```

**Android Emulator**:
```bash
# List available emulators
emulator -list-avds

# Start a specific emulator
emulator -avd YOUR_AVD_NAME
```

### Getting Help

If you encounter issues not covered here:

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Search [Expo forums](https://forums.expo.dev/)
3. Check [React Native documentation](https://reactnative.dev/docs/getting-started)
4. Review [GitHub issues](https://github.com/expo/expo/issues)

## Platform-Specific Code

The project supports platform-specific implementations to respect native conventions while maintaining a consistent BerthCare identity.

### File Extensions

React Native automatically selects the appropriate file based on the platform:

- `.ios.tsx` / `.ios.ts` - iOS-specific implementation
- `.android.tsx` / `.android.ts` - Android-specific implementation
- `.tsx` / `.ts` - Shared implementation (fallback)

### Usage Example

```typescript
// Import works the same way on both platforms
import Button from '@/ui/Button';

// React Native automatically loads:
// - Button.ios.tsx on iOS
// - Button.android.tsx on Android
// - Button.tsx as fallback if platform-specific file doesn't exist
```

### Platform Adaptations

**iOS:**
- SF Pro font (system default)
- iOS blue (#007AFF)
- Rounded corners (10px border radius)
- Letter spacing: -0.4
- Active opacity: 0.6

**Android:**
- Roboto font (system default)
- Material blue (#2196F3)
- Less rounded corners (4px border radius)
- Letter spacing: 1.25
- Elevation for shadows
- Uppercase button text

### When to Use Platform-Specific Code

Use platform-specific files when:
- UI components need different visual styles (buttons, navigation)
- Platform conventions differ significantly (iOS swipe vs Android back button)
- Native APIs have different implementations

Keep shared when:
- Business logic is identical
- Data models and types are the same
- API calls and data fetching are platform-agnostic

### Metro Configuration

The Metro bundler is configured to recognize platform-specific extensions in `metro.config.js`:

```javascript
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ios.tsx',
  'android.tsx',
  'ios.ts',
  'android.ts',
];
```

## Building and Deployment

### Expo Application Services (EAS)

The project uses **EAS Build** for creating production-ready builds and **EAS Update** for over-the-air updates.

#### Initial Setup

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure your project**:
   ```bash
   eas build:configure
   ```
   
   This will prompt you to create an Expo account and link your project. Update the `projectId` in `app.json` with your actual project ID.

#### Build Profiles

The project includes three build profiles configured in `eas.json`:

- **development**: For internal testing with development client
- **preview**: For internal distribution (TestFlight/Internal Testing)
- **production**: For app store submission

#### Creating Builds

**Development Builds** (for testing with custom native code):
```bash
# iOS development build
npm run build:dev:ios
# or: eas build --profile development --platform ios

# Android development build
npm run build:dev:android
# or: eas build --profile development --platform android
```

**Preview Builds** (for internal testing):
```bash
# iOS preview build
npm run build:preview:ios
# or: eas build --profile preview --platform ios

# Android preview build
npm run build:preview:android
# or: eas build --profile preview --platform android
```

**Production Builds** (for app stores):
```bash
# iOS production build
npm run build:prod:ios
# or: eas build --profile production --platform ios

# Android production build
npm run build:prod:android
# or: eas build --profile production --platform android

# Build for both platforms
npm run build:all
# or: eas build --profile production --platform all
```

#### Over-the-Air (OTA) Updates

EAS Update allows you to deploy JavaScript and asset updates without going through app store review.

**Publishing Updates**:

```bash
# Publish to preview channel
npm run update:preview "Fix: Updated visit screen layout"
# or: eas update --branch preview --message "Fix: Updated visit screen layout"

# Publish to production channel
npm run update:production "Release: Version 1.0.1 - Bug fixes"
# or: eas update --branch production --message "Release: Version 1.0.1 - Bug fixes"
```

**Update Behavior**:
- Updates are checked on app launch (`checkAutomatically: "ON_LOAD"`)
- Updates download in the background
- New version applies on next app restart
- Fallback to cached version if update fails

**What Can Be Updated**:
- JavaScript code changes
- React components and screens
- Assets (images, fonts)
- Configuration in `app.json` (some fields)

**What Requires a New Build**:
- Native code changes (iOS/Android)
- Native module additions
- Changes to `ios/` or `android/` directories
- App version or build number changes
- Permissions or entitlements changes

#### Build Configuration

**eas.json** defines build profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

**app.json** configures updates:

```json
{
  "updates": {
    "url": "https://u.expo.dev/[your-project-id]",
    "checkAutomatically": "ON_LOAD",
    "enabled": true
  },
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

#### Monitoring Builds

After starting a build:

1. View build progress in terminal
2. Or visit: https://expo.dev/accounts/[your-account]/projects/berthcare-mobile/builds
3. Download builds when complete
4. Install on devices for testing

#### Distribution

**iOS (TestFlight)**:
```bash
# Build and submit to TestFlight
eas build --profile production --platform ios --auto-submit
```

**Android (Internal Testing)**:
```bash
# Build and submit to Google Play Internal Testing
eas build --profile production --platform android --auto-submit
```

#### Best Practices

1. **Use development builds** during active development
2. **Use preview builds** for internal team testing
3. **Use production builds** for app store submission
4. **Use OTA updates** for quick fixes and minor updates during pilot phase
5. **Always test updates** on preview channel before pushing to production
6. **Document changes** in update messages for tracking
7. **Monitor update adoption** through Expo dashboard

## License

Proprietary - BerthCare
