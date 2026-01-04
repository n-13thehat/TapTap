/**
 * Performance Monitoring Hooks
 * Easy-to-use React hooks for performance monitoring and optimization
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  performanceMonitor, 
  PerformanceMetric, 
  PerformanceAlert, 
  ResourceUsage 
} from '@/lib/performance/PerformanceMonitor';
import { 
  optimizationEngine, 
  OptimizationRule, 
  OptimizationResult 
} from '@/lib/performance/OptimizationEngine';

// ============================================================================
// Core Performance Hook
// ============================================================================

export interface UsePerformanceOptions {
  enableRealTimeUpdates?: boolean;
  updateInterval?: number;
  category?: string;
  autoOptimize?: boolean;
}

export interface PerformanceState {
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  resourceUsage: ResourceUsage | null;
  isMonitoring: boolean;
  lastUpdate: number;
}

export function usePerformance(options: UsePerformanceOptions = {}) {
  const {
    enableRealTimeUpdates = true,
    updateInterval = 5000,
    category,
    autoOptimize = false,
  } = options;

  const [state, setState] = useState<PerformanceState>({
    metrics: [],
    alerts: [],
    resourceUsage: null,
    isMonitoring: true,
    lastUpdate: 0,
  });

  const updateData = useCallback(() => {
    const metrics = performanceMonitor.getMetrics({
      category: category as any,
      limit: 100,
    });
    
    const alerts = performanceMonitor.getAlerts();
    const resourceUsage = performanceMonitor.getResourceUsage();
    
    setState(prev => ({
      ...prev,
      metrics,
      alerts,
      resourceUsage,
      lastUpdate: Date.now(),
    }));

    // Auto-optimization
    if (autoOptimize) {
      optimizationEngine.runOptimizationCheck(metrics);
    }
  }, [category, autoOptimize]);

  useEffect(() => {
    updateData();

    if (!enableRealTimeUpdates) return;

    const interval = setInterval(updateData, updateInterval);

    // Listen for real-time updates
    const handleMetric = (metric: PerformanceMetric) => {
      setState(prev => ({
        ...prev,
        metrics: [...prev.metrics.slice(-99), metric],
        lastUpdate: Date.now(),
      }));
    };

    const handleAlert = (alert: PerformanceAlert) => {
      setState(prev => ({
        ...prev,
        alerts: [...prev.alerts, alert],
        lastUpdate: Date.now(),
      }));
    };

    performanceMonitor.on('metric', handleMetric);
    performanceMonitor.on('alert', handleAlert);

    return () => {
      clearInterval(interval);
      performanceMonitor.off('metric', handleMetric);
      performanceMonitor.off('alert', handleAlert);
    };
  }, [enableRealTimeUpdates, updateInterval, updateData]);

  const recordMetric = useCallback((metric: Omit<PerformanceMetric, 'timestamp'>) => {
    performanceMonitor.recordMetric({
      ...metric,
      timestamp: Date.now(),
    });
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    performanceMonitor.acknowledgeAlert(alertId);
    updateData();
  }, [updateData]);

  const toggleMonitoring = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMonitoring: !prev.isMonitoring,
    }));
  }, []);

  return {
    ...state,
    recordMetric,
    acknowledgeAlert,
    toggleMonitoring,
    refresh: updateData,
  };
}

// ============================================================================
// Component Performance Hook
// ============================================================================

export interface UseComponentPerformanceOptions {
  componentName?: string;
  trackRenders?: boolean;
  trackProps?: boolean;
  warnThreshold?: number; // ms
}

export function useComponentPerformance(options: UseComponentPerformanceOptions = {}) {
  const {
    componentName = 'Unknown',
    trackRenders = true,
    trackProps = false,
    warnThreshold = 16, // 16ms for 60fps
  } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const propsHistory = useRef<any[]>([]);
  const mountTime = useRef(Date.now());

  // Track render performance
  useEffect(() => {
    if (!trackRenders) return;

    const renderStart = performance.now();
    renderCount.current++;

    // Measure render time
    const measureRender = () => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      lastRenderTime.current = renderTime;

      // Record metric
      performanceMonitor.recordMetric({
        name: 'component_render_time',
        value: renderTime,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'render',
        severity: renderTime > warnThreshold ? 'warning' : 'info',
        metadata: {
          componentName,
          renderCount: renderCount.current,
          isSlowRender: renderTime > warnThreshold,
        },
      });

      // Warn about slow renders
      if (renderTime > warnThreshold) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };

    // Use setTimeout to measure after render completion
    setTimeout(measureRender, 0);
  });

  // Track props changes
  const trackPropsChange = useCallback((props: any) => {
    if (!trackProps) return;

    const propsString = JSON.stringify(props);
    const lastProps = propsHistory.current[propsHistory.current.length - 1];

    if (lastProps && lastProps !== propsString) {
      performanceMonitor.recordMetric({
        name: 'component_props_change',
        value: 1,
        unit: 'count',
        timestamp: Date.now(),
        category: 'render',
        severity: 'info',
        metadata: {
          componentName,
          renderCount: renderCount.current,
        },
      });
    }

    propsHistory.current.push(propsString);
    
    // Keep only last 10 props snapshots
    if (propsHistory.current.length > 10) {
      propsHistory.current = propsHistory.current.slice(-10);
    }
  }, [componentName, trackProps]);

  // Component lifecycle metrics
  useEffect(() => {
    // Component mounted
    performanceMonitor.recordMetric({
      name: 'component_mount',
      value: Date.now() - mountTime.current,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'render',
      severity: 'info',
      metadata: { componentName },
    });

    return () => {
      // Component unmounted
      performanceMonitor.recordMetric({
        name: 'component_unmount',
        value: Date.now() - mountTime.current,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'render',
        severity: 'info',
        metadata: {
          componentName,
          totalRenders: renderCount.current,
          lifespan: Date.now() - mountTime.current,
        },
      });
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    trackPropsChange,
    componentName,
  };
}

// ============================================================================
// Network Performance Hook
// ============================================================================

export interface UseNetworkPerformanceOptions {
  trackRequests?: boolean;
  slowRequestThreshold?: number; // ms
  retryFailedRequests?: boolean;
}

export function useNetworkPerformance(options: UseNetworkPerformanceOptions = {}) {
  const {
    trackRequests = true,
    slowRequestThreshold = 1000,
    retryFailedRequests = false,
  } = options;

  const [networkState, setNetworkState] = useState({
    isOnline: navigator.onLine,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    downlink: (navigator as any).connection?.downlink || 0,
    rtt: (navigator as any).connection?.rtt || 0,
  });

  const requestCache = useRef(new Map<string, any>());
  const pendingRequests = useRef(new Map<string, AbortController>());

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection;
      setNetworkState({
        isOnline: navigator.onLine,
        connectionType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
      });

      // Record network change
      performanceMonitor.recordMetric({
        name: 'network_change',
        value: navigator.onLine ? 1 : 0,
        unit: 'count',
        timestamp: Date.now(),
        category: 'network',
        severity: navigator.onLine ? 'info' : 'warning',
        metadata: {
          isOnline: navigator.onLine,
          connectionType: connection?.effectiveType,
          downlink: connection?.downlink,
          rtt: connection?.rtt,
        },
      });
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  // Enhanced fetch with performance tracking
  const performantFetch = useCallback(async (
    url: string, 
    options: RequestInit = {},
    cacheOptions?: { ttl?: number; key?: string }
  ) => {
    const cacheKey = cacheOptions?.key || `${options.method || 'GET'}:${url}`;
    const startTime = performance.now();

    // Check cache first
    if (options.method === 'GET' || !options.method) {
      const cached = requestCache.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (cacheOptions?.ttl || 300000)) {
        performanceMonitor.recordMetric({
          name: 'network_cache_hit',
          value: performance.now() - startTime,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'network',
          severity: 'info',
          metadata: { url, cached: true },
        });
        
        return cached.response.clone();
      }
    }

    // Create abort controller for request cancellation
    const abortController = new AbortController();
    pendingRequests.current.set(cacheKey, abortController);

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortController.signal,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Record performance metric
      performanceMonitor.recordMetric({
        name: 'network_request',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'network',
        severity: duration > slowRequestThreshold ? 'warning' : 'info',
        metadata: {
          url,
          method: options.method || 'GET',
          status: response.status,
          cached: false,
          slow: duration > slowRequestThreshold,
        },
      });

      // Cache successful GET requests
      if (response.ok && (options.method === 'GET' || !options.method)) {
        requestCache.current.set(cacheKey, {
          response: response.clone(),
          timestamp: Date.now(),
        });
      }

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Record error metric
      performanceMonitor.recordMetric({
        name: 'network_request_failed',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'network',
        severity: 'critical',
        metadata: {
          url,
          method: options.method || 'GET',
          error: (error as Error).message,
        },
      });

      // Retry logic
      if (retryFailedRequests && !abortController.signal.aborted) {
        console.warn(`Request failed, retrying: ${url}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return performantFetch(url, options, cacheOptions);
      }

      throw error;
    } finally {
      pendingRequests.current.delete(cacheKey);
    }
  }, [slowRequestThreshold, retryFailedRequests]);

  // Cancel all pending requests
  const cancelAllRequests = useCallback(() => {
    pendingRequests.current.forEach(controller => {
      controller.abort();
    });
    pendingRequests.current.clear();
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    requestCache.current.clear();
  }, []);

  return {
    networkState,
    performantFetch,
    cancelAllRequests,
    clearCache,
  };
}

// ============================================================================
// Memory Performance Hook
// ============================================================================

export function useMemoryPerformance() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  const leakDetectionRef = useRef<number[]>([]);

  // Monitor memory usage
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const info = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        };

        setMemoryInfo(info);

        // Track for leak detection
        leakDetectionRef.current.push(memory.usedJSHeapSize);
        if (leakDetectionRef.current.length > 20) {
          leakDetectionRef.current = leakDetectionRef.current.slice(-20);
        }

        // Record metric
        performanceMonitor.recordMetric({
          name: 'memory_usage',
          value: info.percentage,
          unit: 'percentage',
          timestamp: Date.now(),
          category: 'memory',
          severity: info.percentage > 80 ? 'warning' : 'info',
          metadata: info,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Force garbage collection (if available)
  const forceGC = useCallback(() => {
    if ((window as any).gc) {
      (window as any).gc();
      setTimeout(() => {
        if ((performance as any).memory) {
          const memory = (performance as any).memory;
          performanceMonitor.recordMetric({
            name: 'garbage_collection',
            value: memory.usedJSHeapSize,
            unit: 'bytes',
            timestamp: Date.now(),
            category: 'memory',
            severity: 'info',
            metadata: { forced: true },
          });
        }
      }, 1000);
    }
  }, []);

  // Detect potential memory leaks
  const detectMemoryLeak = useCallback(() => {
    if (leakDetectionRef.current.length < 10) return false;

    const recent = leakDetectionRef.current.slice(-10);
    const isGrowing = recent.every((val, i) => i === 0 || val > recent[i - 1]);
    
    if (isGrowing) {
      const growth = recent[recent.length - 1] - recent[0];
      const growthRate = growth / recent.length;
      
      if (growthRate > 1000000) { // > 1MB per measurement
        performanceMonitor.recordMetric({
          name: 'memory_leak_detected',
          value: growthRate,
          unit: 'bytes',
          timestamp: Date.now(),
          category: 'memory',
          severity: 'critical',
          metadata: { growthRate, measurements: recent.length },
        });
        
        return true;
      }
    }
    
    return false;
  }, []);

  return {
    memoryInfo,
    forceGC,
    detectMemoryLeak,
    isMemoryLeakDetected: detectMemoryLeak(),
  };
}

// ============================================================================
// Optimization Hook
// ============================================================================

export function useOptimization() {
  const [rules, setRules] = useState<OptimizationRule[]>([]);
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Load optimization data
  useEffect(() => {
    const updateData = () => {
      setRules(optimizationEngine.getRules());
      setResults(optimizationEngine.getResults());
    };

    updateData();
    const interval = setInterval(updateData, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Execute optimization rule
  const executeRule = useCallback(async (ruleId: string) => {
    setIsOptimizing(true);
    try {
      const result = await optimizationEngine.executeRule(ruleId);
      setResults(prev => [...prev, result]);
      return result;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  // Toggle rule
  const toggleRule = useCallback((ruleId: string, enabled: boolean) => {
    if (enabled) {
      optimizationEngine.enableRule(ruleId);
    } else {
      optimizationEngine.disableRule(ruleId);
    }
    setRules(optimizationEngine.getRules());
  }, []);

  // Run optimization check
  const runOptimizationCheck = useCallback((metrics: PerformanceMetric[]) => {
    optimizationEngine.runOptimizationCheck(metrics);
  }, []);

  return {
    rules,
    results,
    isOptimizing,
    executeRule,
    toggleRule,
    runOptimizationCheck,
  };
}

// ============================================================================
// Audio Performance Hook
// ============================================================================

export function useAudioPerformance() {
  const [audioContexts, setAudioContexts] = useState<AudioContext[]>([]);
  const [audioMetrics, setAudioMetrics] = useState({
    latency: 0,
    sampleRate: 0,
    bufferSize: 0,
    state: 'suspended' as AudioContextState,
  });

  // Monitor audio contexts
  useEffect(() => {
    const contexts: AudioContext[] = [];
    
    // Hook into AudioContext creation
    const originalAudioContext = window.AudioContext;
    window.AudioContext = class extends originalAudioContext {
      constructor(...args: any[]) {
        super(...args);
        contexts.push(this);
        setAudioContexts([...contexts]);
        
        // Monitor this context
        const monitorContext = () => {
          if (this.state === 'running') {
            const latency = (this.baseLatency + this.outputLatency) * 1000;
            
            setAudioMetrics({
              latency,
              sampleRate: this.sampleRate,
              bufferSize: 0, // Would need to be set during creation
              state: this.state,
            });

            performanceMonitor.recordMetric({
              name: 'audio_latency',
              value: latency,
              unit: 'ms',
              timestamp: Date.now(),
              category: 'audio',
              severity: latency > 50 ? 'warning' : 'info',
              metadata: {
                baseLatency: this.baseLatency,
                outputLatency: this.outputLatency,
                sampleRate: this.sampleRate,
                state: this.state,
              },
            });
          }
        };

        this.addEventListener('statechange', monitorContext);
        monitorContext(); // Initial measurement
      }
    } as any;

    return () => {
      window.AudioContext = originalAudioContext;
    };
  }, []);

  // Optimize audio settings
  const optimizeAudioSettings = useCallback((context: AudioContext) => {
    if (context.state === 'running') {
      // Recommendations based on current performance
      const recommendations = [];
      
      if (audioMetrics.latency > 50) {
        recommendations.push('Consider reducing buffer size for lower latency');
      }
      
      if (audioMetrics.sampleRate > 48000) {
        recommendations.push('Consider using 48kHz sample rate for better performance');
      }
      
      return recommendations;
    }
    
    return [];
  }, [audioMetrics]);

  return {
    audioContexts,
    audioMetrics,
    optimizeAudioSettings,
  };
}
