"use client";

import { useEffect, useCallback, useRef } from 'react';
import { PrismAnalytics, AnalyticsEvent, AnalyticsConfig } from '@/lib/analytics/prismAnalytics';
import { useAuth } from './useAuth';

/**
 * Hook for analytics tracking
 */
export function useAnalytics(config?: Partial<AnalyticsConfig>) {
  const analytics = useRef<PrismAnalytics | null>(null);
  const { user } = useAuth();

  // Initialize analytics
  useEffect(() => {
    if (!analytics.current) {
      analytics.current = new PrismAnalytics({
        userId: user?.id,
        ...config,
      });
    }
  }, [config, user?.id]);

  // Update user ID when auth changes
  useEffect(() => {
    if (analytics.current && user?.id) {
      analytics.current.updateConsent(analytics.current['config'].optInLevel, user.id);
    }
  }, [user?.id]);

  /**
   * Track analytics event
   */
  const track = useCallback((
    type: string,
    properties?: Record<string, any>,
    category?: AnalyticsEvent['category']
  ) => {
    if (analytics.current) {
      analytics.current.track(type, properties, category);
    }
  }, []);

  /**
   * Track KPI metric
   */
  const trackKPI = useCallback((
    id: string,
    name: string,
    category: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>
  ) => {
    if (analytics.current) {
      analytics.current.trackKPI(id, name, category, value, unit, metadata);
    }
  }, []);

  /**
   * Update consent level
   */
  const updateConsent = useCallback((level: 'none' | 'basic' | 'enhanced' | 'full') => {
    if (analytics.current) {
      analytics.current.updateConsent(level, user?.id);
    }
  }, [user?.id]);

  /**
   * Get dashboard data
   */
  const getDashboardData = useCallback(() => {
    return analytics.current?.getDashboardData() || null;
  }, []);

  /**
   * Subscribe to analytics events
   */
  const subscribe = useCallback((callback: (event: AnalyticsEvent) => void) => {
    return analytics.current?.subscribe(callback) || (() => {});
  }, []);

  return {
    track,
    trackKPI,
    updateConsent,
    getDashboardData,
    subscribe,
    isReady: !!analytics.current,
  };
}

/**
 * Hook for page view tracking
 */
export function usePageTracking() {
  const { track } = useAnalytics();

  const trackPageView = useCallback((page: string, properties?: Record<string, any>) => {
    track('page_view', {
      page,
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof window !== 'undefined' ? document.referrer : '',
      timestamp: Date.now(),
      ...properties,
    }, 'user');
  }, [track]);

  // Auto-track page views
  useEffect(() => {
    if (typeof window !== 'undefined') {
      trackPageView(window.location.pathname);
    }
  }, [trackPageView]);

  return { trackPageView };
}

/**
 * Hook for user behavior tracking
 */
export function useBehaviorTracking() {
  const { track } = useAnalytics();

  const trackClick = useCallback((element: string, properties?: Record<string, any>) => {
    track('click', {
      element,
      timestamp: Date.now(),
      ...properties,
    }, 'engagement');
  }, [track]);

  const trackSearch = useCallback((query: string, results?: number, properties?: Record<string, any>) => {
    track('search', {
      query,
      results,
      timestamp: Date.now(),
      ...properties,
    }, 'engagement');
  }, [track]);

  const trackShare = useCallback((content: string, platform?: string, properties?: Record<string, any>) => {
    track('share', {
      content,
      platform,
      timestamp: Date.now(),
      ...properties,
    }, 'engagement');
  }, [track]);

  const trackError = useCallback((error: string, context?: string, properties?: Record<string, any>) => {
    track('error', {
      error,
      context,
      timestamp: Date.now(),
      ...properties,
    }, 'system');
  }, [track]);

  return {
    trackClick,
    trackSearch,
    trackShare,
    trackError,
  };
}

/**
 * Hook for performance tracking
 */
export function usePerformanceTracking() {
  const { track, trackKPI } = useAnalytics();

  const trackPageLoad = useCallback((duration: number, properties?: Record<string, any>) => {
    track('page_load', {
      duration,
      timestamp: Date.now(),
      ...properties,
    }, 'performance');

    trackKPI('page_load_time', 'Page Load Time', 'performance', duration, 'duration');
  }, [track, trackKPI]);

  const trackAPICall = useCallback((
    endpoint: string,
    duration: number,
    status: number,
    properties?: Record<string, any>
  ) => {
    track('api_call', {
      endpoint,
      duration,
      status,
      timestamp: Date.now(),
      ...properties,
    }, 'performance');

    trackKPI('api_response_time', 'API Response Time', 'performance', duration, 'duration');
  }, [track, trackKPI]);

  const trackResourceLoad = useCallback((
    resource: string,
    duration: number,
    size?: number,
    properties?: Record<string, any>
  ) => {
    track('resource_load', {
      resource,
      duration,
      size,
      timestamp: Date.now(),
      ...properties,
    }, 'performance');
  }, [track]);

  return {
    trackPageLoad,
    trackAPICall,
    trackResourceLoad,
  };
}

/**
 * Hook for business metrics tracking
 */
export function useBusinessTracking() {
  const { track, trackKPI } = useAnalytics();

  const trackPurchase = useCallback((
    itemId: string,
    amount: number,
    currency: string,
    properties?: Record<string, any>
  ) => {
    track('purchase', {
      itemId,
      amount,
      currency,
      timestamp: Date.now(),
      ...properties,
    }, 'business');

    trackKPI('total_revenue', 'Total Revenue', 'business', amount, 'currency');
  }, [track, trackKPI]);

  const trackWalletConnection = useCallback((
    provider: string,
    address: string,
    properties?: Record<string, any>
  ) => {
    track('wallet_connected', {
      provider,
      address,
      timestamp: Date.now(),
      ...properties,
    }, 'business');

    trackKPI('wallet_connections', 'Wallet Connections', 'business', 1, 'count');
  }, [track, trackKPI]);

  const trackTransaction = useCallback((
    type: string,
    amount: number,
    currency: string,
    properties?: Record<string, any>
  ) => {
    track('transaction', {
      type,
      amount,
      currency,
      timestamp: Date.now(),
      ...properties,
    }, 'business');

    if (currency === 'TAPCOIN') {
      trackKPI('tapcoin_transactions', 'TapCoin Transactions', 'business', 1, 'count');
      trackKPI('total_tapcoin_volume', 'Total TapCoin Volume', 'business', amount, 'currency');
    }
  }, [track, trackKPI]);

  return {
    trackPurchase,
    trackWalletConnection,
    trackTransaction,
  };
}
