"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { featureFlags, FeatureFlagConfig, FeatureFlag } from '@/lib/featureFlags';

/**
 * Hook for using feature flags in React components
 */
export function useFeatureFlags() {
  const [config, setConfig] = useState<FeatureFlagConfig>(featureFlags.getAllFlags());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to flag changes
    const unsubscribe = featureFlags.subscribe((newConfig) => {
      setConfig(newConfig);
      setLoading(false);
    });

    // Initial load
    setLoading(false);

    return unsubscribe;
  }, []);

  const isEnabled = useCallback((flagKey: string): boolean => {
    return featureFlags.isEnabled(flagKey);
  }, []);

  const getFlagMetadata = useCallback((flagKey: string): FeatureFlag | null => {
    return featureFlags.getFlagMetadata(flagKey);
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    await featureFlags.refresh();
    setLoading(false);
  }, []);

  const override = useCallback((flagKey: string, enabled: boolean): void => {
    featureFlags.override(flagKey, enabled);
  }, []);

  const clearOverrides = useCallback((): void => {
    featureFlags.clearOverrides();
  }, []);

  return {
    config,
    loading,
    isEnabled,
    getFlagMetadata,
    refresh,
    override,
    clearOverrides
  };
}

/**
 * Hook for checking a specific feature flag
 */
export function useFeatureFlag(flagKey: string): {
  enabled: boolean;
  loading: boolean;
  metadata: FeatureFlag | null;
} {
  const { isEnabled, loading, getFlagMetadata } = useFeatureFlags();
  
  return {
    enabled: isEnabled(flagKey),
    loading,
    metadata: getFlagMetadata(flagKey)
  };
}

/**
 * Hook for conditional rendering based on feature flags
 */
export function useFeatureGate(flagKey: string): boolean {
  const { enabled } = useFeatureFlag(flagKey);
  return enabled;
}

/**
 * Higher-order component for feature gating
 */
export function withFeatureFlag<P extends object>(
  flagKey: string,
  Component: ComponentType<P>,
  FallbackComponent?: ComponentType<P>
) {
  return function FeatureGatedComponent(props: P) {
    const enabled = useFeatureGate(flagKey);
    
    if (!enabled) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }
    
    return <Component {...props} />;
  };
}

/**
 * Component for conditional rendering based on feature flags
 */
interface FeatureGateProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const enabled = useFeatureGate(flag);
  return enabled ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook for A/B testing with feature flags
 */
export function useABTest(flagKey: string, variants: string[] = ['A', 'B']): {
  variant: string;
  isEnabled: boolean;
  metadata: FeatureFlag | null;
} {
  const { isEnabled, getFlagMetadata } = useFeatureFlags();
  const enabled = isEnabled(flagKey);
  const metadata = getFlagMetadata(flagKey);
  
  // Simple variant selection based on user hash
  const variant = variants[0]; // Default to first variant
  // TODO: Implement proper variant selection based on user ID hash
  
  return {
    variant,
    isEnabled: enabled,
    metadata
  };
}
