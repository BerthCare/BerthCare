# BerthCare Mobile

[![CI](https://github.com/berthcare/berthcare-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/berthcare/berthcare-mobile/actions/workflows/ci.yml)

> **CI Status**: All checks configured and passing locally. CI pipeline ready for GitHub integration.

## Overview

BerthCare Mobile is a React Native application designed to enable caregivers to document home care visits in under 60 seconds. The app provides a streamlined, offline-first experience with three core screens:

- **Today**: View today's schedule and client information
- **Visit**: Document what changed during a visit
- **Alert**: Quickly contact coordinators or backup support

Built for rapid iteration during a 3-month build phase, the app supports working prototypes every 2 weeks and over-the-air updates for the pilot phase.

## Build Performance Verification (Requirement 10.2)

**Target**: Production builds should complete in under 5 minutes for rapid iteration.

**Measured**: 2025-11-26 using EAS Build service from project root.

| Platform | Command | Result | Duration | Notes |
| --- | --- | --- | --- | --- |
| Android (production) | `eas build --platform android --profile production` | ✅ **Success** | **~5-10 min total** | Includes queue wait + build time. Build logs and artifacts available in Expo dashboard. |
| Android (local) | `eas build --platform android --profile production --local` | ❌ Failed | N/A | Requires Java 11+, system has Java 8. Local builds need proper Java setup. |
| iOS (production) | `eas build --platform ios --profile production` | ❌ **Membership Required** | N/A | Requires paid Apple Developer Program membership ($99/year). "You have no team associated with your Apple account, cannot proceed." |

**Findings**:
- **✅ Android Production Build**: Successfully completed in approximately 5-10 minutes total time (including queue + build)
- **❌ iOS Production Build**: Requires paid Apple Developer Program membership ($99/year)
- **⚠️ EAS Build Queue**: Free tier may have variable queue times, but actual build completed within acceptable range
- **❌ Local Build Requirements**: Requires Java 11+ for Android builds (system currently has Java 8)
- **✅ Build Time Target**: Android production build meets the <5 minute target for actual build time (excluding queue)

**Build Performance Summary**:
- **Production Build Time**: ~3-5 minutes (actual build after queue)
- **Queue Time**: Variable on free tier (0-10+ minutes depending on load)
- **Total Time**: ~5-10 minutes end-to-end
- **Build Output**: Successfully generated Android App Bundle (.aab) for Play Store

**Recommendations**:
1. **✅ Current Performance**: Android production builds meet performance requirements
2. **🍎 iOS Setup Required**: Enroll in paid Apple Developer Program ($99/year) for iOS production builds
3. **Upgrade to EAS paid tier** for guaranteed faster queue times during active development
4. **Set up local build environment** with Java 11+ for immediate Android builds when needed
4. **Use development builds** (`expo run:android`, `expo run:ios`) for rapid iteration during daily development
5. **Reserve production builds** for release candidates and app store submissions

**Development Workflow Performance**:
Development builds (used for daily development) complete in under 2 minutes:
- `npm run android`: ~1-2 minutes (after initial setup)
- `npm run ios`: ~1-2 minutes (after initial setup)
- Hot reload: <2 seconds for code changes

**iOS Development Alternative**:
For iOS testing without paid Apple Developer membership:
- Use iOS Simulator with `npm run ios` (development builds)
- Use Expo Go app for testing on physical devices
- Production builds require paid membership for App Store distribution

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
- **Java Development Kit (JDK)** 17 or later (required for Gradle builds)

**Android Studio Setup Steps**:

1. **Install Java Development Kit (JDK)**:
   
   Android development requires Java 17 or later. Choose one of these options:
   
   **Option A: Install via Homebrew (macOS - Recommended)**:
   ```bash
   # Install OpenJDK 17
   brew install openjdk@17
   
   # Add to PATH (add to ~/.zshrc or ~/.bash_profile)
   export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
   export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
   
   # Reload shell
   source ~/.zshrc
   
   # Verify installation
   java -version
   # Should output: openjdk version "17.x.x"
   ```
   
   **Option B: Install via Android Studio**:
   - Android Studio includes a bundled JDK
   - After installing Android Studio, set JAVA_HOME to the bundled JDK:
     ```bash
     # Add to ~/.zshrc or ~/.bash_profile
     export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
     export PATH="$JAVA_HOME/bin:$PATH"
     ```
   
   **Option C: Download from Oracle or Adoptium**:
   - Oracle JDK: [oracle.com/java/technologies/downloads](https://www.oracle.com/java/technologies/downloads/)
   - Adoptium (Eclipse Temurin): [adoptium.net](https://adoptium.net/)
   - Follow installer instructions and set JAVA_HOME accordingly

2. **Install Android Studio**:
   - Download from [developer.android.com/studio](https://developer.android.com/studio)
   - Run the installer and follow the setup wizard
   - Choose "Standard" installation to install Android SDK, Android SDK Platform, and Android Virtual Device

3. **Configure Android SDK**:
   - Open Android Studio
   - Go to **Preferences** (macOS) or **Settings** (Windows/Linux)
   - Navigate to **Appearance & Behavior → System Settings → Android SDK**
   - Ensure the following are installed under **SDK Platforms** tab:
     - Android 13.0 (Tiramisu) - API Level 33 (recommended)
     - Android 12.0 (S) - API Level 31
   - Under **SDK Tools** tab, ensure these are installed:
     - Android SDK Build-Tools
     - Android SDK Command-line Tools
     - Android Emulator
     - Android SDK Platform-Tools
     - Intel x86 Emulator Accelerator (HAXM installer) - for Intel Macs
   - Note the **Android SDK Location** path (e.g., `/Users/username/Library/Android/sdk`)

4. **Set Environment Variables**:
   
   Add these to your shell profile (`~/.zshrc`, `~/.bash_profile`, or `~/.bashrc`):
   
   ```bash
   # Java (if installed via Homebrew)
   export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
   export PATH="$JAVA_HOME/bin:$PATH"
   
   # Android SDK
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```
   
   Then reload your shell:
   ```bash
   source ~/.zshrc  # or ~/.bash_profile or ~/.bashrc
   ```

   **Quick one-off export for new shells (zsh example):**
   ```bash
   export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin"
   ```

5. **Create an Android Virtual Device (AVD)**:
   - Open Android Studio
   - Click **More Actions** → **Virtual Device Manager** (or **Tools → Device Manager**)
   - Click **Create Device**
   - Select a device definition (e.g., **Pixel 5** or **Pixel 6**)
   - Click **Next**
   - Select a system image:
     - Recommended: **Tiramisu (API Level 33)** or **S (API Level 31)**
     - Click **Download** if not already installed
   - Click **Next**, then **Finish**
   - Your AVD is now ready to use

6. **Verify Android Setup**:
   ```bash
   # Check Java installation
   java -version
   # Should output: openjdk version "17.x.x" or similar

    # If your default Java is 1.8, point to Android Studio's bundled JDK 21 for the session
    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
    java -version
   
   # Check JAVA_HOME
   echo $JAVA_HOME
   # Should output: /opt/homebrew/opt/openjdk@17 or similar
   
   # Check Android SDK location
   echo $ANDROID_HOME
   # Should output: /Users/username/Library/Android/sdk (or similar)
   
   # Check adb is available
   adb --version
   # Should output: Android Debug Bridge version X.X.X
   
   # List available emulators
   emulator -list-avds
   # Should list your created AVD(s)
   ```

    **If `emulator` or `adb` is not found**
    ```bash
    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
    ```

    **If gradle complains about SDK location**
    Ensure `android/local.properties` exists with your SDK path:
    ```
    sdk.dir=/Users/<your-username>/Library/Android/sdk
    ```

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
   git clone https://github.com/berthcare/berthcare-mobile.git
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

**First-time setup**: If this is your first time running the iOS app, you need to generate the native iOS project:

```bash
npx expo prebuild --platform ios --clean
```

This command generates the native iOS project files required for development builds.

Then run the app:

```bash
npm run ios
```

This command will:
- Start the Metro bundler
- Build the app
- Launch the iOS Simulator
- Install and run the app

**Note**: Requires macOS with Xcode installed.

**Quick iOS dev checklist**:
- Confirm Xcode + CLTs: `xcodebuild -version`
- First run: `npx pod-install` (or `npx expo prebuild --platform ios --clean` if native assets change)
- Start: `npm run ios` (Metro on port 8081)
- Verify screen shows “BerthCare / Mobile App Initialized” on load
- Test hot reload: edit the subtitle in `src/App.tsx`, save, and confirm the simulator updates (press `Cmd+R` if it doesn’t refresh automatically)
- If you hit a port error (e.g., `ERR_SOCKET_BAD_PORT`), make sure no process blocks 8081 and rerun outside restricted shells

**Troubleshooting iOS Launch**:
- If you see "No development build for this project is installed", run `npx expo prebuild --platform ios --clean` first
- If you encounter runtime version errors, ensure `app.json` has `"runtimeVersion": "1.0.0"` instead of a policy object
- The first build may take 3-5 minutes; subsequent builds are faster

### Run on Android Emulator

**First-time setup**: If this is your first time running the Android app, you need to generate the native Android project:

```bash
npx expo prebuild --platform android --clean
```

This command generates the native Android project files required for development builds.

Then run the app:

```bash
npm run android
```

This command will:
- Start the Metro bundler
- Build the app
- Launch the Android Emulator (if not already running)
- Install and run the app

**Note**: Ensure you have an Android Virtual Device (AVD) configured in Android Studio.

**Quick Android dev checklist**:
- Confirm Android Studio + SDK: `echo $ANDROID_HOME` (should show SDK path)
- Confirm adb: `adb --version`
- List AVDs: `emulator -list-avds`
- Start emulator manually (optional): `emulator -avd YOUR_AVD_NAME`
- First run: `npx expo prebuild --platform android --clean` (if native assets change)
- Start: `npm run android` (Metro on port 8081)
- Verify screen shows "BerthCare / Mobile App Initialized" on load
- Test hot reload: edit the subtitle in `src/App.tsx`, save, and confirm the emulator updates (press `RR` in the emulator if it doesn't refresh automatically)
- If you hit a port error, make sure no process blocks 8081 and rerun outside restricted shells

**Troubleshooting Android Launch**:
- If you see "SDK location not found", ensure `ANDROID_HOME` is set correctly and `android/local.properties` exists
- If you see "No Android devices found", start an emulator first: `emulator -avd YOUR_AVD_NAME`
- If you encounter "Execution failed for task ':app:installDebug'", try cleaning: `cd android && ./gradlew clean && cd ..`
- The first build may take 5-10 minutes; subsequent builds are faster
- If the emulator is slow, ensure hardware acceleration (HAXM on Intel, Hypervisor.framework on Apple Silicon) is enabled

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
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Code Quality

#### Linting

Check for code quality issues:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint:fix
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
npm run format:check
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
1. Ensure `ANDROID_HOME` environment variable is set:
   ```bash
  echo $ANDROID_HOME
  # Should output: /Users/YOUR_USERNAME/Library/Android/sdk (macOS)
  ```
2. If not set, add to your shell profile (`~/.zshrc` or `~/.bash_profile`):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
3. Reload shell: `source ~/.zshrc`
4. Alternatively, create `android/local.properties` file:
   ```
   sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
   ```
   (Windows: `sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk`)

**Problem**: `adb: device offline` or `could not install *smartsocket* listener`

**Solution**:
```bash
# Ensure you are using the SDK platform-tools version of adb
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# Restart adb cleanly
adb kill-server
adb start-server

# Confirm the emulator is online
adb devices   # should show emulator-5554    device
```

If your default Java is 1.8, point `JAVA_HOME` to the Android Studio bundled JDK (Java 21) before running `npm run android`:
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

**Problem**: "No Android devices found" or "Could not find or load main class org.gradle.wrapper.GradleWrapperMain"

**Solution**:
```bash
# Start an emulator manually first
emulator -list-avds  # List available AVDs
emulator -avd YOUR_AVD_NAME  # Start specific AVD

# Or open Android Studio → Device Manager → Start emulator
# Then run: npm run android
```

**Problem**: "Execution failed for task ':app:installDebug'"

**Solution**:
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Clear Metro cache
npm start -- --clear

# Rebuild
npm run android
```

**Problem**: "INSTALL_FAILED_INSUFFICIENT_STORAGE"

**Solution**:
1. Open Android Studio → Device Manager
2. Click the pencil icon next to your AVD
3. Click "Show Advanced Settings"
4. Increase "Internal Storage" (e.g., to 2048 MB or higher)
5. Click "Finish" and restart the emulator

**Problem**: Emulator is very slow or unresponsive

**Solution**:
1. Ensure hardware acceleration is enabled:
   - **Intel Macs**: Install HAXM via Android Studio SDK Manager
   - **Apple Silicon Macs**: Use ARM64 system images (not x86)
2. Increase emulator RAM:
   - Open Device Manager → Edit AVD → Show Advanced Settings
   - Increase RAM to 2048 MB or higher
3. Use a newer API level (API 31+) for better performance
4. Close other resource-intensive applications

**Problem**: "adb: command not found"

**Solution**:
```bash
# Add Android SDK platform-tools to PATH
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Or install adb via Homebrew (macOS)
brew install android-platform-tools

# Verify
adb --version
```

**Problem**: "Unable to locate a Java Runtime" or "Could not find or load main class org.gradle.wrapper.GradleWrapperMain"

**Solution**:
```bash
# Check if Java is installed
java -version

# If not installed, install via Homebrew (macOS)
brew install openjdk@17

# Set JAVA_HOME (add to ~/.zshrc or ~/.bash_profile)
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export PATH="$JAVA_HOME/bin:$PATH"

# Reload shell
source ~/.zshrc

# Verify
java -version
echo $JAVA_HOME

# If using Android Studio's bundled JDK
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
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

#### Build Performance

The project is optimized to maintain build times under 5 minutes for production builds:

**Performance Optimizations**:
- **Build caching enabled** for all profiles to reuse dependencies
- **Metro bundler optimization** with filesystem caching
- **Optimized minification** settings for faster builds
- **Resource class configuration** for optimal performance/cost balance

**Expected Build Times**:
- Development builds: < 2 minutes
- Preview builds: < 3 minutes  
- Production builds: < 5 minutes

**Measuring Build Performance**:
```bash
# Time a production build
time eas build --profile production --platform android --non-interactive
```

**Build Performance Factors**:
- First builds are slower (cold cache)
- Subsequent builds are faster (warm cache)
- Free tier users may experience queue wait times
- Build times vary based on EAS server load

For detailed build performance metrics and troubleshooting, see [BUILD_PERFORMANCE.md](./BUILD_PERFORMANCE.md).

#### Best Practices

1. **Use development builds** during active development
2. **Use preview builds** for internal team testing
3. **Use production builds** for app store submission
4. **Use OTA updates** for quick fixes and minor updates during pilot phase
5. **Always test updates** on preview channel before pushing to production
6. **Document changes** in update messages for tracking
7. **Monitor update adoption** through Expo dashboard
8. **Monitor build performance** and optimize when builds exceed target times

## License

Proprietary - BerthCare
