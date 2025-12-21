// Jest setup file for React Native Testing Library
import '@testing-library/jest-native/extend-expect';

jest.mock('expo-updates', () => ({
  channel: 'development',
}));

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedModule', () => {
  const nativeAnimatedModule = {
    createAnimatedNode: jest.fn(),
    updateAnimatedNodeConfig: jest.fn(),
    getValue: jest.fn(),
    startListeningToAnimatedNodeValue: jest.fn(),
    stopListeningToAnimatedNodeValue: jest.fn(),
    connectAnimatedNodes: jest.fn(),
    disconnectAnimatedNodes: jest.fn(),
    startAnimatingNode: jest.fn(),
    stopAnimation: jest.fn(),
    setAnimatedNodeValue: jest.fn(),
    setAnimatedNodeOffset: jest.fn(),
    flattenAnimatedNodeOffset: jest.fn(),
    extractAnimatedNodeOffset: jest.fn(),
    connectAnimatedNodeToView: jest.fn(),
    disconnectAnimatedNodeFromView: jest.fn(),
    restoreDefaultValues: jest.fn(),
    dropAnimatedNode: jest.fn(),
    addAnimatedEventToView: jest.fn(),
    removeAnimatedEventFromView: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeListeners: jest.fn(),
    startOperationBatch: jest.fn(),
    finishOperationBatch: jest.fn(),
  };

  return {
    __esModule: true,
    default: nativeAnimatedModule,
  };
});

jest.mock('@sentry/react-native', () => {
  const Native = {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    addBreadcrumb: jest.fn(),
    setTags: jest.fn(),
    nativeCrash: jest.fn(),
  };
  return { init: jest.fn(), Native, getCurrentHub: jest.fn(() => ({})) };
});
