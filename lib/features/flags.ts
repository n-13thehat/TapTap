import { Logger } from '@/lib/logger';
import React from 'react';
import { CacheManager, CacheKeys } from '@/lib/cache/redis';

// Feature flag types
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: FeatureFlagCondition[];
  metadata?: Record<string, any>;
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'user_role' | 'user_email' | 'random' | 'date_range';
  operator: 'equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  timestamp?: number;
}

// Default feature flags
const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: 'beta_features',
    name: 'Beta Features',
    description: 'Enable beta features for testing',
    enabled: process.env.NODE_ENV === 'development',
  },
  {
    key: 'ai_recommendations',
    name: 'AI Recommendations',
    description: 'Enable AI-powered music recommendations',
    enabled: true,
    rolloutPercentage: 50,
  },
  {
    key: 'live_streaming',
    name: 'Live Streaming',
    description: 'Enable live streaming features',
    enabled: false,
    conditions: [
      {
        type: 'user_role',
        operator: 'in',
        value: ['CREATOR', 'ADMIN'],
      },
    ],
  },
  {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Enable advanced analytics dashboard',
    enabled: true,
    conditions: [
      {
        type: 'user_role',
        operator: 'equals',
        value: 'ADMIN',
      },
    ],
  },
  {
    key: 'social_features',
    name: 'Social Features',
    description: 'Enable social features like following and feeds',
    enabled: true,
  },
  {
    key: 'marketplace',
    name: 'Marketplace',
    description: 'Enable marketplace for buying/selling music',
    enabled: true,
    rolloutPercentage: 75,
  },
  {
    key: 'deezerMarket',
    name: 'Deezer Marketplace Seeding',
    description: 'Enable Deezer-sourced listings, pricing, and escrow flow for unclaimed artists',
    enabled: true,
  },
  {
    key: 'battles',
    name: 'Music Battles',
    description: 'Enable music battle competitions',
    enabled: true,
  },
  {
    key: 'wallet_integration',
    name: 'Wallet Integration',
    description: 'Enable cryptocurrency wallet features',
    enabled: false,
    rolloutPercentage: 25,
  },
  {
    key: 'enhanced_search',
    name: 'Enhanced Search',
    description: 'Enable enhanced search with filters and AI',
    enabled: true,
    rolloutPercentage: 80,
  },
  {
    key: 'mobile_app',
    name: 'Mobile App Features',
    description: 'Enable mobile-specific features',
    enabled: false,
  },
];

// Feature flag manager
export class FeatureFlagManager {
  private static flags: Map<string, FeatureFlag> = new Map();
  private static initialized = false;

  // Initialize feature flags
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load flags from cache first
      const cachedFlags = await CacheManager.get<FeatureFlag[]>(CacheKeys.featureFlags());
      
      if (cachedFlags) {
        cachedFlags.forEach(flag => this.flags.set(flag.key, flag));
        Logger.info('Feature flags loaded from cache', { metadata: { count: cachedFlags.length } });
      } else {
        // Load default flags
        DEFAULT_FLAGS.forEach(flag => this.flags.set(flag.key, flag));
        
        // Cache the flags
        await CacheManager.set(CacheKeys.featureFlags(), DEFAULT_FLAGS, { ttl: 300 });
        Logger.info('Default feature flags loaded', { metadata: { count: DEFAULT_FLAGS.length } });
      }

      this.initialized = true;
    } catch (error) {
      Logger.error('Failed to initialize feature flags', error as Error);
      // Fallback to default flags
      DEFAULT_FLAGS.forEach(flag => this.flags.set(flag.key, flag));
      this.initialized = true;
    }
  }

  // Check if a feature is enabled
  static async isEnabled(
    flagKey: string, 
    context: FeatureFlagContext = {}
  ): Promise<boolean> {
    await this.initialize();

    const flag = this.flags.get(flagKey);
    if (!flag) {
      Logger.warn('Feature flag not found', { metadata: { flagKey } });
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      const hash = this.hashString(context.userId || 'anonymous');
      const percentage = (hash % 100) + 1;
      if (percentage > flag.rolloutPercentage) {
        return false;
      }
    }

    // Check conditions
    if (flag.conditions && flag.conditions.length > 0) {
      return this.evaluateConditions(flag.conditions, context);
    }

    return true;
  }

  // Get feature flag details
  static async getFlag(flagKey: string): Promise<FeatureFlag | null> {
    await this.initialize();
    return this.flags.get(flagKey) || null;
  }

  // Get all feature flags
  static async getAllFlags(): Promise<FeatureFlag[]> {
    await this.initialize();
    return Array.from(this.flags.values());
  }

  // Update feature flag
  static async updateFlag(flagKey: string, updates: Partial<FeatureFlag>): Promise<void> {
    await this.initialize();

    const existingFlag = this.flags.get(flagKey);
    if (!existingFlag) {
      throw new Error(`Feature flag '${flagKey}' not found`);
    }

    const updatedFlag = { ...existingFlag, ...updates };
    this.flags.set(flagKey, updatedFlag);

    // Update cache
    const allFlags = Array.from(this.flags.values());
    await CacheManager.set(CacheKeys.featureFlags(), allFlags, { ttl: 300 });

    Logger.info('Feature flag updated', { metadata: { flagKey, updates } });
  }

  // Create new feature flag
  static async createFlag(flag: FeatureFlag): Promise<void> {
    await this.initialize();

    if (this.flags.has(flag.key)) {
      throw new Error(`Feature flag '${flag.key}' already exists`);
    }

    this.flags.set(flag.key, flag);

    // Update cache
    const allFlags = Array.from(this.flags.values());
    await CacheManager.set(CacheKeys.featureFlags(), allFlags, { ttl: 300 });

    Logger.info('Feature flag created', { metadata: { flagKey: flag.key } });
  }

  // Delete feature flag
  static async deleteFlag(flagKey: string): Promise<void> {
    await this.initialize();

    if (!this.flags.has(flagKey)) {
      throw new Error(`Feature flag '${flagKey}' not found`);
    }

    this.flags.delete(flagKey);

    // Update cache
    const allFlags = Array.from(this.flags.values());
    await CacheManager.set(CacheKeys.featureFlags(), allFlags, { ttl: 300 });

    Logger.info('Feature flag deleted', { metadata: { flagKey } });
  }

  // Evaluate conditions
  private static evaluateConditions(
    conditions: FeatureFlagCondition[],
    context: FeatureFlagContext
  ): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, context));
  }

  // Evaluate single condition
  private static evaluateCondition(
    condition: FeatureFlagCondition,
    context: FeatureFlagContext
  ): boolean {
    let contextValue: any;

    switch (condition.type) {
      case 'user_id':
        contextValue = context.userId;
        break;
      case 'user_role':
        contextValue = context.userRole;
        break;
      case 'user_email':
        contextValue = context.userEmail;
        break;
      case 'random':
        contextValue = Math.random() * 100;
        break;
      case 'date_range':
        contextValue = context.timestamp || Date.now();
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'contains':
        return typeof contextValue === 'string' && contextValue.includes(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      case 'greater_than':
        return contextValue > condition.value;
      case 'less_than':
        return contextValue < condition.value;
      default:
        return false;
    }
  }

  // Hash string for consistent rollout
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Convenience functions
export const isFeatureEnabled = FeatureFlagManager.isEnabled.bind(FeatureFlagManager);
export const getFeatureFlag = FeatureFlagManager.getFlag.bind(FeatureFlagManager);
export const getAllFeatureFlags = FeatureFlagManager.getAllFlags.bind(FeatureFlagManager);

// React hook for feature flags (to be used in components)
export function useFeatureFlag(flagKey: string, context: FeatureFlagContext = {}) {
  const [enabled, setEnabled] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    FeatureFlagManager.isEnabled(flagKey, context)
      .then(setEnabled)
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, [flagKey, context]);

  return { enabled, loading };
}
