"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { featureFlags, FeatureFlagConfig } from '@/lib/featureFlags';
import { useAuth } from '@/hooks/useAuth';

interface FeatureFlagsContextType {
  config: FeatureFlagConfig;
  loading: boolean;
  isEnabled: (flagKey: string) => boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
  userId?: string;
  userGroups?: string[];
}

export function FeatureFlagsProvider({ 
  children, 
  userId, 
  userGroups,
}: FeatureFlagsProviderProps) {
  const [config, setConfig] = useState<FeatureFlagConfig>(featureFlags.getAllFlags());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const resolvedUserId = userId ?? (user?.id ?? null);
  const userRole = user?.role;
  const betaAccess = Boolean((user as any)?.betaAccess);
  const resolvedGroups = useMemo(() => {
    if (userGroups && userGroups.length > 0) {
      return userGroups;
    }

    const derived: string[] = [];
    if (userRole) derived.push(String(userRole).toLowerCase());
    if (betaAccess) derived.push('beta_testers');
    return derived;
  }, [betaAccess, userGroups, userRole]);

  useEffect(() => {
    let mounted = true;

    const initializeFlags = async () => {
      try {
        await featureFlags.initialize(resolvedUserId ?? undefined, resolvedGroups);
        if (mounted) {
          setConfig(featureFlags.getAllFlags());
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize feature flags:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Subscribe to flag changes
    const unsubscribe = featureFlags.subscribe((newConfig) => {
      if (mounted) {
        setConfig(newConfig);
      }
    });

    initializeFlags();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [resolvedUserId, resolvedGroups]);

  const isEnabled = (flagKey: string): boolean => {
    return featureFlags.isEnabled(flagKey);
  };

  const refresh = async (): Promise<void> => {
    setLoading(true);
    try {
      await featureFlags.refresh();
    } finally {
      setLoading(false);
    }
  };

  const value: FeatureFlagsContextType = {
    config,
    loading,
    isEnabled,
    refresh
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlagsContext(): FeatureFlagsContextType {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlagsContext must be used within a FeatureFlagsProvider');
  }
  return context;
}

// Development-only feature flag debugger component
export function FeatureFlagsDebugger() {
  const { config, isEnabled, refresh } = useFeatureFlagsContext();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !mounted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <details className="bg-black/90 border border-white/20 rounded-lg p-3 text-xs text-white">
        <summary className="cursor-pointer font-medium text-teal-300 mb-2">
          Feature Flags Debug ({Object.keys(config.flags).length} flags)
        </summary>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60">Version: {config.version}</span>
            <button
              onClick={refresh}
              className="text-teal-300 hover:text-teal-200 text-xs"
            >
              Refresh
            </button>
          </div>
          
          {Object.entries(config.flags).map(([key, flag]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="truncate mr-2" title={flag.description}>
                {key}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isEnabled(key) ? 'text-green-400' : 'text-red-400'}`}>
                  {isEnabled(key) ? 'ON' : 'OFF'}
                </span>
                {flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100 && (
                  <span className="text-xs text-yellow-400">
                    {flag.rolloutPercentage}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
