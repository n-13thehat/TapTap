// import { Redis } from '@upstash/redis';
import { Logger } from '@/lib/logger';

// Redis client configuration - temporarily disabled due to dependency issues
// TODO: Re-enable Redis when yallist dependency conflict is resolved
const redis = null;

// In-memory cache fallback
const memoryCache = new Map<string, { value: any; expiry: number }>();

// Cache interface
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export class CacheManager {
  private static readonly DEFAULT_TTL = 300; // 5 minutes
  private static readonly MAX_MEMORY_CACHE_SIZE = 1000;

  // Get value from cache
  static async get<T>(key: string): Promise<T | null> {
    try {
      if (redis) {
        const value = await redis.get(key);
        if (value !== null) {
          Logger.debug('Cache hit (Redis)', { metadata: { key } });
          return value as T;
        }
      } else {
        // Fallback to memory cache
        const cached = memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          Logger.debug('Cache hit (Memory)', { metadata: { key } });
          return cached.value as T;
        } else if (cached) {
          memoryCache.delete(key);
        }
      }

      Logger.debug('Cache miss', { metadata: { key } });
      return null;
    } catch (error) {
      Logger.error('Cache get error', error as Error, { metadata: { key } });
      return null;
    }
  }

  // Set value in cache
  static async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.DEFAULT_TTL;
    
    try {
      if (redis) {
        await redis.setex(key, ttl, JSON.stringify(value));
        
        // Store tags for invalidation
        if (options.tags) {
          for (const tag of options.tags) {
            await redis.sadd(`tag:${tag}`, key);
            await redis.expire(`tag:${tag}`, ttl);
          }
        }
        
        Logger.debug('Cache set (Redis)', { metadata: { key, ttl, tags: options.tags } });
      } else {
        // Fallback to memory cache
        if (memoryCache.size >= this.MAX_MEMORY_CACHE_SIZE) {
          // Remove oldest entries
          const oldestKey = memoryCache.keys().next().value;
          if (oldestKey !== undefined) {
            memoryCache.delete(oldestKey);
          }
        }
        
        memoryCache.set(key, {
          value,
          expiry: Date.now() + (ttl * 1000),
        });
        
        Logger.debug('Cache set (Memory)', { metadata: { key, ttl } });
      }
    } catch (error) {
      Logger.error('Cache set error', error as Error, { metadata: { key, ttl } });
    }
  }

  // Delete value from cache
  static async del(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
        Logger.debug('Cache delete (Redis)', { metadata: { key } });
      } else {
        memoryCache.delete(key);
        Logger.debug('Cache delete (Memory)', { metadata: { key } });
      }
    } catch (error) {
      Logger.error('Cache delete error', error as Error, { metadata: { key } });
    }
  }

  // Invalidate cache by tags
  static async invalidateByTag(tag: string): Promise<void> {
    try {
      if (redis) {
        const keys = await redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await redis.del(...keys);
          await redis.del(`tag:${tag}`);
          Logger.debug('Cache invalidated by tag (Redis)', { metadata: { tag, keysCount: keys.length } });
        }
      } else {
        // For memory cache, we'd need to store tags separately
        Logger.debug('Cache invalidation by tag not supported in memory cache', { metadata: { tag } });
      }
    } catch (error) {
      Logger.error('Cache invalidation error', error as Error, { metadata: { tag } });
    }
  }

  // Cache with automatic refresh
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await fetcher();
    await this.set(key, value, options);
    
    return value;
  }

  // Batch operations
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (redis) {
        const values = await redis.mget(...keys);
        Logger.debug('Cache batch get (Redis)', { metadata: { keysCount: keys.length } });
        return values as (T | null)[];
      } else {
        const values = keys.map(key => {
          const cached = memoryCache.get(key);
          if (cached && cached.expiry > Date.now()) {
            return cached.value as T;
          }
          return null;
        });
        Logger.debug('Cache batch get (Memory)', { metadata: { keysCount: keys.length } });
        return values;
      }
    } catch (error) {
      Logger.error('Cache batch get error', error as Error, { metadata: { keysCount: keys.length } });
      return keys.map(() => null);
    }
  }

  static async mset(entries: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    try {
      if (redis) {
        const pipeline = redis.pipeline();
        
        for (const entry of entries) {
          const ttl = entry.options?.ttl || this.DEFAULT_TTL;
          pipeline.setex(entry.key, ttl, JSON.stringify(entry.value));
        }
        
        await pipeline.exec();
        Logger.debug('Cache batch set (Redis)', { metadata: { entriesCount: entries.length } });
      } else {
        for (const entry of entries) {
          const ttl = entry.options?.ttl || this.DEFAULT_TTL;
          memoryCache.set(entry.key, {
            value: entry.value,
            expiry: Date.now() + (ttl * 1000),
          });
        }
        Logger.debug('Cache batch set (Memory)', { metadata: { entriesCount: entries.length } });
      }
    } catch (error) {
      Logger.error('Cache batch set error', error as Error, { metadata: { entriesCount: entries.length } });
    }
  }

  // Cache statistics
  static async getStats(): Promise<{ hits: number; misses: number; size: number }> {
    try {
      if (redis) {
        // Upstash Redis client does not expose detailed stats; return placeholder values
        return { hits: 0, misses: 0, size: 0 };
      } else {
        return {
          hits: 0, // Would need to track these
          misses: 0,
          size: memoryCache.size,
        };
      }
    } catch (error) {
      Logger.error('Cache stats error', error as Error);
      return { hits: 0, misses: 0, size: 0 };
    }
  }

  // Clear all cache
  static async clear(): Promise<void> {
    try {
      if (redis) {
        await redis.flushall();
        Logger.info('Cache cleared (Redis)');
      } else {
        memoryCache.clear();
        Logger.info('Cache cleared (Memory)');
      }
    } catch (error) {
      Logger.error('Cache clear error', error as Error);
    }
  }
}

// Cache key generators
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  track: (id: string) => `track:${id}`,
  album: (id: string) => `album:${id}`,
  playlist: (id: string) => `playlist:${id}`,
  userTracks: (userId: string) => `user:${userId}:tracks`,
  userPlaylists: (userId: string) => `user:${userId}:playlists`,
  searchResults: (query: string, type: string) => `search:${type}:${query}`,
  trending: (type: string, period: string) => `trending:${type}:${period}`,
  feed: (userId: string, page: number) => `feed:${userId}:${page}`,
  battleLeaderboard: (period: string) => `battles:leaderboard:${period}`,
  featureFlags: () => 'feature-flags:all',
};

// Cache tags for invalidation
export const CacheTags = {
  user: (id: string) => `user:${id}`,
  track: (id: string) => `track:${id}`,
  album: (id: string) => `album:${id}`,
  playlist: (id: string) => `playlist:${id}`,
  userContent: (userId: string) => `user-content:${userId}`,
  search: 'search',
  trending: 'trending',
  battles: 'battles',
};
