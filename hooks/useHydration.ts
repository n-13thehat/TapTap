import { useEffect, useState } from 'react';

/**
 * Hook to prevent hydration mismatches by ensuring components only render after client-side hydration
 * @param delay Optional delay in milliseconds before marking as hydrated (default: 0)
 * @returns boolean indicating if the component is hydrated and safe to render client-only content
 */
export function useHydration(delay: number = 0): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsHydrated(true), delay);
      return () => clearTimeout(timer);
    } else {
      setIsHydrated(true);
    }
  }, [delay]);

  return isHydrated;
}

/**
 * Hook to check if we're in a browser environment (client-side)
 * @returns boolean indicating if running in browser
 */
export function useIsBrowser(): boolean {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  return isBrowser;
}

/**
 * Hook to safely access browser APIs with fallbacks
 * @param callback Function that accesses browser APIs
 * @param fallback Fallback value to return during SSR or if callback fails
 * @returns The result of the callback or the fallback value
 */
export function useSafeBrowserAPI<T>(
  callback: () => T,
  fallback: T
): T {
  const [result, setResult] = useState<T>(fallback);
  const isHydrated = useHydration();

  useEffect(() => {
    if (!isHydrated) return;

    try {
      const value = callback();
      setResult(value);
    } catch (error) {
      console.warn('Browser API access failed:', error);
      setResult(fallback);
    }
  }, [isHydrated, callback, fallback]);

  return result;
}

/**
 * Hook for components that need to render differently on server vs client
 * @param serverContent Content to render on server
 * @param clientContent Content to render on client
 * @returns The appropriate content based on hydration state
 */
export function useSSRSafeContent<T>(
  serverContent: T,
  clientContent: T
): T {
  const isHydrated = useHydration();
  return isHydrated ? clientContent : serverContent;
}