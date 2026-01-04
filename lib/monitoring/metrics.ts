import { Logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache/redis';

// Metric types
export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  error?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Metrics collector
export class MetricsCollector {
  private static metrics: Map<string, Metric[]> = new Map();
  private static readonly MAX_METRICS_PER_NAME = 1000;
  private static readonly METRICS_TTL = 3600; // 1 hour

  // Record a counter metric
  static counter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'counter',
    });
  }

  // Record a gauge metric
  static gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'gauge',
    });
  }

  // Record a histogram metric
  static histogram(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'histogram',
    });
  }

  // Record a timer metric
  static timer(name: string, startTime: number, tags?: Record<string, string>): void {
    const duration = Date.now() - startTime;
    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      tags,
      type: 'timer',
    });
  }

  // Record metric
  private static recordMetric(metric: Metric): void {
    const existing = this.metrics.get(metric.name) || [];
    
    // Keep only the most recent metrics
    if (existing.length >= this.MAX_METRICS_PER_NAME) {
      existing.shift();
    }
    
    existing.push(metric);
    this.metrics.set(metric.name, existing);

    // Log metric for debugging
    Logger.debug('Metric recorded', {
      metadata: {
        name: metric.name,
        value: metric.value,
        type: metric.type,
        tags: metric.tags,
      },
    });

    // Store in cache for persistence
    this.persistMetric(metric);
  }

  // Persist metric to cache
  private static async persistMetric(metric: Metric): Promise<void> {
    try {
      const key = `metrics:${metric.name}:${Date.now()}`;
      await CacheManager.set(key, metric, { ttl: this.METRICS_TTL });
    } catch (error) {
      Logger.error('Failed to persist metric', error as Error, { metadata: { metric: metric.name } });
    }
  }

  // Get metrics by name
  static getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  // Get all metrics
  static getAllMetrics(): Record<string, Metric[]> {
    const result: Record<string, Metric[]> = {};
    for (const [name, metrics] of this.metrics.entries()) {
      result[name] = metrics;
    }
    return result;
  }

  // Get metric summary
  static getMetricSummary(name: string): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    latest: number;
  } | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const latest = metrics[metrics.length - 1].value;

    return {
      count: metrics.length,
      sum,
      avg: sum / metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest,
    };
  }

  // Clear old metrics
  static clearOldMetrics(olderThanMs: number = 3600000): void { // 1 hour default
    const cutoff = Date.now() - olderThanMs;
    
    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      if (filtered.length !== metrics.length) {
        this.metrics.set(name, filtered);
      }
    }
  }
}

// Health check manager
export class HealthCheckManager {
  private static checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private static results: Map<string, HealthCheck> = new Map();

  // Register a health check
  static register(name: string, check: () => Promise<HealthCheck>): void {
    this.checks.set(name, check);
    Logger.info('Health check registered', { metadata: { name } });
  }

  // Run all health checks
  static async runAll(): Promise<Record<string, HealthCheck>> {
    const results: Record<string, HealthCheck> = {};
    
    for (const [name, check] of this.checks.entries()) {
      try {
        const result = await check();
        results[name] = result;
        this.results.set(name, result);
        
        // Record metrics
        MetricsCollector.gauge(`health_check.${name}.status`, result.status === 'healthy' ? 1 : 0);
        if (result.latency) {
          MetricsCollector.histogram(`health_check.${name}.latency`, result.latency);
        }
      } catch (error) {
        const errorResult: HealthCheck = {
          name,
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        };
        results[name] = errorResult;
        this.results.set(name, errorResult);
        
        Logger.error('Health check failed', error as Error, { metadata: { name } });
      }
    }
    
    return results;
  }

  // Run specific health check
  static async run(name: string): Promise<HealthCheck | null> {
    const check = this.checks.get(name);
    if (!check) return null;

    try {
      const result = await check();
      this.results.set(name, result);
      return result;
    } catch (error) {
      const errorResult: HealthCheck = {
        name,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
      this.results.set(name, errorResult);
      return errorResult;
    }
  }

  // Get overall system health
  static getOverallHealth(): {
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: Record<string, HealthCheck>;
    summary: {
      total: number;
      healthy: number;
      unhealthy: number;
      degraded: number;
    };
  } {
    const checks: Record<string, HealthCheck> = {};
    let healthy = 0;
    let unhealthy = 0;
    let degraded = 0;

    for (const [name, result] of this.results.entries()) {
      checks[name] = result;
      switch (result.status) {
        case 'healthy':
          healthy++;
          break;
        case 'unhealthy':
          unhealthy++;
          break;
        case 'degraded':
          degraded++;
          break;
      }
    }

    const total = healthy + unhealthy + degraded;
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (degraded > 0) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      checks,
      summary: {
        total,
        healthy,
        unhealthy,
        degraded,
      },
    };
  }
}

// Application Performance Monitoring
export class APM {
  private static transactions: Map<string, { startTime: number; metadata?: any }> = new Map();

  // Start a transaction
  static startTransaction(name: string, metadata?: any): string {
    const transactionId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.transactions.set(transactionId, {
      startTime: Date.now(),
      metadata,
    });
    
    MetricsCollector.counter('apm.transaction.started', 1, { name });
    return transactionId;
  }

  // End a transaction
  static endTransaction(transactionId: string, success: boolean = true, error?: Error): void {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    const duration = Date.now() - transaction.startTime;
    const name = transactionId.split('_')[0];
    
    // Record metrics
    MetricsCollector.timer(`apm.transaction.${name}.duration`, transaction.startTime);
    MetricsCollector.counter(`apm.transaction.${name}.${success ? 'success' : 'error'}`, 1);
    
    if (error) {
      Logger.error('Transaction failed', error, {
        metadata: {
          transactionId,
          name,
          duration,
          transactionMetadata: transaction.metadata,
        },
      });
    } else {
      Logger.debug('Transaction completed', {
        metadata: {
          transactionId,
          name,
          duration,
          success,
          transactionMetadata: transaction.metadata,
        },
      });
    }

    this.transactions.delete(transactionId);
  }

  // Measure function execution
  static async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const transactionId = this.startTransaction(name, metadata);
    
    try {
      const result = await fn();
      this.endTransaction(transactionId, true);
      return result;
    } catch (error) {
      this.endTransaction(transactionId, false, error as Error);
      throw error;
    }
  }

  // Get active transactions
  static getActiveTransactions(): Array<{
    id: string;
    name: string;
    duration: number;
    metadata?: any;
  }> {
    const now = Date.now();
    return Array.from(this.transactions.entries()).map(([id, transaction]) => ({
      id,
      name: id.split('_')[0],
      duration: now - transaction.startTime,
      metadata: transaction.metadata,
    }));
  }
}
