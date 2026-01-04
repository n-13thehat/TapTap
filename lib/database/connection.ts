import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '@/lib/logger';

// Database connection configuration
const DATABASE_CONFIG = {
  // Connection pool settings
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
  
  // Query timeout settings
  queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '10000'), // 10 seconds
  
  // Connection timeout settings
  connectTimeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '5000'), // 5 seconds
  
  // Retry settings
  maxRetries: parseInt(process.env.DATABASE_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '1000'), // 1 second
};

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with optimized configuration
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Log slow queries
  client.$on('query', (e) => {
    if (e.duration > 1000) { // Log queries taking more than 1 second
      Logger.warn('Slow database query detected', {
        metadata: {
          query: e.query,
          params: e.params,
          duration: e.duration,
          target: e.target,
        },
      });
    } else {
      Logger.debug('Database query executed', {
        metadata: {
          duration: e.duration,
          target: e.target,
        },
      });
    }
  });

  // Log database errors
  client.$on('error', (e) => {
    Logger.error('Database error', new Error(e.message), {
      metadata: {
        target: e.target,
      },
    });
  });

  // Log database info
  client.$on('info', (e) => {
    Logger.info('Database info', {
      metadata: {
        message: e.message,
        target: e.target,
      },
    });
  });

  // Log database warnings
  client.$on('warn', (e) => {
    Logger.warn('Database warning', {
      metadata: {
        message: e.message,
        target: e.target,
      },
    });
  });

  return client;
}

// Get or create Prisma client instance
export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    
    Logger.debug('Database health check passed', { metadata: { latency } });
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    Logger.error('Database health check failed', error as Error, { metadata: { latency } });
    
    return {
      status: 'unhealthy',
      latency,
      error: errorMessage,
    };
  }
}

// Database connection pool monitoring
export async function getDatabaseStats(): Promise<{
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
}> {
  try {
    // This would require custom metrics collection
    // For now, return placeholder values
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
    };
  } catch (error) {
    Logger.error('Failed to get database stats', error as Error);
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
    };
  }
}

// Optimized query helpers
export class DatabaseOptimizer {
  // Batch queries to reduce database round trips
  static async batchQueries<T>(
    queries: Array<() => Promise<T>>
  ): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      const results = await Promise.all(queries.map(query => query()));
      const duration = Date.now() - startTime;
      
      Logger.performance('Batch queries executed', duration, {
        metadata: { queryCount: queries.length },
      });
      
      return results;
    } catch (error) {
      Logger.error('Batch query execution failed', error as Error, {
        metadata: { queryCount: queries.length },
      });
      throw error;
    }
  }

  // Execute queries in transaction for consistency
  static async transaction<T>(
    operations: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await prisma.$transaction(operations, {
        timeout: DATABASE_CONFIG.queryTimeout,
        maxWait: DATABASE_CONFIG.connectTimeout,
      });
      
      const duration = Date.now() - startTime;
      Logger.performance('Database transaction completed', duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Database transaction failed', error as Error, { metadata: { duration } });
      throw error;
    }
  }

  // Paginated queries with cursor-based pagination for better performance
  static async paginatedQuery<T>(
    query: (cursor?: string, limit?: number) => Promise<T[]>,
    limit: number = 20,
    cursor?: string
  ): Promise<{ data: T[]; nextCursor?: string; hasMore: boolean }> {
    const startTime = Date.now();
    
    try {
      // Fetch one extra item to check if there are more results
      const data = await query(cursor, limit + 1);
      const hasMore = data.length > limit;
      
      // Remove the extra item if present
      if (hasMore) {
        data.pop();
      }
      
      // Get the cursor for the next page (assuming items have an 'id' field)
      const nextCursor = hasMore && data.length > 0 
        ? (data[data.length - 1] as any).id 
        : undefined;
      
      const duration = Date.now() - startTime;
      Logger.performance('Paginated query executed', duration, {
        metadata: {
          limit,
          resultCount: data.length,
          hasMore,
        },
      });
      
      return {
        data,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      Logger.error('Paginated query failed', error as Error, { metadata: { limit, cursor } });
      throw error;
    }
  }

  // Bulk operations for better performance
  static async bulkCreate<T>(
    model: any,
    data: T[],
    batchSize: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Process in batches to avoid overwhelming the database
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await model.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
      
      const duration = Date.now() - startTime;
      Logger.performance('Bulk create completed', duration, {
        metadata: {
          totalRecords: data.length,
          batchSize,
          batches: Math.ceil(data.length / batchSize),
        },
      });
    } catch (error) {
      Logger.error('Bulk create failed', error as Error, {
        metadata: {
          totalRecords: data.length,
          batchSize,
        },
      });
      throw error;
    }
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await prisma.$disconnect();
    Logger.info('Database connection closed gracefully');
  } catch (error) {
    Logger.error('Error closing database connection', error as Error);
  }
}

// Setup graceful shutdown handlers
if (typeof process !== 'undefined') {
  process.on('SIGINT', closeDatabaseConnection);
  process.on('SIGTERM', closeDatabaseConnection);
  process.on('beforeExit', closeDatabaseConnection);
}
