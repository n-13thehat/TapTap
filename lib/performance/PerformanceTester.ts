/**
 * Performance Testing and Benchmarking Utilities
 * Comprehensive performance testing suite for components and functions
 */

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  operationsPerSecond: number;
  memoryUsage: {
    before: number;
    after: number;
    peak: number;
  };
  timestamp: number;
}

export interface LoadTestConfig {
  duration: number; // ms
  concurrency: number;
  rampUpTime: number; // ms
  targetRPS: number; // requests per second
  endpoint?: string;
  payload?: any;
  headers?: Record<string, string>;
}

export interface LoadTestResult {
  config: LoadTestConfig;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  responseTimePercentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  errors: { [errorType: string]: number };
  timeline: TimelinePoint[];
}

export interface TimelinePoint {
  timestamp: number;
  activeRequests: number;
  responseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

export interface ComponentTestConfig {
  component: React.ComponentType<any>;
  props: any[];
  iterations: number;
  warmupIterations: number;
  measureRender: boolean;
  measureMount: boolean;
  measureUpdate: boolean;
}

export interface ComponentTestResult {
  componentName: string;
  renderTimes: number[];
  mountTime: number;
  updateTimes: number[];
  averageRenderTime: number;
  memoryLeaks: boolean;
  recommendations: string[];
}

export class PerformanceTester {
  private static instance: PerformanceTester;
  private benchmarkHistory: Map<string, BenchmarkResult[]> = new Map();
  private loadTestHistory: LoadTestResult[] = [];

  private constructor() {}

  public static getInstance(): PerformanceTester {
    if (!PerformanceTester.instance) {
      PerformanceTester.instance = new PerformanceTester();
    }
    return PerformanceTester.instance;
  }

  // ============================================================================
  // Function Benchmarking
  // ============================================================================

  public async benchmark(
    name: string,
    fn: () => any,
    iterations: number = 1000,
    warmupIterations: number = 100
  ): Promise<BenchmarkResult> {
    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }

    // Force garbage collection if available
    if ((global as any).gc) {
      (global as any).gc();
    }

    const times: number[] = [];
    const memoryBefore = this.getMemoryUsage();
    let memoryPeak = memoryBefore;

    // Run benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      
      times.push(end - start);
      
      // Track peak memory
      const currentMemory = this.getMemoryUsage();
      if (currentMemory > memoryPeak) {
        memoryPeak = currentMemory;
      }
    }

    const memoryAfter = this.getMemoryUsage();
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // Calculate standard deviation
    const variance = times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / iterations;
    const standardDeviation = Math.sqrt(variance);
    
    const operationsPerSecond = 1000 / averageTime;

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      operationsPerSecond,
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        peak: memoryPeak,
      },
      timestamp: Date.now(),
    };

    // Store in history
    const history = this.benchmarkHistory.get(name) || [];
    history.push(result);
    this.benchmarkHistory.set(name, history);

    return result;
  }

  public compareBenchmarks(name1: string, name2: string): {
    faster: string;
    speedup: number;
    comparison: string;
  } | null {
    const history1 = this.benchmarkHistory.get(name1);
    const history2 = this.benchmarkHistory.get(name2);

    if (!history1 || !history2 || history1.length === 0 || history2.length === 0) {
      return null;
    }

    const latest1 = history1[history1.length - 1];
    const latest2 = history2[history2.length - 1];

    const faster = latest1.averageTime < latest2.averageTime ? name1 : name2;
    const slower = faster === name1 ? name2 : name1;
    const fasterTime = faster === name1 ? latest1.averageTime : latest2.averageTime;
    const slowerTime = faster === name1 ? latest2.averageTime : latest1.averageTime;
    
    const speedup = slowerTime / fasterTime;
    const comparison = `${faster} is ${speedup.toFixed(2)}x faster than ${slower}`;

    return { faster, speedup, comparison };
  }

  // ============================================================================
  // Load Testing
  // ============================================================================

  public async loadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const results: Array<{ responseTime: number; success: boolean; error?: string }> = [];
    const timeline: TimelinePoint[] = [];
    const startTime = Date.now();
    const endTime = startTime + config.duration;
    
    let activeRequests = 0;
    const errors: { [errorType: string]: number } = {};

    // Calculate request interval
    const requestInterval = 1000 / config.targetRPS;
    
    return new Promise((resolve) => {
      const makeRequest = async (): Promise<void> => {
        activeRequests++;
        const requestStart = performance.now();
        
        try {
          let response: Response;
          
          if (config.endpoint) {
            response = await fetch(config.endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...config.headers,
              },
              body: config.payload ? JSON.stringify(config.payload) : undefined,
            });
          } else {
            // Simulate request
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            response = new Response('OK', { status: 200 });
          }
          
          const responseTime = performance.now() - requestStart;
          
          results.push({
            responseTime,
            success: response.ok,
            error: response.ok ? undefined : `HTTP ${response.status}`,
          });
          
          if (!response.ok) {
            const errorType = `HTTP_${response.status}`;
            errors[errorType] = (errors[errorType] || 0) + 1;
          }
          
        } catch (error) {
          const responseTime = performance.now() - requestStart;
          const errorType = (error as Error).name || 'UNKNOWN_ERROR';
          
          results.push({
            responseTime,
            success: false,
            error: (error as Error).message,
          });
          
          errors[errorType] = (errors[errorType] || 0) + 1;
        } finally {
          activeRequests--;
        }
      };

      // Start load test
      const interval = setInterval(() => {
        if (Date.now() >= endTime) {
          clearInterval(interval);
          
          // Wait for all requests to complete
          const waitForCompletion = () => {
            if (activeRequests === 0) {
              resolve(this.calculateLoadTestResult(config, results, timeline, errors));
            } else {
              setTimeout(waitForCompletion, 100);
            }
          };
          waitForCompletion();
          return;
        }

        // Launch concurrent requests
        for (let i = 0; i < config.concurrency; i++) {
          makeRequest();
        }

        // Record timeline point
        const now = Date.now();
        const recentResults = results.filter(r => now - r.responseTime < 1000);
        const recentErrors = recentResults.filter(r => !r.success).length;
        const avgResponseTime = recentResults.length > 0
          ? recentResults.reduce((sum, r) => sum + r.responseTime, 0) / recentResults.length
          : 0;

        timeline.push({
          timestamp: now,
          activeRequests,
          responseTime: avgResponseTime,
          requestsPerSecond: recentResults.length,
          errorRate: recentResults.length > 0 ? (recentErrors / recentResults.length) * 100 : 0,
        });
        
      }, requestInterval);
    });
  }

  private calculateLoadTestResult(
    config: LoadTestConfig,
    results: Array<{ responseTime: number; success: boolean; error?: string }>,
    timeline: TimelinePoint[],
    errors: { [errorType: string]: number }
  ): LoadTestResult {
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = results.map(r => r.responseTime);
    responseTimes.sort((a, b) => a - b);
    
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    const requestsPerSecond = totalRequests / (config.duration / 1000);
    const errorRate = (failedRequests / totalRequests) * 100;
    
    // Calculate percentiles
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p90 = responseTimes[Math.floor(responseTimes.length * 0.9)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

    const result: LoadTestResult = {
      config,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond,
      errorRate,
      responseTimePercentiles: { p50, p90, p95, p99 },
      errors,
      timeline,
    };

    this.loadTestHistory.push(result);
    return result;
  }

  // ============================================================================
  // Component Performance Testing
  // ============================================================================

  public async testComponent(config: ComponentTestConfig): Promise<ComponentTestResult> {
    const { component: Component, props, iterations, warmupIterations, measureRender, measureMount, measureUpdate } = config;
    
    const renderTimes: number[] = [];
    const updateTimes: number[] = [];
    let mountTime = 0;
    let memoryLeaks = false;
    const recommendations: string[] = [];

    // This would require integration with React testing utilities
    // For now, we'll simulate the testing process
    
    if (measureMount) {
      const start = performance.now();
      // Simulate component mounting
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      mountTime = performance.now() - start;
    }

    if (measureRender) {
      // Warmup renders
      for (let i = 0; i < warmupIterations; i++) {
        // Simulate render
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Measure renders
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        // Simulate render with different props
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
        const renderTime = performance.now() - start;
        renderTimes.push(renderTime);
      }
    }

    if (measureUpdate) {
      for (let i = 0; i < Math.min(iterations, 100); i++) {
        const start = performance.now();
        // Simulate prop update
        await new Promise(resolve => setTimeout(resolve, Math.random() * 3));
        const updateTime = performance.now() - start;
        updateTimes.push(updateTime);
      }
    }

    // Analyze results
    const averageRenderTime = renderTimes.length > 0
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
      : 0;

    // Generate recommendations
    if (averageRenderTime > 16) {
      recommendations.push('Consider memoizing this component with React.memo');
      recommendations.push('Check for unnecessary re-renders caused by prop changes');
    }

    if (mountTime > 100) {
      recommendations.push('Component mount time is slow, consider lazy loading');
    }

    if (updateTimes.some(time => time > 16)) {
      recommendations.push('Some updates are slow, consider optimizing state updates');
    }

    // Simple memory leak detection (would be more sophisticated in real implementation)
    const memoryGrowth = this.getMemoryUsage() - this.getMemoryUsage();
    memoryLeaks = Math.abs(memoryGrowth) > 1000000; // 1MB threshold

    return {
      componentName: Component.name || 'Anonymous',
      renderTimes,
      mountTime,
      updateTimes,
      averageRenderTime,
      memoryLeaks,
      recommendations,
    };
  }

  // ============================================================================
  // Memory and CPU Profiling
  // ============================================================================

  public async profileFunction<T>(
    fn: () => T,
    options: { measureMemory?: boolean; measureCPU?: boolean } = {}
  ): Promise<{
    result: T;
    executionTime: number;
    memoryUsage?: { before: number; after: number; peak: number };
    cpuUsage?: number;
  }> {
    const { measureMemory = true, measureCPU = false } = options;
    
    const memoryBefore = measureMemory ? this.getMemoryUsage() : 0;
    let memoryPeak = memoryBefore;
    
    const cpuBefore = measureCPU ? process.cpuUsage?.() : undefined;
    
    const start = performance.now();
    
    // Monitor memory during execution
    const memoryMonitor = measureMemory ? setInterval(() => {
      const current = this.getMemoryUsage();
      if (current > memoryPeak) {
        memoryPeak = current;
      }
    }, 10) : null;
    
    try {
      const result = await fn();
      const executionTime = performance.now() - start;
      
      if (memoryMonitor) {
        clearInterval(memoryMonitor);
      }
      
      const memoryAfter = measureMemory ? this.getMemoryUsage() : 0;
      const cpuAfter = measureCPU && cpuBefore ? process.cpuUsage?.(cpuBefore) : undefined;
      
      return {
        result,
        executionTime,
        memoryUsage: measureMemory ? {
          before: memoryBefore,
          after: memoryAfter,
          peak: memoryPeak,
        } : undefined,
        cpuUsage: cpuAfter ? (cpuAfter.user + cpuAfter.system) / 1000 : undefined,
      };
    } catch (error) {
      if (memoryMonitor) {
        clearInterval(memoryMonitor);
      }
      throw error;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    
    return 0;
  }

  public getBenchmarkHistory(name?: string): BenchmarkResult[] | Map<string, BenchmarkResult[]> {
    if (name) {
      return this.benchmarkHistory.get(name) || [];
    }
    return this.benchmarkHistory;
  }

  public getLoadTestHistory(): LoadTestResult[] {
    return [...this.loadTestHistory];
  }

  public clearHistory(): void {
    this.benchmarkHistory.clear();
    this.loadTestHistory = [];
  }

  public exportResults(): {
    benchmarks: { [name: string]: BenchmarkResult[] };
    loadTests: LoadTestResult[];
    exportTime: number;
  } {
    const benchmarks: { [name: string]: BenchmarkResult[] } = {};
    this.benchmarkHistory.forEach((results, name) => {
      benchmarks[name] = results;
    });

    return {
      benchmarks,
      loadTests: this.loadTestHistory,
      exportTime: Date.now(),
    };
  }

  public importResults(data: {
    benchmarks: { [name: string]: BenchmarkResult[] };
    loadTests: LoadTestResult[];
  }): void {
    // Clear existing data
    this.clearHistory();
    
    // Import benchmarks
    Object.entries(data.benchmarks).forEach(([name, results]) => {
      this.benchmarkHistory.set(name, results);
    });
    
    // Import load tests
    this.loadTestHistory = data.loadTests;
  }
}

// Singleton instance
export const performanceTester = PerformanceTester.getInstance();

// Utility functions for quick testing
export const benchmark = (name: string, fn: () => any, iterations?: number) => 
  performanceTester.benchmark(name, fn, iterations);

export const loadTest = (config: LoadTestConfig) => 
  performanceTester.loadTest(config);

export const profile = <T>(fn: () => T, options?: { measureMemory?: boolean; measureCPU?: boolean }) =>
  performanceTester.profileFunction(fn, options);
