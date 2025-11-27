const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for platform-specific extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ios.tsx',
  'android.tsx',
  'ios.ts',
  'android.ts',
];

// Performance optimizations
config.transformer.minifierConfig = {
  // Optimize minification for faster builds
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Enable caching for faster subsequent builds
config.cacheStores = [
  {
    name: 'filesystem',
    type: 'FileStore',
  },
];

// Optimize resolver for faster module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
