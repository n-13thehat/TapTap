/**
 * Performance Middleware for API Routes and Server-Side Operations
 * Comprehensive performance tracking for backend operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from './PerformanceMonitor';

export interface PerformanceConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableProfiling: boolean;
  slowRequestThreshold: number; // ms
  memoryThreshold: number; // MB
  cpuThreshold: number; // percentage
  enableCaching: boolean;
  cacheStrategy: 'memory' | 'redis' | 'database';
  enableCompression: boolean;
  enableRateLimiting: boolean;
}

export interface RequestMetrics {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  startTime: number;
  endTime: number;
  duration: number;
  statusCode: number;
  responseSize: number;
  memoryUsage: {
    before: number;
    after: number;
    peak: number;
  };
  cpuUsage: number;
  dbQueries?: QueryMetric[];
  cacheHits: number;
  cacheMisses: number;
  errors?: ErrorMetric[];
}

export interface QueryMetric {
  query: string;
  duration: number;
  rows: number;
  cached: boolean;
}

export interface ErrorMetric {
  type: string;
  message: string;
  stack?: string;
  timestamp: number;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

export class PerformanceMiddleware {
  private static instance: PerformanceMiddleware;
  private config: PerformanceConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private activeRequests: Map<string, RequestMetrics> = new Map();
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  private constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMetrics: true,
      enableTracing: true,
      enableProfiling: false,
      slowRequestThreshold: 1000,
      memoryThreshold: 100,
      cpuThreshold: 80,
      enableCaching: true,
      cacheStrategy: 'memory',
      enableCompression: true,
      enableRateLimiting: true,
      ...config,
    };
  }

  public static getInstance(config?: Partial<PerformanceConfig>): PerformanceMiddleware {
    if (!PerformanceMiddleware.instance) {
      PerformanceMiddleware.instance = new PerformanceMiddleware(config);
    }
    return PerformanceMiddleware.instance;
  }

  public middleware() {
    return async (request: NextRequest): Promise<NextResponse> => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();
      
      // Initialize request metrics
      const metrics: RequestMetrics = {
        requestId,
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: this.getClientIP(request),
        startTime,
        endTime: 0,
        duration: 0,
        statusCode: 0,
        responseSize: 0,
        memoryUsage: {
          before: this.getMemoryUsage(),
          after: 0,
          peak: 0,
        },
        cpuUsage: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      this.activeRequests.set(requestId, metrics);

      try {
        // Rate limiting check
        if (this.config.enableRateLimiting && !this.checkRateLimit(metrics.ip || 'unknown')) {
          return new NextResponse('Rate limit exceeded', { status: 429 });
        }

        // Check cache first
        let response: NextResponse | null = null;
        if (this.config.enableCaching && request.method === 'GET') {
          response = this.getCachedResponse(request.url);
          if (response) {
            metrics.cacheHits++;
          } else {
            metrics.cacheMisses++;
          }
        }

        // If no cached response, continue with request processing
        if (!response) {
          // This would be where the actual request handler runs
          // For middleware, we'll simulate processing
          response = await this.processRequest(request, metrics);
        }

        // Record final metrics
        const endTime = Date.now();
        metrics.endTime = endTime;
        metrics.duration = endTime - startTime;
        metrics.statusCode = response.status;
        metrics.responseSize = this.estimateResponseSize(response);
        metrics.memoryUsage.after = this.getMemoryUsage();
        metrics.cpuUsage = this.getCPUUsage();

        // Cache successful GET responses
        if (this.config.enableCaching && 
            request.method === 'GET' && 
            response.status === 200 && 
            !this.getCachedResponse(request.url)) {
          this.setCachedResponse(request.url, response.clone());
        }

        // Record performance metrics
        this.recordMetrics(metrics);

        // Add performance headers
        response.headers.set('X-Request-ID', requestId);
        response.headers.set('X-Response-Time', `${metrics.duration}ms`);
        response.headers.set('X-Memory-Usage', `${metrics.memoryUsage.after}MB`);

        return response;

      } catch (error) {
        const endTime = Date.now();
        metrics.endTime = endTime;
        metrics.duration = endTime - startTime;
        metrics.statusCode = 500;
        metrics.errors = [{
          type: 'UnhandledError',
          message: (error as Error).message,
          stack: (error as Error).stack,
          timestamp: endTime,
        }];

        this.recordMetrics(metrics);
        
        return new NextResponse('Internal Server Error', { status: 500 });
      } finally {
        this.activeRequests.delete(requestId);
      }
    };
  }

  private async processRequest(request: NextRequest, metrics: RequestMetrics): Promise<NextResponse> {
    // Simulate request processing with performance monitoring
    const startCPU = process.cpuUsage?.() || { user: 0, system: 0 };
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    const endCPU = process.cpuUsage?.(startCPU) || { user: 0, system: 0 };
    metrics.cpuUsage = (endCPU.user + endCPU.system) / 1000; // Convert to ms
    
    // Track memory peak
    const currentMemory = this.getMemoryUsage();
    if (currentMemory > metrics.memoryUsage.peak) {
      metrics.memoryUsage.peak = currentMemory;
    }

    return new NextResponse(JSON.stringify({ 
      message: 'Success',
      requestId: metrics.requestId,
      timestamp: Date.now(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private recordMetrics(metrics: RequestMetrics) {
    if (!this.config.enableMetrics) return;

    // Record request duration
    performanceMonitor.recordMetric({
      name: 'api_request_duration',
      value: metrics.duration,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'network',
      severity: metrics.duration > this.config.slowRequestThreshold ? 'warning' : 'info',
      metadata: {
        method: metrics.method,
        url: metrics.url,
        statusCode: metrics.statusCode,
        requestId: metrics.requestId,
      },
    });

    // Record memory usage
    performanceMonitor.recordMetric({
      name: 'api_memory_usage',
      value: metrics.memoryUsage.after,
      unit: 'bytes',
      timestamp: Date.now(),
      category: 'memory',
      severity: metrics.memoryUsage.after > this.config.memoryThreshold * 1024 * 1024 ? 'warning' : 'info',
      metadata: {
        before: metrics.memoryUsage.before,
        after: metrics.memoryUsage.after,
        peak: metrics.memoryUsage.peak,
        requestId: metrics.requestId,
      },
    });

    // Record CPU usage
    if (metrics.cpuUsage > 0) {
      performanceMonitor.recordMetric({
        name: 'api_cpu_usage',
        value: metrics.cpuUsage,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'system',
        severity: 'info',
        metadata: {
          requestId: metrics.requestId,
          method: metrics.method,
        },
      });
    }

    // Record cache metrics
    if (this.config.enableCaching) {
      performanceMonitor.recordMetric({
        name: 'api_cache_hit_rate',
        value: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100,
        unit: 'percentage',
        timestamp: Date.now(),
        category: 'system',
        severity: 'info',
        metadata: {
          hits: metrics.cacheHits,
          misses: metrics.cacheMisses,
          requestId: metrics.requestId,
        },
      });
    }

    // Record errors
    if (metrics.errors && metrics.errors.length > 0) {
      metrics.errors.forEach(error => {
        performanceMonitor.recordMetric({
          name: 'api_error',
          value: 1,
          unit: 'count',
          timestamp: Date.now(),
          category: 'system',
          severity: 'critical',
          metadata: {
            errorType: error.type,
            errorMessage: error.message,
            requestId: metrics.requestId,
            method: metrics.method,
            url: metrics.url,
          },
        });
      });
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           'unknown';
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  private getCPUUsage(): number {
    // Simplified CPU usage calculation
    // In a real implementation, this would use more sophisticated monitoring
    return Math.random() * 100; // Placeholder
  }

  private estimateResponseSize(response: NextResponse): number {
    // Estimate response size based on headers
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    
    // Fallback estimation
    return 1024; // 1KB default estimate
  }

  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 100; // Max requests per window

    const current = this.rateLimitMap.get(identifier);
    
    if (!current || now > current.resetTime) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (current.count >= maxRequests) {
      return false;
    }

    current.count++;
    return true;
  }

  private getCachedResponse(url: string): NextResponse | null {
    if (!this.config.enableCaching) return null;

    const entry = this.cache.get(url);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(url);
      return null;
    }

    entry.hits++;
    return new NextResponse(JSON.stringify(entry.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
      },
    });
  }

  private setCachedResponse(url: string, response: NextResponse): void {
    if (!this.config.enableCaching) return;

    const ttl = 300000; // 5 minutes default TTL
    
    // Clone response data
    response.json().then(data => {
      const entry: CacheEntry = {
        key: url,
        data,
        timestamp: Date.now(),
        ttl,
        hits: 0,
        size: JSON.stringify(data).length,
      };

      this.cache.set(url, entry);

      // Cleanup old entries if cache is too large
      if (this.cache.size > 1000) {
        this.cleanupCache();
      }
    }).catch(() => {
      // Ignore cache errors
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Sort by last access time and remove oldest entries
    entries
      .sort((a, b) => (a[1].timestamp + a[1].hits * 1000) - (b[1].timestamp + b[1].hits * 1000))
      .slice(0, Math.floor(entries.length * 0.3)) // Remove 30% of entries
      .forEach(([key]) => this.cache.delete(key));
  }

  public getMetrics(): {
    activeRequests: number;
    cacheSize: number;
    cacheHitRate: number;
    averageResponseTime: number;
  } {
    const cacheEntries = Array.from(this.cache.values());
    const totalHits = cacheEntries.reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = cacheEntries.length + totalHits;
    const cacheHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    // Calculate average response time from recent requests
    const recentMetrics = Array.from(this.activeRequests.values());
    const averageResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, metric) => sum + metric.duration, 0) / recentMetrics.length
      : 0;

    return {
      activeRequests: this.activeRequests.size,
      cacheSize: this.cache.size,
      cacheHitRate,
      averageResponseTime,
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }
}

// Database Query Performance Tracker
export class QueryPerformanceTracker {
  private static instance: QueryPerformanceTracker;
  private queryMetrics: Map<string, QueryMetric[]> = new Map();

  private constructor() {}

  public static getInstance(): QueryPerformanceTracker {
    if (!QueryPerformanceTracker.instance) {
      QueryPerformanceTracker.instance = new QueryPerformanceTracker();
    }
    return QueryPerformanceTracker.instance;
  }

  public trackQuery(query: string, duration: number, rows: number, cached: boolean = false): void {
    const metric: QueryMetric = {
      query: this.sanitizeQuery(query),
      duration,
      rows,
      cached,
    };

    const queryHash = this.hashQuery(query);
    const existing = this.queryMetrics.get(queryHash) || [];
    existing.push(metric);
    
    // Keep only last 100 executions per query
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    this.queryMetrics.set(queryHash, existing);

    // Record performance metric
    performanceMonitor.recordMetric({
      name: 'database_query',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'system',
      severity: duration > 1000 ? 'warning' : 'info',
      metadata: {
        queryHash,
        rows,
        cached,
        slowQuery: duration > 1000,
      },
    });
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data and normalize query
    return query
      .replace(/\b\d+\b/g, '?') // Replace numbers with placeholders
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private hashQuery(query: string): string {
    const sanitized = this.sanitizeQuery(query);
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  public getSlowQueries(threshold: number = 1000): QueryMetric[] {
    const slowQueries: QueryMetric[] = [];
    
    this.queryMetrics.forEach(metrics => {
      const slow = metrics.filter(metric => metric.duration > threshold);
      slowQueries.push(...slow);
    });

    return slowQueries.sort((a, b) => b.duration - a.duration);
  }

  public getQueryStats(): { [queryHash: string]: { count: number; avgDuration: number; maxDuration: number } } {
    const stats: { [queryHash: string]: { count: number; avgDuration: number; maxDuration: number } } = {};

    this.queryMetrics.forEach((metrics, queryHash) => {
      const durations = metrics.map(m => m.duration);
      stats[queryHash] = {
        count: metrics.length,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        maxDuration: Math.max(...durations),
      };
    });

    return stats;
  }
}

// Export singleton instances
export const performanceMiddleware = PerformanceMiddleware.getInstance();
export const queryTracker = QueryPerformanceTracker.getInstance();
