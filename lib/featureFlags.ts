/**
 * Feature Flags System for TapTap
 * Provides dynamic feature control, A/B testing, and safe rollouts
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
  userGroups?: string[];
  environment?: 'development' | 'staging' | 'production' | 'all';
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  version: string;
  lastUpdated: string;
  environment: string;
  error?: string;
}

// Bootstrap defaults for all feature flags
export const BOOTSTRAP_FLAGS: Record<string, FeatureFlag> = {
  // Core App Features
  surfPaywall: {
    key: 'surfPaywall',
    enabled: false,
    description: 'Enable TapPass paywall for Surf app premium content',
    rolloutPercentage: 0,
    environment: 'all'
  },
  
  tapGame: {
    key: 'tapGame',
    enabled: true,
    description: 'Enable TapGame integration and playable games',
    rolloutPercentage: 100,
    environment: 'all'
  },
  
  battles: {
    key: 'battles',
    enabled: true,
    description: 'Enable Battles app and voting functionality',
    rolloutPercentage: 100,
    environment: 'all'
  },
  
  offRamp: {
    key: 'offRamp',
    enabled: false,
    description: 'Enable crypto off-ramp functionality in wallet',
    rolloutPercentage: 0,
    environment: 'all'
  },
  
  deluxeMint: {
    key: 'deluxeMint',
    enabled: false,
    description: 'Enable deluxe NFT minting after sellout',
    rolloutPercentage: 0,
    environment: 'all'
  },
  
  // Advanced Features
  astroVibes: {
    key: 'astroVibes',
    enabled: false,
    description: 'Enable AstroVibes astrology system',
    rolloutPercentage: 10,
    environment: 'all'
  },
  
  liveStreaming: {
    key: 'liveStreaming',
    enabled: true,
    description: 'Enable live streaming functionality',
    rolloutPercentage: 100,
    environment: 'all'
  },
  
  aiRecommendations: {
    key: 'aiRecommendations',
    enabled: true,
    description: 'Enable AI-powered music recommendations',
    rolloutPercentage: 50,
    environment: 'all'
  },
  
  // Beta Features
  betaUnlock: {
    key: 'betaUnlock',
    enabled: false,
    description: 'Bypass beta restrictions for testing',
    rolloutPercentage: 0,
    environment: 'development',
    userGroups: ['beta_testers', 'developers']
  },
  
  creatorMode: {
    key: 'creatorMode',
    enabled: true,
    description: 'Enable creator mode and tools',
    rolloutPercentage: 100,
    environment: 'all'
  },
  
  // Experimental Features
  voiceCommands: {
    key: 'voiceCommands',
    enabled: false,
    description: 'Enable voice command controls',
    rolloutPercentage: 0,
    environment: 'development'
  },
  
  socialFeeds: {
    key: 'socialFeeds',
    enabled: true,
    description: 'Enable social feeds and interactions',
    rolloutPercentage: 100,
    environment: 'all'
  },
  
  // Performance Features
  offlineMode: {
    key: 'offlineMode',
    enabled: false,
    description: 'Enable offline playback and caching',
    rolloutPercentage: 0,
    environment: 'all'
  },
  
  preloadTracks: {
    key: 'preloadTracks',
    enabled: true,
    description: 'Enable track preloading for better performance',
    rolloutPercentage: 100,
    environment: 'all'
  },
  
  // Kill Switches
  globalKillSwitch: {
    key: 'globalKillSwitch',
    enabled: false,
    description: 'Emergency kill switch for all features',
    rolloutPercentage: 0,
    environment: 'all'
  },
  
  paymentProcessing: {
    key: 'paymentProcessing',
    enabled: true,
    description: 'Enable payment processing and transactions',
    rolloutPercentage: 100,
    environment: 'all'
  },
  
  // Analytics & Tracking
  analytics: {
    key: 'analytics',
    enabled: true,
    description: 'Enable analytics and event tracking',
    rolloutPercentage: 100,
    environment: 'all'
  },
  
  crashReporting: {
    key: 'crashReporting',
    enabled: true,
    description: 'Enable crash reporting and error tracking',
    rolloutPercentage: 100,
    environment: 'all'
  },

  // Route-level gates
  surf: {
    key: 'surf',
    enabled: true,
    description: 'Enable Surf discovery experience',
    rolloutPercentage: 100,
    environment: 'all'
  },

  battles: {
    key: 'battles',
    enabled: true,
    description: 'Enable Battles experience',
    rolloutPercentage: 100,
    environment: 'all'
  },

  posterize: {
    key: 'posterize',
    enabled: true,
    description: 'Enable Posterize minting experience',
    rolloutPercentage: 100,
    environment: 'all'
  },

  uploads: {
    key: 'uploads',
    enabled: true,
    description: 'Enable Upload/Creator pipeline',
    rolloutPercentage: 100,
    environment: 'all'
  },

  creatorHub: {
    key: 'creatorHub',
    enabled: true,
    description: 'Enable Creator hub UI',
    rolloutPercentage: 100,
    environment: 'all'
  },

  liveStage: {
    key: 'liveStage',
    enabled: true,
    description: 'Enable Live/Stage experiences',
    rolloutPercentage: 100,
    environment: 'all'
  },

  matrixDebugOverlay: {
    key: 'matrixDebugOverlay',
    enabled: false,
    description: 'Enable debug overlay and dev widgets',
    rolloutPercentage: 0,
    environment: 'development'
  }
};

/**
 * Feature Flags Manager Class
 */
class FeatureFlagsManager {
  private config: FeatureFlagConfig;
  private cache: Map<string, boolean> = new Map();
  private listeners: Set<(flags: FeatureFlagConfig) => void> = new Set();
  private userId?: string;
  private userGroups: string[] = [];

  constructor() {
    this.config = {
      flags: { ...BOOTSTRAP_FLAGS },
      version: '2.0.0', // Match the API version to prevent hydration mismatch
      lastUpdated: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    this.loadFromStorage();
  }

  /**
   * Initialize the feature flags system
   */
  async initialize(userId?: string, userGroups: string[] = []): Promise<void> {
    this.userId = userId;
    this.userGroups = userGroups;

    try {
      await this.fetchRemoteConfig();
    } catch (error) {
      console.warn('Failed to fetch remote config, using bootstrap defaults:', error);
    }

    this.notifyListeners();
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagKey: string): boolean {
    // Check cache first
    if (this.cache.has(flagKey)) {
      return this.cache.get(flagKey)!;
    }

    const flag = this.config.flags[flagKey];
    if (!flag) {
      console.warn(`Feature flag '${flagKey}' not found, defaulting to false`);
      return false;
    }

    // Check global kill switch
    if (flagKey !== 'globalKillSwitch' && this.isEnabled('globalKillSwitch')) {
      this.cache.set(flagKey, false);
      return false;
    }

    // Check environment
    if (flag.environment && flag.environment !== 'all' && flag.environment !== this.config.environment) {
      this.cache.set(flagKey, false);
      return false;
    }

    // Check expiration
    if (flag.expiresAt && new Date(flag.expiresAt) < new Date()) {
      this.cache.set(flagKey, false);
      return false;
    }

    // Check user groups
    if (flag.userGroups && flag.userGroups.length > 0) {
      const hasRequiredGroup = flag.userGroups.some(group => this.userGroups.includes(group));
      if (!hasRequiredGroup) {
        this.cache.set(flagKey, false);
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const userHash = this.getUserHash(flagKey);
      const isInRollout = userHash < flag.rolloutPercentage;
      if (!isInRollout) {
        this.cache.set(flagKey, false);
        return false;
      }
    }

    const result = flag.enabled;
    this.cache.set(flagKey, result);
    return result;
  }

  /**
   * Get feature flag metadata
   */
  getFlagMetadata(flagKey: string): FeatureFlag | null {
    return this.config.flags[flagKey] || null;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlagConfig {
    return { ...this.config };
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(listener: (flags: FeatureFlagConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Force refresh flags from remote
   */
  async refresh(): Promise<void> {
    this.cache.clear();
    await this.fetchRemoteConfig();
    this.notifyListeners();
  }

  /**
   * Override a flag for testing (development only)
   */
  override(flagKey: string, enabled: boolean): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Flag overrides only allowed in development');
      return;
    }

    this.cache.set(flagKey, enabled);
    console.log(`Feature flag '${flagKey}' overridden to: ${enabled}`);
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.cache.clear();
  }

  // Private methods
  private getUserHash(flagKey: string): number {
    if (!this.userId) return Math.random() * 100;

    // Simple hash function for consistent rollout
    let hash = 0;
    const str = `${this.userId}-${flagKey}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  private async fetchRemoteConfig(): Promise<void> {
    try {
      const response = await fetch('/api/feature-flags?version=2.0.0', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const remoteConfig = await response.json();
        this.config = { ...this.config, ...remoteConfig };
        this.saveToStorage();
      }
    } catch (error) {
      console.warn('Failed to fetch remote feature flags:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('taptap_feature_flags');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only use stored config if it's recent (within 1 hour)
        const lastUpdated = new Date(parsed.lastUpdated);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        if (lastUpdated > oneHourAgo) {
          this.config = { ...this.config, ...parsed };
        }
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('taptap_feature_flags', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Error in feature flag listener:', error);
      }
    });
  }
}

// Global instance
export const featureFlags = new FeatureFlagsManager();
