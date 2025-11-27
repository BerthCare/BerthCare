// Jest setup file for React Native Testing Library
import '@testing-library/jest-native/extend-expect';

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedModule', () => ({
  default: {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    startOperationBatch: jest.fn(),
    finishOperationBatch: jest.fn(),
  },
}));
