"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { SurfManager } from '@/lib/surf/surfManager';
import { ShadowTrackCreator } from '@/lib/surf/shadowTrackCreator';
import { 
  SurfTrack, 
  SurfFeed, 
  SurfSession, 
  TapPassStatus, 
  SurfError,
  ShadowTrackCreation 
} from '@/lib/surf/types';
import { useAuth } from './useAuth';

/**
 * Hook for surf functionality
 */
export function useSurf() {
  const { user } = useAuth();
  const surfManager = useRef<SurfManager | null>(null);
  const shadowCreator = useRef<ShadowTrackCreator | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSession, setCurrentSession] = useState<SurfSession | null>(null);
  const [availableFeeds, setAvailableFeeds] = useState<SurfFeed[]>([]);
  const [tapPassStatus, setTapPassStatus] = useState<TapPassStatus>({
    has_tappass: false,
    tier: 'free',
    features: [],
    daily_surf_limit: 50,
    daily_surf_used: 0,
    beta_access: false,
  });

  // Initialize surf manager
  useEffect(() => {
    if (user?.id && !surfManager.current) {
      const config = {
        rate_limits: {
          surf_per_hour: tapPassStatus.has_tappass ? 1000 : 100,
          save_per_hour: tapPassStatus.has_tappass ? 500 : 50,
          skip_per_minute: 30,
          shadow_create_per_day: tapPassStatus.beta_access ? 10 : 0,
        },
        tappass_features: {
          unlimited_surf: tapPassStatus.has_tappass,
          premium_feeds: tapPassStatus.has_tappass,
          early_access: tapPassStatus.beta_access,
          ad_free: tapPassStatus.has_tappass,
        },
        beta_features: {
          experimental_feeds: tapPassStatus.beta_access,
          advanced_filters: tapPassStatus.beta_access,
          shadow_track_creation: tapPassStatus.beta_access,
          api_access: tapPassStatus.beta_access,
        },
        fallback_strategies: {
          network_error: 'cache' as const,
          rate_limit: 'upgrade_prompt' as const,
          tappass_required: 'upgrade_prompt' as const,
        },
      };

      surfManager.current = new SurfManager(user.id, tapPassStatus, config);
      shadowCreator.current = new ShadowTrackCreator();
      
      // Load available feeds
      const feeds = surfManager.current.getAvailableFeeds();
      setAvailableFeeds(feeds);
      setIsInitialized(true);
    }
  }, [user?.id, tapPassStatus]);

  const startSession = useCallback(async () => {
    if (!surfManager.current) return null;

    try {
      const session = await surfManager.current.startSurfSession();
      setCurrentSession(session);
      return session;
    } catch (error) {
      console.error('Failed to start surf session:', error);
      throw error;
    }
  }, []);

  const endSession = useCallback(async () => {
    if (!surfManager.current) return;

    try {
      await surfManager.current.endSurfSession();
      setCurrentSession(null);
    } catch (error) {
      console.error('Failed to end surf session:', error);
    }
  }, []);

  const getFeedTracks = useCallback(async (feedId: string, limit = 20) => {
    if (!surfManager.current) return [];

    try {
      return await surfManager.current.getFeedTracks(feedId, limit);
    } catch (error) {
      console.error('Failed to get feed tracks:', error);
      throw error;
    }
  }, []);

  const saveTrack = useCallback(async (trackId: string) => {
    if (!surfManager.current) return;

    try {
      await surfManager.current.saveTrack(trackId);
    } catch (error) {
      console.error('Failed to save track:', error);
      throw error;
    }
  }, []);

  const skipTrack = useCallback(async (trackId: string, reason?: string) => {
    if (!surfManager.current) return;

    try {
      await surfManager.current.skipTrack(trackId, reason);
    } catch (error) {
      console.error('Failed to skip track:', error);
      throw error;
    }
  }, []);

  const createShadowTrack = useCallback(async (url: string) => {
    if (!shadowCreator.current || !user?.id) return null;

    try {
      return await shadowCreator.current.createShadowTrack(url, user.id);
    } catch (error) {
      console.error('Failed to create shadow track:', error);
      throw error;
    }
  }, [user?.id]);

  const getShadowTrackStatus = useCallback((shadowId: string) => {
    if (!shadowCreator.current) return null;
    return shadowCreator.current.getShadowTrackStatus(shadowId);
  }, []);

  const updateTapPassStatus = useCallback((newStatus: Partial<TapPassStatus>) => {
    setTapPassStatus(prev => ({ ...prev, ...newStatus }));
  }, []);

  return {
    isInitialized,
    currentSession,
    availableFeeds,
    tapPassStatus,
    startSession,
    endSession,
    getFeedTracks,
    saveTrack,
    skipTrack,
    createShadowTrack,
    getShadowTrackStatus,
    updateTapPassStatus,
  };
}

/**
 * Hook for surf feed management
 */
export function useSurfFeed(feedId: string) {
  const { getFeedTracks, isInitialized } = useSurf();
  const [tracks, setTracks] = useState<SurfTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SurfError | null>(null);

  const loadTracks = useCallback(async (limit = 20) => {
    if (!isInitialized) return;

    setLoading(true);
    setError(null);

    try {
      const feedTracks = await getFeedTracks(feedId, limit);
      setTracks(feedTracks);
    } catch (err) {
      setError(err as SurfError);
    } finally {
      setLoading(false);
    }
  }, [feedId, getFeedTracks, isInitialized]);

  const refreshTracks = useCallback(() => {
    loadTracks();
  }, [loadTracks]);

  // Auto-load tracks when feed changes
  useEffect(() => {
    if (isInitialized) {
      loadTracks();
    }
  }, [feedId, isInitialized, loadTracks]);

  return {
    tracks,
    loading,
    error,
    refreshTracks,
    loadTracks,
  };
}

/**
 * Hook for shadow track creation
 */
export function useShadowTrackCreation() {
  const { createShadowTrack, getShadowTrackStatus } = useSurf();
  const [creations, setCreations] = useState<Map<string, ShadowTrackCreation>>(new Map());

  const createTrack = useCallback(async (url: string) => {
    try {
      const creation = await createShadowTrack(url);
      if (creation) {
        setCreations(prev => new Map(prev).set(creation.id, creation));
        return creation;
      }
    } catch (error) {
      console.error('Failed to create shadow track:', error);
      throw error;
    }
  }, [createShadowTrack]);

  const getCreationStatus = useCallback((shadowId: string) => {
    return creations.get(shadowId) || getShadowTrackStatus(shadowId);
  }, [creations, getShadowTrackStatus]);

  const updateCreationStatus = useCallback((shadowId: string) => {
    const status = getShadowTrackStatus(shadowId);
    if (status) {
      setCreations(prev => new Map(prev).set(shadowId, status));
    }
  }, [getShadowTrackStatus]);

  return {
    creations: Array.from(creations.values()),
    createTrack,
    getCreationStatus,
    updateCreationStatus,
  };
}

/**
 * Hook for TapPass management
 */
export function useTapPass() {
  const { tapPassStatus, updateTapPassStatus } = useSurf();

  const upgradeTapPass = useCallback(async (tier: 'basic' | 'premium' | 'vip') => {
    // Mock upgrade process
    updateTapPassStatus({
      has_tappass: true,
      tier,
      expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      features: tier === 'vip' ? ['unlimited_surf', 'premium_feeds', 'beta_access'] : ['unlimited_surf'],
      daily_surf_limit: tier === 'vip' ? -1 : 1000, // -1 = unlimited
      beta_access: tier === 'vip',
    });
  }, [updateTapPassStatus]);

  const enableBetaAccess = useCallback(() => {
    updateTapPassStatus({
      beta_access: true,
      features: [...tapPassStatus.features, 'beta_access'],
    });
  }, [tapPassStatus.features, updateTapPassStatus]);

  return {
    tapPassStatus,
    upgradeTapPass,
    enableBetaAccess,
    hasFeature: (feature: string) => tapPassStatus.features.includes(feature),
    isUnlimited: tapPassStatus.daily_surf_limit === -1,
    remainingDaily: Math.max(0, tapPassStatus.daily_surf_limit - tapPassStatus.daily_surf_used),
  };
}
