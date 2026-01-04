/**
 * Performance Optimization Engine
 * Automatic and manual performance optimizations
 */

export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  category: 'memory' | 'network' | 'render' | 'storage' | 'audio';
  priority: 'low' | 'medium' | 'high' | 'critical';
  condition: (metrics: any[]) => boolean;
  action: () => Promise<void> | void;
  enabled: boolean;
  lastExecuted?: number;
  cooldown?: number; // ms
}

export interface OptimizationResult {
  ruleId: string;
  success: boolean;
  improvement?: {
    metric: string;
    before: number;
    after: number;
    percentage: number;
  };
  error?: string;
  timestamp: number;
}

export interface CacheStrategy {
  type: 'memory' | 'localStorage' | 'indexedDB' | 'serviceWorker';
  maxSize: number;
  ttl: number; // Time to live in ms
  compression: boolean;
  encryption: boolean;
}

export interface BundleOptimization {
  codesplitting: boolean;
  treeshaking: boolean;
  minification: boolean;
  compression: boolean;
  lazyLoading: boolean;
  preloading: string[];
}

export class OptimizationEngine {
  private static instance: OptimizationEngine;
  private rules: Map<string, OptimizationRule> = new Map();
  private results: OptimizationResult[] = [];
  private caches: Map<string, Map<string, { data: any; timestamp: number; ttl: number }>> = new Map();
  private observers: Map<string, MutationObserver | IntersectionObserver> = new Map();
  
  // Resource management
  private resourcePool: Map<string, any[]> = new Map();
  private loadingQueue: Map<string, Promise<any>> = new Map();
  
  // Performance state
  private isOptimizing = false;
  private optimizationQueue: string[] = [];
  
  private constructor() {
    this.initializeDefaultRules();
    this.initializeCaches();
    this.startOptimizationLoop();
  }

  public static getInstance(): OptimizationEngine {
    if (!OptimizationEngine.instance) {
      OptimizationEngine.instance = new OptimizationEngine();
    }
    return OptimizationEngine.instance;
  }

  private initializeDefaultRules() {
    const defaultRules: OptimizationRule[] = [
      {
        id: 'memory-cleanup',
        name: 'Memory Cleanup',
        description: 'Clean up unused objects and force garbage collection',
        category: 'memory',
        priority: 'high',
        condition: (metrics) => {
          const memoryMetrics = metrics.filter(m => m.name === 'memory_usage');
          return memoryMetrics.some(m => m.value > 80);
        },
        action: () => this.performMemoryCleanup(),
        enabled: true,
        cooldown: 30000, // 30 seconds
      },
      {
        id: 'image-optimization',
        name: 'Image Optimization',
        description: 'Optimize images by lazy loading and compression',
        category: 'network',
        priority: 'medium',
        condition: (metrics) => {
          const networkMetrics = metrics.filter(m => m.name === 'resource_load_time' && m.metadata?.type === 'image');
          return networkMetrics.some(m => m.value > 2000);
        },
        action: () => this.optimizeImages(),
        enabled: true,
        cooldown: 60000, // 1 minute
      },
      {
        id: 'component-memoization',
        name: 'Component Memoization',
        description: 'Automatically memoize frequently re-rendering components',
        category: 'render',
        priority: 'medium',
        condition: (metrics) => {
          const renderMetrics = metrics.filter(m => m.name === 'render_time');
          return renderMetrics.some(m => m.value > 16);
        },
        action: () => this.optimizeComponentRendering(),
        enabled: true,
        cooldown: 120000, // 2 minutes
      },
      {
        id: 'network-caching',
        name: 'Network Caching',
        description: 'Implement aggressive caching for API responses',
        category: 'network',
        priority: 'high',
        condition: (metrics) => {
          const apiMetrics = metrics.filter(m => m.name === 'api_request');
          return apiMetrics.some(m => m.value > 1000);
        },
        action: () => this.optimizeNetworkCaching(),
        enabled: true,
        cooldown: 300000, // 5 minutes
      },
      {
        id: 'audio-buffer-optimization',
        name: 'Audio Buffer Optimization',
        description: 'Optimize audio buffer sizes and preloading',
        category: 'audio',
        priority: 'high',
        condition: (metrics) => {
          const audioMetrics = metrics.filter(m => m.name === 'audio_latency');
          return audioMetrics.some(m => m.value > 50);
        },
        action: () => this.optimizeAudioBuffers(),
        enabled: true,
        cooldown: 60000, // 1 minute
      },
      {
        id: 'storage-cleanup',
        name: 'Storage Cleanup',
        description: 'Clean up old cached data and optimize storage usage',
        category: 'storage',
        priority: 'low',
        condition: (metrics) => {
          const storageMetrics = metrics.filter(m => m.name === 'storage_usage');
          return storageMetrics.some(m => m.value > 70);
        },
        action: () => this.cleanupStorage(),
        enabled: true,
        cooldown: 600000, // 10 minutes
      },
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private initializeCaches() {
    // Initialize different cache types
    this.caches.set('memory', new Map());
    this.caches.set('api', new Map());
    this.caches.set('images', new Map());
    this.caches.set('audio', new Map());
  }

  private startOptimizationLoop() {
    setInterval(() => {
      if (!this.isOptimizing && this.optimizationQueue.length > 0) {
        this.processOptimizationQueue();
      }
    }, 5000); // Check every 5 seconds
  }

  private async processOptimizationQueue() {
    if (this.isOptimizing) return;
    
    this.isOptimizing = true;
    
    try {
      while (this.optimizationQueue.length > 0) {
        const ruleId = this.optimizationQueue.shift()!;
        await this.executeRule(ruleId);
      }
    } finally {
      this.isOptimizing = false;
    }
  }

  public async executeRule(ruleId: string): Promise<OptimizationResult> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      throw new Error(`Rule ${ruleId} not found or disabled`);
    }

    // Check cooldown
    if (rule.lastExecuted && rule.cooldown) {
      const timeSinceLastExecution = Date.now() - rule.lastExecuted;
      if (timeSinceLastExecution < rule.cooldown) {
        throw new Error(`Rule ${ruleId} is in cooldown`);
      }
    }

    const startTime = Date.now();
    let result: OptimizationResult;

    try {
      // Measure before
      const beforeMetrics = this.captureRelevantMetrics(rule.category);
      
      // Execute optimization
      await rule.action();
      
      // Measure after
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for effects
      const afterMetrics = this.captureRelevantMetrics(rule.category);
      
      // Calculate improvement
      const improvement = this.calculateImprovement(beforeMetrics, afterMetrics, rule.category);
      
      result = {
        ruleId,
        success: true,
        improvement,
        timestamp: Date.now(),
      };
      
      rule.lastExecuted = Date.now();
    } catch (error) {
      result = {
        ruleId,
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }

    this.results.push(result);
    
    // Keep only last 100 results
    if (this.results.length > 100) {
      this.results = this.results.slice(-100);
    }

    return result;
  }

  private captureRelevantMetrics(category: string): any {
    const { performanceMonitor } = require('./PerformanceMonitor');
    
    switch (category) {
      case 'memory':
        return performanceMonitor.getResourceUsage().memory;
      case 'network':
        return performanceMonitor.getMetrics({ category: 'network', limit: 10 });
      case 'render':
        return performanceMonitor.getMetrics({ category: 'render', limit: 10 });
      case 'audio':
        return performanceMonitor.getMetrics({ category: 'audio', limit: 10 });
      case 'storage':
        return performanceMonitor.getResourceUsage().storage;
      default:
        return null;
    }
  }

  private calculateImprovement(before: any, after: any, category: string): any {
    switch (category) {
      case 'memory':
        if (before && after && before.percentage > after.percentage) {
          return {
            metric: 'memory_usage',
            before: before.percentage,
            after: after.percentage,
            percentage: ((before.percentage - after.percentage) / before.percentage) * 100,
          };
        }
        break;
      case 'network':
        if (Array.isArray(before) && Array.isArray(after)) {
          const beforeAvg = before.reduce((sum, m) => sum + m.value, 0) / before.length;
          const afterAvg = after.reduce((sum, m) => sum + m.value, 0) / after.length;
          if (beforeAvg > afterAvg) {
            return {
              metric: 'network_response_time',
              before: beforeAvg,
              after: afterAvg,
              percentage: ((beforeAvg - afterAvg) / beforeAvg) * 100,
            };
          }
        }
        break;
    }
    return null;
  }

  // Optimization implementations
  private async performMemoryCleanup() {
    // Clear unused caches
    this.caches.forEach((cache, type) => {
      const now = Date.now();
      cache.forEach((item, key) => {
        if (now - item.timestamp > item.ttl) {
          cache.delete(key);
        }
      });
    });

    // Clear resource pools
    this.resourcePool.forEach((pool, type) => {
      if (pool.length > 100) {
        this.resourcePool.set(type, pool.slice(-50));
      }
    });

    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }

    // Clear completed loading promises
    this.loadingQueue.clear();
  }

  private async optimizeImages() {
    // Implement lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    
    if (!this.observers.has('image-lazy')) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      }, { rootMargin: '50px' });
      
      this.observers.set('image-lazy', imageObserver);
    }

    const observer = this.observers.get('image-lazy') as IntersectionObserver;
    images.forEach(img => observer.observe(img));

    // Compress images in cache
    const imageCache = this.caches.get('images')!;
    imageCache.forEach(async (item, key) => {
      if (item.data instanceof HTMLImageElement) {
        const compressed = await this.compressImage(item.data);
        if (compressed) {
          imageCache.set(key, { ...item, data: compressed });
        }
      }
    });
  }

  private async compressImage(img: HTMLImageElement): Promise<HTMLImageElement | null> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Reduce size if too large
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP if supported
      const format = 'image/webp';
      const quality = 0.8;
      const dataUrl = canvas.toDataURL(format, quality);

      const newImg = new Image();
      newImg.src = dataUrl;
      return newImg;
    } catch (error) {
      console.warn('Image compression failed:', error);
      return null;
    }
  }

  private async optimizeComponentRendering() {
    // This would typically be handled at build time or through React DevTools
    // For runtime optimization, we can implement component tracking
    
    const componentTracker = new Map<string, { renders: number; lastRender: number }>();
    
    // Hook into React's render cycle (simplified)
    if (typeof window !== 'undefined' && (window as any).React) {
      const originalCreateElement = (window as any).React.createElement;
      
      (window as any).React.createElement = function(type: any, props: any, ...children: any[]) {
        if (typeof type === 'function') {
          const componentName = type.name || type.displayName || 'Anonymous';
          const tracker = componentTracker.get(componentName) || { renders: 0, lastRender: 0 };
          
          tracker.renders++;
          tracker.lastRender = Date.now();
          componentTracker.set(componentName, tracker);
          
          // Log frequently rendering components
          if (tracker.renders > 100) {
            console.warn(`Component ${componentName} has rendered ${tracker.renders} times`);
          }
        }
        
        return originalCreateElement.call(this, type, props, ...children);
      };
    }
  }

  private async optimizeNetworkCaching() {
    // Implement service worker caching if not already present
    if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    }

    // Implement request deduplication
    const originalFetch = window.fetch;
    const pendingRequests = new Map<string, Promise<Response>>();
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      const cacheKey = `${method}:${url}`;
      
      // Return pending request if exists
      if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)!.then(response => response.clone());
      }
      
      // Create new request
      const requestPromise = originalFetch(input, init);
      pendingRequests.set(cacheKey, requestPromise);
      
      try {
        const response = await requestPromise;
        
        // Cache successful responses
        if (response.ok && method === 'GET') {
          const apiCache = this.caches.get('api')!;
          apiCache.set(url, {
            data: response.clone(),
            timestamp: Date.now(),
            ttl: 300000, // 5 minutes
          });
        }
        
        return response;
      } finally {
        // Clean up pending request
        setTimeout(() => pendingRequests.delete(cacheKey), 1000);
      }
    };
  }

  private async optimizeAudioBuffers() {
    // Optimize audio context settings
    if (typeof AudioContext !== 'undefined') {
      const contexts = (window as any).__audioContexts || [];
      
      contexts.forEach((context: AudioContext) => {
        if (context.state === 'running') {
          // Optimize buffer sizes
          const optimalBufferSize = Math.max(256, Math.min(4096, context.sampleRate / 100));
          
          // This would typically be set during AudioContext creation
          console.log(`Recommended buffer size: ${optimalBufferSize}`);
        }
      });
    }

    // Preload critical audio files
    const audioCache = this.caches.get('audio')!;
    const criticalAudioUrls = [
      '/audio/ui-sounds/click.mp3',
      '/audio/ui-sounds/notification.mp3',
    ];

    for (const url of criticalAudioUrls) {
      if (!audioCache.has(url)) {
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          
          audioCache.set(url, {
            data: arrayBuffer,
            timestamp: Date.now(),
            ttl: 3600000, // 1 hour
          });
        } catch (error) {
          console.warn(`Failed to preload audio: ${url}`, error);
        }
      }
    }
  }

  private async cleanupStorage() {
    // Clean localStorage
    const localStorageKeys = Object.keys(localStorage);
    const now = Date.now();
    
    localStorageKeys.forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        if (item.timestamp && item.ttl && now - item.timestamp > item.ttl) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // Invalid JSON, consider removing old items
        if (key.startsWith('taptap-old-')) {
          localStorage.removeItem(key);
        }
      }
    });

    // Clean IndexedDB
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        
        for (const db of databases) {
          if (db.name?.includes('cache') || db.name?.includes('temp')) {
            // Clean old cache databases
            indexedDB.deleteDatabase(db.name);
          }
        }
      } catch (error) {
        console.warn('IndexedDB cleanup failed:', error);
      }
    }
  }

  // Cache management
  public setCache(type: string, key: string, data: any, ttl: number = 300000) {
    if (!this.caches.has(type)) {
      this.caches.set(type, new Map());
    }
    
    const cache = this.caches.get(type)!;
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  public getCache(type: string, key: string): any | null {
    const cache = this.caches.get(type);
    if (!cache) return null;
    
    const item = cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  public clearCache(type?: string) {
    if (type) {
      this.caches.get(type)?.clear();
    } else {
      this.caches.forEach(cache => cache.clear());
    }
  }

  // Resource pooling
  public getFromPool<T>(type: string, factory: () => T): T {
    if (!this.resourcePool.has(type)) {
      this.resourcePool.set(type, []);
    }
    
    const pool = this.resourcePool.get(type)!;
    
    if (pool.length > 0) {
      return pool.pop() as T;
    }
    
    return factory();
  }

  public returnToPool(type: string, resource: any) {
    if (!this.resourcePool.has(type)) {
      this.resourcePool.set(type, []);
    }
    
    const pool = this.resourcePool.get(type)!;
    
    // Limit pool size
    if (pool.length < 50) {
      pool.push(resource);
    }
  }

  // Rule management
  public addRule(rule: OptimizationRule) {
    this.rules.set(rule.id, rule);
  }

  public removeRule(ruleId: string) {
    this.rules.delete(ruleId);
  }

  public enableRule(ruleId: string) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  public disableRule(ruleId: string) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  public getRules(): OptimizationRule[] {
    return Array.from(this.rules.values());
  }

  public getResults(): OptimizationResult[] {
    return [...this.results];
  }

  public queueOptimization(ruleId: string) {
    if (!this.optimizationQueue.includes(ruleId)) {
      this.optimizationQueue.push(ruleId);
    }
  }

  public async runOptimizationCheck(metrics: any[]) {
    for (const rule of this.rules.values()) {
      if (rule.enabled && rule.condition(metrics)) {
        this.queueOptimization(rule.id);
      }
    }
  }

  public destroy() {
    // Clear all caches
    this.clearCache();
    
    // Disconnect observers
    this.observers.forEach(observer => {
      if ('disconnect' in observer) {
        observer.disconnect();
      }
    });
    this.observers.clear();
    
    // Clear resource pools
    this.resourcePool.clear();
    
    // Clear loading queue
    this.loadingQueue.clear();
  }
}

// Singleton instance
export const optimizationEngine = OptimizationEngine.getInstance();
