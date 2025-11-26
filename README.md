# BerthCare Mobile

## Overview

BerthCare Mobile is a React Native application designed to enable caregivers to document home care visits in under 60 seconds. The app provides a streamlined, offline-first experience with three core screens:

- **Today**: View today's schedule and client information
- **Visit**: Document what changed during a visit
- **Alert**: Quickly contact coordinators or backup support

## Technology Stack

- **React Native** 0.72+
- **Expo** SDK 49+ with custom development builds
- **TypeScript** 5.0+
- **React Navigation** 6.x

## Project Status

This repository has been initialized and is ready for development. The project structure follows a clean, scalable architecture that supports rapid iteration and cross-platform development.

## Getting Started

Detailed setup instructions will be added as the project progresses.

## Architecture

The app uses Expo with custom development builds (expo-dev-client) to balance development speed with native flexibility. This approach provides:

- Over-the-air (OTA) updates for rapid iteration
- Access to custom native modules when needed
- Simplified configuration and dependency management
- Excellent developer experience with hot reload

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

## License

Proprietary - BerthCare
