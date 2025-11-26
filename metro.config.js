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

module.exports = config;
