import * as Sentry from '@sentry/react-native';

import { captureException } from './logging';

export const triggerTestCrash = () => {
  const error = new Error('Test crash triggered manually');
  captureException(error);
  // Give Sentry time to flush the event before crashing
  setTimeout(() => {
    if (Sentry.Native?.nativeCrash) {
      Sentry.Native.nativeCrash();
    } else {
      throw error;
    }
  }, 100);
};
