import { NextResponse } from 'next/server';
import { HealthCheckManager, MetricsCollector } from '@/lib/monitoring/metrics';
import { checkDatabaseHealth } from '@/lib/database/connection';
import { CacheManager } from '@/lib/cache/redis';
import { Logger } from '@/lib/logger';

// Register health checks
HealthCheckManager.register('database', async () => {
  const result = await checkDatabaseHealth();

  return {
    name: 'database',
    status: result.status,
    latency: result.latency,
    error: result.error,
    timestamp: Date.now(),
    metadata: {
      connectionStatus: result.status,
    },
  };
});

HealthCheckManager.register('cache', async () => {
  const startTime = Date.now();

  try {
    // Test cache read/write
    const testKey = 'health-check-test';
    const testValue = { timestamp: Date.now() };

    await CacheManager.set(testKey, testValue, { ttl: 60 });
    const retrieved = await CacheManager.get(testKey);
    await CacheManager.del(testKey);

    const latency = Date.now() - startTime;

    if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
      return {
        name: 'cache',
        status: 'healthy' as const,
        latency,
        timestamp: Date.now(),
        metadata: {
          cacheType: process.env.UPSTASH_REDIS_REST_URL ? 'redis' : 'memory',
        },
      };
    } else {
      return {
        name: 'cache',
        status: 'unhealthy' as const,
        latency,
        error: 'Cache read/write test failed',
        timestamp: Date.now(),
      };
    }
  } catch (error) {
    return {
      name: 'cache',
      status: 'unhealthy' as const,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown cache error',
      timestamp: Date.now(),
    };
  }
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';
  const check = searchParams.get('check');

  try {
    let healthData;

    if (check) {
      // Run specific health check
      const result = await HealthCheckManager.run(check);
      if (!result) {
        return NextResponse.json(
          { error: `Health check '${check}' not found` },
          { status: 404 }
        );
      }
      healthData = { [check]: result };
    } else {
      // Run all health checks
      const results = await HealthCheckManager.runAll();
      const overall = HealthCheckManager.getOverallHealth();

      healthData = {
        status: overall.status,
        timestamp: Date.now(),
        checks: results,
        summary: overall.summary,
      };
    }

    // Record health check metrics
    MetricsCollector.counter('health_check.requests', 1, {
      status: typeof healthData.status === 'string' ? healthData.status : 'unknown',
      detailed: detailed.toString(),
    });

    return NextResponse.json(healthData, {
      status: healthData.status === 'unhealthy' ? 503 : 200
    });

  } catch (error) {
    Logger.error('Health check endpoint error', error as Error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

