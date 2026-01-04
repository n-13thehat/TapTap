/**
 * Performance monitoring and optimization utilities
 */

import React, { useEffect, useRef, useCallback } from 'react';

// ============================================================================
// Performance Measurement
// ============================================================================

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupObservers();
    }
  }

  private setupObservers() {
    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('navigation.domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
            this.recordMetric('navigation.load', navEntry.loadEventEnd - navEntry.loadEventStart);
            this.recordMetric('navigation.firstPaint', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(`paint.${entry.name}`, entry.startTime);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.warn('Paint observer not supported:', error);
    }

    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    // Observe cumulative layout shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.recordMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }

    // Observe first input delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('fid', (entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetric(name: string): number[] {
    return this.metrics.get(name) || [];
  }

  getAverageMetric(name: string): number {
    const values = this.getMetric(name);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  getMetrics(): Record<string, { values: number[]; average: number; latest: number }> {
    const result: Record<string, { values: number[]; average: number; latest: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      result[name] = {
        values: [...values],
        average: values.reduce((a, b) => a + b, 0) / values.length,
        latest: values[values.length - 1] || 0,
      };
    }
    
    return result;
  }

  clearMetrics() {
    this.metrics.clear();
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// ============================================================================
// Performance Hooks
// ============================================================================

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName: string) {
  const renderStartRef = useRef<number>();
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    if (renderStartRef.current) {
      const renderTime = performance.now() - renderStartRef.current;
      monitor.recordMetric(`component.${componentName}.renderTime`, renderTime);
    }
  });
}

/**
 * Hook to measure function execution time
 */
export function useExecutionTime() {
  const monitor = PerformanceMonitor.getInstance();

  return useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    name: string
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      monitor.recordMetric(`function.${name}.executionTime`, end - start);
      return result;
    }) as T;
  }, [monitor]);
}

/**
 * Hook to measure memory usage
 */
export function useMemoryMonitor(interval = 5000) {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    if (!('memory' in performance)) return;

    const measureMemory = () => {
      const memory = (performance as any).memory;
      monitor.recordMetric('memory.usedJSHeapSize', memory.usedJSHeapSize);
      monitor.recordMetric('memory.totalJSHeapSize', memory.totalJSHeapSize);
      monitor.recordMetric('memory.jsHeapSizeLimit', memory.jsHeapSizeLimit);
    };

    measureMemory();
    const intervalId = setInterval(measureMemory, interval);

    return () => clearInterval(intervalId);
  }, [interval, monitor]);
}

/**
 * Hook to detect performance issues
 */
export function usePerformanceAlerts() {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    const checkPerformance = () => {
      const metrics = monitor.getMetrics();
      
      // Check for slow renders
      Object.keys(metrics).forEach(key => {
        if (key.includes('renderTime')) {
          const avgRenderTime = metrics[key].average;
          if (avgRenderTime > 16) { // 60fps threshold
            console.warn(`Slow render detected for ${key}: ${avgRenderTime.toFixed(2)}ms`);
          }
        }
      });

      // Check for memory leaks
      if (metrics['memory.usedJSHeapSize']) {
        const memoryValues = metrics['memory.usedJSHeapSize'].values;
        if (memoryValues.length > 10) {
          const recent = memoryValues.slice(-5);
          const older = memoryValues.slice(-10, -5);
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          
          if (recentAvg > olderAvg * 1.5) {
            console.warn('Potential memory leak detected');
          }
        }
      }

      // Check Core Web Vitals
      if (metrics.lcp && metrics.lcp.latest > 2500) {
        console.warn(`Poor LCP: ${metrics.lcp.latest.toFixed(2)}ms`);
      }
      
      if (metrics.fid && metrics.fid.latest > 100) {
        console.warn(`Poor FID: ${metrics.fid.latest.toFixed(2)}ms`);
      }
      
      if (metrics.cls && metrics.cls.latest > 0.1) {
        console.warn(`Poor CLS: ${metrics.cls.latest.toFixed(3)}`);
      }
    };

    const intervalId = setInterval(checkPerformance, 10000);
    return () => clearInterval(intervalId);
  }, [monitor]);
}

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  }) as T;
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

/**
 * Memoization utility
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Lazy loading utility for components
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFn);

  return (props: React.ComponentProps<T>) => {
    const fallbackElement = fallback
      ? React.createElement(fallback)
      : React.createElement('div', {}, 'Loading...');

    return React.createElement(
      React.Suspense,
      { fallback: fallbackElement },
      React.createElement(LazyComponent, props)
    );
  };
}

/**
 * Bundle size analyzer
 */
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return;
  
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  const analysis = {
    scripts: scripts.map(script => ({
      src: (script as HTMLScriptElement).src,
      async: (script as HTMLScriptElement).async,
      defer: (script as HTMLScriptElement).defer,
    })),
    styles: styles.map(style => ({
      href: (style as HTMLLinkElement).href,
    })),
    totalScripts: scripts.length,
    totalStyles: styles.length,
  };
  
  console.table(analysis.scripts);
  console.table(analysis.styles);
  
  return analysis;
}

/**
 * Image optimization utility
 */
export function optimizeImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
  } = {}
): string {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  
  const url = new URL(src, window.location.origin);
  
  if (options.width) url.searchParams.set('w', options.width.toString());
  if (options.height) url.searchParams.set('h', options.height.toString());
  if (options.quality) url.searchParams.set('q', options.quality.toString());
  if (options.format && options.format !== 'auto') {
    url.searchParams.set('f', options.format);
  }
  
  return url.toString();
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  
  document.head.appendChild(link);
}

/**
 * Prefetch resources for next navigation
 */
export function prefetchResource(href: string) {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  
  document.head.appendChild(link);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get device performance tier
 */
export function getDevicePerformanceTier(): 'low' | 'medium' | 'high' {
  if (typeof navigator === 'undefined') return 'medium';
  
  // Check for device memory
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory) {
    if (deviceMemory <= 2) return 'low';
    if (deviceMemory <= 4) return 'medium';
    return 'high';
  }
  
  // Check for hardware concurrency
  const cores = navigator.hardwareConcurrency;
  if (cores) {
    if (cores <= 2) return 'low';
    if (cores <= 4) return 'medium';
    return 'high';
  }
  
  // Fallback to user agent detection
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mobile') || userAgent.includes('tablet')) {
    return 'low';
  }
  
  return 'medium';
}

// ============================================================================
// React Performance Utilities
// ============================================================================

/**
 * Higher-order component for performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const WithPerformanceMonitoring = React.memo((props: P) => {
    useRenderTime(displayName);
    return React.createElement(WrappedComponent, props);
  });
  
  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return WithPerformanceMonitoring;
}

/**
 * Hook for component performance profiling
 */
export function useComponentProfiler(name: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const monitor = PerformanceMonitor.getInstance();
  
  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    
    if (lastRenderTime.current > 0) {
      const timeSinceLastRender = now - lastRenderTime.current;
      monitor.recordMetric(`component.${name}.timeBetweenRenders`, timeSinceLastRender);
    }
    
    lastRenderTime.current = now;
    monitor.recordMetric(`component.${name}.renderCount`, renderCount.current);
  });
  
  return {
    renderCount: renderCount.current,
    getMetrics: () => monitor.getMetrics(),
  };
}
