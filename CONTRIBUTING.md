# Contributing to BerthCare Mobile

Thank you for your interest in contributing to the BerthCare mobile application! This document provides guidelines and conventions to ensure consistent, high-quality code across the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Conventions](#commit-message-conventions)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Project Structure](#project-structure)
- [Platform-Specific Development](#platform-specific-development)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

- **Node.js** >=18.0.0
- **npm** >=9.0.0 or **yarn** >=1.22.0
- **Expo CLI**: `npm install -g @expo/cli`
- **EAS CLI**: `npm install -g eas-cli`
- **iOS Development**: Xcode (macOS only)
- **Android Development**: Android Studio with AVD configured

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd berthcare-mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Run on platforms**:
   ```bash
   npm run ios     # iOS simulator
   npm run android # Android emulator
   ```

## Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature development branches
- **fix/**: Bug fix branches
- **hotfix/**: Critical production fixes

### Branch Naming Convention

```
feature/screen-name-functionality
fix/component-name-issue
hotfix/critical-security-patch
```

**Examples**:
- `feature/today-screen-schedule-list`
- `fix/button-ios-styling`
- `hotfix/auth-token-validation`

### Development Process

1. **Create feature branch** from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** following code style guidelines

3. **Test your changes**:
   ```bash
   npm run lint        # Check code style
   npm run type-check  # TypeScript validation
   npm test           # Run unit tests
   ```

4. **Commit changes** using conventional commit format

5. **Push and create pull request**

## Code Style Guidelines

### TypeScript Standards

- **Strict Mode**: Always use TypeScript strict mode
- **Type Definitions**: Prefer explicit types over `any`
- **Interfaces**: Use interfaces for object shapes
- **Enums**: Use const assertions or union types instead of enums when possible

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

const UserRole = {
  CAREGIVER: 'caregiver',
  COORDINATOR: 'coordinator',
} as const;

type UserRole = typeof UserRole[keyof typeof UserRole];

// ❌ Avoid
const user: any = { ... };
enum UserRole { ... }
```

### React Native Components

- **Functional Components**: Use function declarations, not arrow functions for components
- **Props Interface**: Always define props interface
- **Default Props**: Use default parameters instead of defaultProps
- **Hooks**: Follow React hooks rules and conventions

```typescript
// ✅ Good
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false 
}: ButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, styles[variant]]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}
```

### Styling Conventions

- **StyleSheet**: Always use `StyleSheet.create()`
- **Platform-Specific**: Use platform extensions for platform-specific styles
- **Naming**: Use camelCase for style names
- **Organization**: Group related styles together

```typescript
// ✅ Good
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#F2F2F7',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### File Organization

- **Naming**: Use kebab-case for files, PascalCase for components
- **Exports**: Use default exports for components, named exports for utilities
- **Imports**: Group imports (React, libraries, local) with blank lines between

```typescript
// ✅ Good file structure
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Button } from '@/ui/Button';
import { styles } from './styles';
import type { ScreenProps } from './types';
```

### Error Handling

- **Try-Catch**: Use try-catch for async operations
- **Error Types**: Create specific error types for different scenarios
- **User Feedback**: Always provide user-friendly error messages

```typescript
// ✅ Good
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error instanceof NetworkError) {
    showToast('Please check your internet connection');
  } else {
    showToast('Something went wrong. Please try again.');
  }
  throw error;
}
```

## Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for consistent commit messages.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build config, etc.)
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Scopes

Use component or screen names as scopes:

- **today**: Today screen
- **visit**: Visit screen
- **alert**: Alert screen
- **ui**: UI components
- **data**: Data layer (API, database, sync)
- **navigation**: Navigation setup
- **build**: Build configuration
- **deps**: Dependencies

### Examples

```bash
# Features
feat(today): add schedule list component
feat(ui): implement platform-specific button styles
feat(data): add offline sync for visit data

# Bug fixes
fix(visit): resolve form validation issue
fix(ui): correct button padding on Android
fix(data): handle network timeout errors

# Documentation
docs: update README with setup instructions
docs(api): add JSDoc comments to data models

# Refactoring
refactor(navigation): simplify screen navigation logic
refactor(ui): extract common button styles

# Tests
test(visit): add unit tests for form validation
test(data): add integration tests for sync engine

# Chores
chore(deps): update React Native to 0.72.6
chore(build): configure EAS build profiles
```

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api)!: update user authentication flow

BREAKING CHANGE: The authentication API now requires a refresh token.
Update all API calls to include the new token format.
```

## Pull Request Process

### Before Creating a PR

1. **Sync with latest changes**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-feature-branch
   git rebase develop
   ```

2. **Run all checks**:
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run format
   ```

3. **Test on both platforms**:
   ```bash
   npm run ios
   npm run android
   ```

### PR Title and Description

- **Title**: Use conventional commit format
- **Description**: Include:
  - What changes were made
  - Why the changes were necessary
  - How to test the changes
  - Screenshots (for UI changes)
  - Breaking changes (if any)

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed on iOS
- [ ] Manual testing completed on Android
- [ ] No TypeScript errors
- [ ] No ESLint errors

## Screenshots (if applicable)
Include screenshots for UI changes.

## Additional Notes
Any additional information or context.
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one team member must approve
3. **Testing**: Reviewer should test changes locally
4. **Merge**: Use "Squash and merge" for clean history

## Testing Requirements

### Unit Testing

- **Coverage**: Aim for >80% code coverage
- **Test Files**: Place tests adjacent to source files with `.test.ts` extension
- **Naming**: Use descriptive test names that explain the scenario

```typescript
// user-service.test.ts
describe('UserService', () => {
  describe('validateUser', () => {
    it('should return true for valid user data', () => {
      const validUser = { name: 'John', email: 'john@example.com' };
      expect(UserService.validateUser(validUser)).toBe(true);
    });

    it('should return false for invalid email format', () => {
      const invalidUser = { name: 'John', email: 'invalid-email' };
      expect(UserService.validateUser(invalidUser)).toBe(false);
    });
  });
});
```

### Integration Testing

- **Screen Tests**: Test complete user flows
- **API Tests**: Test API integration with mock data
- **Navigation Tests**: Test screen transitions

### Manual Testing

Before submitting a PR, manually test:

1. **Core Functionality**: Verify the feature works as expected
2. **Edge Cases**: Test with empty data, network failures, etc.
3. **Platform Differences**: Test on both iOS and Android
4. **Performance**: Check for memory leaks or performance issues

### Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- user-service.test.ts

# Run tests for specific pattern
npm test -- --testNamePattern="validateUser"
```

## Project Structure

### Directory Guidelines

```
src/
├── screens/           # Screen-level components
│   ├── today/
│   │   ├── screen.tsx        # Main screen component
│   │   ├── styles.ts         # Screen-specific styles
│   │   └── parts/            # Screen-specific components
│   │       ├── schedule-list.tsx
│   │       └── client-card.tsx
├── ui/                # Reusable UI components
│   ├── Button.tsx            # Shared implementation
│   ├── Button.ios.tsx        # iOS-specific
│   └── Button.android.tsx    # Android-specific
├── data/              # Data layer
│   ├── api/                  # API clients and endpoints
│   ├── db/                   # Database setup and queries
│   ├── sync/                 # Sync engine
│   └── storage/              # Storage utilities
├── types/             # TypeScript definitions
│   ├── models.ts             # Data models
│   ├── api.ts                # API types
│   └── navigation.ts         # Navigation types
├── navigation/        # Navigation setup
└── assets/           # Static assets
```

### File Naming Conventions

- **Components**: PascalCase (`Button.tsx`, `ClientCard.tsx`)
- **Utilities**: camelCase (`userService.ts`, `dateUtils.ts`)
- **Types**: camelCase with `.types.ts` suffix (`user.types.ts`)
- **Tests**: Same as source file with `.test.ts` suffix
- **Styles**: Same as component with `.styles.ts` suffix

## Platform-Specific Development

### When to Use Platform-Specific Code

- **UI Differences**: Different styling for iOS vs Android
- **Native Modules**: Platform-specific functionality
- **Performance**: Platform-specific optimizations
- **User Experience**: Following platform conventions

### Platform File Extensions

```typescript
// Shared implementation (fallback)
Button.tsx

// iOS-specific implementation
Button.ios.tsx

// Android-specific implementation
Button.android.tsx
```

### Platform Detection

```typescript
import { Platform } from 'react-native';

// Runtime platform detection
if (Platform.OS === 'ios') {
  // iOS-specific code
}

// Platform-specific styles
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : 56,
  },
});

// Platform select
const fontSize = Platform.select({
  ios: 16,
  android: 14,
  default: 16,
});
```

## Troubleshooting

### Common Issues

**Metro bundler not starting**:
```bash
npx expo start --clear
```

**TypeScript errors after dependency update**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**iOS simulator not launching**:
```bash
# Reset iOS simulator
xcrun simctl erase all
```

**Android emulator issues**:
```bash
# Cold boot emulator
emulator -avd <AVD_NAME> -cold-boot
```

**Build failures**:
```bash
# Clear all caches
npx expo install --fix
npm run clean
```

### Getting Help

1. **Check Documentation**: Review README.md and ARCHITECTURE.md
2. **Search Issues**: Look for similar issues in the repository
3. **Ask Team**: Reach out to team members for guidance
4. **Create Issue**: If problem persists, create a detailed issue

### Development Environment Reset

If you encounter persistent issues, try a complete reset:

```bash
# Clean everything
rm -rf node_modules package-lock.json
npm install

# Clear Metro cache
npx expo start --clear

# Reset git state (if needed)
git clean -fd
git reset --hard HEAD
```

## Code Review Checklist

### For Authors

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Tested on both iOS and Android
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventions
- [ ] PR description is complete

### For Reviewers

- [ ] Code is readable and maintainable
- [ ] Logic is correct and efficient
- [ ] Error handling is appropriate
- [ ] Tests cover the changes
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Platform-specific code is justified
- [ ] Breaking changes are documented

## Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

---

Thank you for contributing to BerthCare Mobile! Your efforts help us build better tools for caregivers and improve the quality of home healthcare.