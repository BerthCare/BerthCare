import { renderHook, waitFor } from '@testing-library/react-native';
import { useConnectivityMonitor } from '../connectivity';

// Mock AppState with minimal dependencies
jest.mock('react-native', () => {
  const listeners: Array<(state: string) => void> = [];

  return {
    AppState: {
      currentState: 'active',
      addEventListener: (event: string, callback: (state: string) => void) => {
        if (event === 'change') {
          listeners.push(callback);
        }
        return {
          remove: () => {
            const index = listeners.indexOf(callback);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          },
        };
      },
    },
  };
});

global.fetch = jest.fn();

describe('useConnectivityMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns unknown on initial render', () => {
    const { result } = renderHook(() => useConnectivityMonitor());
    expect(result.current).toBe('unknown');
  });

  it('detects online state after initial check', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useConnectivityMonitor());

    await waitFor(() => {
      expect(result.current).toBe('online');
    });
  });

  it('detects offline state after network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useConnectivityMonitor());

    await waitFor(() => {
      expect(result.current).toBe('offline');
    });
  });

  it('calls onConnectivityRestored callback when transitioning from offline to online', async () => {
    const callback = jest.fn();

    // Start offline
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    const { rerender } = renderHook(() => useConnectivityMonitor(callback));

    // Wait for offline state
    jest.advanceTimersByTime(100);

    // Transition to online
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    rerender();

    // Run the periodic check
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
  });

  it('does not call callback on initial online state', async () => {
    const callback = jest.fn();

    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    renderHook(() => useConnectivityMonitor(callback));

    jest.advanceTimersByTime(100);

    // Callback should not have been called for initial state
    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up listeners and intervals on unmount', () => {
    const { unmount } = renderHook(() => useConnectivityMonitor());

    // Should complete without errors
    expect(() => {
      unmount();
    }).not.toThrow();
  });
});
