import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler, AppError, formatErrorResponse } from '../errors';
import { Logger } from '../logger';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from '@upstash/redis';

// API Error Handler Middleware
export function withErrorHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = uuidv4();
    const userId = req.headers.get('x-user-id') || undefined;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Log incoming request
      Logger.http(`${req.method} ${req.url}`, {
        requestId,
        userId,
        metadata: {
          ip,
          userAgent,
          method: req.method,
          url: req.url,
        },
      });

      const startTime = Date.now();
      const response = await handler(req, context);
      const duration = Date.now() - startTime;

      // Log response
      Logger.http(`${req.method} ${req.url} - ${response.status}`, {
        requestId,
        userId,
        metadata: {
          statusCode: response.status,
          duration,
        },
      });

      // Add request ID to response headers
      response.headers.set('x-request-id', requestId);

      return response;
    } catch (error) {
      const appError = ErrorHandler.handle(error as Error, {
        requestId,
        userId,
        method: req.method,
        url: req.url,
      });

      const errorResponse = formatErrorResponse(appError, requestId);

      return NextResponse.json(errorResponse, {
        status: appError.statusCode,
        headers: {
          'x-request-id': requestId,
        },
      });
    }
  };
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    Logger.error('Unhandled Promise Rejection', reason as Error, {
      metadata: {
        type: 'unhandledRejection',
        promise: promise.toString(),
      },
    });

    // Don't exit the process in production, but log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    Logger.error('Uncaught Exception', error, {
      metadata: {
        type: 'uncaughtException',
      },
    });

    // Exit the process for uncaught exceptions
    process.exit(1);
  });

  // Handle SIGTERM gracefully
  process.on('SIGTERM', () => {
    Logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  // Handle SIGINT gracefully
  process.on('SIGINT', () => {
    Logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

// Performance monitoring middleware
export function withPerformanceMonitoring(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  operationName: string
) {
  return withErrorHandler(async (req: NextRequest, context?: any) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(req, context);
      const duration = Date.now() - startTime;
      
      // Log performance metrics
      Logger.performance(operationName, duration, {
        metadata: {
          method: req.method,
          url: req.url,
          statusCode: response.status,
        },
      });
      
      // Add performance headers
      response.headers.set('x-response-time', `${duration}ms`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.performance(`${operationName} (failed)`, duration, {
        metadata: {
          method: req.method,
          url: req.url,
          error: (error as Error).message,
        },
      });
      throw error;
    }
  });
}

// Rate limiting with error handling
export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
) {
  const memoryRequests = new Map<string, { count: number; resetTime: number }>();
  const redis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
      : null;

  return withErrorHandler(async (req: NextRequest, context?: any) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();

    if (redis) {
      const key = `ratelimit:${ip}:${windowMs}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, windowMs);
      }
      if (count > limit) {
        Logger.security('Rate limit exceeded', {
          severity: 'medium',
          metadata: { ip, limit, current: count },
        });
        throw new AppError('Rate limit exceeded', 429, true, 'RATE_LIMIT_EXCEEDED');
      }
      const ttlMs = await redis.pttl(key);
      const resetAt = ttlMs && ttlMs > 0 ? Math.ceil((Date.now() + ttlMs) / 1000) : Math.ceil((now + windowMs) / 1000);
      const response = await handler(req, context);
      response.headers.set('x-ratelimit-limit', limit.toString());
      response.headers.set('x-ratelimit-remaining', Math.max(0, limit - count).toString());
      response.headers.set('x-ratelimit-reset', resetAt.toString());
      return response;
    }

    // Fallback to in-memory limiter
    const windowStart = now - windowMs;
    for (const [key, value] of memoryRequests.entries()) {
      if (value.resetTime < windowStart) {
        memoryRequests.delete(key);
      }
    }

    const current = memoryRequests.get(ip) || { count: 0, resetTime: now + windowMs };
    if (current.count >= limit && current.resetTime > now) {
      Logger.security('Rate limit exceeded', {
        severity: 'medium',
        metadata: { ip, limit, current: current.count },
      });
      throw new AppError('Rate limit exceeded', 429, true, 'RATE_LIMIT_EXCEEDED');
    }

    memoryRequests.set(ip, { count: current.count + 1, resetTime: current.resetTime });
    const response = await handler(req, context);
    response.headers.set('x-ratelimit-limit', limit.toString());
    response.headers.set('x-ratelimit-remaining', Math.max(0, limit - current.count - 1).toString());
    response.headers.set('x-ratelimit-reset', Math.ceil(current.resetTime / 1000).toString());
    return response;
  });
}
