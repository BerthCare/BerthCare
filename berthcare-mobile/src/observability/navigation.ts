import { addBreadcrumb } from './logging';

type RouteInfo = {
  name?: string | null;
  params?: Record<string, unknown> | undefined;
};

type RouteGetter = () => RouteInfo | undefined;

const ALLOWED_PARAM_KEYS = ['id', 'flow', 'screen', 'source'];

const sanitizeParams = (params?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!params) return undefined;
  const entries = Object.entries(params).filter(([key]) => ALLOWED_PARAM_KEYS.includes(key));
  return entries.length ? Object.fromEntries(entries) : undefined;
};

const recordRouteChange = (from?: string, to?: string, params?: Record<string, unknown>) => {
  if (!to || from === to) {
    return;
  }

  addBreadcrumb({
    category: 'navigation',
    type: 'navigation',
    message: to,
    data: {
      from,
      to,
      params: sanitizeParams(params),
    },
    level: 'info',
  });
};

/**
 * Creates navigation lifecycle handlers for React Navigation containers.
 *
 * Example:
 * const navigationRef = createNavigationContainerRef();
 * const { onReady, onStateChange } = createNavigationBreadcrumbHandler(() => navigationRef.getCurrentRoute());
 * <NavigationContainer ref={navigationRef} onReady={onReady} onStateChange={onStateChange}>...</NavigationContainer>
 */
export const createNavigationBreadcrumbHandler = (getCurrentRoute: RouteGetter) => {
  let previousRouteName: string | undefined;

  const capture = () => {
    const route = getCurrentRoute();
    const currentRouteName = route?.name ?? 'unknown';
    recordRouteChange(previousRouteName, currentRouteName, route?.params);
    previousRouteName = currentRouteName;
  };

  return {
    onReady: capture,
    onStateChange: capture,
  };
};
