/**
 * KPI Definitions and Mapping
 * Comprehensive KPI system for TapTap analytics
 */

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  category: 'engagement' | 'user' | 'business' | 'performance' | 'content';
  unit: 'count' | 'percentage' | 'duration' | 'bytes' | 'currency';
  aggregation: 'sum' | 'average' | 'max' | 'min' | 'count' | 'unique';
  target?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  formula?: string;
  dependencies?: string[];
}

/**
 * Core KPI Definitions for TapTap
 */
export const KPI_DEFINITIONS: Record<string, KPIDefinition> = {
  // Engagement KPIs
  tracks_played: {
    id: 'tracks_played',
    name: 'Tracks Played',
    description: 'Total number of tracks played by users',
    category: 'engagement',
    unit: 'count',
    aggregation: 'sum',
    target: 1000,
  },

  tracks_completed: {
    id: 'tracks_completed',
    name: 'Tracks Completed',
    description: 'Number of tracks played to completion (>80%)',
    category: 'engagement',
    unit: 'count',
    aggregation: 'sum',
  },

  completion_rate: {
    id: 'completion_rate',
    name: 'Track Completion Rate',
    description: 'Percentage of tracks played to completion',
    category: 'engagement',
    unit: 'percentage',
    aggregation: 'average',
    formula: '(tracks_completed / tracks_played) * 100',
    dependencies: ['tracks_completed', 'tracks_played'],
    target: 75,
    threshold: { warning: 60, critical: 40 },
  },

  avg_session_duration: {
    id: 'avg_session_duration',
    name: 'Average Session Duration',
    description: 'Average time users spend in a session',
    category: 'engagement',
    unit: 'duration',
    aggregation: 'average',
    target: 1800000, // 30 minutes
  },

  tracks_saved: {
    id: 'tracks_saved',
    name: 'Tracks Saved',
    description: 'Number of tracks saved to user libraries',
    category: 'engagement',
    unit: 'count',
    aggregation: 'sum',
  },

  playlists_created: {
    id: 'playlists_created',
    name: 'Playlists Created',
    description: 'Number of playlists created by users',
    category: 'engagement',
    unit: 'count',
    aggregation: 'sum',
  },

  // User KPIs
  daily_active_users: {
    id: 'daily_active_users',
    name: 'Daily Active Users',
    description: 'Number of unique users active in the last 24 hours',
    category: 'user',
    unit: 'count',
    aggregation: 'unique',
    target: 500,
  },

  weekly_active_users: {
    id: 'weekly_active_users',
    name: 'Weekly Active Users',
    description: 'Number of unique users active in the last 7 days',
    category: 'user',
    unit: 'count',
    aggregation: 'unique',
    target: 2000,
  },

  monthly_active_users: {
    id: 'monthly_active_users',
    name: 'Monthly Active Users',
    description: 'Number of unique users active in the last 30 days',
    category: 'user',
    unit: 'count',
    aggregation: 'unique',
    target: 5000,
  },

  user_retention_rate: {
    id: 'user_retention_rate',
    name: 'User Retention Rate',
    description: 'Percentage of users who return after first visit',
    category: 'user',
    unit: 'percentage',
    aggregation: 'average',
    target: 40,
    threshold: { warning: 30, critical: 20 },
  },

  new_user_signups: {
    id: 'new_user_signups',
    name: 'New User Signups',
    description: 'Number of new user registrations',
    category: 'user',
    unit: 'count',
    aggregation: 'sum',
    target: 100,
  },

  // Business KPIs
  wallet_connections: {
    id: 'wallet_connections',
    name: 'Wallet Connections',
    description: 'Number of crypto wallets connected',
    category: 'business',
    unit: 'count',
    aggregation: 'sum',
    target: 200,
  },

  tapcoin_transactions: {
    id: 'tapcoin_transactions',
    name: 'TapCoin Transactions',
    description: 'Number of TapCoin transactions processed',
    category: 'business',
    unit: 'count',
    aggregation: 'sum',
  },

  total_tapcoin_volume: {
    id: 'total_tapcoin_volume',
    name: 'Total TapCoin Volume',
    description: 'Total volume of TapCoin transactions',
    category: 'business',
    unit: 'currency',
    aggregation: 'sum',
  },

  nft_purchases: {
    id: 'nft_purchases',
    name: 'NFT Purchases',
    description: 'Number of NFT purchases in marketplace',
    category: 'business',
    unit: 'count',
    aggregation: 'sum',
  },

  creator_earnings: {
    id: 'creator_earnings',
    name: 'Creator Earnings',
    description: 'Total earnings distributed to creators',
    category: 'business',
    unit: 'currency',
    aggregation: 'sum',
  },

  // Performance KPIs
  page_load_time: {
    id: 'page_load_time',
    name: 'Page Load Time',
    description: 'Average page load time in milliseconds',
    category: 'performance',
    unit: 'duration',
    aggregation: 'average',
    target: 2000,
    threshold: { warning: 3000, critical: 5000 },
  },

  api_response_time: {
    id: 'api_response_time',
    name: 'API Response Time',
    description: 'Average API response time in milliseconds',
    category: 'performance',
    unit: 'duration',
    aggregation: 'average',
    target: 500,
    threshold: { warning: 1000, critical: 2000 },
  },

  error_rate: {
    id: 'error_rate',
    name: 'Error Rate',
    description: 'Percentage of requests that result in errors',
    category: 'performance',
    unit: 'percentage',
    aggregation: 'average',
    target: 1,
    threshold: { warning: 2, critical: 5 },
  },

  uptime: {
    id: 'uptime',
    name: 'System Uptime',
    description: 'Percentage of time system is available',
    category: 'performance',
    unit: 'percentage',
    aggregation: 'average',
    target: 99.9,
    threshold: { warning: 99, critical: 95 },
  },

  // Content KPIs
  total_tracks: {
    id: 'total_tracks',
    name: 'Total Tracks',
    description: 'Total number of tracks in the platform',
    category: 'content',
    unit: 'count',
    aggregation: 'count',
    target: 10000,
  },

  tracks_uploaded: {
    id: 'tracks_uploaded',
    name: 'Tracks Uploaded',
    description: 'Number of new tracks uploaded',
    category: 'content',
    unit: 'count',
    aggregation: 'sum',
    target: 50,
  },

  avg_track_rating: {
    id: 'avg_track_rating',
    name: 'Average Track Rating',
    description: 'Average rating of all tracks',
    category: 'content',
    unit: 'count',
    aggregation: 'average',
    target: 4.0,
  },

  content_moderation_rate: {
    id: 'content_moderation_rate',
    name: 'Content Moderation Rate',
    description: 'Percentage of content that requires moderation',
    category: 'content',
    unit: 'percentage',
    aggregation: 'average',
    target: 5,
    threshold: { warning: 10, critical: 20 },
  },
};

/**
 * KPI Categories for organization
 */
export const KPI_CATEGORIES = {
  engagement: {
    name: 'Engagement',
    description: 'User interaction and engagement metrics',
    color: '#10B981',
    icon: '📈',
  },
  user: {
    name: 'User',
    description: 'User acquisition, retention, and behavior',
    color: '#3B82F6',
    icon: '👥',
  },
  business: {
    name: 'Business',
    description: 'Revenue, transactions, and business metrics',
    color: '#F59E0B',
    icon: '💰',
  },
  performance: {
    name: 'Performance',
    description: 'System performance and technical metrics',
    color: '#EF4444',
    icon: '⚡',
  },
  content: {
    name: 'Content',
    description: 'Content creation and quality metrics',
    color: '#8B5CF6',
    icon: '🎵',
  },
};

/**
 * Get KPI definition by ID
 */
export function getKPIDefinition(id: string): KPIDefinition | undefined {
  return KPI_DEFINITIONS[id];
}

/**
 * Get KPIs by category
 */
export function getKPIsByCategory(category: string): KPIDefinition[] {
  return Object.values(KPI_DEFINITIONS).filter(kpi => kpi.category === category);
}

/**
 * Calculate derived KPI
 */
export function calculateDerivedKPI(
  kpiId: string,
  dependencies: Record<string, number>
): number | null {
  const definition = getKPIDefinition(kpiId);
  if (!definition || !definition.formula) return null;

  try {
    // Simple formula evaluation (would be more robust in production)
    let formula = definition.formula;
    
    // Replace dependency values
    for (const [depId, value] of Object.entries(dependencies)) {
      formula = formula.replace(new RegExp(depId, 'g'), value.toString());
    }

    // Evaluate formula (basic math operations)
    return eval(formula);
  } catch (error) {
    console.error(`Failed to calculate derived KPI ${kpiId}:`, error);
    return null;
  }
}

/**
 * Check if KPI value meets threshold
 */
export function checkKPIThreshold(
  kpiId: string,
  value: number
): 'good' | 'warning' | 'critical' {
  const definition = getKPIDefinition(kpiId);
  if (!definition || !definition.threshold) return 'good';

  if (value <= definition.threshold.critical) return 'critical';
  if (value <= definition.threshold.warning) return 'warning';
  return 'good';
}
