import * as Sentry from 'sentry-expo';

import { captureException } from './logging';

export const triggerTestCrash = () => {
  const error = new Error('Test crash triggered manually');
  captureException(error);
  // Also invoke native crash if available in dev to validate symbolication end-to-end.
  if (Sentry.Native?.nativeCrash) {
    Sentry.Native.nativeCrash();
  } else {
    throw error;
  }
};
