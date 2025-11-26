# Build Performance Documentation

## Overview

This document tracks build performance metrics and optimizations for the BerthCare mobile app. The target is to maintain build times under 5 minutes for production builds.

## Current Optimizations

### EAS Build Configuration

1. **Build Caching Enabled**: All build profiles have caching enabled to reuse dependencies and build artifacts
2. **Resource Class**: Using `m-medium` resource class for iOS builds for optimal performance/cost balance
3. **App Version Source**: Set to `remote` to avoid version conflicts and speed up builds

### Metro Bundler Optimizations

1. **Minifier Configuration**: Optimized minification settings for faster builds while maintaining code quality
2. **Filesystem Caching**: Enabled filesystem caching for faster subsequent builds
3. **Platform-specific Extensions**: Configured to support `.ios.tsx` and `.android.tsx` extensions
4. **Resolver Optimization**: Optimized platform resolution order

### Babel Configuration

1. **Module Resolver**: Path aliases configured for cleaner imports and faster resolution
2. **Caching**: Babel caching enabled for faster transpilation

## Build Time Targets

| Build Type | Target Time | Platform | Notes |
|------------|-------------|----------|-------|
| Development | < 2 minutes | Both | Local development builds |
| Preview | < 3 minutes | Both | Internal testing builds |
| Production | < 5 minutes | Both | App store releases |

## Performance Monitoring

### Measuring Build Times

To measure build times locally:

```bash
# Android production build
time npx eas-cli build --platform android --profile production --non-interactive

# iOS production build  
time npx eas-cli build --platform ios --profile production --non-interactive

# Both platforms
time npx eas-cli build --platform all --profile production --non-interactive
```

### Build Performance Factors

**Factors that improve build performance:**
- Build caching (enabled)
- Smaller bundle size
- Fewer dependencies
- Optimized Metro configuration
- Using appropriate EAS resource classes

**Factors that slow down builds:**
- Large asset files
- Many dependencies
- Complex native modules
- Disabled caching
- Cold builds (first build without cache)

## Historical Build Times

| Date | Platform | Profile | Time | Notes |
|------|----------|---------|------|-------|
| 2025-11-26 | Local | TypeScript | 1.9s | Type checking compilation |
| 2025-11-26 | Local | ESLint | 2.3s | Code linting |
| 2025-11-26 | Android | Production | Pending | EAS build with optimizations |
| 2025-11-26 | iOS | Production | Pending | EAS build with optimizations |

## Troubleshooting Slow Builds

### Common Issues and Solutions

1. **Build Queue Wait Times**
   - **Issue**: Long wait times in EAS free tier queue
   - **Solution**: Consider upgrading to paid plan for priority queue access
   - **Workaround**: Schedule builds during off-peak hours

2. **Cache Misses**
   - **Issue**: Builds taking longer than expected
   - **Solution**: Ensure caching is enabled in eas.json
   - **Check**: Verify cache settings in build logs

3. **Large Bundle Size**
   - **Issue**: Slow bundling and upload times
   - **Solution**: Analyze bundle size and remove unused dependencies
   - **Tools**: Use `npx expo install --fix` to optimize dependencies

4. **Network Issues**
   - **Issue**: Slow upload to EAS servers
   - **Solution**: Check internet connection and try again
   - **Optimization**: Ensure .gitignore excludes unnecessary files

## Future Optimizations

### Potential Improvements

1. **Bundle Splitting**: Implement code splitting for larger apps
2. **Asset Optimization**: Compress images and optimize asset loading
3. **Dependency Audit**: Regular review of dependencies to remove unused packages
4. **Build Parallelization**: Consider parallel builds for different platforms
5. **Local Builds**: Set up local build environment for faster iteration

### Monitoring and Alerts

1. **CI/CD Integration**: Add build time monitoring to GitHub Actions
2. **Performance Regression Detection**: Alert when build times exceed thresholds
3. **Regular Performance Reviews**: Monthly review of build performance metrics

## Build Commands Reference

```bash
# Development builds (fastest)
npm run build:dev:android
npm run build:dev:ios

# Preview builds (medium speed)
npm run build:preview:android  
npm run build:preview:ios

# Production builds (target < 5 minutes)
npm run build:prod:android
npm run build:prod:ios
npm run build:all

# Build with timing
time npm run build:prod:android
```

## Notes

- Build times may vary based on EAS server load and queue position
- First builds are typically slower due to cold cache
- Subsequent builds should be faster with warm cache
- Free tier users may experience longer queue times
- Build performance is continuously monitored and optimized