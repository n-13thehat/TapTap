"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PrismAnalytics, AnalyticsEvent, AnalyticsConfig } from '@/lib/analytics/prismAnalytics';
import { eventBus, EventTypes } from '@/lib/eventBus';
import { useAuth } from '@/hooks/useAuth';

interface AnalyticsContextType {
  analytics: PrismAnalytics | null;
  isInitialized: boolean;
  consentLevel: 'none' | 'basic' | 'enhanced' | 'full';
  dashboardData: any;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  config?: Partial<AnalyticsConfig>;
}

export function AnalyticsProvider({ children, config = {} }: AnalyticsProviderProps) {
  const [analytics, setAnalytics] = useState<PrismAnalytics | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [consentLevel, setConsentLevel] = useState<'none' | 'basic' | 'enhanced' | 'full'>('basic');
  const [dashboardData, setDashboardData] = useState<ReturnType<PrismAnalytics['getDashboardData']> | null>(null);
  
  const { user } = useAuth();

  // Initialize analytics
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        // Load saved consent level
        const savedConsent = localStorage.getItem('taptap_analytics_consent');
        let initialConsentLevel = 'basic';
        
        if (savedConsent) {
          const consent = JSON.parse(savedConsent);
          initialConsentLevel = consent.level;
        }

        const analyticsInstance = new PrismAnalytics({
          userId: user?.id,
          optInLevel: initialConsentLevel as any,
          ...config,
        });

        setAnalytics(analyticsInstance);
        setConsentLevel(initialConsentLevel as any);
        setIsInitialized(true);

        console.log('Prism Analytics initialized');
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      }
    };

    initAnalytics();
  }, [config, user?.id]);

  // Subscribe to event bus for automatic analytics
  useEffect(() => {
    if (!analytics) return;

    const unsubscribe = eventBus.on({
      id: 'analytics-listener',
      eventTypes: Object.values(EventTypes),
      handler: (event) => {
        analytics.processEventBusEvent(event);
      },
    });

    return unsubscribe;
  }, [analytics]);

  // Update dashboard data periodically
  useEffect(() => {
    if (!analytics) return;

    const updateDashboard = () => {
      const data = analytics.getDashboardData();
      setDashboardData(data);
    };

    updateDashboard();
    const interval = setInterval(updateDashboard, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [analytics]);

  // Update user ID when auth changes
  useEffect(() => {
    if (analytics && user?.id) {
      analytics.updateConsent(consentLevel, user.id);
    }
  }, [analytics, user?.id, consentLevel]);

  const value: AnalyticsContextType = {
    analytics,
    isInitialized,
    consentLevel,
    dashboardData,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}

// Development-only analytics debugger
export function AnalyticsDebugger() {
  const { analytics, isInitialized, consentLevel, dashboardData } = useAnalyticsContext();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleFlush = () => {
    if (analytics) {
      analytics.flush();
    }
  };

  const handleConsentChange = (level: 'none' | 'basic' | 'enhanced' | 'full') => {
    if (analytics) {
      analytics.updateConsent(level);
    }
  };

  return (
    <div className="fixed bottom-32 left-4 z-40 max-w-sm">
      <details className="bg-black/90 border border-white/20 rounded-lg p-3 text-xs text-white">
        <summary className="cursor-pointer font-medium text-blue-300 mb-2">
          Prism Analytics Debug
        </summary>
        
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/60">Status:</span>
              <div className={`font-medium ${isInitialized ? 'text-green-400' : 'text-yellow-400'}`}>
                {isInitialized ? 'Active' : 'Loading'}
              </div>
            </div>
            <div>
              <span className="text-white/60">Consent:</span>
              <div className="font-medium text-blue-400">{consentLevel}</div>
            </div>
            
            {dashboardData && (
              <>
                <div>
                  <span className="text-white/60">Events:</span>
                  <div className="font-medium text-purple-400">{dashboardData.events?.length || 0}</div>
                </div>
                <div>
                  <span className="text-white/60">KPIs:</span>
                  <div className="font-medium text-teal-400">{dashboardData.kpis?.length || 0}</div>
                </div>
                <div>
                  <span className="text-white/60">Session:</span>
                  <div className="font-medium text-orange-400">
                    {dashboardData.sessionStats?.eventCount || 0}
                  </div>
                </div>
                <div>
                  <span className="text-white/60">Duration:</span>
                  <div className="font-medium text-pink-400">
                    {dashboardData.sessionStats?.duration 
                      ? Math.round(dashboardData.sessionStats.duration / 1000 / 60) + 'm'
                      : '0m'
                    }
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div>
              <span className="text-white/60 text-xs">Consent Level:</span>
              <div className="flex gap-1 mt-1">
                {['none', 'basic', 'enhanced', 'full'].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleConsentChange(level as any)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      consentLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleFlush}
              className="w-full text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-2 py-1 rounded transition-colors"
            >
              Flush Analytics
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
