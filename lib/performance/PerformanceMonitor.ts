/**
 * Advanced Performance Monitoring System
 * Comprehensive performance tracking, optimization, and real-time monitoring
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage' | 'fps';
  timestamp: number;
  category: 'render' | 'network' | 'memory' | 'audio' | 'user' | 'system';
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
}

export interface PerformanceReport {
  timestamp: number;
  duration: number;
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    warnings: number;
    criticals: number;
    averageResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  recommendations: string[];
}

export interface ResourceUsage {
  memory: {
    used: number;
    total: number;
    percentage: number;
    heap: {
      used: number;
      total: number;
      limit: number;
    };
  };
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
  };
  network: {
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
    effectiveType: string;
  };
  storage: {
    quota: number;
    usage: number;
    available: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold_exceeded' | 'memory_leak' | 'slow_operation' | 'network_issue';
  severity: 'warning' | 'critical';
  message: string;
  metric: PerformanceMetric;
  timestamp: number;
  acknowledged: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private alerts: PerformanceAlert[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  
  // Event listeners
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  
  // Performance tracking
  private frameCount = 0;
  private lastFrameTime = 0;
  private renderTimes: number[] = [];
  private networkRequests: Map<string, { start: number; url: string }> = new Map();
  
  // Memory leak detection
  private memorySnapshots: number[] = [];
  private componentCounts: Map<string, number> = new Map();
  
  // Configuration
  private config = {
    maxMetrics: 1000,
    alertThreshold: 100,
    samplingRate: 1000, // ms
    enableAutoOptimization: true,
    enableMemoryLeakDetection: true,
    enableNetworkMonitoring: true,
    enableRenderMonitoring: true,
  };

  private constructor() {
    this.initializeDefaultThresholds();
    this.startMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeDefaultThresholds() {
    const defaultThresholds: PerformanceThreshold[] = [
      { metric: 'page_load_time', warning: 3000, critical: 5000, unit: 'ms' },
      { metric: 'first_contentful_paint', warning: 1500, critical: 2500, unit: 'ms' },
      { metric: 'largest_contentful_paint', warning: 2500, critical: 4000, unit: 'ms' },
      { metric: 'cumulative_layout_shift', warning: 0.1, critical: 0.25, unit: 'score' },
      { metric: 'first_input_delay', warning: 100, critical: 300, unit: 'ms' },
      { metric: 'memory_usage', warning: 70, critical: 90, unit: 'percentage' },
      { metric: 'cpu_usage', warning: 80, critical: 95, unit: 'percentage' },
      { metric: 'network_latency', warning: 500, critical: 1000, unit: 'ms' },
      { metric: 'audio_latency', warning: 50, critical: 100, unit: 'ms' },
      { metric: 'render_time', warning: 16, critical: 33, unit: 'ms' },
      { metric: 'bundle_size', warning: 1000000, critical: 2000000, unit: 'bytes' },
    ];

    defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.metric, threshold);
    });
  }

  private startMonitoring() {
    if (typeof window === 'undefined') return;

    // Start core monitoring
    this.initializeWebVitals();
    this.initializeResourceMonitoring();
    this.initializeNetworkMonitoring();
    this.initializeRenderMonitoring();
    this.initializeMemoryMonitoring();
    this.initializeAudioMonitoring();

    // Start periodic collection
    this.intervals.set('metrics', setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.samplingRate));

    // Start memory leak detection
    if (this.config.enableMemoryLeakDetection) {
      this.intervals.set('memory', setInterval(() => {
        this.detectMemoryLeaks();
      }, 30000)); // Every 30 seconds
    }
  }

  private initializeWebVitals() {
    if (!('PerformanceObserver' in window)) return;

    // Core Web Vitals
    const vitalsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          name: entry.name,
          value: entry.value || (entry as any).duration || 0,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'render',
          severity: 'info',
          metadata: {
            entryType: entry.entryType,
            startTime: entry.startTime,
          }
        });
      }
    });

    try {
      vitalsObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
      this.observers.set('vitals', vitalsObserver);
    } catch (error) {
      console.warn('Web Vitals monitoring not supported:', error);
    }

    // Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        if (clsValue > 0) {
          this.recordMetric({
            name: 'cumulative_layout_shift',
            value: clsValue,
            unit: 'count',
            timestamp: Date.now(),
            category: 'render',
            severity: clsValue > 0.25 ? 'critical' : clsValue > 0.1 ? 'warning' : 'info'
          });
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    } catch (error) {
      console.warn('Layout Shift monitoring not supported:', error);
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'first_input_delay',
            value: (entry as any).processingStart - entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            category: 'user',
            severity: 'info'
          });
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    } catch (error) {
      console.warn('First Input Delay monitoring not supported:', error);
    }
  }

  private initializeResourceMonitoring() {
    if (!('PerformanceObserver' in window)) return;

    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        
        this.recordMetric({
          name: 'resource_load_time',
          value: resource.responseEnd - resource.startTime,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'network',
          severity: 'info',
          metadata: {
            url: resource.name,
            type: this.getResourceType(resource.name),
            size: resource.transferSize,
            cached: resource.transferSize === 0,
          }
        });

        // Track large resources
        if (resource.transferSize > 1000000) { // > 1MB
          this.recordMetric({
            name: 'large_resource',
            value: resource.transferSize,
            unit: 'bytes',
            timestamp: Date.now(),
            category: 'network',
            severity: 'warning',
            metadata: {
              url: resource.name,
              size: resource.transferSize,
            }
          });
        }
      }
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      console.warn('Resource monitoring not supported:', error);
    }
  }

  private initializeNetworkMonitoring() {
    if (!navigator.connection) return;

    const connection = navigator.connection;
    
    // Monitor connection changes
    const updateNetworkInfo = () => {
      this.recordMetric({
        name: 'network_speed',
        value: connection.downlink,
        unit: 'count',
        timestamp: Date.now(),
        category: 'network',
        severity: connection.downlink < 1 ? 'warning' : 'info',
        metadata: {
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          saveData: connection.saveData,
        }
      });
    };

    connection.addEventListener('change', updateNetworkInfo);
    updateNetworkInfo(); // Initial measurement

    // Monitor fetch requests
    this.interceptFetch();
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      this.networkRequests.set(requestId, { start: startTime, url });
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordMetric({
          name: 'api_request',
          value: duration,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'network',
          severity: duration > 1000 ? 'warning' : 'info',
          metadata: {
            url,
            status: response.status,
            method: args[1]?.method || 'GET',
            cached: response.headers.get('cache-control')?.includes('max-age'),
          }
        });
        
        this.networkRequests.delete(requestId);
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordMetric({
          name: 'api_request_failed',
          value: duration,
          unit: 'ms',
          timestamp: Date.now(),
          category: 'network',
          severity: 'critical',
          metadata: {
            url,
            error: (error as Error).message,
          }
        });
        
        this.networkRequests.delete(requestId);
        throw error;
      }
    };
  }

  private initializeRenderMonitoring() {
    // Monitor frame rate
    const measureFrameRate = () => {
      const now = performance.now();
      
      if (this.lastFrameTime > 0) {
        const frameTime = now - this.lastFrameTime;
        this.renderTimes.push(frameTime);
        
        // Keep only last 60 frames
        if (this.renderTimes.length > 60) {
          this.renderTimes.shift();
        }
        
        // Calculate FPS
        const avgFrameTime = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
        const fps = 1000 / avgFrameTime;
        
        this.recordMetric({
          name: 'frame_rate',
          value: fps,
          unit: 'fps',
          timestamp: Date.now(),
          category: 'render',
          severity: fps < 30 ? 'warning' : 'info',
          metadata: {
            frameTime: avgFrameTime,
            jank: frameTime > 16.67 ? true : false,
          }
        });
      }
      
      this.lastFrameTime = now;
      this.frameCount++;
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'long_task',
              value: entry.duration,
              unit: 'ms',
              timestamp: Date.now(),
              category: 'render',
              severity: entry.duration > 100 ? 'critical' : 'warning',
              metadata: {
                startTime: entry.startTime,
                attribution: (entry as any).attribution,
              }
            });
          }
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long task monitoring not supported:', error);
      }
    }
  }

  private initializeMemoryMonitoring() {
    if (!(performance as any).memory) return;

    const measureMemory = () => {
      const memory = (performance as any).memory;
      const memoryUsage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      
      this.recordMetric({
        name: 'memory_usage',
        value: memoryUsage,
        unit: 'percentage',
        timestamp: Date.now(),
        category: 'memory',
        severity: memoryUsage > 90 ? 'critical' : memoryUsage > 70 ? 'warning' : 'info',
        metadata: {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        }
      });
      
      // Store for leak detection
      this.memorySnapshots.push(memory.usedJSHeapSize);
      if (this.memorySnapshots.length > 20) {
        this.memorySnapshots.shift();
      }
    };

    this.intervals.set('memory-monitor', setInterval(measureMemory, 5000));
  }

  private initializeAudioMonitoring() {
    // Monitor audio context performance
    if (typeof AudioContext !== 'undefined') {
      const monitorAudioContext = (audioContext: AudioContext) => {
        const measureAudioLatency = () => {
          if (audioContext.state === 'running') {
            const latency = audioContext.baseLatency + audioContext.outputLatency;
            
            this.recordMetric({
              name: 'audio_latency',
              value: latency * 1000, // Convert to ms
              unit: 'ms',
              timestamp: Date.now(),
              category: 'audio',
              severity: latency > 0.1 ? 'warning' : 'info',
              metadata: {
                baseLatency: audioContext.baseLatency,
                outputLatency: audioContext.outputLatency,
                sampleRate: audioContext.sampleRate,
                state: audioContext.state,
              }
            });
          }
        };

        this.intervals.set('audio-latency', setInterval(measureAudioLatency, 2000));
      };

      // Hook into audio context creation
      const originalAudioContext = window.AudioContext;
      window.AudioContext = class extends originalAudioContext {
        constructor(...args: any[]) {
          super(...args);
          monitorAudioContext(this);
        }
      } as any;
    }
  }

  private collectSystemMetrics() {
    // CPU usage estimation
    const startTime = performance.now();
    const iterations = 100000;
    
    for (let i = 0; i < iterations; i++) {
      Math.random();
    }
    
    const endTime = performance.now();
    const cpuTime = endTime - startTime;
    const cpuUsage = Math.min(100, (cpuTime / 10) * 100); // Rough estimation
    
    this.recordMetric({
      name: 'cpu_usage',
      value: cpuUsage,
      unit: 'percentage',
      timestamp: Date.now(),
      category: 'system',
      severity: cpuUsage > 80 ? 'warning' : 'info'
    });

    // Storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;
        
        this.recordMetric({
          name: 'storage_usage',
          value: percentage,
          unit: 'percentage',
          timestamp: Date.now(),
          category: 'system',
          severity: percentage > 80 ? 'warning' : 'info',
          metadata: {
            usage,
            quota,
            available: quota - usage,
          }
        });
      });
    }
  }

  private detectMemoryLeaks() {
    if (this.memorySnapshots.length < 5) return;

    // Check for consistent memory growth
    const recent = this.memorySnapshots.slice(-5);
    const isGrowing = recent.every((val, i) => i === 0 || val > recent[i - 1]);
    
    if (isGrowing) {
      const growth = recent[recent.length - 1] - recent[0];
      const growthRate = growth / recent.length;
      
      if (growthRate > 1000000) { // > 1MB per snapshot
        this.createAlert({
          type: 'memory_leak',
          severity: 'critical',
          message: `Potential memory leak detected. Memory growing at ${(growthRate / 1000000).toFixed(2)}MB per measurement.`,
          metric: {
            name: 'memory_leak_detection',
            value: growthRate,
            unit: 'bytes',
            timestamp: Date.now(),
            category: 'memory',
            severity: 'critical',
          }
        });
      }
    }
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['js', 'mjs'].includes(extension || '')) return 'script';
    if (['css'].includes(extension || '')) return 'stylesheet';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension || '')) return 'audio';
    if (['mp4', 'webm', 'avi', 'mov'].includes(extension || '')) return 'video';
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) return 'font';
    
    return 'other';
  }

  public recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Trim metrics if too many
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }
    
    // Check thresholds
    this.checkThresholds(metric);
    
    // Emit event
    this.emit('metric', metric);
  }

  private checkThresholds(metric: PerformanceMetric) {
    const threshold = this.thresholds.get(metric.name);
    if (!threshold) return;
    
    let severity: 'warning' | 'critical' | null = null;
    
    if (metric.value >= threshold.critical) {
      severity = 'critical';
    } else if (metric.value >= threshold.warning) {
      severity = 'warning';
    }
    
    if (severity) {
      this.createAlert({
        type: 'threshold_exceeded',
        severity,
        message: `${metric.name} exceeded ${severity} threshold: ${metric.value}${metric.unit} (threshold: ${threshold[severity]}${threshold.unit})`,
        metric,
      });
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged'>) {
    const alert: PerformanceAlert = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      acknowledged: false,
      ...alertData,
    };
    
    this.alerts.push(alert);
    
    // Trim alerts if too many
    if (this.alerts.length > this.config.alertThreshold) {
      this.alerts = this.alerts.slice(-this.config.alertThreshold);
    }
    
    // Emit alert
    this.emit('alert', alert);
    
    // Auto-optimization if enabled
    if (this.config.enableAutoOptimization) {
      this.triggerAutoOptimization(alert);
    }
  }

  private triggerAutoOptimization(alert: PerformanceAlert) {
    switch (alert.type) {
      case 'memory_leak':
        // Trigger garbage collection if available
        if ((window as any).gc) {
          (window as any).gc();
        }
        break;
        
      case 'slow_operation':
        // Could implement operation queuing or throttling
        break;
        
      case 'network_issue':
        // Could implement request retry or caching strategies
        break;
    }
  }

  public getMetrics(filter?: {
    category?: PerformanceMetric['category'];
    severity?: PerformanceMetric['severity'];
    timeRange?: { start: number; end: number };
    limit?: number;
  }): PerformanceMetric[] {
    let filtered = [...this.metrics];
    
    if (filter?.category) {
      filtered = filtered.filter(m => m.category === filter.category);
    }
    
    if (filter?.severity) {
      filtered = filtered.filter(m => m.severity === filter.severity);
    }
    
    if (filter?.timeRange) {
      filtered = filtered.filter(m => 
        m.timestamp >= filter.timeRange!.start && 
        m.timestamp <= filter.timeRange!.end
      );
    }
    
    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }
    
    return filtered;
  }

  public getAlerts(acknowledged?: boolean): PerformanceAlert[] {
    if (acknowledged !== undefined) {
      return this.alerts.filter(a => a.acknowledged === acknowledged);
    }
    return [...this.alerts];
  }

  public acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert-acknowledged', alert);
    }
  }

  public generateReport(timeRange?: { start: number; end: number }): PerformanceReport {
    const metrics = this.getMetrics({ timeRange });
    const alerts = this.alerts.filter(a => 
      !timeRange || (a.timestamp >= timeRange.start && a.timestamp <= timeRange.end)
    );
    
    const warnings = alerts.filter(a => a.severity === 'warning').length;
    const criticals = alerts.filter(a => a.severity === 'critical').length;
    
    const networkMetrics = metrics.filter(m => m.category === 'network');
    const averageResponseTime = networkMetrics.length > 0
      ? networkMetrics.reduce((sum, m) => sum + m.value, 0) / networkMetrics.length
      : 0;
    
    const memoryMetrics = metrics.filter(m => m.name === 'memory_usage');
    const currentMemoryUsage = memoryMetrics.length > 0
      ? memoryMetrics[memoryMetrics.length - 1].value
      : 0;
    
    const cpuMetrics = metrics.filter(m => m.name === 'cpu_usage');
    const currentCpuUsage = cpuMetrics.length > 0
      ? cpuMetrics[cpuMetrics.length - 1].value
      : 0;
    
    const recommendations = this.generateRecommendations(metrics, alerts);
    
    return {
      timestamp: Date.now(),
      duration: timeRange ? timeRange.end - timeRange.start : 0,
      metrics,
      summary: {
        totalMetrics: metrics.length,
        warnings,
        criticals,
        averageResponseTime,
        memoryUsage: currentMemoryUsage,
        cpuUsage: currentCpuUsage,
      },
      recommendations,
    };
  }

  private generateRecommendations(metrics: PerformanceMetric[], alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = [];
    
    // Memory recommendations
    const memoryAlerts = alerts.filter(a => a.metric.category === 'memory');
    if (memoryAlerts.length > 0) {
      recommendations.push('Consider implementing memory optimization strategies');
      recommendations.push('Review component lifecycle and cleanup unused references');
    }
    
    // Network recommendations
    const slowNetworkMetrics = metrics.filter(m => 
      m.category === 'network' && m.value > 1000
    );
    if (slowNetworkMetrics.length > 5) {
      recommendations.push('Implement request caching and optimization');
      recommendations.push('Consider using a CDN for static assets');
    }
    
    // Render recommendations
    const slowRenderMetrics = metrics.filter(m => 
      m.category === 'render' && m.value > 16
    );
    if (slowRenderMetrics.length > 10) {
      recommendations.push('Optimize component rendering with React.memo and useMemo');
      recommendations.push('Consider virtualizing long lists');
    }
    
    return recommendations;
  }

  public setThreshold(metric: string, threshold: PerformanceThreshold) {
    this.thresholds.set(metric, threshold);
  }

  public updateConfig(newConfig: Partial<typeof this.config>) {
    this.config = { ...this.config, ...newConfig };
  }

  public on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (data: any) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  public getResourceUsage(): ResourceUsage {
    const memory = (performance as any).memory;
    const connection = navigator.connection;
    
    return {
      memory: {
        used: memory?.usedJSHeapSize || 0,
        total: memory?.totalJSHeapSize || 0,
        percentage: memory ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100 : 0,
        heap: {
          used: memory?.usedJSHeapSize || 0,
          total: memory?.totalJSHeapSize || 0,
          limit: memory?.jsHeapSizeLimit || 0,
        },
      },
      cpu: {
        usage: this.metrics.filter(m => m.name === 'cpu_usage').slice(-1)[0]?.value || 0,
        cores: navigator.hardwareConcurrency || 1,
        frequency: 0, // Not available in browser
      },
      network: {
        downloadSpeed: connection?.downlink || 0,
        uploadSpeed: 0, // Not available
        latency: connection?.rtt || 0,
        effectiveType: connection?.effectiveType || 'unknown',
      },
      storage: {
        quota: 0, // Will be updated async
        usage: 0,
        available: 0,
      },
    };
  }

  public destroy() {
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear data
    this.metrics = [];
    this.alerts = [];
    this.listeners.clear();
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
