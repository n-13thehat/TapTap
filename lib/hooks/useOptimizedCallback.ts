/**
 * Optimized callback hooks for performance
 */

import { useCallback, useRef, useMemo } from 'react';

/**
 * A more stable useCallback that only changes when dependencies actually change
 * Uses deep comparison for dependency array
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);
  
  // Deep compare dependencies
  const depsChanged = useMemo(() => {
    if (depsRef.current.length !== deps.length) return true;
    return depsRef.current.some((dep, index) => {
      const newDep = deps[index];
      if (dep === newDep) return false;
      if (typeof dep === 'object' && typeof newDep === 'object') {
        return JSON.stringify(dep) !== JSON.stringify(newDep);
      }
      return true;
    });
  }, deps);
  
  if (depsChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }
  
  return useCallback(callbackRef.current, [depsChanged]) as T;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay, ...deps]
  );
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;
      
      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [callback, delay, ...deps]
  );
}

/**
 * Memoized event handler that prevents unnecessary re-renders
 */
export function useEventCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    []
  );
}

/**
 * Optimized callback for handling form changes
 */
export function useFormCallback<T extends Record<string, any>>(
  setValue: (field: keyof T, value: any) => void
) {
  return useCallback(
    (field: keyof T) => (value: any) => {
      setValue(field, value);
    },
    [setValue]
  );
}

/**
 * Batch multiple state updates to prevent unnecessary re-renders
 */
export function useBatchedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): T {
  return useCallback(
    ((...args: Parameters<T>) => {
      // Use React's unstable_batchedUpdates if available
      if (typeof (React as any).unstable_batchedUpdates === 'function') {
        (React as any).unstable_batchedUpdates(() => {
          callback(...args);
        });
      } else {
        callback(...args);
      }
    }) as T,
    deps
  );
}
