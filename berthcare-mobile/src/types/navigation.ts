/**
 * Navigation type definitions
 *
 * This file contains TypeScript type definitions for React Navigation
 * including screen parameters, navigation props, and route types.
 */

// Placeholder for navigation types - to be implemented during navigation setup
export type RootStackParamList = {
  // TODO: Define navigation stack parameters
  Today: undefined;
  Visit: { visitId?: string };
  Alert: undefined;
};

export type ScreenNavigationProp<T extends keyof RootStackParamList> = {
  // TODO: Define navigation prop types
  navigate: (screen: T, params?: RootStackParamList[T]) => void;
  goBack: () => void;
};
