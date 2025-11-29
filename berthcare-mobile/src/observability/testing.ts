import { captureException } from './logging';

export const triggerTestCrash = () => {
  const error = new Error('Test crash triggered manually');
  captureException(error);
  // Give Sentry time to flush the event before crashing; runtime crash handled via JS throw.
  throw error;
};
