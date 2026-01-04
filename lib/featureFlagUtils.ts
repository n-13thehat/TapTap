/**
 * Feature Flag Utilities
 * Common patterns and helpers for feature flag usage
 */

import { featureFlags } from './featureFlags';

/**
 * Feature flag keys enum for type safety
 */
export const FeatureFlagKeys = {
  // Core App Features
  SURF_PAYWALL: 'surfPaywall',
  TAP_GAME: 'tapGame',
  BATTLES: 'battles',
  OFF_RAMP: 'offRamp',
  DELUXE_MINT: 'deluxeMint',
  
  // Advanced Features
  ASTRO_VIBES: 'astroVibes',
  LIVE_STREAMING: 'liveStreaming',
  AI_RECOMMENDATIONS: 'aiRecommendations',
  
  // Beta Features
  BETA_UNLOCK: 'betaUnlock',
  CREATOR_MODE: 'creatorMode',
  
  // Experimental Features
  VOICE_COMMANDS: 'voiceCommands',
  SOCIAL_FEEDS: 'socialFeeds',
  
  // Performance Features
  OFFLINE_MODE: 'offlineMode',
  PRELOAD_TRACKS: 'preloadTracks',
  
  // Kill Switches
  GLOBAL_KILL_SWITCH: 'globalKillSwitch',
  PAYMENT_PROCESSING: 'paymentProcessing',
  
  // Analytics & Tracking
  ANALYTICS: 'analytics',
  CRASH_REPORTING: 'crashReporting'
} as const;

export type FeatureFlagKey = typeof FeatureFlagKeys[keyof typeof FeatureFlagKeys];

/**
 * Check if TapPass paywall should be shown
 */
export function shouldShowTapPassPaywall(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.SURF_PAYWALL);
}

/**
 * Check if TapGame features are available
 */
export function isTapGameEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.TAP_GAME);
}

/**
 * Check if battles functionality is enabled
 */
export function areBattlesEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.BATTLES);
}

/**
 * Check if crypto off-ramp is available
 */
export function isOffRampEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.OFF_RAMP);
}

/**
 * Check if deluxe minting is available
 */
export function isDeluxeMintEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.DELUXE_MINT);
}

/**
 * Check if AstroVibes system is enabled
 */
export function isAstroVibesEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.ASTRO_VIBES);
}

/**
 * Check if live streaming features are enabled
 */
export function isLiveStreamingEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.LIVE_STREAMING);
}

/**
 * Check if AI recommendations are enabled
 */
export function areAIRecommendationsEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.AI_RECOMMENDATIONS);
}

/**
 * Check if beta restrictions should be bypassed
 */
export function shouldBypassBetaRestrictions(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.BETA_UNLOCK);
}

/**
 * Check if creator mode is available
 */
export function isCreatorModeEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.CREATOR_MODE);
}

/**
 * Check if voice commands are enabled
 */
export function areVoiceCommandsEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.VOICE_COMMANDS);
}

/**
 * Check if social feeds are enabled
 */
export function areSocialFeedsEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.SOCIAL_FEEDS);
}

/**
 * Check if offline mode is available
 */
export function isOfflineModeEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.OFFLINE_MODE);
}

/**
 * Check if track preloading is enabled
 */
export function isTrackPreloadingEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.PRELOAD_TRACKS);
}

/**
 * Check if payment processing is enabled
 */
export function isPaymentProcessingEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.PAYMENT_PROCESSING);
}

/**
 * Check if analytics tracking is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.ANALYTICS);
}

/**
 * Check if crash reporting is enabled
 */
export function isCrashReportingEnabled(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.CRASH_REPORTING);
}

/**
 * Check if the global kill switch is activated
 */
export function isGlobalKillSwitchActive(): boolean {
  return featureFlags.isEnabled(FeatureFlagKeys.GLOBAL_KILL_SWITCH);
}

/**
 * Get feature availability for a specific app
 */
export function getAppFeatures(app: 'surf' | 'battles' | 'marketplace' | 'live' | 'social') {
  switch (app) {
    case 'surf':
      return {
        paywall: shouldShowTapPassPaywall(),
        aiRecommendations: areAIRecommendationsEnabled(),
        offlineMode: isOfflineModeEnabled()
      };
      
    case 'battles':
      return {
        enabled: areBattlesEnabled(),
        tapGame: isTapGameEnabled()
      };
      
    case 'marketplace':
      return {
        deluxeMint: isDeluxeMintEnabled(),
        paymentProcessing: isPaymentProcessingEnabled()
      };
      
    case 'live':
      return {
        enabled: isLiveStreamingEnabled(),
        voiceCommands: areVoiceCommandsEnabled()
      };
      
    case 'social':
      return {
        feeds: areSocialFeedsEnabled(),
        creatorMode: isCreatorModeEnabled()
      };
      
    default:
      return {};
  }
}

/**
 * Feature flag middleware for API routes
 */
export function requireFeatureFlag(flagKey: FeatureFlagKey) {
  return (handler: Function) => {
    return async (req: Request, ...args: any[]) => {
      if (!featureFlags.isEnabled(flagKey)) {
        return new Response(
          JSON.stringify({ 
            error: 'Feature not available',
            feature: flagKey 
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      return handler(req, ...args);
    };
  };
}

/**
 * Batch check multiple feature flags
 */
export function checkFeatureFlags(flags: FeatureFlagKey[]): Record<FeatureFlagKey, boolean> {
  return flags.reduce((acc, flag) => {
    acc[flag] = featureFlags.isEnabled(flag);
    return acc;
  }, {} as Record<FeatureFlagKey, boolean>);
}

/**
 * Get feature flag configuration for client-side usage
 */
export function getClientFeatureFlags(): Record<string, boolean> {
  const clientFlags = [
    FeatureFlagKeys.TAP_GAME,
    FeatureFlagKeys.BATTLES,
    FeatureFlagKeys.ASTRO_VIBES,
    FeatureFlagKeys.LIVE_STREAMING,
    FeatureFlagKeys.AI_RECOMMENDATIONS,
    FeatureFlagKeys.CREATOR_MODE,
    FeatureFlagKeys.SOCIAL_FEEDS,
    FeatureFlagKeys.OFFLINE_MODE,
    FeatureFlagKeys.VOICE_COMMANDS
  ];
  
  return checkFeatureFlags(clientFlags);
}
