/**
 * React Performance Optimizer
 * Advanced React optimization utilities and hooks for TapTap Matrix
 */

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect, 
  useState,
  createContext,
  useContext,
  ComponentType,
  ReactNode,
  MutableRefObject
} from 'react';
import { getPerformanceManager } from './PerformanceManager';

// Performance monitoring context
interface PerformanceContextValue {
  measureRender: (componentName: string, renderFn: () => ReactNode) => ReactNode;
  trackInteraction: (interactionName: string, callback: () => void) => void;
  enableProfiling: boolean;
  setEnableProfiling: (enabled: boolean) => void;
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

// Performance provider component
export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [enableProfiling, setEnableProfiling] = useState(false);
  const performanceManager = getPerformanceManager();

  const measureRender = useCallback((componentName: string, renderFn: () => ReactNode) => {
    if (!enableProfiling) return renderFn();
    
    return performanceManager.measureComponentRender(componentName, renderFn);
  }, [enableProfiling, performanceManager]);

  const trackInteraction = useCallback((interactionName: string, callback: () => void) => {
    if (!enableProfiling) {
      callback();
      return;
    }

    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    
    performance.measure(interactionName, { start: startTime, end: endTime });
  }, [enableProfiling]);

  const value: PerformanceContextValue = {
    measureRender,
    trackInteraction,
    enableProfiling,
    setEnableProfiling,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

// Hook to use performance context
export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// Optimized memo with custom comparison
export function optimizedMemo<T extends ComponentType<any>>(
  Component: T,
  customCompare?: (prevProps: any, nextProps: any) => boolean
): T {
  const MemoizedComponent = memo(Component, customCompare || shallowEqual);
  
  // Add display name for debugging
  MemoizedComponent.displayName = `OptimizedMemo(${Component.displayName || Component.name})`;
  
  return MemoizedComponent as T;
}

// Shallow equality check
function shallowEqual(prevProps: any, nextProps: any): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
}

// Deep equality check for complex objects
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

// Optimized useCallback with dependency tracking
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const depsRef = useRef<React.DependencyList>();
  const callbackRef = useRef<T>();

  // Check if dependencies have changed
  const depsChanged = !depsRef.current || 
    depsRef.current.length !== deps.length ||
    depsRef.current.some((dep, index) => dep !== deps[index]);

  if (depsChanged) {
    depsRef.current = deps;
    callbackRef.current = callback;
  }

  return callbackRef.current!;
}

// Optimized useMemo with deep comparison option
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  deepCompare: boolean = false
): T {
  const depsRef = useRef<React.DependencyList>();
  const valueRef = useRef<T>();

  // Check if dependencies have changed
  const depsChanged = !depsRef.current || 
    (deepCompare ? !deepEqual(depsRef.current, deps) : 
     depsRef.current.length !== deps.length ||
     depsRef.current.some((dep, index) => dep !== deps[index]));

  if (depsChanged) {
    depsRef.current = deps;
    valueRef.current = factory();
  }

  return valueRef.current!;
}

// Debounced state hook
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setDebouncedValueCallback = useCallback((newValue: T) => {
    setValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, debouncedValue, setDebouncedValueCallback];
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback((...args: any[]) => {
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
  }, [callback, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

// Virtual scrolling hook
export function useVirtualScrolling<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  };
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: MutableRefObject<Element | null>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
}

// Lazy component wrapper
export function LazyComponent<T extends ComponentType<any>>({
  component: Component,
  fallback = <div>Loading...</div>,
  ...props
}: {
  component: T;
  fallback?: ReactNode;
} & React.ComponentProps<T>) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { hasIntersected } = useIntersectionObserver(elementRef);

  return (
    <div ref={elementRef}>
      {hasIntersected ? <Component {...props} /> : fallback}
    </div>
  );
}

// Performance monitoring HOC
export function withPerformanceMonitoring<T extends ComponentType<any>>(
  Component: T,
  componentName?: string
): T {
  const PerformanceMonitoredComponent = (props: React.ComponentProps<T>) => {
    const { measureRender } = usePerformance();
    const name = componentName || Component.displayName || Component.name || 'Unknown';

    return measureRender(name, () => <Component {...props} />) as ReactNode;
  };

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;

  return PerformanceMonitoredComponent as T;
}

// Render optimization hook
export function useRenderOptimization() {
  const renderCountRef = useRef(0);
  const lastPropsRef = useRef<any>();
  const lastRenderTimeRef = useRef<number>(0);

  useEffect(() => {
    renderCountRef.current++;
    lastRenderTimeRef.current = performance.now();
  });

  const trackProps = useCallback((props: any) => {
    const propsChanged = !shallowEqual(lastPropsRef.current, props);
    lastPropsRef.current = props;
    return propsChanged;
  }, []);

  return {
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current,
    trackProps,
  };
}

// Memory usage hook
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Bundle size optimization utilities
export function createAsyncComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
): React.LazyExoticComponent<T> {
  const LazyComponent = React.lazy(importFn);
  
  return LazyComponent;
}

// Preload component for better UX
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): void {
  // Preload the component
  importFn().catch(error => {
    console.warn('Failed to preload component:', error);
  });
}

// Resource preloader hook
export function useResourcePreloader() {
  const preloadedResources = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((src: string): Promise<void> => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadAudio = useCallback((src: string): Promise<void> => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      audio.onerror = reject;
      audio.src = src;
    });
  }, []);

  const preloadFont = useCallback((fontFamily: string, src: string): Promise<void> => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    const font = new FontFace(fontFamily, `url(${src})`);
    return font.load().then(() => {
      document.fonts.add(font);
      preloadedResources.current.add(src);
    });
  }, []);

  return {
    preloadImage,
    preloadAudio,
    preloadFont,
    preloadedResources: preloadedResources.current,
  };
}

// Optimized list component
export interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  height: number;
  width?: number;
  overscan?: number;
  className?: string;
}

export function OptimizedList<T>({
  items,
  renderItem,
  itemHeight,
  height,
  width = '100%',
  overscan = 5,
  className = '',
}: OptimizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  } = useVirtualScrolling({
    items,
    itemHeight,
    containerHeight: height,
    overscan,
  });

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height, width }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Optimized grid component
export interface OptimizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemWidth: number;
  itemHeight: number;
  columns: number;
  height: number;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function OptimizedGrid<T>({
  items,
  renderItem,
  itemWidth,
  itemHeight,
  columns,
  height,
  gap = 0,
  overscan = 5,
  className = '',
}: OptimizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / columns);
  
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + height) / rowHeight) + overscan
    );
    
    return { startRow, endRow };
  }, [scrollTop, rowHeight, height, totalRows, overscan]);

  const visibleItems = useMemo(() => {
    const startIndex = visibleRange.startRow * columns;
    const endIndex = Math.min(items.length - 1, (visibleRange.endRow + 1) * columns - 1);
    
    return items.slice(startIndex, endIndex + 1);
  }, [items, visibleRange, columns]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const totalHeight = totalRows * rowHeight;
  const offsetY = visibleRange.startRow * rowHeight;

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
            gap: `${gap}px`,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startRow * columns + index;
            return (
              <div key={actualIndex}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Performance debugging utilities
export function usePerformanceDebugger(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const propsHistory = useRef<any[]>([]);

  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (renderTime > 16) { // Slower than 60fps
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  });

  const trackProps = useCallback((props: any) => {
    propsHistory.current.push({
      props: { ...props },
      timestamp: performance.now(),
      renderCount: renderCount.current,
    });

    // Keep only last 10 renders
    if (propsHistory.current.length > 10) {
      propsHistory.current = propsHistory.current.slice(-10);
    }
  }, []);

  const getDebugInfo = useCallback(() => {
    return {
      componentName,
      renderCount: renderCount.current,
      lastRenderTime: lastRenderTime.current,
      propsHistory: propsHistory.current,
    };
  }, [componentName]);

  return { trackProps, getDebugInfo };
}

// Export all optimization utilities
export {
  shallowEqual,
  deepEqual,
};

// Default export with all utilities
export default {
  PerformanceProvider,
  usePerformance,
  optimizedMemo,
  useOptimizedCallback,
  useOptimizedMemo,
  useDebouncedState,
  useThrottledCallback,
  useVirtualScrolling,
  useIntersectionObserver,
  LazyComponent,
  withPerformanceMonitoring,
  useRenderOptimization,
  useMemoryMonitoring,
  createAsyncComponent,
  preloadComponent,
  useResourcePreloader,
  OptimizedList,
  OptimizedGrid,
  usePerformanceDebugger,
  shallowEqual,
  deepEqual,
};
