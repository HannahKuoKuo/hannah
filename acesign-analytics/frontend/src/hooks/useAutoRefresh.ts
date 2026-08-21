import { useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // milliseconds, default 5 minutes
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function useAutoRefresh(
  fetchFn: () => Promise<void>,
  options: UseAutoRefreshOptions = {}
) {
  const {
    interval = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    onError,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return;

    try {
      isRefreshingRef.current = true;
      await fetchFn();
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
      console.error('Auto-refresh failed:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchFn, onError]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial refresh
    refresh();

    // Set up interval
    intervalRef.current = setInterval(refresh, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, refresh]);

  return { refresh, isRefreshing: isRefreshingRef.current };
}
