import * as Sentry from '@sentry/react-native';

import { captureException } from './logging';

export const triggerTestCrash = () => {
  const error = new Error('Test crash triggered manually');
  captureException(error);
  // Also invoke native crash if available in dev to validate symbolication end-to-end.
  if ((Sentry as unknown as { nativeCrash?: () => void }).nativeCrash) {
    (Sentry as unknown as { nativeCrash: () => void }).nativeCrash();
  } else {
    throw error;
  }
};
