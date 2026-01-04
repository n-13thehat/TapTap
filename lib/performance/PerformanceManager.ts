/**
 * Performance Manager
 * Comprehensive performance monitoring and optimization for TapTap Matrix
 */

export interface PerformanceConfig {
  monitoring: {
    enabled: boolean;
    sampleRate: number; // 0-1
    bufferSize: number;
    metricsInterval: number; // ms
    enableUserTiming: boolean;
    enableResourceTiming: boolean;
    enableNavigationTiming: boolean;
    enableMemoryMonitoring: boolean;
  };
  optimization: {
    enableLazyLoading: boolean;
    enableCodeSplitting: boolean;
    enableImageOptimization: boolean;
    enableAudioOptimization: boolean;
    enableMemoryOptimization: boolean;
    enableCacheOptimization: boolean;
    maxMemoryUsage: number; // MB
    gcThreshold: number; // MB
  };
  audio: {
    bufferSize: number;
    sampleRate: number;
    latencyHint: 'interactive' | 'balanced' | 'playback';
    enableWorklets: boolean;
    enableOfflineProcessing: boolean;
    maxConcurrentTracks: number;
    enableAudioCompression: boolean;
  };
  network: {
    enableCompression: boolean;
    enableCaching: boolean;
    maxCacheSize: number; // MB
    enablePrefetching: boolean;
    enableServiceWorker: boolean;
    enableCDN: boolean;
  };
}

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  
  // Custom metrics
  audioLatency: number;
  renderTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  
  // Audio specific
  audioDropouts: number;
  bufferUnderruns: number;
  processingLoad: number;
  
  // React specific
  componentRenderTime: number;
  reconciliationTime: number;
  effectExecutionTime: number;
  
  timestamp: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'memory' | 'cpu' | 'audio' | 'network' | 'render';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
  suggestions: string[];
}

export interface OptimizationRecommendation {
  id: string;
  category: 'bundle' | 'memory' | 'audio' | 'render' | 'network';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  implementation: string;
  estimatedImprovement: number; // percentage
}

export interface ResourceUsage {
  memory: {
    used: number;
    total: number;
    percentage: number;
    jsHeapSizeUsed: number;
    jsHeapSizeTotal: number;
    jsHeapSizeLimit: number;
  };
  cpu: {
    usage: number;
    cores: number;
    frequency: number;
  };
  network: {
    bandwidth: number;
    latency: number;
    packetLoss: number;
  };
  audio: {
    bufferSize: number;
    sampleRate: number;
    latency: number;
    cpuLoad: number;
  };
}

export class PerformanceManager {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private recommendations: OptimizationRecommendation[] = [];
  
  // Monitoring
  private observer: PerformanceObserver | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private memoryMonitor: NodeJS.Timeout | null = null;
  
  // Optimization
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private audioCache: Map<string, AudioBuffer> = new Map();
  private componentCache: Map<string, any> = new Map();
  private resourceCache: Map<string, any> = new Map();
  
  // Audio optimization
  private audioWorklets: Map<string, AudioWorkletNode> = new Map();
  private audioBufferPool: AudioBuffer[] = [];
  private processingQueue: any[] = [];
  
  // Memory management
  private memoryPressureLevel = 0; // 0-3
  private gcScheduled = false;
  private weakRefs: WeakRef<any>[] = [];
  
  // Performance tracking
  private renderTimes: Map<string, number[]> = new Map();
  private networkRequests: Map<string, number> = new Map();
  private cacheStats = { hits: 0, misses: 0 };

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      monitoring: {
        enabled: true,
        sampleRate: 0.1,
        bufferSize: 1000,
        metricsInterval: 5000,
        enableUserTiming: true,
        enableResourceTiming: true,
        enableNavigationTiming: true,
        enableMemoryMonitoring: true,
      },
      optimization: {
        enableLazyLoading: true,
        enableCodeSplitting: true,
        enableImageOptimization: true,
        enableAudioOptimization: true,
        enableMemoryOptimization: true,
        enableCacheOptimization: true,
        maxMemoryUsage: 512, // 512MB
        gcThreshold: 256, // 256MB
      },
      audio: {
        bufferSize: 512,
        sampleRate: 44100,
        latencyHint: 'interactive',
        enableWorklets: true,
        enableOfflineProcessing: true,
        maxConcurrentTracks: 32,
        enableAudioCompression: true,
      },
      network: {
        enableCompression: true,
        enableCaching: true,
        maxCacheSize: 100, // 100MB
        enablePrefetching: true,
        enableServiceWorker: true,
        enableCDN: true,
      },
      ...config,
    };

    this.initializeMonitoring();
    this.initializeOptimizations();
    this.generateRecommendations();
  }

  // Monitoring
  private initializeMonitoring(): void {
    if (!this.config.monitoring.enabled || typeof window === 'undefined') return;

    // Performance Observer
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        this.processPerformanceEntries(list.getEntries());
      });

      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Core Web Vitals
    this.initializeCoreWebVitals();

    // Memory monitoring
    if (this.config.monitoring.enableMemoryMonitoring) {
      this.startMemoryMonitoring();
    }

    // Metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.monitoring.metricsInterval);
  }

  private initializeCoreWebVitals(): void {
    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.updateMetric('lcp', lastEntry.startTime);
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }
    }

    // FID (First Input Delay)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.updateMetric('fid', entry.processingStart - entry.startTime);
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }
    }

    // CLS (Cumulative Layout Shift)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.updateMetric('cls', clsValue);
          }
        });
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }
  }

  private startMemoryMonitoring(): void {
    this.memoryMonitor = setInterval(() => {
      const memoryInfo = this.getMemoryInfo();
      
      if (memoryInfo.percentage > 80) {
        this.memoryPressureLevel = 3; // Critical
        this.triggerMemoryOptimization();
      } else if (memoryInfo.percentage > 60) {
        this.memoryPressureLevel = 2; // High
      } else if (memoryInfo.percentage > 40) {
        this.memoryPressureLevel = 1; // Medium
      } else {
        this.memoryPressureLevel = 0; // Low
      }

      // Schedule garbage collection if needed
      if (memoryInfo.used > this.config.optimization.gcThreshold && !this.gcScheduled) {
        this.scheduleGarbageCollection();
      }
    }, 10000); // Every 10 seconds
  }

  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      switch (entry.entryType) {
        case 'navigation':
          this.processNavigationEntry(entry as PerformanceNavigationTiming);
          break;
        case 'resource':
          this.processResourceEntry(entry as PerformanceResourceTiming);
          break;
        case 'measure':
          this.processMeasureEntry(entry as PerformanceMeasure);
          break;
        case 'paint':
          this.processPaintEntry(entry as PerformancePaintTiming);
          break;
      }
    });
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.updateMetric('ttfb', entry.responseStart - entry.fetchStart);
    this.updateMetric('renderTime', entry.loadEventEnd - entry.navigationStart);
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const url = entry.name;
    const loadTime = entry.responseEnd - entry.startTime;
    
    // Track network performance
    this.networkRequests.set(url, loadTime);
    
    // Check for slow resources
    if (loadTime > 3000) { // 3 seconds
      this.createAlert('network', 'high', `Slow resource load: ${url}`, loadTime, 3000, [
        'Enable compression',
        'Use CDN',
        'Optimize resource size',
        'Implement caching'
      ]);
    }
  }

  private processMeasureEntry(entry: PerformanceMeasure): void {
    // Track custom performance measures
    if (entry.name.startsWith('component-render-')) {
      const componentName = entry.name.replace('component-render-', '');
      this.trackComponentRender(componentName, entry.duration);
    }
  }

  private processPaintEntry(entry: PerformancePaintTiming): void {
    if (entry.name === 'first-contentful-paint') {
      this.updateMetric('fcp', entry.startTime);
    }
  }

  // Metrics collection
  private collectMetrics(): void {
    const metrics: PerformanceMetrics = {
      lcp: this.getLatestMetric('lcp'),
      fid: this.getLatestMetric('fid'),
      cls: this.getLatestMetric('cls'),
      fcp: this.getLatestMetric('fcp'),
      ttfb: this.getLatestMetric('ttfb'),
      audioLatency: this.measureAudioLatency(),
      renderTime: this.getLatestMetric('renderTime'),
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      networkLatency: this.getNetworkLatency(),
      cacheHitRate: this.getCacheHitRate(),
      audioDropouts: this.getAudioDropouts(),
      bufferUnderruns: this.getBufferUnderruns(),
      processingLoad: this.getProcessingLoad(),
      componentRenderTime: this.getAverageComponentRenderTime(),
      reconciliationTime: this.getReconciliationTime(),
      effectExecutionTime: this.getEffectExecutionTime(),
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.config.monitoring.bufferSize) {
      this.metrics = this.metrics.slice(-this.config.monitoring.bufferSize);
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metrics);
  }

  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    // Core Web Vitals thresholds
    if (metrics.lcp > 2500) {
      this.createAlert('render', 'high', 'Poor LCP performance', metrics.lcp, 2500, [
        'Optimize images',
        'Reduce server response time',
        'Eliminate render-blocking resources'
      ]);
    }

    if (metrics.fid > 100) {
      this.createAlert('render', 'medium', 'Poor FID performance', metrics.fid, 100, [
        'Reduce JavaScript execution time',
        'Split long tasks',
        'Use web workers'
      ]);
    }

    if (metrics.cls > 0.1) {
      this.createAlert('render', 'medium', 'Poor CLS performance', metrics.cls, 0.1, [
        'Set dimensions for images and videos',
        'Avoid inserting content above existing content',
        'Use transform animations'
      ]);
    }

    // Memory thresholds
    if (metrics.memoryUsage > this.config.optimization.maxMemoryUsage) {
      this.createAlert('memory', 'critical', 'High memory usage', metrics.memoryUsage, this.config.optimization.maxMemoryUsage, [
        'Clear unused caches',
        'Optimize data structures',
        'Implement lazy loading'
      ]);
    }

    // Audio thresholds
    if (metrics.audioLatency > 50) {
      this.createAlert('audio', 'high', 'High audio latency', metrics.audioLatency, 50, [
        'Reduce buffer size',
        'Use audio worklets',
        'Optimize audio processing'
      ]);
    }

    if (metrics.audioDropouts > 0) {
      this.createAlert('audio', 'critical', 'Audio dropouts detected', metrics.audioDropouts, 0, [
        'Increase buffer size',
        'Reduce processing load',
        'Check system performance'
      ]);
    }
  }

  // Optimization
  private initializeOptimizations(): void {
    if (this.config.optimization.enableLazyLoading) {
      this.setupLazyLoading();
    }

    if (this.config.optimization.enableImageOptimization) {
      this.setupImageOptimization();
    }

    if (this.config.optimization.enableAudioOptimization) {
      this.setupAudioOptimization();
    }

    if (this.config.optimization.enableMemoryOptimization) {
      this.setupMemoryOptimization();
    }

    if (this.config.optimization.enableCacheOptimization) {
      this.setupCacheOptimization();
    }
  }

  private setupLazyLoading(): void {
    // Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            this.loadElement(element);
            observer.unobserve(element);
          }
        });
      }, {
        rootMargin: '50px',
        threshold: 0.1
      });

      // Observe lazy-loadable elements
      document.querySelectorAll('[data-lazy]').forEach(el => {
        observer.observe(el);
      });
    }
  }

  private setupImageOptimization(): void {
    // WebP support detection
    const supportsWebP = this.checkWebPSupport();
    
    // Image loading optimization
    this.optimizeImageLoading();
    
    // Image compression
    this.setupImageCompression();
  }

  private setupAudioOptimization(): void {
    // Audio worklet setup
    if (this.config.audio.enableWorklets && 'AudioWorklet' in window) {
      this.setupAudioWorklets();
    }

    // Audio buffer pooling
    this.setupAudioBufferPool();

    // Audio compression
    if (this.config.audio.enableAudioCompression) {
      this.setupAudioCompression();
    }
  }

  private setupMemoryOptimization(): void {
    // Weak references for large objects
    this.setupWeakReferences();

    // Memory pressure handling
    this.setupMemoryPressureHandling();

    // Automatic cleanup
    this.setupAutomaticCleanup();
  }

  private setupCacheOptimization(): void {
    // Service worker for caching
    if (this.config.network.enableServiceWorker && 'serviceWorker' in navigator) {
      this.setupServiceWorker();
    }

    // Memory caching
    this.setupMemoryCache();

    // Cache invalidation
    this.setupCacheInvalidation();
  }

  // Audio optimization methods
  private async setupAudioWorklets(): Promise<void> {
    try {
      // Register audio worklets for optimized processing
      const audioContext = new AudioContext();
      
      await audioContext.audioWorklet.addModule('/worklets/audio-processor.js');
      
      const processorNode = new AudioWorkletNode(audioContext, 'audio-processor');
      this.audioWorklets.set('main-processor', processorNode);
      
    } catch (error) {
      console.warn('Audio worklets not supported:', error);
    }
  }

  private setupAudioBufferPool(): void {
    // Pre-allocate audio buffers to avoid GC pressure
    const bufferCount = 10;
    const bufferLength = this.config.audio.bufferSize;
    const sampleRate = this.config.audio.sampleRate;

    for (let i = 0; i < bufferCount; i++) {
      const buffer = new AudioBuffer({
        numberOfChannels: 2,
        length: bufferLength,
        sampleRate: sampleRate
      });
      this.audioBufferPool.push(buffer);
    }
  }

  private setupAudioCompression(): void {
    // Implement audio compression for reduced memory usage
    // This would integrate with the audio processing pipeline
  }

  // Memory optimization methods
  private setupWeakReferences(): void {
    // Use WeakRef for large objects that can be garbage collected
    const originalSet = Set.prototype.add;
    Set.prototype.add = function(value) {
      if (typeof value === 'object' && value !== null) {
        this.weakRefs?.push(new WeakRef(value));
      }
      return originalSet.call(this, value);
    };
  }

  private setupMemoryPressureHandling(): void {
    // Handle memory pressure events
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      
      setInterval(() => {
        const usedRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
        
        if (usedRatio > 0.9) {
          this.triggerMemoryOptimization();
        }
      }, 5000);
    }
  }

  private setupAutomaticCleanup(): void {
    // Automatic cleanup of unused resources
    setInterval(() => {
      this.cleanupUnusedResources();
    }, 30000); // Every 30 seconds
  }

  private triggerMemoryOptimization(): void {
    // Clear caches
    this.clearCaches();
    
    // Clean up weak references
    this.cleanupWeakReferences();
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    this.gcScheduled = false;
  }

  private scheduleGarbageCollection(): void {
    if (this.gcScheduled) return;
    
    this.gcScheduled = true;
    
    // Use requestIdleCallback for non-blocking GC
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.triggerMemoryOptimization();
      });
    } else {
      setTimeout(() => {
        this.triggerMemoryOptimization();
      }, 100);
    }
  }

  // Performance measurement utilities
  public measureComponentRender<T>(componentName: string, renderFn: () => T): T {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    this.trackComponentRender(componentName, endTime - startTime);
    
    return result;
  }

  public measureAsyncOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return operation().then(result => {
      const endTime = performance.now();
      performance.measure(operationName, { start: startTime, end: endTime });
      return result;
    });
  }

  public trackComponentRender(componentName: string, duration: number): void {
    const renders = this.renderTimes.get(componentName) || [];
    renders.push(duration);
    
    // Keep only last 100 renders
    if (renders.length > 100) {
      renders.splice(0, renders.length - 100);
    }
    
    this.renderTimes.set(componentName, renders);
    
    // Alert for slow renders
    if (duration > 16) { // 60fps threshold
      this.createAlert('render', 'medium', `Slow component render: ${componentName}`, duration, 16, [
        'Optimize component logic',
        'Use React.memo',
        'Implement virtualization',
        'Reduce re-renders'
      ]);
    }
  }

  // Cache management
  public cacheImage(url: string, image: HTMLImageElement): void {
    if (this.imageCache.size > 100) {
      // LRU eviction
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }
    
    this.imageCache.set(url, image);
    this.cacheStats.hits++;
  }

  public getCachedImage(url: string): HTMLImageElement | null {
    const image = this.imageCache.get(url);
    if (image) {
      this.cacheStats.hits++;
      return image;
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }

  public cacheAudioBuffer(url: string, buffer: AudioBuffer): void {
    if (this.audioCache.size > 50) {
      // LRU eviction
      const firstKey = this.audioCache.keys().next().value;
      this.audioCache.delete(firstKey);
    }
    
    this.audioCache.set(url, buffer);
  }

  public getCachedAudioBuffer(url: string): AudioBuffer | null {
    return this.audioCache.get(url) || null;
  }

  // Utility methods
  private updateMetric(name: string, value: number): void {
    // Update the latest metric value
    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (latestMetrics) {
      (latestMetrics as any)[name] = value;
    }
  }

  private getLatestMetric(name: string): number {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    return latestMetrics ? (latestMetrics as any)[name] || 0 : 0;
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    value: number,
    threshold: number,
    suggestions: string[]
  ): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: Date.now(),
      resolved: false,
      suggestions,
    };

    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  private generateRecommendations(): void {
    // Generate optimization recommendations based on current state
    this.recommendations = [
      {
        id: 'bundle-splitting',
        category: 'bundle',
        priority: 'high',
        title: 'Implement Code Splitting',
        description: 'Split large bundles into smaller chunks for faster loading',
        impact: 'high',
        effort: 'medium',
        implementation: 'Use dynamic imports and React.lazy for route-based splitting',
        estimatedImprovement: 30,
      },
      {
        id: 'image-optimization',
        category: 'network',
        priority: 'medium',
        title: 'Optimize Images',
        description: 'Implement WebP format and responsive images',
        impact: 'medium',
        effort: 'low',
        implementation: 'Use next/image or implement WebP with fallbacks',
        estimatedImprovement: 20,
      },
      {
        id: 'audio-worklets',
        category: 'audio',
        priority: 'high',
        title: 'Use Audio Worklets',
        description: 'Move audio processing to dedicated threads',
        impact: 'high',
        effort: 'high',
        implementation: 'Implement AudioWorkletProcessor for heavy audio operations',
        estimatedImprovement: 40,
      },
      {
        id: 'memory-pooling',
        category: 'memory',
        priority: 'medium',
        title: 'Implement Object Pooling',
        description: 'Reuse objects to reduce garbage collection pressure',
        impact: 'medium',
        effort: 'medium',
        implementation: 'Create pools for frequently allocated objects',
        estimatedImprovement: 25,
      },
      {
        id: 'virtualization',
        category: 'render',
        priority: 'high',
        title: 'Implement Virtualization',
        description: 'Virtualize large lists and grids for better performance',
        impact: 'high',
        effort: 'medium',
        implementation: 'Use react-window or react-virtualized for large datasets',
        estimatedImprovement: 50,
      },
    ];
  }

  // Measurement methods (simplified implementations)
  private measureAudioLatency(): number {
    // Simplified audio latency measurement
    return 20; // ms
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      return memoryInfo.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  private getCPUUsage(): number {
    // Simplified CPU usage estimation
    return 0;
  }

  private getNetworkLatency(): number {
    // Calculate average network latency from recent requests
    const latencies = Array.from(this.networkRequests.values());
    return latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  }

  private getCacheHitRate(): number {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    return total > 0 ? this.cacheStats.hits / total : 0;
  }

  private getAudioDropouts(): number {
    // Track audio dropouts
    return 0;
  }

  private getBufferUnderruns(): number {
    // Track buffer underruns
    return 0;
  }

  private getProcessingLoad(): number {
    // Calculate audio processing load
    return 0.3; // 30%
  }

  private getAverageComponentRenderTime(): number {
    let totalTime = 0;
    let totalRenders = 0;

    this.renderTimes.forEach(renders => {
      totalTime += renders.reduce((a, b) => a + b, 0);
      totalRenders += renders.length;
    });

    return totalRenders > 0 ? totalTime / totalRenders : 0;
  }

  private getReconciliationTime(): number {
    // Simplified reconciliation time
    return 0;
  }

  private getEffectExecutionTime(): number {
    // Simplified effect execution time
    return 0;
  }

  private getMemoryInfo(): ResourceUsage['memory'] {
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      return {
        used: memoryInfo.usedJSHeapSize / (1024 * 1024),
        total: memoryInfo.totalJSHeapSize / (1024 * 1024),
        percentage: (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100,
        jsHeapSizeUsed: memoryInfo.usedJSHeapSize,
        jsHeapSizeTotal: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      };
    }

    return {
      used: 0,
      total: 0,
      percentage: 0,
      jsHeapSizeUsed: 0,
      jsHeapSizeTotal: 0,
      jsHeapSizeLimit: 0,
    };
  }

  // Cleanup methods
  private clearCaches(): void {
    this.imageCache.clear();
    this.audioCache.clear();
    this.componentCache.clear();
    this.resourceCache.clear();
  }

  private cleanupWeakReferences(): void {
    this.weakRefs = this.weakRefs.filter(ref => ref.deref() !== undefined);
  }

  private cleanupUnusedResources(): void {
    // Clean up unused audio buffers
    this.audioBufferPool = this.audioBufferPool.slice(0, 10);
    
    // Clean up old metrics
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    // Clean up old alerts
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  // Utility implementations
  private loadElement(element: HTMLElement): void {
    const src = element.getAttribute('data-src');
    if (src) {
      element.setAttribute('src', src);
      element.removeAttribute('data-src');
    }
  }

  private checkWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private optimizeImageLoading(): void {
    // Implement image loading optimization
  }

  private setupImageCompression(): void {
    // Implement image compression
  }

  private setupServiceWorker(): void {
    // Setup service worker for caching
  }

  private setupMemoryCache(): void {
    // Setup memory cache
  }

  private setupCacheInvalidation(): void {
    // Setup cache invalidation
  }

  // Public API
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getRecommendations(): OptimizationRecommendation[] {
    return [...this.recommendations];
  }

  public getResourceUsage(): ResourceUsage {
    return {
      memory: this.getMemoryInfo(),
      cpu: { usage: this.getCPUUsage(), cores: navigator.hardwareConcurrency || 4, frequency: 0 },
      network: { bandwidth: 0, latency: this.getNetworkLatency(), packetLoss: 0 },
      audio: {
        bufferSize: this.config.audio.bufferSize,
        sampleRate: this.config.audio.sampleRate,
        latency: this.measureAudioLatency(),
        cpuLoad: this.getProcessingLoad(),
      },
    };
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public destroy(): void {
    // Clean up observers and intervals
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }

    // Clear caches
    this.clearCaches();
    
    // Clear data
    this.metrics = [];
    this.alerts = [];
    this.recommendations = [];
    this.weakRefs = [];
  }
}

// Singleton instance
let performanceManager: PerformanceManager | null = null;

export function getPerformanceManager(): PerformanceManager {
  if (!performanceManager) {
    performanceManager = new PerformanceManager();
  }
  return performanceManager;
}

export function initializePerformanceManager(config?: Partial<PerformanceConfig>): PerformanceManager {
  performanceManager = new PerformanceManager(config);
  return performanceManager;
}
