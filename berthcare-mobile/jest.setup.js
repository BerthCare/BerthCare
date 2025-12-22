// Jest setup file for React Native Testing Library
import '@testing-library/jest-native/extend-expect';

jest.mock('expo-updates', () => ({
  channel: 'development',
}));

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock')
);

jest.mock('react-native-keychain', () => {
  const store = new Map();
  return {
    ACCESSIBLE: {
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
    },
    STORAGE_TYPE: {
      AES_GCM_NO_AUTH: 'AES_GCM_NO_AUTH',
    },
    SECURITY_LEVEL: {
      SECURE_HARDWARE: 'SECURE_HARDWARE',
      SECURE_SOFTWARE: 'SECURE_SOFTWARE',
    },
    setGenericPassword: jest.fn(async (username, password, options) => {
      const service = options?.service ?? username;
      store.set(service, { username, password });
      return true;
    }),
    getGenericPassword: jest.fn(async (options) => {
      const service = options?.service ?? '';
      const record = store.get(service);
      if (!record) {
        return false;
      }
      return { username: record.username, password: record.password };
    }),
    resetGenericPassword: jest.fn(async (options) => {
      const service = options?.service ?? '';
      store.delete(service);
      return true;
    }),
  };
});

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
